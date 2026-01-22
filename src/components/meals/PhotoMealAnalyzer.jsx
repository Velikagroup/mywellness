import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, X, Plus, ArrowLeft, Sparkles, Zap, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import CameraCapture from './CameraCapture';

export default function PhotoMealAnalyzer({ meal, user, onClose, onRebalanceNeeded, language: propLanguage, t: propT, initialFile = null }) {
  const contextLang = useLanguage();
  const t = propT || contextLang?.t || ((key) => key);
  const language = propLanguage || contextLang?.language || 'it';
  const [photos, setPhotos] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const filesRef = useRef(new Map());

  // Auto-load initial file if provided
  React.useEffect(() => {
    if (initialFile) {
      const photoId = Date.now();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        filesRef.current.set(photoId, initialFile);
        
        const newPhoto = {
          id: photoId,
          previewUrl: event.target.result,
          fileName: initialFile.name,
          fileSize: initialFile.size,
          description: '',
          uploadedUrl: null
        };
        setPhotos([newPhoto]);
      };
      
      reader.readAsDataURL(initialFile);
    }
  }, [initialFile]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
    e.target.value = '';
  };

  const processFiles = (files) => {
    files.forEach(file => {
      const photoId = Date.now() + Math.random();
      const reader = new FileReader();
      
      reader.onload = (event) => {
        filesRef.current.set(photoId, file);
        
        const newPhoto = {
          id: photoId,
          previewUrl: event.target.result,
          fileName: file.name,
          fileSize: file.size,
          description: '',
          uploadedUrl: null
        };
        setPhotos(prev => [...prev, newPhoto]);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = (file) => {
    processFiles([file]);
    setCameraOpen(false);
  };

  const handleDescriptionChange = (photoId, description) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, description } : p
    ));
  };

  const removePhoto = (photoId) => {
    filesRef.current.delete(photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
  };

  const analyzePhotos = async () => {
    if (photos.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const uploadedUrls = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const file = filesRef.current.get(photo.id);
        
        if (!file) {
          alert(`Errore: File ${i + 1} non trovato`);
          setIsAnalyzing(false);
          return;
        }
        
        try {
          const result = await base44.integrations.Core.UploadFile({ file: file });
          
          if (!result || !result.file_url) {
            throw new Error(`Upload fallito per foto ${i + 1}`);
          }
          
          uploadedUrls.push(result.file_url);
          
        } catch (uploadError) {
          console.error(`Error uploading photo ${i + 1}:`, uploadError);
          alert(`Errore nel caricamento della foto ${i + 1}: ${uploadError.message || 'Errore sconosciuto'}`);
          setIsAnalyzing(false);
          return;
        }
      }
      
      const updatedPhotos = photos.map((photo, idx) => ({
        ...photo,
        uploadedUrl: uploadedUrls[idx]
      }));
      setPhotos(updatedPhotos);

      const languageNames = {
        it: 'Italian',
        en: 'English',
        es: 'Spanish',
        pt: 'Portuguese',
        de: 'German',
        fr: 'French'
      };
      const userLang = language || t('common.lang') || 'en';
      const langName = languageNames[userLang] || 'English';

      const noDescText = {
        it: 'Nessuna descrizione fornita',
        en: 'No description provided',
        es: 'Ninguna descripción proporcionada',
        pt: 'Nenhuma descrição fornecida',
        de: 'Keine Beschreibung angegeben',
        fr: 'Aucune description fournie'
      }[userLang] || 'No description provided';

      const photoDescriptions = updatedPhotos.map((photo, idx) => 
        `${t('photoMealAnalyzer.photoLabel')} ${idx + 1}: ${photo.description || noDescText}`
      ).join('\n');

      const analysisPrompt = `You are an EXPERT nutritionist, food scientist, and computer vision specialist. Perform a HIGHLY DETAILED and SCIENTIFIC analysis of this meal.

CRITICAL: Generate ALL content in ${langName.toUpperCase()} language. Food names, cut types, and analysis MUST be in ${langName.toUpperCase()}.

**USER PROVIDED ${updatedPhotos.length} PHOTO(S) WITH DESCRIPTIONS:**
${photoDescriptions}

---

## 🔬 SCIENTIFIC ANALYSIS PROTOCOL - CONSISTENCY IS PARAMOUNT

### ⚠️ CRITICAL CONSISTENCY RULES (FOLLOW EXACTLY):
The SAME photo analyzed multiple times MUST produce CONSISTENT results (within ±10% variance).
To achieve this, follow these STRICT measurement protocols:

---

### **STEP 1: PLATE CALIBRATION (MANDATORY FIRST STEP)**
1. **ALWAYS assume standard dinner plate = 26cm diameter** unless clearly smaller/larger
2. Use plate diameter as ABSOLUTE reference for ALL measurements
3. 1/4 of plate = ~6.5cm, 1/2 of plate = ~13cm, full plate = ~26cm
4. If cutlery visible: fork = 20cm, knife = 24cm, spoon = 18cm

### **STEP 2: STANDARDIZED PORTION ESTIMATION**
Use these STRICT reference weights for common foods (ALWAYS use these baselines):

**PROTEINS (cooked weights):**
- Chicken breast: palm-sized piece = 100-120g, full breast half = 150-180g
- Chicken thigh: 1 piece with bone = 80-100g meat, boneless = 100-130g
- Salmon/fish fillet: palm-sized = 120-150g, large fillet = 180-220g
- Beef steak: palm-thick piece = 150-200g
- Eggs: 1 whole = 50g, scrambled 2 eggs = 100g

**CARBOHYDRATES (cooked weights):**
- Rice: 1/4 plate coverage = 80-100g, 1/3 plate = 120-150g, 1/2 plate = 180-220g
- Pasta: similar to rice measurements
- Bread: 1 slice = 30-40g, thick slice = 50g
- Potato: medium = 150g, large = 250g

**VEGETABLES:**
- Salad greens: full plate loose = 50-80g
- Cooked vegetables: 1/4 plate = 80-100g, 1/2 plate = 150-200g
- Avocado: 1/4 fruit = 40g, 1/2 fruit = 80g

**FATS/OILS (ONLY if visibly glistening or user mentions):**
- Visible oil sheen on food = 5-10ml (45-90 kcal)
- Dressing on salad = 15-20ml if visible
- DO NOT add hidden oils unless user specifically mentions cooking oil

### **STEP 3: VISUAL MEASUREMENT PROTOCOL**
For EACH ingredient, measure against the plate:
1. What fraction of plate does it occupy? (1/8, 1/4, 1/3, 1/2, etc.)
2. How thick/tall is it compared to a finger (1cm) or thumb (2cm)?
3. Calculate: fraction × plate_area × thickness × density = weight

### **STEP 4: NUTRITIONAL CALCULATION (USE USDA VALUES)**
Standard values per 100g:
- Chicken breast (cooked): 165 kcal, 31g protein, 0g carbs, 3.6g fat
- Chicken thigh (cooked): 209 kcal, 26g protein, 0g carbs, 11g fat
- Salmon (cooked): 208 kcal, 20g protein, 0g carbs, 13g fat
- White rice (cooked): 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
- Mixed salad: 20 kcal, 1.5g protein, 3g carbs, 0.2g fat
- Avocado: 160 kcal, 2g protein, 9g carbs, 15g fat
- Olive oil: 884 kcal per 100ml (1 tbsp = 15ml = 133 kcal)

### **STEP 5: INGREDIENT ANALYSIS**
For EVERY visible food item:

**A) IDENTIFICATION:**
- Food name in ${langName.toUpperCase()}
- Specific type and cooking method in ${langName.toUpperCase()}

**B) DETAILED NUTRITIONAL DESCRIPTION (2-4 sentences in ${langName.toUpperCase()}):**
- Nutritional characteristics and health benefits
- Main macronutrients
- Vitamins, minerals, or special properties

**C) STANDARDIZED MEASUREMENT:**
- Fraction of plate occupied
- Estimated dimensions (use plate as reference)
- Weight based on standard portions above

**D) NUTRITIONAL VALUES:**
Calculate from weight × standard values per 100g

---

## 📊 REQUIRED OUTPUT STRUCTURE (in ${langName.toUpperCase()}):

{
  "plate_reference": {
    "estimated_diameter_cm": 26,
    "confidence": "high" | "medium" | "low"
  },
  "visible_ingredients": [
    {
      "name": "string (in ${langName.toUpperCase()})",
      "detailed_nutritional_description": "string (2-4 sentences in ${langName.toUpperCase()} - MANDATORY)",
      "identification": {
        "specific_type": "string",
        "cut": "string",
        "cooking_method": "string",
        "visual_notes": "string"
      },
      "dimensions": {
        "plate_fraction": "string (e.g., '1/4 plate')",
        "length_cm": number,
        "width_cm": number,
        "thickness_cm": number,
        "estimated_volume_cm3": number
      },
      "weight_estimation": {
        "estimated_grams": number,
        "reference_used": "string (e.g., 'palm-sized chicken breast = 120g')",
        "confidence": "high" | "medium" | "low"
      },
      "nutrition_per_item": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "hidden_ingredients": [
    {
      "name": "string (in ${langName.toUpperCase()})",
      "detailed_nutritional_description": "string (in ${langName.toUpperCase()} - MANDATORY)",
      "source": "user_description",
      "user_stated_amount": "string",
      "estimated_grams_or_ml": number,
      "nutrition_per_item": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "total_actual_nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "comparison_vs_planned": {
    "delta_calories": number,
    "delta_protein": number,
    "delta_carbs": number,
    "delta_fat": number
  },
  "detected_items": ["array of strings in ${langName.toUpperCase()}"],
  "assessment": "string in ${langName.toUpperCase()}",
  "adherence_level": "on_track" | "slightly_over" | "significantly_over" | "under",
  "suggested_meal_name": "string in ${langName.toUpperCase()}"
}

---

## ⚠️ CONSISTENCY RULES (CRITICAL):

1. **SAME PHOTO = SAME RESULT**: If you see a palm-sized chicken breast, ALWAYS estimate 100-120g
2. **USE STANDARD REFERENCES**: Don't invent weights - use the standard portions listed above
3. **DEFAULT PLATE = 26cm**: Unless clearly different
4. **NO HIDDEN OILS**: Don't add cooking oil unless user explicitly mentions it
5. **ROUND TO REALISTIC VALUES**: Use 100g, 120g, 150g - not 137g or 143g
6. **WHEN IN DOUBT, USE MIDDLE VALUE**: If portion looks 100-150g, use 125g
7. **ALL TEXT IN ${langName.toUpperCase()}**: Every food name and description

Now analyze the photo with CONSISTENT, REPRODUCIBLE measurements.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: uploadedUrls,
        response_json_schema: {
          type: "object",
          properties: {
            plate_reference: {
              type: "object",
              properties: {
                estimated_diameter_cm: { type: "number" },
                confidence: { type: "string", enum: ["high", "medium", "low"] }
              }
            },
            visible_ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  detailed_nutritional_description: { type: "string" },
                  identification: {
                    type: "object",
                    properties: {
                      specific_type: { type: "string" },
                      cut: { type: "string" },
                      cooking_method: { type: "string" },
                      visual_notes: { type: "string" }
                    }
                  },
                  dimensions: {
                    type: "object",
                    properties: {
                      length_cm: { type: "number" },
                      width_cm: { type: "number" },
                      thickness_cm: { type: "number" },
                      estimated_volume_cm3: { type: "number" }
                    }
                  },
                  weight_estimation: {
                    type: "object",
                    properties: {
                      estimated_grams: { type: "number" },
                      density_used_g_per_cm3: { type: "number" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] }
                    }
                  },
                  nutrition_per_item: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    }
                  }
                },
                required: ["name", "detailed_nutritional_description"]
              }
            },
            hidden_ingredients: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  detailed_nutritional_description: { type: "string" },
                  source: { type: "string" },
                  user_stated_amount: { type: "string" },
                  estimated_grams_or_ml: { type: "number" },
                  nutrition_per_item: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    }
                  }
                },
                required: ["name", "detailed_nutritional_description"]
              }
            },
            total_actual_nutrition: {
              type: "object",
              properties: {
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" }
              }
            },
            comparison_vs_planned: {
              type: "object",
              properties: {
                delta_calories: { type: "number" },
                delta_protein: { type: "number" },
                delta_carbs: { type: "number" },
                delta_fat: { type: "number" }
              }
            },
            detected_items: { type: "array", items: { type: "string" } },
            assessment: { type: "string" },
            adherence_level: { type: "string", enum: ["on_track", "slightly_over", "significantly_over", "under"] },
            suggested_meal_name: { type: "string" }
          },
          required: ["total_actual_nutrition", "detected_items", "assessment", "adherence_level", "suggested_meal_name"]
        }
      });

      const delta = analysis.total_actual_nutrition.calories - meal.total_calories;
      
      setAnalysisResult({
        ...analysis,
        photo_urls: uploadedUrls,
        delta_calories: delta,
        actual_calories: analysis.total_actual_nutrition.calories,
        actual_protein: analysis.total_actual_nutrition.protein,
        actual_carbs: analysis.total_actual_nutrition.carbs,
        actual_fat: analysis.total_actual_nutrition.fat
      });
    } catch (error) {
      console.error("Error analyzing photos:", error);
      alert(`Errore nell'analisi delle foto: ${error.message || 'Errore sconosciuto'}`);
    }
    setIsAnalyzing(false);
  };

  const saveAndRebalance = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await base44.entities.MealLog.create({
        user_id: user.id,
        original_meal_id: meal.id,
        date: today,
        meal_type: meal.meal_type,
        photo_url: analysisResult.photo_urls[0],
        detected_items: analysisResult.detected_items,
        actual_calories: analysisResult.actual_calories,
        actual_protein: analysisResult.actual_protein,
        actual_carbs: analysisResult.actual_carbs,
        actual_fat: analysisResult.actual_fat,
        planned_calories: meal.total_calories,
        delta_calories: analysisResult.delta_calories,
        rebalanced: false
      });

      // ✅ NON modificare il MealPlan ufficiale - lascialo invariato per le prossime settimane

      if (Math.abs(analysisResult.delta_calories) > 50) {
        onRebalanceNeeded(analysisResult.delta_calories, meal.meal_type);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving meal log:", error);
      alert("Errore nel salvataggio. Riprova.");
    }
    setIsSaving(false);
  };

  const saveWithoutRebalance = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await base44.entities.MealLog.create({
        user_id: user.id,
        original_meal_id: meal.id,
        date: today,
        meal_type: meal.meal_type,
        photo_url: analysisResult.photo_urls[0],
        detected_items: analysisResult.detected_items,
        actual_calories: analysisResult.actual_calories,
        actual_protein: analysisResult.actual_protein,
        actual_carbs: analysisResult.actual_carbs,
        actual_fat: analysisResult.actual_fat,
        planned_calories: meal.total_calories,
        delta_calories: analysisResult.delta_calories,
        rebalanced: true
      });

      // ✅ NON modificare il MealPlan ufficiale - lascialo invariato per le prossime settimane
      
      onClose();
    } catch (error) {
      console.error("Error saving meal log:", error);
      alert("Errore nel salvataggio. Riprova.");
    }
    setIsSaving(false);
  };

  return (
    <>
      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
          t={t}
        />
      )}
      
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-200">
          <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-[#26847F] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-gray-900 font-bold">
                {t('photoMealAnalyzer.title')}
              </span>
              <p className="text-sm text-gray-600 font-normal mt-1">{t('photoMealAnalyzer.subtitle')}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Upload Section - Only show if no photos uploaded */}
              {photos.length === 0 && (
                <div className="relative border-2 border-dashed border-[#26847F]/30 rounded-2xl p-8 text-center bg-gradient-to-br from-[#e9f6f5]/50 to-white hover:border-[#26847F]/50 transition-all group">
                  <Camera className="w-12 h-12 text-[#26847F] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-gray-800 font-semibold mb-2">{t('photoMealAnalyzer.uploadMealPhoto')}</p>
                  <p className="text-sm text-gray-600 mb-6">{t('photoMealAnalyzer.uploadInfo')}</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="camera-input"
                    />
                    <Button 
                      type="button" 
                      onClick={() => document.getElementById('camera-input').click()}
                      className="bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {t('photoMealAnalyzer.takePhoto')}
                    </Button>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="gallery-input"
                    />
                    <Button 
                      type="button" 
                      onClick={() => document.getElementById('gallery-input').click()}
                      variant="outline" 
                      className="border-2 border-[#26847F]/30 text-gray-700 hover:border-[#26847F] hover:bg-[#e9f6f5] transition-all"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('photoMealAnalyzer.selectFromGallery')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Photos Grid */}
              {photos.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#26847F]" />
                      {t('photoMealAnalyzer.photosUploaded')} ({photos.length})
                    </h3>
                    <Button 
                      type="button" 
                      onClick={() => setCameraOpen(true)}
                      variant="outline" 
                      size="sm" 
                      className="border-[#26847F]/30 text-gray-700 hover:border-[#26847F] hover:bg-[#e9f6f5]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('photoMealAnalyzer.addMorePhoto')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photos.map((photo, idx) => (
                      <motion.div 
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border-2 border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="relative mb-3 group">
                          <img 
                            src={photo.previewUrl} 
                            alt={`Foto ${idx + 1}`} 
                            className="w-full h-48 object-cover rounded-lg" 
                          />
                          <Button
                            onClick={() => removePhoto(photo.id)}
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                            {t('photoMealAnalyzer.photoLabel')} {idx + 1}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[#26847F]" />
                            {t('photoMealAnalyzer.ingredientDescription')}
                          </label>
                          <Textarea
                            placeholder={t('photoMealAnalyzer.descriptionPlaceholder')}
                            value={photo.description}
                            onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                            className="h-24 border-2 border-gray-300 focus:border-[#26847F] transition-all text-gray-800"
                          />
                          <p className="text-xs text-gray-600">💡 {t('photoMealAnalyzer.moreDetailsMoreAccurate')}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {!isAnalyzing && (
                    <Button
                      onClick={analyzePhotos}
                      className="w-full bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white text-lg py-7 shadow-xl hover:shadow-2xl transition-all font-bold"
                      disabled={photos.length === 0}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('photoMealAnalyzer.analyzeWithScience')}
                    </Button>
                  )}
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-gradient-to-br from-[#e9f6f5]/50 to-white rounded-2xl border-2 border-[#26847F]/20"
                >
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <Loader2 className="w-16 h-16 animate-spin text-[#26847F]" />
                    <Sparkles className="w-6 h-6 text-teal-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-2">🔬 {t('photoMealAnalyzer.analyzing')}</p>
                  <p className="text-sm text-gray-600 mb-4">{t('photoMealAnalyzer.dimensionalCalculation')}</p>
                  <div className="max-w-md mx-auto space-y-2 text-xs text-gray-600">
                    <p>✓ {t('photoMealAnalyzer.plateCalibration')}</p>
                    <p>✓ {t('photoMealAnalyzer.dimensionMeasurement')}</p>
                    <p>✓ {t('photoMealAnalyzer.weightEstimation')}</p>
                    <p>✓ {t('photoMealAnalyzer.nutritionCalculation')}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Analysis Results */
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <Button
                onClick={resetAnalysis}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-gray-200 hover:border-[#26847F] hover:bg-[#e9f6f5] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('photoMealAnalyzer.backAndReshoot')}
              </Button>

              {/* Suggested Meal Name */}
              <div className="bg-gradient-to-r from-[#e9f6f5] to-teal-50 p-6 rounded-2xl border-2 border-[#26847F]/30 shadow-lg">
                <h4 className="text-sm font-semibold text-[#0e4a46] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('photoMealAnalyzer.analyzedMealName')}
                </h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-[#26847F] to-teal-600 bg-clip-text text-transparent">
                  {analysisResult.suggested_meal_name}
                </p>
              </div>

              {/* Plate Reference (if available) */}
              {analysisResult.plate_reference && (
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    📏 {t('photoMealAnalyzer.plateReference')} {analysisResult.plate_reference.estimated_diameter_cm}cm
                  </p>
                  <p className="text-xs text-blue-600">
                    {t('photoMealAnalyzer.confidence')} {analysisResult.plate_reference.confidence === 'high' ? `🟢 ${t('photoMealAnalyzer.confidenceHigh')}` : analysisResult.plate_reference.confidence === 'medium' ? `🟡 ${t('photoMealAnalyzer.confidenceMedium')}` : `🔴 ${t('photoMealAnalyzer.confidenceLow')}`}
                  </p>
                </div>
              )}

              {/* Visible Ingredients Breakdown */}
              {analysisResult.visible_ingredients && analysisResult.visible_ingredients.length > 0 && (
                <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-md">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#26847F]" />
                    {t('photoMealAnalyzer.visibleIngredients')}
                  </h4>
                  <div className="space-y-4">
                    {analysisResult.visible_ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-bold text-gray-900 mb-2">{ing.name}</p>
                        
                        {/* DETAILED NUTRITIONAL DESCRIPTION for visible ingredients */}
                        {ing.detailed_nutritional_description && (
                          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border-2 border-yellow-200 mb-3">
                            <div className="flex items-start gap-2">
                              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {ing.detailed_nutritional_description}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                        {ing.identification && (
                          <div className="col-span-2">
                            <p className="text-gray-600">
                              <strong>{t('photoMealAnalyzer.type')}</strong> {ing.identification.specific_type} | 
                              <strong> {t('photoMealAnalyzer.cut')}</strong> {ing.identification.cut} | 
                              <strong> {t('photoMealAnalyzer.cooking')}</strong> {ing.identification.cooking_method}
                            </p>
                          </div>
                        )}
                        {ing.dimensions && (
                          <div>
                            <p className="text-gray-600">
                              <strong>📏 {t('photoMealAnalyzer.dimensions')}</strong><br/>
                              {ing.dimensions.length_cm}cm × {ing.dimensions.width_cm}cm × {ing.dimensions.thickness_cm}cm
                            </p>
                          </div>
                        )}
                        {ing.weight_estimation && (
                          <div>
                            <p className="text-gray-600">
                              <strong>⚖️ {t('photoMealAnalyzer.estimatedWeight')}</strong><br/>
                              {ing.weight_estimation.estimated_grams}g
                              {ing.weight_estimation.density_used_g_per_cm3 && (
                                <span className="text-xs text-gray-500"> ({t('photoMealAnalyzer.density')} {ing.weight_estimation.density_used_g_per_cm3}g/cm³)</span>
                              )}
                            </p>
                          </div>
                        )}
                          {ing.nutrition_per_item && (
                            <div className="col-span-2 bg-white p-2 rounded border border-gray-200">
                              <p className="text-gray-800 font-semibold">
                                {ing.nutrition_per_item.calories} kcal | 
                                P: {ing.nutrition_per_item.protein}g | 
                                C: {ing.nutrition_per_item.carbs}g | 
                                G: {ing.nutrition_per_item.fat}g
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden Ingredients */}
              {analysisResult.hidden_ingredients && analysisResult.hidden_ingredients.length > 0 && (
                <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200 shadow-md">
                  <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    👁️‍🗨️ {t('photoMealAnalyzer.hiddenIngredients')}
                  </h4>
                  <div className="space-y-3">
                    {analysisResult.hidden_ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200">
                        <p className="font-semibold text-gray-900 mb-2">{ing.name}</p>
                        
                        {/* DETAILED NUTRITIONAL DESCRIPTION for hidden ingredients */}
                        {ing.detailed_nutritional_description && (
                          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border-2 border-yellow-200 mb-2">
                            <div className="flex items-start gap-2">
                              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {ing.detailed_nutritional_description}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-600 mb-2">
                          "{ing.user_stated_amount}" → {ing.estimated_grams_or_ml}{ing.name.includes('olio') ? 'ml' : 'g'}
                        </p>
                        {ing.nutrition_per_item && (
                          <p className="text-xs text-gray-800 font-semibold bg-amber-100 px-2 py-1 rounded">
                            {ing.nutrition_per_item.calories} kcal | 
                            P: {ing.nutrition_per_item.protein}g | 
                            C: {ing.nutrition_per_item.carbs}g | 
                            G: {ing.nutrition_per_item.fat}g
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adherence Badge */}
              <div className={`p-5 rounded-2xl border-2 shadow-lg ${
                analysisResult.adherence_level === 'on_track' 
                  ? 'border-green-300 bg-gradient-to-br from-green-50 to-green-100'
                  : analysisResult.adherence_level.includes('over')
                  ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100'
                  : 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {analysisResult.adherence_level === 'on_track' ? (
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <h4 className="font-bold text-lg">{t('photoMealAnalyzer.scientificEvaluation')}</h4>
                </div>
                <p className="text-sm leading-relaxed">{analysisResult.assessment}</p>
              </div>

              {/* Photo Thumbnails */}
              <div className="flex gap-2 overflow-x-auto p-2 bg-gray-50 rounded-xl">
                {photos.map((photo, idx) => (
                  <img 
                    key={photo.id}
                    src={photo.previewUrl} 
                    alt={`Foto ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:scale-105 transition-transform"
                  />
                ))}
              </div>

              {/* Nutritional Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200 shadow-md">
                  <p className="text-sm text-gray-600 font-medium mb-2">🎯 {t('photoMealAnalyzer.planned')}</p>
                  <p className="text-3xl font-bold text-gray-900">{meal.total_calories} kcal</p>
                  <div className="text-xs text-gray-600 mt-3 space-y-1.5">
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.proteins')}</span><strong>{meal.total_protein}g</strong></div>
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.carbs')}</span><strong>{meal.total_carbs}g</strong></div>
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.fats')}</span><strong>{meal.total_fat}g</strong></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#e9f6f5] to-teal-50 p-5 rounded-xl border-2 border-[#26847F]/30 shadow-md">
                  <p className="text-sm text-[#0e4a46] font-medium mb-2">🔬 {t('photoMealAnalyzer.scientificAnalysis')}</p>
                  <p className="text-3xl font-bold text-[#26847F]">{analysisResult.actual_calories} kcal</p>
                  <div className="text-xs text-[#0e4a46] mt-3 space-y-1.5">
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.proteins')}</span><strong>{analysisResult.actual_protein}g</strong></div>
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.carbs')}</span><strong>{analysisResult.actual_carbs}g</strong></div>
                    <div className="flex justify-between"><span>{t('photoMealAnalyzer.fats')}</span><strong>{analysisResult.actual_fat}g</strong></div>
                  </div>
                </div>
              </div>

              {/* Delta Calories */}
              {analysisResult.delta_calories !== 0 && (
                <div className={`p-4 rounded-xl text-center font-bold text-lg shadow-lg ${
                  analysisResult.delta_calories > 0 
                    ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-2 border-red-300'
                    : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-300'
                }`}>
                  {analysisResult.delta_calories > 0 ? '📈 +' : '📉 '}{Math.abs(analysisResult.delta_calories)} kcal {t('photoMealAnalyzer.fromPlan')}
                </div>
              )}

              {/* Detected Items Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  📋 {t('photoMealAnalyzer.detectedItemsSummary')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.detected_items.map((item, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm text-gray-800 border-2 border-gray-200 font-medium hover:border-[#26847F] transition-all shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {analysisResult && (
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={saveWithoutRebalance}
              variant="outline"
              disabled={isSaving}
              className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              {t('photoMealAnalyzer.saveWithoutRebalance')}
            </Button>
            {Math.abs(analysisResult.delta_calories) > 50 && (
              <Button
                onClick={saveAndRebalance}
                className="bg-gradient-to-r from-[#26847F] to-teal-600 hover:from-[#1f6b66] hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {t('photoMealAnalyzer.saveAndRebalance')}
              </Button>
            )}
            </DialogFooter>
            )}
            </DialogContent>
            </Dialog>
            </>
            );
            }