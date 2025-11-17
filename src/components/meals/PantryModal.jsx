import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Package, Edit2, Check, X, Camera, Upload, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'carne_pesce', label: '🥩 Carne & Pesce', color: 'bg-red-50 border-red-200' },
  { id: 'latticini_uova', label: '🥛 Latticini & Uova', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'frutta_verdura', label: '🥗 Frutta & Verdura', color: 'bg-green-50 border-green-200' },
  { id: 'cereali_pasta', label: '🌾 Cereali & Pasta', color: 'bg-amber-50 border-amber-200' },
  { id: 'legumi_frutta_secca', label: '🥜 Legumi & Frutta Secca', color: 'bg-orange-50 border-orange-200' },
  { id: 'condimenti_spezie', label: '🧂 Condimenti', color: 'bg-purple-50 border-purple-200' },
  { id: 'altro', label: '📦 Altro', color: 'bg-gray-50 border-gray-200' }
];

export default function PantryModal({ isOpen, onClose, user }) {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    unit: 'g',
    category: 'altro',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productPhoto, setProductPhoto] = useState(null);
  const [nutritionPhoto, setNutritionPhoto] = useState(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState(null);
  const [nutritionPhotoPreview, setNutritionPhotoPreview] = useState(null);
  const productInputRef = useRef(null);
  const nutritionInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadIngredients();
    }
  }, [isOpen, user]);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.UserIngredient.filter({ user_id: user.id });
      setIngredients(data);
    } catch (error) {
      console.error('Error loading pantry:', error);
    }
    setIsLoading(false);
  };

  const handleEdit = (ingredient) => {
    setEditingId(ingredient.id);
    setFormData({
      name: ingredient.name,
      calories_per_100g: ingredient.calories_per_100g,
      protein_per_100g: ingredient.protein_per_100g,
      carbs_per_100g: ingredient.carbs_per_100g,
      fat_per_100g: ingredient.fat_per_100g,
      unit: ingredient.unit || 'g',
      category: ingredient.category || 'altro',
      notes: ingredient.notes || ''
    });
    setShowAddForm(true);
  };

  const handleProductPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductPhoto(file);
      setProductPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleNutritionPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNutritionPhoto(file);
      setNutritionPhotoPreview(URL.createObjectURL(file));
    }
  };

  const analyzeWithAI = async () => {
    if (!productPhoto) {
      alert('Carica almeno la foto del prodotto');
      return;
    }

    setIsAnalyzing(true);
    try {
      const uploadedUrls = [];
      
      const { file_url: productUrl } = await base44.integrations.Core.UploadFile({ file: productPhoto });
      uploadedUrls.push(productUrl);

      if (nutritionPhoto) {
        const { file_url: nutritionUrl } = await base44.integrations.Core.UploadFile({ file: nutritionPhoto });
        uploadedUrls.push(nutritionUrl);
      }

      const prompt = nutritionPhoto 
        ? `Analizza queste immagini di un prodotto alimentare.

FOTO 1: Prodotto/Confezione con etichetta
FOTO 2: Tabella nutrizionale

TASK:
1. Identifica il nome esatto del prodotto dall'etichetta
2. Estrai i valori nutrizionali per 100g dalla tabella nutrizionale
3. Determina la categoria più appropriata
4. Aggiungi note sul brand/tipo se visibili

Fornisci dati PRECISI dalla tabella nutrizionale.`
        : `Analizza questa immagine di un prodotto alimentare.

Vedo solo la foto del prodotto (senza tabella nutrizionale).

TASK:
1. Identifica il nome del prodotto
2. STIMA i valori nutrizionali medi per 100g basandoti su database alimentari standard
3. Determina la categoria più appropriata
4. Indica nelle note che sono valori stimati

Sii preciso nell'identificazione del prodotto.`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: uploadedUrls,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nome completo del prodotto" },
            calories_per_100g: { type: "number", description: "Calorie per 100g" },
            protein_per_100g: { type: "number", description: "Proteine per 100g" },
            carbs_per_100g: { type: "number", description: "Carboidrati per 100g" },
            fat_per_100g: { type: "number", description: "Grassi per 100g" },
            category: { 
              type: "string", 
              enum: ["carne_pesce", "latticini_uova", "frutta_verdura", "cereali_pasta", "legumi_frutta_secca", "condimenti_spezie", "altro"],
              description: "Categoria culinaria" 
            },
            notes: { type: "string", description: "Note aggiuntive (brand, tipo, se stimato)" }
          },
          required: ["name", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g", "category"]
        }
      });

      setFormData({
        name: aiResult.name,
        calories_per_100g: aiResult.calories_per_100g,
        protein_per_100g: aiResult.protein_per_100g,
        carbs_per_100g: aiResult.carbs_per_100g,
        fat_per_100g: aiResult.fat_per_100g,
        unit: 'g',
        category: aiResult.category,
        notes: aiResult.notes || ''
      });

      setShowAIWizard(false);
      setShowAddForm(true);
      setWizardStep(1);
      setProductPhoto(null);
      setNutritionPhoto(null);
      setProductPhotoPreview(null);
      setNutritionPhotoPreview(null);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      alert('Errore nell\'analisi AI. Riprova.');
    }
    setIsAnalyzing(false);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.calories_per_100g) {
      alert('Inserisci almeno nome e calorie');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await base44.entities.UserIngredient.update(editingId, formData);
      } else {
        await base44.entities.UserIngredient.create({
          user_id: user.id,
          ...formData,
          calories_per_100g: parseFloat(formData.calories_per_100g),
          protein_per_100g: parseFloat(formData.protein_per_100g || 0),
          carbs_per_100g: parseFloat(formData.carbs_per_100g || 0),
          fat_per_100g: parseFloat(formData.fat_per_100g || 0)
        });
      }
      
      setFormData({ name: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '', unit: 'g', category: 'altro', notes: '' });
      setShowAddForm(false);
      setEditingId(null);
      await loadIngredients();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      alert('Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo ingrediente dalla dispensa?')) return;
    
    try {
      await base44.entities.UserIngredient.delete(id);
      await loadIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Errore nell\'eliminazione');
    }
  };

  const groupedIngredients = ingredients.reduce((acc, ing) => {
    const cat = ing.category || 'altro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-[#26847F] to-teal-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            La Mia Dispensa
          </DialogTitle>
          <p className="text-sm text-gray-600">Gestisci i tuoi ingredienti personalizzati con valori nutrizionali specifici</p>
        </DialogHeader>

        <div className="space-y-6">
          {!showAddForm && !showAIWizard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowAIWizard(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-auto py-4"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">Scansiona con AI</div>
                  <div className="text-xs opacity-90">Foto prodotto + tabella nutrizionale</div>
                </div>
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white h-auto py-4"
              >
                <Plus className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">Inserimento Manuale</div>
                  <div className="text-xs opacity-90">Aggiungi dati manualmente</div>
                </div>
              </Button>
            </div>
          ) : showAIWizard ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Scansione AI Ingrediente
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAIWizard(false);
                    setWizardStep(1);
                    setProductPhoto(null);
                    setNutritionPhoto(null);
                    setProductPhotoPreview(null);
                    setNutritionPhotoPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                  <Label className="font-semibold text-gray-900 mb-2 block">📸 Foto Prodotto/Confezione *</Label>
                  <p className="text-xs text-gray-600 mb-3">Scatta o carica una foto del prodotto con etichetta visibile</p>
                  
                  <input
                    ref={productInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProductPhotoChange}
                    className="hidden"
                  />
                  
                  {productPhotoPreview ? (
                    <div className="relative">
                      <img src={productPhotoPreview} alt="Prodotto" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProductPhoto(null);
                          setProductPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => productInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-32 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50"
                    >
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-700">Carica Foto Prodotto</span>
                      </div>
                    </Button>
                  )}
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <Label className="font-semibold text-gray-900 mb-2 block">🏷️ Foto Tabella Nutrizionale (opzionale)</Label>
                  <p className="text-xs text-gray-600 mb-3">Se disponibile, carica la tabella per dati precisi</p>
                  
                  <input
                    ref={nutritionInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNutritionPhotoChange}
                    className="hidden"
                  />
                  
                  {nutritionPhotoPreview ? (
                    <div className="relative">
                      <img src={nutritionPhotoPreview} alt="Tabella" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNutritionPhoto(null);
                          setNutritionPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => nutritionInputRef.current?.click()}
                      variant="outline"
                      className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Carica Tabella Nutrizionale</span>
                        <p className="text-xs text-gray-500 mt-1">Altrimenti l'AI stimerà i valori</p>
                      </div>
                    </Button>
                  )}
                </div>

                <Button
                  onClick={analyzeWithAI}
                  disabled={!productPhoto || isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analisi AI in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analizza con AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : showAddForm ? (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-[#26847F]/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{editingId ? 'Modifica' : 'Nuovo'} Ingrediente</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ name: '', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fat_per_100g: '', unit: 'g', category: 'altro', notes: '' });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Ingrediente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Es: Petto di pollo biologico"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calories">Calorie per 100g *</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.1"
                    value={formData.calories_per_100g}
                    onChange={(e) => setFormData({...formData, calories_per_100g: e.target.value})}
                    placeholder="165"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Proteine per 100g</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={formData.protein_per_100g}
                    onChange={(e) => setFormData({...formData, protein_per_100g: e.target.value})}
                    placeholder="31"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carboidrati per 100g</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={formData.carbs_per_100g}
                    onChange={(e) => setFormData({...formData, carbs_per_100g: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Grassi per 100g</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={formData.fat_per_100g}
                    onChange={(e) => setFormData({...formData, fat_per_100g: e.target.value})}
                    placeholder="3.6"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Note (opzionale)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Es: Brand specifico, preferito, valori stimati"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleAdd}
                  disabled={isSaving}
                  className="bg-[#26847F] hover:bg-[#1f6b66] text-white flex-1"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {editingId ? 'Salva Modifiche' : 'Aggiungi'}
                </Button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#26847F] mx-auto mb-3" />
              <p className="text-gray-600">Caricamento dispensa...</p>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Dispensa vuota</p>
              <p className="text-sm text-gray-500 mt-1">Aggiungi ingredienti personalizzati per usarli nei tuoi piani</p>
            </div>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.map(category => {
                const categoryIngredients = groupedIngredients[category.id] || [];
                if (categoryIngredients.length === 0) return null;
                
                return (
                  <div key={category.id} className={`${category.color} rounded-xl p-4 border-2`}>
                    <h4 className="font-bold text-gray-900 mb-3">{category.label}</h4>
                    <div className="space-y-2">
                      {categoryIngredients.map(ing => (
                        <div key={ing.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{ing.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {ing.calories_per_100g} kcal • 
                              P: {ing.protein_per_100g}g • 
                              C: {ing.carbs_per_100g}g • 
                              G: {ing.fat_per_100g}g
                              <span className="text-gray-400 ml-1">(per 100{ing.unit})</span>
                            </p>
                            {ing.notes && (
                              <p className="text-xs text-gray-500 italic mt-1">{ing.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(ing)}
                              className="text-gray-500 hover:text-[#26847F]"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(ing.id)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}