
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, X, Plus, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { MealLog } from '@/entities/MealLog';
import { MealPlan } from '@/entities/MealPlan';
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
          const result = await UploadFile({ file: file });
          
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

      const analysisPrompt = `You are an expert nutritionist and food analyst. Analyze these meal photos with the user's descriptions and provide detailed nutritional information.

      CRITICAL: Generate ALL content in ITALIAN language. Food item names in 'detected_items' MUST be in Italian, and 'suggested_meal_name' MUST be in Italian.

      Planned Meal Info (for reference):
      - Name: ${meal.name}
      - Planned Calories: ${meal.total_calories} kcal
      - Planned Protein: ${meal.total_protein}g
      - Planned Carbs: ${meal.total_carbs}g
      - Planned Fat: ${meal.total_fat}g

      User has provided ${updatedPhotos.length} photo(s) with these descriptions:
      ${photoDescriptions}

      IMPORTANT: Use both the visual information from the photos AND the user's text descriptions to make your analysis. The descriptions contain crucial information about:
      - Hidden ingredients (sauces, fillings, seasonings)
      - Portion sizes and plate dimensions
      - Cooking methods
      - Specific ingredients not visible in photos

      Task:
      1. Carefully analyze ALL photos together with their descriptions
      2. Identify all food items (visible AND described by user) with Italian names (e.g., "petto di pollo alla griglia", "riso integrale", "zucchine saltate", "olio di oliva")
      3. Estimate accurate portion sizes using both visual cues and user descriptions
      4. Calculate total nutritional values considering ALL information
      5. Compare with planned meal
      6. Create a NEW, descriptive meal name in Italian based on what you actually see in the photos and descriptions (e.g., "Pollo alla Griglia con Insalata Mista", "Pasta Integrale al Pomodoro con Parmigiano")
      7. Provide a brief assessment in Italian

      Return ONLY a JSON object with this structure. All text fields must be in Italian.`;

      const analysis = await InvokeLLM({
        prompt: analysisPrompt,
        file_urls: uploadedUrls,
        response_json_schema: {
          type: "object",
          properties: {
            detected_items: { type: "array", items: { type: "string" } },
            actual_calories: { type: "number" },
            actual_protein: { type: "number" },
            actual_carbs: { type: "number" },
            actual_fat: { type: "number" },
            assessment: { type: "string" },
            adherence_level: { type: "string", enum: ["on_track", "slightly_over", "significantly_over", "under"] },
            suggested_meal_name: { type: "string" }
          },
          required: ["detected_items", "actual_calories", "actual_protein", "actual_carbs", "actual_fat", "assessment", "adherence_level", "suggested_meal_name"]
        }
      });

      const delta = analysis.actual_calories - meal.total_calories;
      
      setAnalysisResult({
        ...analysis,
        photo_urls: uploadedUrls,
        delta_calories: delta
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
      
      await MealLog.create({
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

      await MealPlan.update(meal.id, {
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
      
      await MealLog.create({
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

      await MealPlan.update(meal.id, {
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
                Analisi Pasto con AI
              </span>
              <p className="text-sm text-gray-500 font-normal mt-1">Carica più foto e descrivi ogni dettaglio</p>
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
                <p className="text-gray-700 font-semibold mb-2">Carica una o più foto del tuo pasto</p>
                <p className="text-sm text-gray-500 mb-6">Per risultati ottimali, inquadra bene il piatto e descrivi gli ingredienti</p>
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
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Scatta Foto
                    </span>
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
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Carica da Galleria
                    </span>
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
                      <span>
                        <Plus className="w-4 h-4 mr-1" />
                        Aggiungi Altra Foto
                      </span>
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
                            Descrizione Dettagliata
                          </label>
                          <Textarea
                            placeholder="Es: Piatto di pasta al pomodoro, circa 200g. C'è parmigiano grattugiato sopra e un filo d'olio. La pasta è integrale."
                            value={photo.description}
                            onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                            className="h-24 border-2 border-gray-200 focus:border-[var(--brand-primary)] transition-all"
                          />
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
                      Analizza con AI
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
                  <p className="text-gray-900 font-bold text-lg mb-2">L'AI sta analizzando {photos.length} {photos.length === 1 ? 'foto' : 'foto'}...</p>
                  <p className="text-sm text-gray-600">Stiamo processando immagini e descrizioni per un'analisi accurata</p>
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
                  Nome Pasto Suggerito dall'AI:
                </h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
                  {analysisResult.suggested_meal_name}
                </p>
              </div>

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
                  <h4 className="font-bold text-lg">Valutazione AI</h4>
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
                  <p className="text-sm text-[var(--brand-primary-dark-text)] font-medium mb-2">✨ Effettivo (AI)</p>
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

              {/* Detected Items */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border-2 border-gray-200 shadow-md">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--brand-primary)]" />
                  Alimenti Rilevati dall'AI:
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
