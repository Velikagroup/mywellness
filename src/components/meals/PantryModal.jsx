import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Package, Edit2, Check, X, Camera, Upload, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PantryModal({ isOpen, onClose, user }) {
  const { t } = useLanguage();

  const CATEGORIES = [
    { id: 'carne_pesce', label: `🥩 ${t('meals.categoryMeat')}`, color: 'bg-red-50 border-red-200' },
    { id: 'latticini_uova', label: `🥛 ${t('meals.categoryDairy')}`, color: 'bg-yellow-50 border-yellow-200' },
    { id: 'frutta_verdura', label: `🥗 ${t('meals.categoryFruitVeg')}`, color: 'bg-green-50 border-green-200' },
    { id: 'cereali_pasta', label: `🌾 ${t('meals.categoryGrains')}`, color: 'bg-amber-50 border-amber-200' },
    { id: 'legumi_frutta_secca', label: `🥜 ${t('meals.categoryLegumes')}`, color: 'bg-orange-50 border-orange-200' },
    { id: 'condimenti_spezie', label: `🧂 ${t('meals.categoryCondiments')}`, color: 'bg-purple-50 border-purple-200' },
    { id: 'altro', label: `📦 ${t('meals.categoryOther')}`, color: 'bg-gray-50 border-gray-200' }
  ];
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
    const messages = {
      it: 'Carica almeno la foto del prodotto',
      en: 'Upload at least the product photo',
      es: 'Carga al menos la foto del producto',
      pt: 'Carregue pelo menos a foto do produto',
      de: 'Laden Sie mindestens das Produktfoto hoch',
      fr: 'Téléchargez au moins la photo du produit'
    };
    
    if (!productPhoto) {
      alert(messages[t('common.lang')]);
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
    const messages = {
      it: {
        missingFields: 'Inserisci almeno nome e calorie',
        updated: `✅ Ingrediente "${formData.name}" aggiornato!\n\n💡 Dalla prossima generazione del piano alimentare, se necessario, userò questo ingrediente con i valori nutrizionali che hai specificato.`,
        added: `✅ Ingrediente "${formData.name}" aggiunto alla dispensa!\n\n💡 Dalla prossima generazione del piano alimentare completo, se il piano necessita di questo ingrediente, lo prenderò dalla tua dispensa utilizzando questi valori nutrizionali precisi.`
      },
      en: {
        missingFields: 'Enter at least name and calories',
        updated: `✅ Ingredient "${formData.name}" updated!\n\n💡 From the next meal plan generation, if needed, I'll use this ingredient with the nutritional values you specified.`,
        added: `✅ Ingredient "${formData.name}" added to pantry!\n\n💡 From the next complete meal plan generation, if the plan needs this ingredient, I'll take it from your pantry using these precise nutritional values.`
      },
      es: {
        missingFields: 'Ingresa al menos nombre y calorías',
        updated: `✅ Ingrediente "${formData.name}" actualizado!\n\n💡 Desde la próxima generación del plan nutricional, si es necesario, usaré este ingrediente con los valores nutricionales que especificaste.`,
        added: `✅ Ingrediente "${formData.name}" añadido a la despensa!\n\n💡 Desde la próxima generación completa del plan nutricional, si el plan necesita este ingrediente, lo tomaré de tu despensa usando estos valores nutricionales precisos.`
      },
      pt: {
        missingFields: 'Digite pelo menos nome e calorias',
        updated: `✅ Ingrediente "${formData.name}" atualizado!\n\n💡 Da próxima geração do plano nutricional, se necessário, usarei este ingrediente com os valores nutricionais que você especificou.`,
        added: `✅ Ingrediente "${formData.name}" adicionado à despensa!\n\n💡 Da próxima geração completa do plano nutricional, se o plano precisar deste ingrediente, pegarei da sua despensa usando estes valores nutricionais precisos.`
      },
      de: {
        missingFields: 'Geben Sie mindestens Name und Kalorien ein',
        updated: `✅ Zutat "${formData.name}" aktualisiert!\n\n💡 Bei der nächsten Ernährungsplan-Generierung werde ich diese Zutat bei Bedarf mit den von Ihnen angegebenen Nährwerten verwenden.`,
        added: `✅ Zutat "${formData.name}" zur Vorratskammer hinzugefügt!\n\n💡 Bei der nächsten vollständigen Ernährungsplan-Generierung werde ich diese Zutat aus Ihrer Vorratskammer mit diesen genauen Nährwerten verwenden.`
      },
      fr: {
        missingFields: 'Entrez au moins le nom et les calories',
        updated: `✅ Ingrédient "${formData.name}" mis à jour!\n\n💡 Lors de la prochaine génération du plan nutritionnel, si nécessaire, j'utiliserai cet ingrédient avec les valeurs nutritionnelles que vous avez spécifiées.`,
        added: `✅ Ingrédient "${formData.name}" ajouté au garde-manger!\n\n💡 Lors de la prochaine génération complète du plan nutritionnel, si le plan a besoin de cet ingrédient, je le prendrai de votre garde-manger en utilisant ces valeurs nutritionnelles précises.`
      }
    };

    const lang = t('common.lang');
    
    if (!formData.name || !formData.calories_per_100g) {
      alert(messages[lang].missingFields);
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await base44.entities.UserIngredient.update(editingId, formData);
        alert(messages[lang].updated);
      } else {
        await base44.entities.UserIngredient.create({
          user_id: user.id,
          ...formData,
          calories_per_100g: parseFloat(formData.calories_per_100g),
          protein_per_100g: parseFloat(formData.protein_per_100g || 0),
          carbs_per_100g: parseFloat(formData.carbs_per_100g || 0),
          fat_per_100g: parseFloat(formData.fat_per_100g || 0)
        });
        alert(messages[lang].added);
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
    const messages = {
      it: 'Eliminare questo ingrediente dalla dispensa?',
      en: 'Delete this ingredient from pantry?',
      es: '¿Eliminar este ingrediente de la despensa?',
      pt: 'Excluir este ingrediente da despensa?',
      de: 'Diese Zutat aus der Vorratskammer löschen?',
      fr: 'Supprimer cet ingrédient du garde-manger?'
    };
    
    if (!confirm(messages[t('common.lang')])) return;
    
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
          {t('meals.pantryTitle')}
          </DialogTitle>
          <p className="text-sm text-gray-600">{t('meals.pantrySubtitle')}</p>
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
                  <div className="font-bold">{t('meals.scanWithAI')}</div>
                  <div className="text-xs opacity-90">{t('meals.scanLabelDesc')}</div>
                </div>
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white h-auto py-4"
              >
                <Plus className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-bold">{t('meals.addManually')}</div>
                  <div className="text-xs opacity-90">{t('meals.scanLabelDesc')}</div>
                </div>
              </Button>
            </div>
          ) : showAIWizard ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {t('meals.scanLabel')}
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
                  <Label className="font-semibold text-gray-900 mb-2 block">📸 {t('meals.uploadImage')}</Label>
                  <p className="text-xs text-gray-600 mb-3">{t('meals.scanLabelDesc')}</p>
                  
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
                  <Label className="font-semibold text-gray-900 mb-2 block">🏷️ {t('meals.scanLabel')}</Label>
                  <p className="text-xs text-gray-600 mb-3">{t('meals.scanLabelDesc')}</p>
                  
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
                      {t('meals.analyzing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('meals.scanWithAI')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : showAddForm ? (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-[#26847F]/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{editingId ? t('meals.editIngredient') : t('meals.ingredientName')}</h3>
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
                  <Label htmlFor="name">{t('meals.ingredientName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t('meals.ingredientNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="category">{t('meals.category')}</Label>
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
                  <Label htmlFor="calories">{t('meals.caloriesPer100g')} *</Label>
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
                  <Label htmlFor="protein">{t('meals.proteinPer100g')}</Label>
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
                  <Label htmlFor="carbs">{t('meals.carbsPer100g')}</Label>
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
                  <Label htmlFor="fat">{t('meals.fatPer100g')}</Label>
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
                  {t('meals.saveIngredient')}
                </Button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#26847F] mx-auto mb-3" />
              <p className="text-gray-600">{t('common.loading')}</p>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">{t('meals.emptyPantry')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('meals.emptyPantryDesc')}</p>
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