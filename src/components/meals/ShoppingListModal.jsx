import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, ShoppingCart, Trash2, Camera, Upload, Loader2, Crown, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';
import UpgradeModal from './UpgradeModal';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { categorizeIngredient } from '@/utils/categorizeIngredient';

export default function ShoppingListModal({ isOpen, user, onClose }) {
  const { t } = useLanguage();

  const CATEGORY_LABELS = {
    frutta_verdura: { label: t('meals.categoryFruitVeg'), emoji: '🥬', bg: 'bg-green-50' },
    carne_pesce: { label: t('meals.categoryMeat'), emoji: '🥩', bg: 'bg-red-50' },
    latticini_uova: { label: t('meals.categoryDairy'), emoji: '🥛', bg: 'bg-blue-50' },
    cereali_pasta: { label: t('meals.categoryGrains'), emoji: '🌾', bg: 'bg-amber-50' },
    legumi_frutta_secca: { label: t('meals.categoryLegumes'), emoji: '🥜', bg: 'bg-orange-50' },
    condimenti_spezie: { label: t('meals.categoryCondiments'), emoji: '🧂', bg: 'bg-yellow-50' },
    bevande: { label: t('meals.categoryDrinks'), emoji: '🥤', bg: 'bg-cyan-50' },
    altro: { label: t('meals.categoryOther'), emoji: '🛒', bg: 'bg-gray-50' }
  };
  const queryClient = useQueryClient();
  const [shoppingList, setShoppingList] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    frutta_verdura: false,
    carne_pesce: false,
    latticini_uova: false,
    cereali_pasta: false,
    legumi_frutta_secca: false,
    condimenti_spezie: false,
    bevande: false,
    altro: false
  });

  const getStartOfWeek = () => {
    const now = new Date();
    const utcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const utcDay = new Date(utcDate).getUTCDay();
    const diff = utcDay === 0 ? -6 : 1 - utcDay;
    const monday = new Date(utcDate);
    monday.setUTCDate(monday.getUTCDate() + diff);
    return monday.toISOString().split('T')[0];
  };

  const startOfWeek = getStartOfWeek();

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
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shoppingLists', user?.id, startOfWeek] });

      // Snapshot the previous value
      const previousLists = queryClient.getQueryData(['shoppingLists', user?.id, startOfWeek]);

      // Optimistically update to the new value
      queryClient.setQueryData(['shoppingLists', user?.id, startOfWeek], (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map(list => list.id === id ? { ...list, ...data } : list);
      });

      // Return a context object with the snapshotted value
      return { previousLists };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLists) {
        queryClient.setQueryData(['shoppingLists', user?.id, startOfWeek], context.previousLists);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingLists'] });
    },
  });

  const toggleItem = async (itemName) => {
    if (!shoppingList) return;
    
    const updatedItems = shoppingList.items.map(item => {
      if (item.name === itemName) {
        return { ...item, checked: !item.checked };
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

      const languageNames = {
        it: 'Italian',
        en: 'English', 
        es: 'Spanish',
        pt: 'Portuguese',
        de: 'German',
        fr: 'French'
      };
      const userLang = t('common.lang') || 'en';
      const langName = languageNames[userLang] || 'English';

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
- "reason": brief explanation in ${langName.toUpperCase()} why it was accepted/rejected`;

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

      // STEP 2A: Ricerca valori ottimali online (SENZA foto)
      const researchPrompt = `Search internet for BEST nutritional values for "${selectedIngredient.name}".
Find optimal values per 100g: highest protein, lowest sugar/fat (if lean food), best fiber.
Return brief summary in ${langName.toUpperCase()} about optimal nutritional values.`;

      const benchmark = await base44.integrations.Core.InvokeLLM({
        prompt: researchPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            best_protein_per_100g: { type: "number" },
            best_carbs_per_100g: { type: "number" },
            best_fat_per_100g: { type: "number" },
            best_calories_per_100g: { type: "number" },
            best_fiber_per_100g: { type: "number" },
            benchmark_summary: { type: "string" }
          },
          required: ["benchmark_summary"]
        }
      });

      // STEP 2B: Analisi foto (SENZA internet)
      const analysisPrompt = `Extract values from label and score vs best for "${selectedIngredient.name}".

BEST: ${benchmark.benchmark_summary}
Protein: ${benchmark.best_protein_per_100g || 'N/A'}g, Carbs: ${benchmark.best_carbs_per_100g || 'N/A'}g, Fat: ${benchmark.best_fat_per_100g || 'N/A'}g, Calories: ${benchmark.best_calories_per_100g || 'N/A'}kcal, Fiber: ${benchmark.best_fiber_per_100g || 'N/A'}g

Score 0-10: 10=matches best, 9=within 5%, 7-8=within 15%, 5-6=within 30%, 3-4=30-50% worse, 0-2=>50% worse.

CRITICAL: Write explanation in ${langName.toUpperCase()}. Explain nutritional comparison and score reasoning.`;


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
      // 1. Cerca o crea l'ingrediente nel database
      const normalizedName = selectedIngredient.name.toLowerCase().trim();
      const existingIngredients = await base44.entities.Ingredient.filter({
        name_it: normalizedName
      });

      let ingredientId;
      
      if (existingIngredients.length > 0) {
        // Aggiorna ingrediente esistente
        ingredientId = existingIngredients[0].id;
        await base44.entities.Ingredient.update(ingredientId, {
          calories_per_100g: scanResult.calories_per_100g,
          protein_per_100g: scanResult.protein_per_100g,
          carbs_per_100g: scanResult.carbs_per_100g,
          fat_per_100g: scanResult.fat_per_100g,
          fiber_per_100g: scanResult.fiber_per_100g || 0,
          verified: true,
          data_sources: ['user_scanned'],
          notes: `Scansionato: ${scanResult.product_name} - Health Score: ${scanResult.health_score}/10`,
          usage_count: (existingIngredients[0].usage_count || 0) + 1
        });
      } else {
        // Crea nuovo ingrediente
        const newIngredient = await base44.entities.Ingredient.create({
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
          notes: `Scansionato: ${scanResult.product_name} - Health Score: ${scanResult.health_score}/10`,
          usage_count: 1,
          suitable_for_diets: []
        });
        ingredientId = newIngredient.id;
      }

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
    // Always re-derive category from ingredient name for reliability
    const category = categorizeIngredient(item.name);
    if (!acc[category]) acc[category] = [];
    
    // Arrotonda le uova a numeri interi
    const processedItem = { ...item };
    if (item.unit && item.unit.toLowerCase() === 'uova' || 
        item.name && item.name.toLowerCase().includes('uov')) {
      processedItem.quantity = Math.round(item.quantity);
    }
    
    acc[category].push(processedItem);
    return acc;
  }, {}) || {};

  return (
    <>
      <Dialog open={isOpen && !showUpgradeModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="w-6 h-6 text-[var(--brand-primary)]" />
              {t('meals.shoppingListTitle')}
            </DialogTitle>
          </DialogHeader>

          {isLoading || isLoadingLists ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
            </div>
          ) : !shoppingList || shoppingList.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('meals.emptyShoppingList')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('meals.emptyShoppingListDesc')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b">
                <p className="text-sm text-gray-600">
                  {t('meals.itemsChecked')
                    .replace('{checked}', shoppingList.items.filter(i => i.checked).length)
                    .replace('{total}', shoppingList.items.length)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearList}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete')}
                </Button>
              </div>

              {Object.entries(organizedItems).map(([category, items]) => {
                const isExpanded = expandedCategories[category];
                return (
                  <div key={category} className={`${CATEGORY_LABELS[category].bg} rounded-lg p-4 border`}>
                    <button
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                      className="w-full flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                      <span className="text-xl">{CATEGORY_LABELS[category].emoji}</span>
                      <h3 className="font-semibold text-gray-800 flex-1 text-left">
                        {CATEGORY_LABELS[category].label}
                      </h3>
                      <span className="text-xs text-gray-500 font-medium">
                        {items.filter(i => !i.checked).length}/{items.length}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white p-3 rounded-md border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleItem(item.name)}
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
                              {Math.round(item.quantity)} {item.unit}
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
                          {t('meals.scanProduct')}
                          {!hasFeatureAccess(user?.subscription_plan, 'progress_photo_analysis') && (
                            <Crown className="w-3 h-3 absolute -top-1 -right-1 text-purple-600" />
                          )}
                        </Button>
                      </div>
                      ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div className="border-2 border-dashed border-[#26847F]/30 rounded-xl p-8 text-center bg-gradient-to-br from-[#E0F2F0] to-white">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#26847F] to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">{t('meals.scanProduct')}</p>
                  <p className="text-sm text-gray-600 mb-6">{t('meals.scanProductDesc')}</p>

                  <div className="flex flex-col gap-3">
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
                    <label htmlFor="file-capture" className="w-full">
                      <Button
                        asChild
                        disabled={isScanning}
                        className="w-full bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white shadow-lg py-6"
                      >
                        <span>
                          {isScanning ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              {t('meals.analyzing')}
                            </>
                          ) : (
                            <>
                              <Camera className="w-5 h-5 mr-2" />
                              📸 {t('meals.takePhoto')}
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
                    <label htmlFor="file-upload" className="w-full">
                      <Button
                        asChild
                        variant="outline"
                        disabled={isScanning}
                        className="w-full border-2 border-[#26847F] text-[#26847F] hover:bg-[#E0F2F0] py-6"
                      >
                        <span>
                          <Upload className="w-5 h-5 mr-2" />
                          📂 {t('meals.uploadImage')}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    💡 <strong>Tip:</strong> {t('meals.scanTip')}
                  </p>
                </div>
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
                      <p className="text-sm text-gray-600 mt-2 font-semibold">{t('meals.healthScore')}</p>
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
                  <p className="font-semibold text-blue-900 mb-2">{t('meals.perServing')}:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">{t('meals.calories')}:</span>
                      <span className="font-bold ml-2">{scanResult.calories_per_100g} kcal</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">{t('meals.protein')}:</span>
                      <span className="font-bold ml-2">{scanResult.protein_per_100g}g</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">{t('meals.carbs')}:</span>
                      <span className="font-bold ml-2">{scanResult.carbs_per_100g}g</span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-gray-600">{t('meals.fat')}:</span>
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
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSaveScannedProduct}
                  className="w-full bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white shadow-lg py-6 text-base font-semibold"
                >
                  <Check className="w-5 h-5 mr-2" />
                  ✅ {t('meals.saveToMeals')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null);
                    }}
                    className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    {t('meals.rescan')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScanner(false);
                      setScanResult(null);
                      setSelectedIngredient(null);
                    }}
                    className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('common.close')}
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