import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, X, Info, Zap, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_ZONES = [
  { id: 'pancia', label: 'Pancia/Addome', photoCount: 1, description: 'Foto ravvicinata della zona addominale' },
  { id: 'petto', label: 'Petto', photoCount: 1, description: 'Foto ravvicinata del petto' },
  { id: 'schiena', label: 'Schiena', photoCount: 1, description: 'Foto ravvicinata della schiena' },
  { id: 'braccia', label: 'Braccia', photoCount: 2, description: 'Foto ravvicinate: braccio sinistro e destro' },
  { id: 'gambe', label: 'Gambe', photoCount: 2, description: 'Foto ravvicinate: gamba sinistra e destra' },
  { id: 'glutei', label: 'Glutei', photoCount: 2, description: 'Foto ravvicinate: gluteo sinistro e destro' }
];

const BODY_PHOTOS = [
  { id: 'front', label: 'Fronte', icon: '⬆️' },
  { id: 'side_left', label: 'Lato Sinistro', icon: '⬅️' },
  { id: 'side_right', label: 'Lato Destro', icon: '➡️' },
  { id: 'back', label: 'Dietro', icon: '⬇️' }
];

export default function ProgressPhotoAnalyzer({ user, onClose, onAnalysisComplete }) {
  const [step, setStep] = useState('zone_selection');
  const [selectedZone, setSelectedZone] = useState(null);
  const [targetPhotos, setTargetPhotos] = useState({});
  const [bodyPhotos, setBodyPhotos] = useState({});
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previousPhoto, setPreviousPhoto] = useState(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState(null);
  const [canApplyChanges, setCanApplyChanges] = useState(false);
  const [daysSinceLastAdjustment, setDaysSinceLastAdjustment] = useState(null);

  const targetFileRefs = useRef({});
  const bodyFileRefs = useRef({});

  useEffect(() => {
    const loadPreviousPhoto = async () => {
      try {
        const photos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
        const sortedPhotos = photos.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortedPhotos.length > 0) {
          setPreviousPhoto(sortedPhotos[0]);
          
          // Controlla quando è stata l'ultima modifica ai piani
          const lastPhotoWithAdjustments = sortedPhotos.find(p => 
            p.ai_analysis?.plans_adjusted === true
          );
          
          if (lastPhotoWithAdjustments) {
            const daysSince = Math.floor(
              (new Date() - new Date(lastPhotoWithAdjustments.date)) / (1000 * 60 * 60 * 24)
            );
            setDaysSinceLastAdjustment(daysSince);
            setCanApplyChanges(daysSince >= 7);
          } else {
            // Nessuna modifica precedente, può applicare
            setCanApplyChanges(true);
            setDaysSinceLastAdjustment(null);
          }
        } else {
          setCanApplyChanges(true);
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
    return !!(bodyPhotos.front && bodyPhotos.side_left && bodyPhotos.side_right && bodyPhotos.back);
  };

  const checkForDuplicatePhotos = async (newPhotoUrls) => {
    try {
      const allPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
      
      // Controlla se una delle nuove foto è già stata caricata
      for (const existingPhoto of allPhotos) {
        const existingUrls = [
          existingPhoto.photo_url,
          ...(existingPhoto.ai_analysis?.target_photo_urls || []),
          ...Object.values(existingPhoto.ai_analysis?.body_photo_urls || {})
        ].filter(Boolean);
        
        for (const newUrl of newPhotoUrls) {
          if (existingUrls.includes(newUrl)) {
            return true; // Foto duplicata trovata
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const analyzePhotos = async () => {
    if (!selectedZone) return;
    
    setIsAnalyzing(true);
    setStep('analysis');
    
    try {
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

      const bodyPhotoUrls = {};
      for (const photoType of ['front', 'side_left', 'side_right', 'back']) {
        if (bodyFileRefs.current[photoType]) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: bodyFileRefs.current[photoType] });
          bodyPhotoUrls[photoType] = file_url;
        }
      }

      // Controlla foto duplicate
      const allUploadedUrls = [...targetPhotoUrls, ...Object.values(bodyPhotoUrls)];
      const isDuplicate = await checkForDuplicatePhotos(allUploadedUrls);
      
      if (isDuplicate) {
        alert('⚠️ Hai già caricato queste foto in precedenza. Per favore scatta nuove foto per un confronto accurato.');
        setIsAnalyzing(false);
        setStep('body_photos');
        return;
      }

      let analysisPrompt;

      if (zone.photoCount === 1) {
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

  const applyPlanAdjustments = async () => {
    if (!analysisResult) return;
    
    setIsApplyingChanges(true);
    const changes = { diet: [], workout: [] };
    
    try {
      // 1. MODIFICA DIETA (se necessario e consentito)
      if (analysisResult.diet_adjustment_needed && canApplyChanges) {
        const currentCalories = user.daily_calories;
        const currentWeight = user.current_weight;
        const targetWeight = user.target_weight;
        const weightDifference = currentWeight - targetWeight;
        
        // Aggiustamento MOLTO conservativo delle calorie (max ±100 kcal)
        let calorieAdjustment = 0;
        
        if (analysisResult.comparison_result === 'regressed' || Math.abs(weightDifference) > 5) {
          // Leggero taglio calorico se regressione o lontano dall'obiettivo
          calorieAdjustment = -50;
        } else if (analysisResult.comparison_result === 'improved') {
          // Nessuna modifica se sta migliorando
          calorieAdjustment = 0;
        }
        
        if (calorieAdjustment !== 0) {
          const newCalories = currentCalories + calorieAdjustment;
          await base44.auth.updateMe({ daily_calories: Math.round(newCalories) });
          changes.diet.push(`Target calorico ${calorieAdjustment > 0 ? 'aumentato' : 'ridotto'} di ${Math.abs(calorieAdjustment)} kcal (da ${currentCalories} a ${newCalories} kcal)`);
        } else {
          changes.diet.push('Piano nutrizionale mantenuto (progressi positivi)');
        }
      }

      // 2. MODIFICA ALLENAMENTO (se necessario e consentito)
      if (analysisResult.workout_adjustment_needed && canApplyChanges) {
        const workoutPlans = await base44.entities.WorkoutPlan.filter({ user_id: user.id });
        
        if (workoutPlans.length > 0) {
          // Identifica i giorni di allenamento attivi
          const activeDays = workoutPlans.filter(p => p.workout_type !== 'rest');
          
          if (activeDays.length > 0) {
            // Seleziona UN SOLO giorno da modificare (il più rilevante per la zona target)
            const targetMuscleGroups = {
              'pancia': ['addominali', 'core'],
              'petto': ['pettorali'],
              'schiena': ['dorsali', 'lombari'],
              'braccia': ['bicipiti', 'tricipiti'],
              'gambe': ['quadricipiti', 'polpacci', 'femorali'],
              'glutei': ['glutei']
            };
            
            const relevantMuscles = targetMuscleGroups[selectedZone.id] || [];
            
            // Trova il giorno con più esercizi rilevanti per la zona
            let dayToModify = activeDays[0];
            let maxRelevantExercises = 0;
            
            for (const day of activeDays) {
              const relevantCount = day.exercises?.filter(ex => 
                relevantMuscles.some(muscle => 
                  ex.muscle_groups?.some(mg => mg.toLowerCase().includes(muscle))
                )
              ).length || 0;
              
              if (relevantCount > maxRelevantExercises) {
                maxRelevantExercises = relevantCount;
                dayToModify = day;
              }
            }
            
            // Carica esercizi disponibili dal database
            const allExercises = await base44.entities.Exercise.list();
            const availableExercises = allExercises.filter(ex => 
              relevantMuscles.some(muscle => 
                ex.muscle_groups?.some(mg => mg.toLowerCase().includes(muscle))
              )
            );
            
            if (availableExercises.length > 0 && dayToModify.exercises?.length > 0) {
              // Seleziona SOLO 1 esercizio da modificare
              const exerciseToReplace = dayToModify.exercises.find(ex =>
                relevantMuscles.some(muscle => 
                  ex.muscle_groups?.some(mg => mg.toLowerCase().includes(muscle))
                )
              ) || dayToModify.exercises[0];
              
              const adjustmentPrompt = `You are an expert personal trainer. Based on the user's progress analysis, suggest ONE alternative exercise to replace "${exerciseToReplace.name}".

CRITICAL INSTRUCTIONS:
- Generate ALL content in ITALIAN language
- Suggest ONLY ONE exercise from this database
- The new exercise must target similar muscle groups but provide a slight variation
- Keep changes MINIMAL - we're making small adjustments, not overhauling the program

Available exercises for ${selectedZone.label}:
${availableExercises.slice(0, 20).map(e => `"${e.name}" (${e.equipment}, ${e.difficulty})`).join(', ')}

User's equipment: ${user.equipment?.join(', ') || 'corpo libero'}
User's experience: ${user.fitness_experience}

Current exercise to replace: "${exerciseToReplace.name}" (${exerciseToReplace.sets} serie x ${exerciseToReplace.reps})

Task:
Suggest ONE single exercise replacement with Italian name, sets, reps (in Italian format), rest, and brief explanation why this change helps.`;

              const replacement = await base44.integrations.Core.InvokeLLM({
                prompt: adjustmentPrompt,
                response_json_schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "string" },
                    rest: { type: "string" },
                    description: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["name", "sets", "reps", "rest", "explanation"]
                }
              });
              
              // Sostituisci l'esercizio nel piano
              const updatedExercises = dayToModify.exercises.map(ex => 
                ex.name === exerciseToReplace.name ? replacement : ex
              );
              
              await base44.entities.WorkoutPlan.update(dayToModify.id, {
                exercises: updatedExercises
              });
              
              changes.workout.push(`${dayToModify.plan_name}: sostituito "${exerciseToReplace.name}" con "${replacement.name}" - ${replacement.explanation}`);
            }
          }
        }
      }

      setAppliedChanges(changes);
    } catch (error) {
      console.error('Error applying plan adjustments:', error);
      alert('Errore nell\'applicazione delle modifiche. L\'analisi verrà comunque salvata.');
    }
    setIsApplyingChanges(false);
  };

  const saveAnalysis = async () => {
    setIsSaving(true);
    
    // Prima applica le modifiche ai piani (se possibile)
    if ((analysisResult.workout_adjustment_needed || analysisResult.diet_adjustment_needed) && canApplyChanges) {
      await applyPlanAdjustments();
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await base44.entities.ProgressPhoto.create({
        user_id: user.id,
        photo_url: analysisResult.target_photo_urls[0],
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
          motivational_message: analysisResult.motivational_message,
          plans_adjusted: canApplyChanges && (analysisResult.workout_adjustment_needed || analysisResult.diet_adjustment_needed),
          applied_changes: appliedChanges
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
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose}></div>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-white z-[60]">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold text-gray-900">
              Analisi Progressi con AI
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal">
              {step === 'zone_selection' && 'Seleziona la zona da migliorare'}
              {step === 'target_photos' && `Foto: ${selectedZone?.label}`}
              {step === 'body_photos' && 'Foto corpo intero per archivio'}
              {step === 'analysis' && 'Analisi completata'}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* STEP 1: Selezione Zona Target */}
            {step === 'zone_selection' && (
              <motion.div
                key="zone-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-1">Privacy Totale</p>
                      <p className="text-xs text-purple-800">
                        Le foto sono analizzate SOLO dall'AI. Scatta in intimo per precisione.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quale zona vuoi migliorare?</h3>
                  <div className="space-y-2">
                    {TARGET_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        onClick={() => handleZoneSelection(zone)}
                        className="w-full p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {zone.label}
                            </h4>
                            <p className="text-xs text-gray-600 mt-0.5">{zone.description}</p>
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            {zone.photoCount} foto
                          </div>
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
                className="space-y-4"
              >
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    ⚠️ Mantieni angolo e luci simili • Preferibilmente in intimo
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Foto: {selectedZone.label}
                  </h3>

                  {TARGET_ZONES.find(z => z.id === selectedZone.id).photoCount === 1 ? (
                    <div>
                      {!targetPhotos.single ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <div className="flex gap-2 justify-center">
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
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Scatta
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
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              Carica
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img 
                            src={targetPhotos.single.previewUrl} 
                            alt="Foto zona" 
                            className="w-full h-64 object-cover rounded-lg border-2 border-green-400"
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
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Sinistro</p>
                        {!targetPhotos.left ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <div className="space-y-1">
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
                                size="sm"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                              >
                                <Camera className="w-3 h-3 mr-1" />
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
                                size="sm"
                                className="w-full text-xs"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img 
                              src={targetPhotos.left.previewUrl} 
                              alt="Sinistro" 
                              className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
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
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Destro</p>
                        {!targetPhotos.right ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <div className="space-y-1">
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
                                size="sm"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                              >
                                <Camera className="w-3 h-3 mr-1" />
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
                                size="sm"
                                className="w-full text-xs"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img 
                              src={targetPhotos.right.previewUrl} 
                              alt="Destro" 
                              className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
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
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setStep('zone_selection')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Indietro
                  </Button>
                  <Button
                    onClick={() => setStep('body_photos')}
                    disabled={!canProceedFromTargetPhotos()}
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Avanti
                    <ArrowRight className="w-4 h-4 ml-1" />
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
                className="space-y-4"
              >
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium">
                    📁 Foto per archivio storico (non analizzate, solo salvate)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Corpo intero (4 angolazioni)</h3>
                  
                  <div className="space-y-2">
                    {BODY_PHOTOS.map((bodyPhoto) => (
                      <div key={bodyPhoto.id}>
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          {bodyPhoto.icon} {bodyPhoto.label}
                        </p>
                        {!bodyPhotos[bodyPhoto.id] ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <div className="flex gap-2 justify-center">
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
                                className="bg-gray-700 hover:bg-gray-800 text-xs"
                              >
                                <Camera className="w-3 h-3 mr-1" />
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
                                className="text-xs"
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img 
                              src={bodyPhotos[bodyPhoto.id].previewUrl} 
                              alt={bodyPhoto.label} 
                              className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
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
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Note (opzionali)
                  </label>
                  <Textarea
                    placeholder="Es: 'Mi sento più forte', 'Ho seguito il piano'..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-20 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => setStep('target_photos')}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Indietro
                  </Button>
                  <Button
                    onClick={analyzePhotos}
                    disabled={!canProceedFromBodyPhotos()}
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Analizza
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
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold text-base mb-2">
                  Analisi AI in corso...
                </p>
                <p className="text-xs text-gray-600">
                  Sto analizzando la zona {selectedZone?.label}
                </p>
              </motion.div>
            )}

            {/* STEP 5: Risultati Analisi */}
            {analysisResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {(() => {
                  const config = getComparisonConfig(analysisResult.comparison_result);
                  const Icon = config.icon;
                  return (
                    <div className={`p-4 rounded-lg border ${config.borderColor} bg-gradient-to-r ${config.bgColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="text-base font-bold text-gray-900">{config.label}</h3>
                      </div>
                      <p className="text-sm italic text-gray-700">"{analysisResult.motivational_message}"</p>
                    </div>
                  );
                })()}

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Valutazione AI</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.overall_assessment}</p>
                </div>

                {analysisResult.visible_characteristics?.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">Caratteristiche</h4>
                    <ul className="space-y-1">
                      {analysisResult.visible_characteristics.map((char, idx) => (
                        <li key={idx} className="text-xs text-blue-800 flex gap-2">
                          <span>•</span>
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.visible_differences?.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2 text-sm">Differenze (Sx vs Dx)</h4>
                    <ul className="space-y-1">
                      {analysisResult.visible_differences.map((diff, idx) => (
                        <li key={idx} className="text-xs text-yellow-800 flex gap-2">
                          <span>↔️</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">Raccomandazioni</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-purple-800 flex gap-2">
                          <span>→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Info modifiche ai piani */}
                {!canApplyChanges && daysSinceLastAdjustment !== null && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-800 font-semibold mb-1">
                          Modifiche ai piani non disponibili
                        </p>
                        <p className="text-xs text-amber-700">
                          Sono passati {daysSinceLastAdjustment} giorni dall'ultima modifica. 
                          Potrai applicare nuove modifiche tra {7 - daysSinceLastAdjustment} giorni.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {canApplyChanges && (analysisResult.workout_adjustment_needed || analysisResult.diet_adjustment_needed) && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <RefreshCw className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-green-800 font-semibold mb-1">
                          L'AI applicherà modifiche parsimoniose ai tuoi piani
                        </p>
                        <ul className="text-xs text-green-700 space-y-0.5">
                          {analysisResult.diet_adjustment_needed && (
                            <li>• Leggero aggiustamento calorico (max ±50 kcal)</li>
                          )}
                          {analysisResult.workout_adjustment_needed && (
                            <li>• Sostituzione di 1 solo esercizio per la zona {selectedZone.label}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {isApplyingChanges && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-800 font-medium">
                        Applicazione modifiche ai piani in corso...
                      </p>
                    </div>
                  </div>
                )}

                {appliedChanges && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Modifiche Applicate
                    </h4>
                    {appliedChanges.diet.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-green-800 mb-1">🍽️ Dieta:</p>
                        <ul className="space-y-0.5">
                          {appliedChanges.diet.map((change, idx) => (
                            <li key={idx} className="text-xs text-green-700">• {change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {appliedChanges.workout.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-800 mb-1">💪 Allenamento:</p>
                        <ul className="space-y-0.5">
                          {appliedChanges.workout.map((change, idx) => (
                            <li key={idx} className="text-xs text-green-700">• {change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={saveAnalysis}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSaving || isApplyingChanges}
                  size="sm"
                >
                  {isSaving || isApplyingChanges ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {isApplyingChanges ? 'Applicazione modifiche...' : 'Salvataggio...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Salva Analisi
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}