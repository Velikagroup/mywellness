import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, X, Info, Zap, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_ZONES = [
  { id: 'pancia', label: '🎯 Pancia/Addome', photoCount: 1, description: 'Foto ravvicinata della zona addominale' },
  { id: 'petto', label: '💪 Petto', photoCount: 1, description: 'Foto ravvicinata del petto' },
  { id: 'schiena', label: '🔙 Schiena', photoCount: 1, description: 'Foto ravvicinata della schiena' },
  { id: 'braccia', label: '💪 Braccia', photoCount: 2, description: 'Foto ravvicinate: braccio sinistro e destro' },
  { id: 'gambe', label: '🦵 Gambe', photoCount: 2, description: 'Foto ravvicinate: gamba sinistra e destra' },
  { id: 'glutei', label: '🍑 Glutei', photoCount: 2, description: 'Foto ravvicinate: gluteo sinistro e destro' }
];

const BODY_PHOTOS = [
  { id: 'front', label: '👤 Fronte', icon: '⬆️' },
  { id: 'side', label: '🔄 Lato', icon: '➡️' },
  { id: 'back', label: '🔙 Dietro', icon: '⬇️' }
];

export default function ProgressPhotoAnalyzer({ user, onClose, onAnalysisComplete }) {
  const [step, setStep] = useState('zone_selection'); // zone_selection, target_photos, body_photos, analysis
  const [selectedZone, setSelectedZone] = useState(null);
  const [targetPhotos, setTargetPhotos] = useState({});
  const [bodyPhotos, setBodyPhotos] = useState({});
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previousPhoto, setPreviousPhoto] = useState(null);

  const targetFileRefs = useRef({});
  const bodyFileRefs = useRef({});

  useEffect(() => {
    const loadPreviousPhoto = async () => {
      try {
        const photos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
        const sortedPhotos = photos.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortedPhotos.length > 0) {
          setPreviousPhoto(sortedPhotos[0]);
        }
      } catch (error) {
        console.error("Error loading previous photo:", error);
      }
    };
    
    if (user?.id) {
      loadPreviousPhoto();
    }
  }, [user]);

  const handleZoneSelection = (zone) => {
    setSelectedZone(zone);
    setStep('target_photos');
  };

  const handleTargetPhotoSelect = (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!targetFileRefs.current[photoType]) {
      targetFileRefs.current[photoType] = {};
    }
    targetFileRefs.current[photoType] = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setTargetPhotos(prev => ({
        ...prev,
        [photoType]: {
          previewUrl: event.target.result,
          fileName: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleBodyPhotoSelect = (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!bodyFileRefs.current[photoType]) {
      bodyFileRefs.current[photoType] = {};
    }
    bodyFileRefs.current[photoType] = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBodyPhotos(prev => ({
        ...prev,
        [photoType]: {
          previewUrl: event.target.result,
          fileName: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const canProceedFromTargetPhotos = () => {
    if (!selectedZone) return false;
    const zone = TARGET_ZONES.find(z => z.id === selectedZone.id);
    if (zone.photoCount === 1) {
      return !!targetPhotos.single;
    } else {
      return !!(targetPhotos.left && targetPhotos.right);
    }
  };

  const canProceedFromBodyPhotos = () => {
    return !!(bodyPhotos.front && bodyPhotos.side && bodyPhotos.back);
  };

  const analyzePhotos = async () => {
    if (!selectedZone) return;
    
    setIsAnalyzing(true);
    setStep('analysis');
    
    try {
      // 1. Upload foto zona target
      const targetPhotoUrls = [];
      const zone = TARGET_ZONES.find(z => z.id === selectedZone.id);
      
      if (zone.photoCount === 1 && targetFileRefs.current.single) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.single });
        targetPhotoUrls.push(file_url);
      } else if (zone.photoCount === 2) {
        if (targetFileRefs.current.left) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.left });
          targetPhotoUrls.push(file_url);
        }
        if (targetFileRefs.current.right) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.right });
          targetPhotoUrls.push(file_url);
        }
      }

      // 2. Upload foto corpo intero (per archivio)
      const bodyPhotoUrls = {};
      for (const photoType of ['front', 'side', 'back']) {
        if (bodyFileRefs.current[photoType]) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: bodyFileRefs.current[photoType] });
          bodyPhotoUrls[photoType] = file_url;
        }
      }

      // 3. Analisi AI SOLO delle foto zona target
      let analysisPrompt;

      if (zone.photoCount === 1) {
        // Zona singola
        analysisPrompt = `You are an expert fitness coach and body composition analyst. Analyze this close-up photo of the user's ${selectedZone.label} area.

CRITICAL INSTRUCTIONS:
- Generate ALL content in ITALIAN language
- Be EXTREMELY DETAILED and scientific in your analysis
- Focus ONLY on the specific body area shown: ${selectedZone.label}
- Comment only on what you can CLEARLY see in the photo
- DO NOT estimate body fat percentage
- DO NOT make assumptions about body parts not visible

User Context:
- Gender: ${user.gender}
- Current Weight: ${user.current_weight}kg
- Target Weight: ${user.target_weight}kg
- Fitness Goal: ${user.fitness_goal}
- Selected Target Area: ${selectedZone.label}

User Notes: ${notes || 'Nessuna nota'}

IMPORTANT REMINDERS:
⚠️ Mantenere angolo fotografico e illuminazione simili tra le foto per confronti accurati
⚠️ Questa foto è privata e vista solo dalla tecnologia AI

Task:
1. Analyze the ${selectedZone.label} area in detail
2. List visible characteristics (muscle definition, skin texture, symmetry, etc.)
3. Provide 3-4 specific, actionable recommendations to improve this area
4. Suggest if workout or diet adjustments are needed
5. Write an encouraging, motivational message in Italian

Remember: Focus ONLY on the specific area shown in the photo.`;

      } else {
        // Zone doppie (sinistra e destra)
        analysisPrompt = `You are an expert fitness coach and body composition analyst. Compare these two photos of the user's ${selectedZone.label} (LEFT and RIGHT).

CRITICAL INSTRUCTIONS:
- Generate ALL content in ITALIAN language
- Compare the two sides objectively WITHOUT giving positive or negative judgments
- Simply NOTIFY the visible differences between left and right
- Be EXTREMELY DETAILED and scientific
- DO NOT estimate body fat percentage
- DO NOT make assumptions about body parts not visible
- Focus on helping the user NOTICE differences they might not see themselves

User Context:
- Gender: ${user.gender}
- Current Weight: ${user.current_weight}kg
- Target Weight: ${user.target_weight}kg
- Fitness Goal: ${user.fitness_goal}
- Selected Target Area: ${selectedZone.label}

User Notes: ${notes || 'Nessuna nota'}

IMPORTANT REMINDERS:
⚠️ Mantenere angolo fotografico e illuminazione simili tra le foto per confronti accurati
⚠️ Queste foto sono private e viste solo dalla tecnologia AI

Task:
1. Compare the two sides (left vs right) in detail
2. List observable differences WITHOUT judging them as good or bad (e.g., "Il lato sinistro mostra maggiore definizione muscolare", "Il lato destro presenta una circonferenza leggermente superiore")
3. Help the user notice asymmetries or differences they might miss
4. Provide 3-4 specific recommendations to balance or improve both sides
5. Suggest if workout adjustments are needed for symmetry
6. Write an encouraging message in Italian

Remember: NO positive or negative judgments - just objective observations to help the user notice differences.`;
      }

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: targetPhotoUrls,
        response_json_schema: {
          type: "object",
          properties: {
            comparison_result: { 
              type: "string", 
              enum: ["first_photo", "improved", "maintained", "regressed"] 
            },
            visible_characteristics: {
              type: "array",
              items: { type: "string" },
              description: "Detailed observations about the target area(s)"
            },
            visible_differences: {
              type: "array",
              items: { type: "string" },
              description: "For dual zones: observable differences between left and right. For single zones: empty array."
            },
            overall_assessment: { 
              type: "string",
              description: "Detailed assessment of the target area(s)"
            },
            recommendations: { 
              type: "array", 
              items: { type: "string" },
              description: "3-4 specific, actionable recommendations in Italian"
            },
            workout_adjustment_needed: { type: "boolean" },
            diet_adjustment_needed: { type: "boolean" },
            motivational_message: { type: "string" }
          },
          required: ["comparison_result", "visible_characteristics", "visible_differences", "overall_assessment", "recommendations", "workout_adjustment_needed", "diet_adjustment_needed", "motivational_message"]
        }
      });

      setAnalysisResult({
        ...analysis,
        target_zone: selectedZone.id,
        target_photo_urls: targetPhotoUrls,
        body_photo_urls: bodyPhotoUrls
      });
    } catch (error) {
      console.error("Error analyzing photos:", error);
      alert(`Errore nell'analisi: ${error.message || 'Errore sconosciuto'}`);
      setStep('body_photos');
    }
    setIsAnalyzing(false);
  };

  const saveAnalysis = async () => {
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Salva record con TUTTE le foto (target + corpo intero)
      await base44.entities.ProgressPhoto.create({
        user_id: user.id,
        photo_url: analysisResult.target_photo_urls[0], // Foto principale per thumbnail
        date: today,
        weight: user.current_weight,
        ai_analysis: {
          target_zone: analysisResult.target_zone,
          target_photo_urls: analysisResult.target_photo_urls,
          body_photo_urls: analysisResult.body_photo_urls,
          comparison_result: analysisResult.comparison_result,
          visible_characteristics: analysisResult.visible_characteristics,
          visible_differences: analysisResult.visible_differences,
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
      console.error("Error saving progress photos:", error);
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
        label: 'Prima Analisi'
      },
      improved: { 
        icon: TrendingUp, 
        color: 'from-green-500 to-emerald-500',
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-300',
        label: 'Progressi Visibili'
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
        label: 'Necessita Attenzione'
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
                {step === 'zone_selection' && 'Seleziona la zona da migliorare'}
                {step === 'target_photos' && `Foto ravvicinate: ${selectedZone?.label}`}
                {step === 'body_photos' && 'Foto corpo intero per archivio'}
                {step === 'analysis' && 'Analisi AI completata'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* STEP 1: Selezione Zona Target */}
          {step === 'zone_selection' && (
            <motion.div
              key="zone-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-bold text-purple-900">🔒 Privacy Totale Garantita</h3>
                    <p className="text-sm text-purple-800">
                      Le tue foto sono completamente private e sicure. Verranno analizzate SOLO dalla nostra tecnologia AI avanzata. Nessun essere umano avrà mai accesso alle tue immagini.
                    </p>
                    <p className="text-sm text-purple-800 font-semibold">
                      💡 Consiglio: Scatta in intimo per un'analisi più accurata
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Quale zona vuoi migliorare?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TARGET_ZONES.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => handleZoneSelection(zone)}
                      className="p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{zone.label.split(' ')[0]}</span>
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                          {zone.label.substring(2)}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">{zone.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-purple-600 font-semibold">
                        <Camera className="w-4 h-4" />
                        {zone.photoCount} {zone.photoCount === 1 ? 'foto richiesta' : 'foto richieste'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Foto Zona Target */}
          {step === 'target_photos' && selectedZone && (
            <motion.div
              key="target-photos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900 mb-1">📸 Linee guida per le foto</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Mantieni angolo fotografico e luci simili tra foto diverse</li>
                      <li>• Scatta foto ravvicinate della zona {selectedZone.label}</li>
                      <li>• Preferibilmente in intimo per massima precisione</li>
                      <li>• Sfondo neutro e illuminazione uniforme</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  Foto Ravvicinate: {selectedZone.label}
                </h3>

                {TARGET_ZONES.find(z => z.id === selectedZone.id).photoCount === 1 ? (
                  // Zona singola
                  <div>
                    {!targetPhotos.single ? (
                      <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 transition-all">
                        <Camera className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                        <p className="text-gray-700 font-semibold mb-4">
                          Scatta foto ravvicinata della zona {selectedZone.label}
                        </p>
                        <div className="flex gap-3 justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleTargetPhotoSelect(e, 'single')}
                            className="hidden"
                            id="target-camera-single"
                          />
                          <Button 
                            type="button" 
                            onClick={() => document.getElementById('target-camera-single').click()}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Scatta Foto
                          </Button>
                          
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleTargetPhotoSelect(e, 'single')}
                            className="hidden"
                            id="target-gallery-single"
                          />
                          <Button 
                            type="button" 
                            onClick={() => document.getElementById('target-gallery-single').click()}
                            variant="outline"
                            className="border-2 border-purple-300"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Carica
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img 
                          src={targetPhotos.single.previewUrl} 
                          alt="Foto zona target" 
                          className="w-full h-96 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                        />
                        <Button
                          onClick={() => {
                            setTargetPhotos(prev => {
                              const updated = { ...prev };
                              delete updated.single;
                              return updated;
                            });
                            delete targetFileRefs.current.single;
                          }}
                          variant="destructive"
                          size="icon"
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Zone doppie (sinistra e destra)
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">⬅️ Lato Sinistro</p>
                      {!targetPhotos.left ? (
                        <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-400 transition-all">
                          <Camera className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                          <p className="text-sm text-gray-700 font-medium mb-4">Foto lato sinistro</p>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleTargetPhotoSelect(e, 'left')}
                              className="hidden"
                              id="target-camera-left"
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById('target-camera-left').click()}
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-sm"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Scatta
                            </Button>
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleTargetPhotoSelect(e, 'left')}
                              className="hidden"
                              id="target-gallery-left"
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById('target-gallery-left').click()}
                              variant="outline"
                              className="border-2 border-purple-300 text-sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Carica
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img 
                            src={targetPhotos.left.previewUrl} 
                            alt="Lato sinistro" 
                            className="w-full h-80 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                          />
                          <Button
                            onClick={() => {
                              setTargetPhotos(prev => {
                                const updated = { ...prev };
                                delete updated.left;
                                return updated;
                              });
                              delete targetFileRefs.current.left;
                            }}
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">➡️ Lato Destro</p>
                      {!targetPhotos.right ? (
                        <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:border-purple-400 transition-all">
                          <Camera className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                          <p className="text-sm text-gray-700 font-medium mb-4">Foto lato destro</p>
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleTargetPhotoSelect(e, 'right')}
                              className="hidden"
                              id="target-camera-right"
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById('target-camera-right').click()}
                              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-sm"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Scatta
                            </Button>
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleTargetPhotoSelect(e, 'right')}
                              className="hidden"
                              id="target-gallery-right"
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById('target-gallery-right').click()}
                              variant="outline"
                              className="border-2 border-purple-300 text-sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Carica
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img 
                            src={targetPhotos.right.previewUrl} 
                            alt="Lato destro" 
                            className="w-full h-80 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                          />
                          <Button
                            onClick={() => {
                              setTargetPhotos(prev => {
                                const updated = { ...prev };
                                delete updated.right;
                                return updated;
                              });
                              delete targetFileRefs.current.right;
                            }}
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep('zone_selection')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cambia Zona
                </Button>
                <Button
                  onClick={() => setStep('body_photos')}
                  disabled={!canProceedFromTargetPhotos()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Avanti: Foto Corpo Intero
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Foto Corpo Intero */}
          {step === 'body_photos' && (
            <motion.div
              key="body-photos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 mb-1">📁 Foto per Archivio Storico</p>
                    <p className="text-sm text-amber-800">
                      Queste foto NON verranno analizzate dall'AI, ma solo archiviate per confronti futuri. 
                      Ti permetteranno di vedere i tuoi progressi complessivi nel tempo.
                    </p>
                    <p className="text-sm text-amber-800 font-semibold mt-2">
                      ⚠️ Mantieni angolo fotografico e luci simili tra le sessioni!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Foto Corpo Intero (3 angolazioni)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {BODY_PHOTOS.map((bodyPhoto) => (
                    <div key={bodyPhoto.id}>
                      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="text-xl">{bodyPhoto.icon}</span>
                        {bodyPhoto.label}
                      </p>
                      {!bodyPhotos[bodyPhoto.id] ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-all">
                          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <div className="flex flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)}
                              className="hidden"
                              id={`body-camera-${bodyPhoto.id}`}
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById(`body-camera-${bodyPhoto.id}`).click()}
                              size="sm"
                              className="bg-gray-700 hover:bg-gray-800"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Scatta
                            </Button>
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)}
                              className="hidden"
                              id={`body-gallery-${bodyPhoto.id}`}
                            />
                            <Button 
                              type="button" 
                              onClick={() => document.getElementById(`body-gallery-${bodyPhoto.id}`).click()}
                              variant="outline"
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Carica
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img 
                            src={bodyPhotos[bodyPhoto.id].previewUrl} 
                            alt={bodyPhoto.label} 
                            className="w-full h-72 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                          />
                          <Button
                            onClick={() => {
                              setBodyPhotos(prev => {
                                const updated = { ...prev };
                                delete updated[bodyPhoto.id];
                                return updated;
                              });
                              delete bodyFileRefs.current[bodyPhoto.id];
                            }}
                            variant="destructive"
                            size="icon"
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Note opzionali sulla sessione
                </label>
                <Textarea
                  placeholder="Es: 'Oggi mi sento più forte', 'Ho seguito il piano perfettamente questa settimana', 'Noto più energia durante gli allenamenti'..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24 border-2 border-gray-200 focus:border-purple-400 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep('target_photos')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
                <Button
                  onClick={analyzePhotos}
                  disabled={!canProceedFromBodyPhotos()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg py-6 shadow-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Avvia Analisi AI
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Analisi in Corso */}
          {step === 'analysis' && !analysisResult && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-gradient-to-br from-purple-50/30 to-white rounded-2xl border-2 border-purple-200"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <Loader2 className="w-24 h-24 animate-spin text-purple-500" />
                <Sparkles className="w-10 h-10 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-gray-900 font-bold text-2xl mb-3">
                🧠 Analisi AI Avanzata in Corso...
              </p>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                La nostra tecnologia AI sta analizzando attentamente le foto della zona {selectedZone?.label} per rilevare tutti i dettagli e le differenze visibili.
              </p>
            </motion.div>
          )}

          {/* STEP 5: Risultati Analisi */}
          {analysisResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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

              {/* Target Zone Photos */}
              <div className="bg-white/80 p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  🎯 Zona Analizzata: {selectedZone?.label}
                </h4>
                <div className={`grid ${TARGET_ZONES.find(z => z.id === selectedZone.id).photoCount === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {Object.entries(targetPhotos).map(([key, photo]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-600 mb-2 font-semibold uppercase">
                        {key === 'single' ? 'Foto Analizzata' : key === 'left' ? '⬅️ Sinistro' : '➡️ Destro'}
                      </p>
                      <img 
                        src={photo.previewUrl} 
                        alt={key} 
                        className="w-full h-64 object-cover rounded-lg border-2 border-purple-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    📊
                  </span>
                  Valutazione AI Dettagliata
                </h4>
                <p className="text-gray-700 leading-relaxed">{analysisResult.overall_assessment}</p>
              </div>

              {/* Visible Characteristics */}
              {analysisResult.visible_characteristics?.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-300 shadow-lg">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Info className="w-5 h-5 text-white" />
                    </div>
                    Caratteristiche Osservate
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.visible_characteristics.map((char, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visible Differences (for dual zones) */}
              {analysisResult.visible_differences?.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-300 shadow-lg">
                  <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Differenze Osservate (Sinistra vs Destra)
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.visible_differences.map((diff, idx) => (
                      <li key={idx} className="text-sm text-yellow-800 flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                        <span className="text-yellow-600 font-bold">↔️</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-3 italic">
                    💡 Queste sono osservazioni oggettive per aiutarti a notare asimmetrie, non giudizi
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations?.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300 shadow-lg">
                  <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Raccomandazioni AI Personalizzate
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
                          <p className="text-sm text-blue-800">L'AI suggerisce di ottimizzare il tuo protocollo di allenamento</p>
                        </div>
                      </div>
                    )}
                    {analysisResult.diet_adjustment_needed && (
                      <div className="flex items-start gap-3 bg-white/60 p-4 rounded-lg">
                        <span className="text-2xl">🍽️</span>
                        <div>
                          <p className="font-semibold text-blue-900">Piano Nutrizionale</p>
                          <p className="text-sm text-blue-800">L'AI suggerisce di rivedere il tuo piano alimentare</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-gray-200/50">
                <Button
                  onClick={saveAnalysis}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all text-lg py-6"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  Salva Analisi Completa
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}