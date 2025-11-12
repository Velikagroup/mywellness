import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, ShoppingCart, Trash2, Camera, Upload, Loader2, Crown, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';
import UpgradeModal from './UpgradeModal';

const CATEGORY_LABELS = {
  frutta_verdura: { label: 'Frutta & Verdura', emoji: '🥬', bg: 'bg-green-50' },
  carne_pesce: { label: 'Carne & Pesce', emoji: '🥩', bg: 'bg-red-50' },
  latticini_uova: { label: 'Latticini & Uova', emoji: '🥛', bg: 'bg-blue-50' },
  cereali_pasta: { label: 'Cereali & Pasta', emoji: '🌾', bg: 'bg-amber-50' },
  legumi_frutta_secca: { label: 'Legumi & Frutta Secca', emoji: '🥜', bg: 'bg-orange-50' },
  condimenti_spezie: { label: 'Condimenti & Spezie', emoji: '🧂', bg: 'bg-yellow-50' },
  bevande: { label: 'Bevande', emoji: '🥤', bg: 'bg-cyan-50' },
  altro: { label: 'Altro', emoji: '🛒', bg: 'bg-gray-50' }
};

export default function ShoppingListModal({ isOpen, user, onClose }) {
  const queryClient = useQueryClient();
  const [shoppingList, setShoppingList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const startOfWeek = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  })();

  const { data: lists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ['shoppingLists', user?.id, startOfWeek],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.ShoppingList.filter({ 
        user_id: user.id, 
        week_start_date: startOfWeek 
      });
    },
    enabled: !!user?.id && isOpen,
  });

  useEffect(() => {
    if (lists.length > 0) {
      setShoppingList(lists[0]);
    } else {
      setShoppingList(null);
    }
    setIsLoading(false);
  }, [lists]);

  const updateShoppingListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShoppingList.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists'] }),
  });

  const toggleItem = async (itemIndex) => {
    if (!shoppingList) return;
    
    const updatedItems = [...shoppingList.items];
    updatedItems[itemIndex].checked = !updatedItems[itemIndex].checked;
    
    await updateShoppingListMutation.mutateAsync({
      id: shoppingList.id,
      data: {
        items: updatedItems,
        last_updated: new Date().toISOString()
      }
    });
  };

  const clearList = async () => {
    if (!shoppingList) return;
    if (!confirm('Vuoi davvero svuotare la lista della spesa?')) return;
    
    await updateShoppingListMutation.mutateAsync({
      id: shoppingList.id,
      data: {
        items: [],
        last_updated: new Date().toISOString()
      }
    });
  };

  const handleScanClick = (ingredient) => {
    if (!hasFeatureAccess(user?.subscription_plan, 'progress_photo_analysis')) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedIngredient(ingredient);
    setShowScanner(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      // Upload foto
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // STEP 1: Validazione foto - deve contenere tabella nutrizionale o confezione
      const validationPrompt = `You are an AI validator for nutritional label scanning.

Analyze this image and determine if it's suitable for nutritional analysis.

ACCEPT ONLY:
✅ Photos showing a clear, readable nutritional facts table/label
✅ Photos of packaged products with nutritional information visible
✅ Nutritional labels that are in focus and legible

REJECT:
❌ Loose/unpackaged food (meat, vegetables, fruits without packaging)
❌ Plates of cooked food
❌ Blurry photos where text is not readable
❌ Photos without any nutritional information visible

Return:
- "valid": true/false
- "reason": brief explanation in Italian why it was accepted/rejected`;

      const validation = await base44.integrations.Core.InvokeLLM({
        prompt: validationPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            valid: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["valid", "reason"]
        }
      });

      if (!validation.valid) {
        alert(`❌ Foto non valida:\n\n${validation.reason}\n\n💡 Scatta una foto della tabella nutrizionale o della confezione del prodotto.`);
        setIsScanning(false);
        return;
      }

      // STEP 2: Analisi nutrizionale con criteri aggiustati
      const analysisPrompt = `You are a professional nutritionist analyzing a food product label for FITNESS and BODYBUILDING purposes.

Analyze this product label photo and provide:
1. Product name (in Italian)
2. Nutritional values per 100g:
   - Calories (kcal)
   - Protein (g)
   - Carbs (g)
   - Fat (g)
   - Fiber (g) if available
3. Health score 0-10 (0=very unhealthy, 10=very healthy)
4. Health classification: "male" (0-3), "medio" (4-6), "bene" (7-10)
5. Brief explanation in Italian why this score

IMPORTANT SCORING CRITERIA (FITNESS-ORIENTED):
✅ POSITIVE factors (heavily weighted):
- High protein content (20g+ per 100g = excellent)
- Quality protein sources (meat, fish, eggs, dairy, legumes)
- Moderate healthy fats (omega-3, monounsaturated)
- Good protein to calorie ratio
- Presence of fiber

⚠️ MODERATE factors (less penalizing):
- Saturated fats: NOT automatically bad if from quality sources (meat, eggs, dairy)
- Simple processing: ground meat, minimally processed = GOOD (not penalize)
- Moderate carbs if from whole grains

❌ NEGATIVE factors:
- Added sugars (highly negative)
- Trans fats (highly negative)
- Excessive sodium (>1000mg per 100g)
- Ultra-processed with many additives/preservatives
- Very high carbs with low protein
- Industrial processing with artificial ingredients

DISTINGUISH:
- Ground beef = minimally processed = GOOD for fitness
- Industrial burger with additives/preservatives = bad
- Natural saturated fats (meat, eggs) = acceptable
- Trans fats/hydrogenated oils = very bad

Return ONLY valid JSON, no markdown.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            calories_per_100g: { type: "number" },
            protein_per_100g: { type: "number" },
            carbs_per_100g: { type: "number" },
            fat_per_100g: { type: "number" },
            fiber_per_100g: { type: "number" },
            health_score: { type: "number" },
            health_classification: { type: "string", enum: ["male", "medio", "bene"] },
            explanation: { type: "string" }
          },
          required: ["product_name", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "health_score", "health_classification", "explanation"]
        }
      });

      setScanResult({
        ...analysis,
        photo_url: file_url
      });
    } catch (error) {
      console.error('Error scanning product:', error);
      alert('Errore durante la scansione. Riprova.');
    }
    setIsScanning(false);
  };

  const handleSaveScannedProduct = async () => {
    if (!scanResult || !selectedIngredient) return;

    try {
      // 1. Aggiorna o crea l'ingrediente nel database
      const ingredientData = {
        name_it: selectedIngredient.name,
        name_en: selectedIngredient.name,
        category: selectedIngredient.category || 'altro',
        calories_per_100g: scanResult.calories_per_100g,
        protein_per_100g: scanResult.protein_per_100g,
        carbs_per_100g: scanResult.carbs_per_100g,
        fat_per_100g: scanResult.fat_per_100g,
        fiber_per_100g: scanResult.fiber_per_100g || 0,
        verified: true,
        data_sources: ['user_scanned'],
        notes: `Scansionato: ${scanResult.product_name} - Health Score: ${scanResult.health_score}/10`
      };

      await base44.functions.invoke('validateAndSaveIngredient', {
        ingredients: [ingredientData]
      });

      // 2. Aggiorna i piani alimentari che usano questo ingrediente
      const mealPlans = await base44.entities.MealPlan.filter({ user_id: user.id });
      
      for (const plan of mealPlans) {
        let updated = false;
        const updatedIngredients = plan.ingredients.map(ing => {
          if (ing.name.toLowerCase() === selectedIngredient.name.toLowerCase()) {
            updated = true;
            // Ricalcola i valori nutrizionali basati sulla quantità
            const factor = ing.quantity / 100;
            return {
              ...ing,
              calories: Math.round(scanResult.calories_per_100g * factor),
              protein: Math.round(scanResult.protein_per_100g * factor * 10) / 10,
              carbs: Math.round(scanResult.carbs_per_100g * factor * 10) / 10,
              fat: Math.round(scanResult.fat_per_100g * factor * 10) / 10
            };
          }
          return ing;
        });

        if (updated) {
          // Ricalcola i totali del pasto
          const newTotalCalories = Math.round(updatedIngredients.reduce((sum, i) => sum + (i.calories || 0), 0));
          const newTotalProtein = Math.round(updatedIngredients.reduce((sum, i) => sum + (i.protein || 0), 0) * 10) / 10;
          const newTotalCarbs = Math.round(updatedIngredients.reduce((sum, i) => sum + (i.carbs || 0), 0) * 10) / 10;
          const newTotalFat = Math.round(updatedIngredients.reduce((sum, i) => sum + (i.fat || 0), 0) * 10) / 10;

          await base44.entities.MealPlan.update(plan.id, {
            ingredients: updatedIngredients,
            total_calories: newTotalCalories,
            total_protein: newTotalProtein,
            total_carbs: newTotalCarbs,
            total_fat: newTotalFat
          });
        }
      }

      // 3. Marca l'ingrediente come acquistato nella lista
      const updatedItems = shoppingList.items.map(item => {
        if (item.name.toLowerCase() === selectedIngredient.name.toLowerCase()) {
          return { ...item, checked: true };
        }
        return item;
      });

      await updateShoppingListMutation.mutateAsync({
        id: shoppingList.id,
        data: {
          items: updatedItems,
          last_updated: new Date().toISOString()
        }
      });

      alert(`✅ ${scanResult.product_name} salvato e piani alimentari aggiornati!`);
      setShowScanner(false);
      setScanResult(null);
      setSelectedIngredient(null);
    } catch (error) {
      console.error('Error saving scanned product:', error);
      alert('Errore nel salvataggio. Riprova.');
    }
  };

  const getHealthScoreColor = (score) => {
    if (score <= 3) return 'text-red-600 bg-red-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getHealthScoreEmoji = (classification) => {
    if (classification === 'male') return '❌';
    if (classification === 'medio') return '⚠️';
    return '✅';
  };

  if (!isOpen) return null;

  const organizedItems = shoppingList?.items.reduce((acc, item) => {
    const category = item.category || 'altro';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {}) || {};

  return (
    <>
      <Dialog open={isOpen && !showUpgradeModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="w-6 h-6 text-[var(--brand-primary)]" />
              Lista della Spesa
            </DialogTitle>
          </DialogHeader>

          {isLoading || isLoadingLists ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
            </div>
          ) : !shoppingList || shoppingList.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nessun ingrediente nella lista</p>
              <p className="text-sm text-gray-400 mt-2">Aggiungi giorni dal piano nutrizionale</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <p className="text-sm text-gray-600">
                  {shoppingList.items.filter(i => i.checked).length} di {shoppingList.items.length} acquistati
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearList}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Svuota Lista
                </Button>
              </div>

              {Object.entries(organizedItems).map(([category, items]) => (
                <div key={category} className={`${CATEGORY_LABELS[category].bg} rounded-lg p-4 border`}>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_LABELS[category].emoji}</span>
                    {CATEGORY_LABELS[category].label}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white p-3 rounded-md border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleItem(shoppingList.items.indexOf(item))}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.checked
                                ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]'
                                : 'border-gray-300 hover:border-[var(--brand-primary)]'
                            }`}
                          >
                            {item.checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleScanClick(item)}
                          className="ml-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:bg-[var(--brand-primary-light)] relative"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Scansiona
                          {!hasFeatureAccess(user?.subscription_plan, 'progress_photo_analysis') && (
                            <Crown className="w-3 h-3 absolute -top-1 -right-1 text-purple-600" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner Modal */}
      <Dialog open={showScanner && !showUpgradeModal} onOpenChange={(open) => {
        if (!open) {
          setShowScanner(false);
          setScanResult(null);
          setSelectedIngredient(null);
        }
      }}>
        <DialogContent className="max-w-xl max-h-[85vh] p-0 gap-0 flex flex-col">
          <div className="flex-shrink-0 bg-white z-10 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[var(--brand-primary)]" />
              <h3 className="font-semibold text-gray-900 text-sm">
                {selectedIngredient?.name}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowScanner(false);
                setScanResult(null);
                setSelectedIngredient(null);
              }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            {!scanResult ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Carica una foto dell'etichetta nutrizionale</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Scatta Foto */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      disabled={isScanning}
                      className="hidden"
                      id="file-capture"
                    />
                    <label htmlFor="file-capture" className="flex-1 sm:flex-initial">
                      <Button
                        asChild
                        disabled={isScanning}
                        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                      >
                        <span>
                          {isScanning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analisi...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Scatta Foto
                            </>
                          )}
                        </span>
                      </Button>
                    </label>

                    {/* Carica da Galleria */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isScanning}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="flex-1 sm:flex-initial">
                      <Button
                        asChild
                        variant="outline"
                        disabled={isScanning}
                        className="w-full border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Carica
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  💡 L'AI analizzerà i valori nutrizionali e darà un punteggio di salubrità
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={scanResult.photo_url}
                  alt="Product"
                  className="w-full h-48 object-cover rounded-lg border"
                />

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    {scanResult.product_name}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-4 my-6">
                    <div className="text-center">
                      <div className={`text-5xl font-black ${getHealthScoreColor(scanResult.health_score)} rounded-full w-20 h-20 flex items-center justify-center mx-auto`}>
                        {scanResult.health_score}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-semibold">Health Score</p>
                    </div>
                    <div className="text-6xl">
                      {getHealthScoreEmoji(scanResult.health_classification)}
                    </div>
                  </div>

                  <div className={`${getHealthScoreColor(scanResult.health_score)} rounded-lg p-3 mb-4`}>
                    <p className="font-bold text-center uppercase tracking-wider">
                      {scanResult.health_classification}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-3 border">
                    {scanResult.explanation}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">Valori Nutrizionali (per 100g):</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">Calorie:</span>
                      <span className="font-bold ml-2">{scanResult.calories_per_100g} kcal</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">Proteine:</span>
                      <span className="font-bold ml-2">{scanResult.protein_per_100g}g</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">Carboidrati:</span>
                      <span className="font-bold ml-2">{scanResult.carbs_per_100g}g</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">Grassi:</span>
                      <span className="font-bold ml-2">{scanResult.fat_per_100g}g</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Bottoni fissi in basso */}
          {scanResult && (
            <div className="flex-shrink-0 bg-white border-t shadow-lg p-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSaveScannedProduct}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] py-6 text-base font-semibold"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Salva e Aggiorna Ricette
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                    }}
                  >
                    Scansiona Altro
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScanner(false);
                      setScanResult(null);
                      setSelectedIngredient(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Chiudi
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal - Completamente separato */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentPlan={user?.subscription_plan || 'base'} 
      />
    </>
  );
}