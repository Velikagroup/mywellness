
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, X, Info, Zap } from 'lucide-react';
import { UploadFile, InvokeLLM } from '@/integrations/Core';
import { ProgressPhoto } from '@/entities/ProgressPhoto';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProgressPhotoAnalyzer({ user, onClose, onAnalysisComplete }) {
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previousPhoto, setPreviousPhoto] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const loadPreviousPhoto = async () => {
      try {
        const photos = await ProgressPhoto.filter({ user_id: user.id }, '-date', 1);
        if (photos.length > 0) {
          setPreviousPhoto(photos[0]);
        }
      } catch (error) {
        console.error("Error loading previous photo:", error);
      }
    };
    
    if (user?.id) {
      loadPreviousPhoto();
    }
  }, [user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileRef.current = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhoto({
        previewUrl: event.target.result,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const analyzePhoto = async () => {
    if (!photo || !fileRef.current) return;
    
    setIsAnalyzing(true);
    try {
      const { file_url } = await UploadFile({ file: fileRef.current });

      let analysisPrompt;
      let file_urls = file_url;

      if (previousPhoto) {
        file_urls = [previousPhoto.photo_url, file_url];
        
        analysisPrompt = `You are an expert fitness coach. Compare these two progress photos: the FIRST is from ${previousPhoto.date}, the SECOND is the new photo.

        CRITICAL INSTRUCTIONS:
        - Generate ALL content in ITALIAN language
        - Be VERY CONSERVATIVE and careful in your analysis
        - Only comment on what you can CLEARLY see in the photos
        - DO NOT estimate body fat percentage
        - DO NOT mention body parts that are not visible in the photos
        - DO NOT make assumptions about areas you cannot see
        - Focus ONLY on visible, clear differences between the two photos

        User Context:
        - Gender: ${user.gender}
        - Weight at previous photo: ${previousPhoto.weight}kg
        - Current Weight: ${user.current_weight}kg
        - Weight change: ${(user.current_weight - previousPhoto.weight).toFixed(1)}kg
        - Days between photos: ${Math.floor((new Date() - new Date(previousPhoto.date)) / (1000 * 60 * 60 * 24))}
        
        User Notes: ${notes || 'Nessuna nota'}

        Task:
        1. Compare the two photos carefully
        2. List ONLY visible improvements (e.g., "Maggiore definizione visibile nelle braccia", "Addominali più evidenti")
        3. List ONLY visible regressions if any (be honest but constructive)
        4. Provide 2-3 specific, actionable recommendations
        5. Decide if workout or diet adjustment is needed based on visible progress
        6. Write a motivational message in Italian

        IMPORTANT: If you cannot clearly see a difference or a body part, DO NOT mention it.`;

      } else {
        analysisPrompt = `You are an expert fitness coach. This is the user's FIRST progress photo.

        CRITICAL INSTRUCTIONS:
        - Generate ALL content in ITALIAN language
        - Be VERY CONSERVATIVE - this is just a baseline photo
        - Only comment on what you can CLEARLY see
        - DO NOT estimate body fat percentage
        - DO NOT mention body parts not visible in the photo
        - DO NOT give "strong points" or "weak points" - this is the starting point
        - Just acknowledge this as the baseline for future comparisons

        User Context:
        - Gender: ${user.gender}
        - Current Weight: ${user.current_weight}kg
        - Target Weight: ${user.target_weight}kg
        - Fitness Goal: ${user.fitness_goal}
        
        User Notes: ${notes || 'Nessuna nota'}

        Task:
        1. Acknowledge this is the baseline photo
        2. Give 2-3 encouraging, general recommendations to start the journey
        3. Write a motivational message to start strong

        Remember: This is just the starting point. Be encouraging and positive.`;
      }

      const schema = {
        type: "object",
        properties: {
          comparison_result: { 
            type: "string", 
            enum: ["first_photo", "improved", "maintained", "regressed"] 
          },
          visible_improvements: { 
            type: "array", 
            items: { type: "string" },
            description: "ONLY list improvements you can clearly see in the photos"
          },
          visible_regressions: { 
            type: "array", 
            items: { type: "string" },
            description: "ONLY list regressions you can clearly see in the photos"
          },
          overall_assessment: { 
            type: "string",
            description: "A careful, honest assessment based only on visible changes"
          },
          recommendations: { 
            type: "array", 
            items: { type: "string" },
            description: "2-3 specific, actionable recommendations in Italian"
          },
          workout_adjustment_needed: { type: "boolean" },
          diet_adjustment_needed: { type: "boolean" },
          motivational_message: { type: "string" }
        },
        required: ["comparison_result", "visible_improvements", "visible_regressions", "overall_assessment", "recommendations", "workout_adjustment_needed", "diet_adjustment_needed", "motivational_message"]
      };

      const analysis = await InvokeLLM({
        prompt: analysisPrompt,
        file_urls: file_urls,
        response_json_schema: schema
      });

      setAnalysisResult({
        ...analysis,
        photo_url: file_url
      });
    } catch (error) {
      console.error("Error analyzing photo:", error);
      alert(`Errore nell'analisi della foto: ${error.message || 'Errore sconosciuto'}`);
    }
    setIsAnalyzing(false);
  };

  const saveAnalysis = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await ProgressPhoto.create({
        user_id: user.id,
        photo_url: analysisResult.photo_url,
        date: today,
        weight: user.current_weight,
        ai_analysis: {
          comparison_result: analysisResult.comparison_result,
          visible_improvements: analysisResult.visible_improvements,
          visible_regressions: analysisResult.visible_regressions,
          overall_assessment: analysisResult.overall_assessment,
          recommendations: analysisResult.recommendations,
          workout_adjustment_needed: analysisResult.workout_adjustment_needed,
          diet_adjustment_needed: analysisResult.diet_adjustment_needed,
          motivational_message: analysisResult.motivational_message
        },
        notes: notes
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving progress photo:", error);
      alert("Errore nel salvataggio. Riprova.");
    }
    setIsSaving(false);
  };

  const getComparisonConfig = (result) => {
    const configs = {
      first_photo: { 
        icon: Camera, 
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-300',
        label: 'Prima Foto - Baseline'
      },
      improved: { 
        icon: TrendingUp, 
        color: 'from-green-500 to-emerald-500',
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-300',
        label: 'Miglioramento Visibile'
      },
      maintained: { 
        icon: Minus, 
        color: 'from-yellow-500 to-amber-500',
        bgColor: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-300',
        label: 'Mantenimento'
      },
      regressed: { 
        icon: TrendingDown, 
        color: 'from-orange-500 to-red-500',
        bgColor: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-300',
        label: 'Regresso'
      }
    };
    return configs[result] || configs.maintained;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-purple-50/30 to-white border-2 border-purple-200/30">
        <DialogHeader className="border-b border-gray-200/50 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                Analisi Progressi con AI
              </span>
              <p className="text-sm text-gray-500 font-normal mt-1">
                {previousPhoto 
                  ? `Confronto con foto del ${new Date(previousPhoto.date).toLocaleDateString('it-IT')}`
                  : 'Questa sarà la tua foto baseline'}
              </p>
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
              {!photo ? (
                <div className="relative border-2 border-dashed border-purple-300 rounded-2xl p-10 text-center bg-gradient-to-br from-purple-50/30 to-white hover:border-purple-400 transition-all group">
                  <Camera className="w-14 h-14 text-purple-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-gray-700 font-semibold mb-2 text-lg">Carica una foto del tuo fisico</p>
                  {previousPhoto && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 max-w-md mx-auto">
                      <p className="text-sm text-blue-800 flex items-center gap-2 justify-center">
                        <Info className="w-4 h-4" />
                        Scatta nella stessa posizione della foto precedente
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 justify-center flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="camera-input-progress"
                    />
                    <Button 
                      type="button" 
                      onClick={() => document.getElementById('camera-input-progress').click()}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Scatta Foto
                    </Button>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="gallery-input-progress"
                    />
                    <Button 
                      type="button" 
                      onClick={() => document.getElementById('gallery-input-progress').click()}
                      variant="outline" 
                      className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Carica da Galleria
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {previousPhoto && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200 shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-900 mb-1">Confronto Attivo</p>
                          <p className="text-sm text-blue-800">
                            L'AI confronterà con la foto del {new Date(previousPhoto.date).toLocaleDateString('it-IT')} 
                            <span className="font-semibold"> (peso: {previousPhoto.weight}kg → ora: {user.current_weight}kg)</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    {previousPhoto && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Foto Precedente
                        </p>
                        <img 
                          src={previousPhoto.photo_url} 
                          alt="Foto precedente" 
                          className="w-full h-80 object-cover rounded-xl border-2 border-gray-300 shadow-lg" 
                        />
                      </div>
                    )}
                    <div className={previousPhoto ? '' : 'col-span-2'}>
                      <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Nuova Foto
                      </p>
                      <div className="relative group">
                        <img 
                          src={photo.previewUrl} 
                          alt="Nuova foto" 
                          className="w-full h-80 object-cover rounded-xl border-2 border-green-400 shadow-lg" 
                        />
                        <Button
                          onClick={() => {
                            setPhoto(null);
                            fileRef.current = null;
                          }}
                          variant="destructive"
                          size="icon"
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      Note opzionali
                    </label>
                    <Textarea
                      placeholder="Es: 'Ho aumentato i pesi', 'Mi sento più energico', 'Ho seguito il piano alla lettera'..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-24 border-2 border-gray-200 focus:border-purple-400 transition-all"
                    />
                  </div>

                  {!isAnalyzing && (
                    <Button
                      onClick={analyzePhoto}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg py-7 shadow-xl hover:shadow-2xl transition-all font-bold"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {previousPhoto ? 'Confronta con AI' : 'Salva Foto Baseline'}
                    </Button>
                  )}
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-gradient-to-br from-purple-50/30 to-white rounded-2xl border-2 border-purple-200"
                >
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <Loader2 className="w-20 h-20 animate-spin text-purple-500" />
                    <Sparkles className="w-8 h-8 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-gray-900 font-bold text-xl mb-2">
                    {previousPhoto ? 'L\'AI sta confrontando le foto...' : 'L\'AI sta analizzando la foto...'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {previousPhoto ? 'Sto valutando i cambiamenti visibili nel tuo fisico' : 'Sto salvando la tua foto baseline per confronti futuri'}
                  </p>
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
              {/* Photo Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {previousPhoto && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Prima ({new Date(previousPhoto.date).toLocaleDateString('it-IT')})</p>
                    <img 
                      src={previousPhoto.photo_url} 
                      alt="Foto precedente" 
                      className="w-full h-64 object-cover rounded-xl border-2 border-gray-300 shadow-lg"
                    />
                  </div>
                )}
                <div className={previousPhoto ? '' : 'col-span-2'}>
                  <p className="text-sm font-medium text-gray-600 mb-2">Oggi</p>
                  <img 
                    src={photo.previewUrl} 
                    alt="Foto attuale" 
                    className="w-full h-64 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                  />
                </div>
              </div>

              {/* Comparison Result Badge */}
              {(() => {
                const config = getComparisonConfig(analysisResult.comparison_result);
                const Icon = config.icon;
                return (
                  <div className={`p-6 rounded-2xl border-2 ${config.borderColor} bg-gradient-to-r ${config.bgColor} text-center shadow-xl`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{config.label}</h3>
                    </div>
                    <p className="text-base italic text-gray-700 font-medium">"{analysisResult.motivational_message}"</p>
                  </div>
                );
              })()}

              {/* Overall Assessment */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    📊
                  </span>
                  Valutazione AI
                </h4>
                <p className="text-gray-700 leading-relaxed">{analysisResult.overall_assessment}</p>
              </div>

              {/* Visible Improvements */}
              {analysisResult.visible_improvements.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-lg">
                  <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Miglioramenti Visibili
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.visible_improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visible Regressions */}
              {analysisResult.visible_regressions.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-300 shadow-lg">
                  <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    Aree di Attenzione
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.visible_regressions.map((regression, idx) => (
                      <li key={idx} className="text-sm text-orange-800 flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                        <span className="text-orange-600 font-bold text-lg">•</span>
                        <span>{regression}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300 shadow-lg">
                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Raccomandazioni AI
                  </h4>
                  <ul className="space-y-3">
                    {analysisResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-purple-800 flex items-start gap-3 bg-white/60 p-4 rounded-lg">
                        <span className="text-purple-600 font-bold text-xl flex-shrink-0">→</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Adjustment Alerts */}
              {(analysisResult.workout_adjustment_needed || analysisResult.diet_adjustment_needed) && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-300 shadow-lg">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                    <Zap className="w-6 h-6 text-blue-600" />
                    Aggiustamenti Consigliati
                  </h4>
                  <div className="space-y-3">
                    {analysisResult.workout_adjustment_needed && (
                      <div className="flex items-start gap-3 bg-white/60 p-4 rounded-lg">
                        <span className="text-2xl">💪</span>
                        <div>
                          <p className="font-semibold text-blue-900">Piano Allenamento</p>
                          <p className="text-sm text-blue-800">L'AI suggerisce di rivedere il tuo piano di allenamento</p>
                        </div>
                      </div>
                    )}
                    {analysisResult.diet_adjustment_needed && (
                      <div className="flex items-start gap-3 bg-white/60 p-4 rounded-lg">
                        <span className="text-2xl">🍽️</span>
                        <div>
                          <p className="font-semibold text-blue-900">Piano Nutrizionale</p>
                          <p className="text-sm text-blue-800">L'AI suggerisce di ottimizzare il tuo piano alimentare</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {analysisResult && (
          <DialogFooter className="pt-4 border-t border-gray-200/50">
            <Button
              onClick={saveAnalysis}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all text-lg py-6"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Salva Analisi
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
