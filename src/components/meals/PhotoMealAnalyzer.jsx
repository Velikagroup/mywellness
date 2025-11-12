
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, X, Plus, ArrowLeft, Sparkles, Zap, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhotoMealAnalyzer({ meal, user, onClose, onRebalanceNeeded }) {
  const [photos, setPhotos] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const filesRef = useRef(new Map());

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
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
    
    e.target.value = '';
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

      const photoDescriptions = updatedPhotos.map((photo, idx) => 
        `Foto ${idx + 1}: ${photo.description || 'Nessuna descrizione fornita'}`
      ).join('\n');

      const analysisPrompt = `You are an EXPERT nutritionist, food scientist, and computer vision specialist. Perform a HIGHLY DETAILED and SCIENTIFIC analysis of this meal.

CRITICAL: Generate ALL content in ITALIAN language. Food names, cut types, and analysis MUST be in Italian.

**PLANNED MEAL (Reference):**
- Name: ${meal.name}
- Planned Calories: ${meal.total_calories} kcal
- Planned Protein: ${meal.total_protein}g | Carbs: ${meal.total_carbs}g | Fat: ${meal.total_fat}g

**USER PROVIDED ${updatedPhotos.length} PHOTO(S) WITH DESCRIPTIONS:**
${photoDescriptions}

---

## 🔬 SCIENTIFIC ANALYSIS PROTOCOL

### **STEP 1: DIMENSIONAL REFERENCE CALIBRATION**
1. Identify the PLATE in the photo
2. Estimate plate diameter (standard: 24-26cm, large: 28-30cm, small: 20-22cm)
3. Use the plate as a REFERENCE SCALE for all measurements
4. If cutlery is visible, use it as secondary reference (fork: ~20cm, spoon: ~18cm)

### **STEP 2: INGREDIENT-BY-INGREDIENT VISUAL ANALYSIS**
For EVERY visible food item in the photo, perform this analysis:

**A) IDENTIFICATION:**
- Food name in Italian (e.g., "petto di pollo grigliato", "coscia di pollo arrosto", "salmone selvaggio")
- Specific cut/type (e.g., "petto di pollo", "coscia", "filetto", "fesa")
- Cooking method (e.g., "grigliato", "al forno", "bollito", "fritto")
- Visible characteristics (color, texture, visible fat, marbling)

**B) DETAILED NUTRITIONAL DESCRIPTION (CRITICAL):**
For EACH ingredient, write a COMPREHENSIVE nutritional description in Italian (2-4 sentences) that includes:
- What the food is and its nutritional characteristics
- Main macronutrients and their health benefits
- Specific nutritional notes (e.g., "ricco di proteine nobili", "fonte di grassi omega-3", "contiene vitamine del gruppo B")
- Cooking method impact on nutrition if relevant
- Any special properties (e.g., "il ghee è burro chiarificato, privo di lattosio e caseina")

EXAMPLE FORMAT:
"Il petto di pollo grigliato è una fonte eccellente di proteine nobili ad alto valore biologico (circa 31g per 100g), essenziali per il mantenimento e la crescita muscolare. Contiene pochi grassi saturi e fornisce vitamine del gruppo B, fondamentali per il metabolismo energetico. La cottura alla griglia preserva le proprietà nutrizionali riducendo l'aggiunta di grassi. È un alimento ideale per chi cerca un apporto proteico magro e di qualità."

**C) DIMENSIONAL MEASUREMENT:**
- Length (cm) - compare to plate diameter
- Width (cm) - compare to plate diameter
- Estimated thickness/height (cm) - from visual perspective
- Estimated volume (cm³) - calculate from dimensions

**D) WEIGHT ESTIMATION:**
Use these density references:
- Lean meat (chicken breast): ~1.0-1.1 g/cm³
- Fatty meat (chicken thigh): ~1.0-1.05 g/cm³
- Fish (salmon): ~1.0-1.05 g/cm³
- Cooked vegetables: ~0.5-0.7 g/cm³
- Raw vegetables: ~0.9-1.0 g/cm³
- Avocado: ~0.9 g/cm³
- Oils (visible): estimate ml from surface area and depth

**E) NUTRITIONAL CALCULATION:**
Based on estimated weight and food type, calculate:
- Calories (kcal)
- Protein (g)
- Carbs (g)
- Fat (g)

Use verified nutritional databases (USDA, CREA, INRAN) for accurate values per 100g.

### **STEP 3: USER DESCRIPTION INTEGRATION**
**A) VISIBLE IN PHOTO:**
- Cross-reference user descriptions with visual analysis
- If user mentions quantities (e.g., "150g chicken"), PRIORITIZE user data if reasonable
- If discrepancy, note it and explain

**B) NOT VISIBLE IN PHOTO (Hidden/Described Only):**
For ingredients user mentions but NOT visible in photo:
- Cooking oils used ("ho messo 2 cucchiai d'olio" = ~30ml = 270 kcal)
- Sauces/dressings not visible
- Seasonings with calories (butter, honey, etc.)
- Internal fillings (stuffed foods)
- INCLUDE DETAILED NUTRITIONAL DESCRIPTION for each hidden ingredient too

Calculate these separately based ENTIRELY on user descriptions.

### **STEP 4: COMPREHENSIVE TOTALS**
Sum all components:
- VISIBLE items (from photo analysis)
- HIDDEN items (from user description)

### **STEP 5: COMPARISON & ASSESSMENT**
Compare actual vs planned:
- Calculate delta for each macro
- Assess adherence level
- Provide scientific reasoning

---

## 📊 REQUIRED OUTPUT STRUCTURE

Return a JSON object with this EXACT structure (all in Italian):

{
  "plate_reference": {
    "estimated_diameter_cm": number,
    "confidence": "high" | "medium" | "low"
  },
  "visible_ingredients": [
    {
      "name": "string (in Italian, e.g., 'petto di pollo grigliato')",
      "detailed_nutritional_description": "string (2-4 sentences in Italian explaining nutritional properties, benefits, composition - MANDATORY)",
      "identification": {
        "specific_type": "string (e.g., 'petto di pollo', 'coscia', 'filetto')",
        "cut": "string (e.g., 'a fette', 'intero', 'a cubetti')",
        "cooking_method": "string (e.g., 'grigliato', 'al forno', 'bollito')",
        "visual_notes": "string (color, texture, visible fat)"
      },
      "dimensions": {
        "length_cm": number,
        "width_cm": number,
        "thickness_cm": number,
        "estimated_volume_cm3": number
      },
      "weight_estimation": {
        "estimated_grams": number,
        "density_used_g_per_cm3": number,
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
      "name": "string (in Italian)",
      "detailed_nutritional_description": "string (2-4 sentences in Italian - MANDATORY)",
      "source": "user_description",
      "user_stated_amount": "string (e.g., '2 cucchiai', '15ml')",
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
  "detected_items": ["array of strings in Italian"],
  "assessment": "string - detailed Italian explanation of analysis",
  "adherence_level": "on_track" | "slightly_over" | "significantly_over" | "under",
  "suggested_meal_name": "string in Italian"
}

---

## ⚠️ IMPORTANT GUIDELINES:

1. **DETAILED DESCRIPTIONS ARE MANDATORY**: Every ingredient MUST have a comprehensive nutritional description
2. **BE PRECISE**: Use decimal points for accuracy (e.g., 7.5cm, not 8cm)
3. **BE REALISTIC**: Don't overestimate or underestimate portions
4. **USE CONTEXT**: If user says "pollo 150g" and visually looks 150g, use 150g
5. **ACCOUNT FOR EVERYTHING**: Even small amounts of oil/butter add up
6. **VISIBLE FAT**: If you see visible fat on meat, increase fat content estimate
7. **COOKED vs RAW**: Cooked meat loses ~25% water weight
8. **ALL IN ITALIAN**: Every food name and description must be in Italian

Now perform the analysis with DETAILED NUTRITIONAL DESCRIPTIONS for every ingredient.`;

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

      await base44.entities.MealPlan.update(meal.id, {
        image_url: analysisResult.photo_urls[0],
        name: analysisResult.suggested_meal_name
      });

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

      await base44.entities.MealPlan.update(meal.id, {
        image_url: analysisResult.photo_urls[0],
        name: analysisResult.suggested_meal_name
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving meal log:", error);
      alert("Errore nel salvataggio. Riprova.");
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-[var(--brand-primary-light)]/20 to-white border-2 border-[var(--brand-primary)]/20">
        <DialogHeader className="border-b border-gray-200/50 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent font-bold">
                Analisi Scientifica Pasto AI
              </span>
              <p className="text-sm text-gray-500 font-normal mt-1">Analisi dimensionale e calcolo preciso ingrediente per ingrediente</p>
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
              {/* Upload Section */}
              <div className="relative border-2 border-dashed border-[var(--brand-primary)]/30 rounded-2xl p-8 text-center bg-gradient-to-br from-[var(--brand-primary-light)]/30 to-white hover:border-[var(--brand-primary)]/50 transition-all group">
                <Camera className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-gray-700 font-semibold mb-2">📸 Carica foto del tuo pasto</p>
                <p className="text-sm text-gray-500 mb-6">L'AI farà analisi dimensionale per calcolare peso e nutrienti con precisione scientifica</p>
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
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 hover:from-[var(--brand-primary-hover)] hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scatta Foto
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
                    className="border-2 border-[var(--brand-primary)]/30 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Carica da Galleria
                  </Button>
                </div>
              </div>

              {/* Photos Grid */}
              {photos.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[var(--brand-primary)]" />
                      Foto Caricate ({photos.length})
                    </h3>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="add-more-input"
                    />
                    <Button 
                      type="button" 
                      onClick={() => document.getElementById('add-more-input').click()}
                      variant="outline" 
                      size="sm" 
                      className="border-[var(--brand-primary)]/30 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Aggiungi Altra Foto
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {photos.map((photo, idx) => (
                      <motion.div 
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border-2 border-gray-200/50 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all"
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
                            Foto {idx + 1}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                            Descrizione Ingredienti (anche nascosti)
                          </label>
                          <Textarea
                            placeholder="Es: Petto di pollo 180g, ho messo 2 cucchiai d'olio per cucinarlo, c'è anche del burro sulle verdure che non si vede"
                            value={photo.description}
                            onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                            className="h-24 border-2 border-gray-200 focus:border-[var(--brand-primary)] transition-all"
                          />
                          <p className="text-xs text-gray-500">💡 Più dettagli fornisci, più sarà preciso il calcolo</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {!isAnalyzing && (
                    <Button
                      onClick={analyzePhotos}
                      className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 hover:from-[var(--brand-primary-hover)] hover:to-teal-700 text-white text-lg py-7 shadow-xl hover:shadow-2xl transition-all font-bold"
                      disabled={photos.length === 0}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analizza con Precisione Scientifica
                    </Button>
                  )}
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-gradient-to-br from-[var(--brand-primary-light)]/30 to-white rounded-2xl border-2 border-[var(--brand-primary)]/20"
                >
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <Loader2 className="w-16 h-16 animate-spin text-[var(--brand-primary)]" />
                    <Sparkles className="w-6 h-6 text-teal-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-2">🔬 Analisi scientifica in corso...</p>
                  <p className="text-sm text-gray-600 mb-4">Calcolo dimensionale ingrediente per ingrediente</p>
                  <div className="max-w-md mx-auto space-y-2 text-xs text-gray-500">
                    <p>✓ Calibrazione riferimento piatto</p>
                    <p>✓ Misurazione dimensioni alimenti</p>
                    <p>✓ Stima peso per densità</p>
                    <p>✓ Calcolo valori nutrizionali</p>
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
                className="flex items-center gap-2 border-2 border-gray-200 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna Indietro e Riscatta
              </Button>

              {/* Suggested Meal Name */}
              <div className="bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 p-6 rounded-2xl border-2 border-[var(--brand-primary)]/30 shadow-lg">
                <h4 className="text-sm font-semibold text-[var(--brand-primary-dark-text)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Nome Pasto Analizzato:
                </h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
                  {analysisResult.suggested_meal_name}
                </p>
              </div>

              {/* Plate Reference (if available) */}
              {analysisResult.plate_reference && (
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    📏 Riferimento Piatto: {analysisResult.plate_reference.estimated_diameter_cm}cm
                  </p>
                  <p className="text-xs text-blue-600">
                    Confidenza: {analysisResult.plate_reference.confidence === 'high' ? '🟢 Alta' : analysisResult.plate_reference.confidence === 'medium' ? '🟡 Media' : '🔴 Bassa'}
                  </p>
                </div>
              )}

              {/* Visible Ingredients Breakdown */}
              {analysisResult.visible_ingredients && analysisResult.visible_ingredients.length > 0 && (
                <div className="bg-white p-5 rounded-xl border-2 border-gray-200 shadow-md">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[var(--brand-primary)]" />
                    Ingredienti Visibili (Analisi Dimensionale)
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
                                <strong>Tipo:</strong> {ing.identification.specific_type} | 
                                <strong> Taglio:</strong> {ing.identification.cut} | 
                                <strong> Cottura:</strong> {ing.identification.cooking_method}
                              </p>
                            </div>
                          )}
                          {ing.dimensions && (
                            <div>
                              <p className="text-gray-600">
                                <strong>📏 Dimensioni:</strong><br/>
                                {ing.dimensions.length_cm}cm × {ing.dimensions.width_cm}cm × {ing.dimensions.thickness_cm}cm
                              </p>
                            </div>
                          )}
                          {ing.weight_estimation && (
                            <div>
                              <p className="text-gray-600">
                                <strong>⚖️ Peso Stimato:</strong><br/>
                                {ing.weight_estimation.estimated_grams}g
                                <span className="text-xs text-gray-500"> (densità: {ing.weight_estimation.density_used_g_per_cm3}g/cm³)</span>
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
                    👁️‍🗨️ Ingredienti Nascosti (da Descrizione)
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
                  <h4 className="font-bold text-lg">Valutazione Scientifica AI</h4>
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
                  <p className="text-sm text-gray-600 font-medium mb-2">🎯 Pianificato</p>
                  <p className="text-3xl font-bold text-gray-900">{meal.total_calories} kcal</p>
                  <div className="text-xs text-gray-600 mt-3 space-y-1.5">
                    <div className="flex justify-between"><span>Proteine:</span><strong>{meal.total_protein}g</strong></div>
                    <div className="flex justify-between"><span>Carboidrati:</span><strong>{meal.total_carbs}g</strong></div>
                    <div className="flex justify-between"><span>Grassi:</span><strong>{meal.total_fat}g</strong></div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[var(--brand-primary-light)] to-teal-50 p-5 rounded-xl border-2 border-[var(--brand-primary)]/30 shadow-md">
                  <p className="text-sm text-[var(--brand-primary-dark-text)] font-medium mb-2">🔬 Analisi Scientifica</p>
                  <p className="text-3xl font-bold text-[var(--brand-primary)]">{analysisResult.actual_calories} kcal</p>
                  <div className="text-xs text-[var(--brand-primary-dark-text)] mt-3 space-y-1.5">
                    <div className="flex justify-between"><span>Proteine:</span><strong>{analysisResult.actual_protein}g</strong></div>
                    <div className="flex justify-between"><span>Carboidrati:</span><strong>{analysisResult.actual_carbs}g</strong></div>
                    <div className="flex justify-between"><span>Grassi:</span><strong>{analysisResult.actual_fat}g</strong></div>
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
                  {analysisResult.delta_calories > 0 ? '📈 +' : '📉 '}{Math.abs(analysisResult.delta_calories)} kcal dal piano
                </div>
              )}

              {/* Detected Items Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  📋 Riepilogo Alimenti Identificati:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.detected_items.map((item, idx) => (
                    <span key={idx} className="px-4 py-2 bg-white rounded-full text-sm text-gray-800 border-2 border-gray-200 font-medium hover:border-[var(--brand-primary)] transition-all shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {analysisResult && (
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200/50">
            <Button
              onClick={saveWithoutRebalance}
              variant="outline"
              disabled={isSaving}
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              Salva Senza Ribilanciare
            </Button>
            {Math.abs(analysisResult.delta_calories) > 50 && (
              <Button
                onClick={saveAndRebalance}
                className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 hover:from-[var(--brand-primary-hover)] hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Salva e Ribilancia Pasti
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
