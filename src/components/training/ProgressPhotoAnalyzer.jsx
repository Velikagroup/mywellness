
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
  const [proposedChanges, setProposedChanges] = useState(null);
  const [isGeneratingProposals, setIsGeneratingProposals] = useState(false);

  const targetFileRefs = useRef({});
  const bodyFileRefs = useRef({});
  const uploadedPhotoUrls = useRef(null);

  useEffect(() => {
    const loadPreviousPhoto = async () => {
      try {
        const photos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
        const sortedPhotos = photos.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortedPhotos.length > 0) {
          setPreviousPhoto(sortedPhotos[0]);
          
          // Trova l'ULTIMA foto con modifiche applicate
          const lastPhotoWithAdjustments = sortedPhotos.find(p => 
            p.ai_analysis?.plans_adjusted === true
          );
          
          if (lastPhotoWithAdjustments) {
            const daysSince = Math.floor(
              (new Date() - new Date(lastPhotoWithAdjustments.date)) / (1000 * 60 * 60 * 24)
            );
            setDaysSinceLastAdjustment(daysSince);
            setCanApplyChanges(daysSince >= 7);
            
            console.log('🔒 Ultima modifica applicata:', daysSince, 'giorni fa. Può applicare modifiche:', daysSince >= 7);
          } else {
            setCanApplyChanges(true);
            setDaysSinceLastAdjustment(null);
            console.log('✅ Nessuna modifica precedente trovata, può applicare modifiche');
          }
        } else {
          setCanApplyChanges(true);
          console.log('✅ Prima foto, può applicare modifiche');
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

  const getFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleTargetPhotoSelect = async (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileHash = await getFileHash(file);
    
    const existingPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
    const existingHashes = existingPhotos
      .map(p => p.ai_analysis?.photo_hashes || [])
      .flat();
    
    if (existingHashes.includes(fileHash)) {
      alert('⚠️ Hai già caricato questa foto in precedenza. Per favore scatta una nuova foto per un confronto accurato.');
      e.target.value = '';
      return;
    }

    if (!targetFileRefs.current[photoType]) {
      targetFileRefs.current[photoType] = {};
    }
    targetFileRefs.current[photoType] = { file, hash: fileHash };
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setTargetPhotos(prev => ({
        ...prev,
        [photoType]: {
          previewUrl: event.target.result,
          fileName: file.name,
          hash: fileHash
        }
      }));
    };
    reader.readAsDataURL(file);
    
    e.target.value = '';
  };

  const handleBodyPhotoSelect = async (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('🔵 BODY PHOTO SELECTED:', photoType, 'File:', file.name);

    const fileHash = await getFileHash(file);
    
    const existingPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
    const existingHashes = existingPhotos
      .map(p => p.ai_analysis?.photo_hashes || [])
      .flat();
    
    if (existingHashes.includes(fileHash)) {
      alert('⚠️ Hai già caricato questa foto in precedenza. Per favore scatta una nuova foto per un confronto accurato.');
      e.target.value = '';
      return;
    }

    if (!bodyFileRefs.current[photoType]) {
      bodyFileRefs.current[photoType] = {};
    }
    bodyFileRefs.current[photoType] = { file, hash: fileHash };
    
    console.log('✅ BODY FILE SAVED TO REF:', photoType, bodyFileRefs.current[photoType]);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBodyPhotos(prev => ({
        ...prev,
        [photoType]: {
          previewUrl: event.target.result,
          fileName: file.name,
          hash: fileHash
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

  const analyzePhotos = async () => {
    if (!selectedZone) return;
    
    setIsAnalyzing(true);
    setStep('analysis');
    setAnalysisResult(null);
    setProposedChanges(null);
    setAppliedChanges(null);
    
    try {
      console.log('🔵 STARTING ANALYSIS...');
      console.log('🔵 bodyFileRefs.current:', bodyFileRefs.current);
      
      const targetPhotoUrls = [];
      const photoHashes = [];
      const zone = TARGET_ZONES.find(z => z.id === selectedZone.id);
      
      if (zone.photoCount === 1 && targetFileRefs.current.single) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.single.file });
        targetPhotoUrls.push(file_url);
        photoHashes.push(targetFileRefs.current.single.hash);
        console.log('✅ Target photo uploaded:', file_url);
      } else if (zone.photoCount === 2) {
        if (targetFileRefs.current.left) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.left.file });
          targetPhotoUrls.push(file_url);
          photoHashes.push(targetFileRefs.current.left.hash);
          console.log('✅ Target left photo uploaded:', file_url);
        }
        if (targetFileRefs.current.right) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.right.file });
          targetPhotoUrls.push(file_url);
          photoHashes.push(targetFileRefs.current.right.hash);
          console.log('✅ Target right photo uploaded:', file_url);
        }
      }

      console.log('🔵 UPLOADING BODY PHOTOS...');
      const bodyPhotoUrls = {};
      for (const photoType of ['front', 'side_left', 'side_right', 'back']) {
        console.log(`🔵 Checking ${photoType}:`, bodyFileRefs.current[photoType]);
        if (bodyFileRefs.current[photoType]) {
          console.log(`⬆️ Uploading ${photoType}...`);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: bodyFileRefs.current[photoType].file });
          bodyPhotoUrls[photoType] = file_url;
          photoHashes.push(bodyFileRefs.current[photoType].hash);
          console.log(`✅ ${photoType} uploaded:`, file_url);
        } else {
          console.warn(`⚠️ ${photoType} NOT FOUND in bodyFileRefs!`);
        }
      }
      console.log('✅ ALL BODY PHOTOS UPLOADED:', bodyPhotoUrls);
      console.log('📦 Photo hashes:', photoHashes);

      uploadedPhotoUrls.current = { targetPhotoUrls, bodyPhotoUrls, photoHashes };
      console.log('✅ uploadedPhotoUrls.current SET:', uploadedPhotoUrls.current);


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
4. Suggest if workout or diet adjustments are needed ONLY if you see clear visual signs that require changes
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

User Context:
- Gender: ${user.gender}
- Current Weight: ${user.current_weight}kg
- Target Weight: ${user.target_weight}kg
- Fitness Goal: ${user.fitness_goal}
- Selected Target Area: ${selectedZone.label}

User Notes: ${notes || 'Nessuna nota'}

IMPORTANT REMINDERS:
⚠️ Mantenere angolo fotografico e illuminazione simili tra le foto per confronti accurati
⚠️ Queste foto sono private e vista solo dalla tecnologia AI

Task:
1. Compare the two sides (left vs right) in detail
2. List observable differences WITHOUT judging them
3. Help the user notice asymmetries
4. Provide 3-4 specific recommendations to balance or improve both sides
5. Suggest if workout adjustments are needed for symmetry ONLY if you see clear asymmetries
6. Write an encouraging message in Italian`;
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
              description: "For dual zones: observable differences between left and right"
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
        target_zone: selectedZone.id
      });

      // ✅ GENERA PROPOSTE SOLO SE PUÒ APPLICARE MODIFICHE (7+ giorni dall'ultima modifica)
      if (canApplyChanges && (analysis.workout_adjustment_needed || analysis.diet_adjustment_needed)) {
        console.log('✅ Generazione proposte modifiche (può applicare modifiche)');
        await generateProposedChanges(analysis);
      } else if (!canApplyChanges && daysSinceLastAdjustment !== null) {
        console.log('🔒 NON genero proposte: ultime modifiche applicate', daysSinceLastAdjustment, 'giorni fa (minimo 7 giorni richiesti)');
      } else {
        console.log('ℹ️ AI non ha suggerito modifiche o non è il momento di applicarle.');
      }

    } catch (error) {
      console.error("Error analyzing photos:", error);
      alert(`Errore nell'analisi: ${error.message || 'Errore sconosciuto'}`);
      setStep('body_photos');
    }
    setIsAnalyzing(false);
  };

  const generateProposedChanges = async (analysis) => {
    setIsGeneratingProposals(true);
    const proposals = { diet: [], workout: [] };
    
    try {
      // PROPOSTA MODIFICA DIETA - Solo se necessario
      if (analysis.diet_adjustment_needed) {
        const currentCalories = user.daily_calories;
        const currentWeight = user.current_weight;
        const targetWeight = user.target_weight;
        const weightDifference = currentWeight - targetWeight;
        
        let calorieAdjustment = 0;
        let reason = '';
        
        if (analysis.comparison_result === 'regressed') {
          calorieAdjustment = -75;
          reason = 'Taglio calorico per contrastare la regressione e incentivare la definizione.';
        } else if (analysis.comparison_result === 'maintained') {
          calorieAdjustment = -50;
          reason = 'Leggero aggiustamento calorico per stimolare ulteriori progressi e superare la fase di mantenimento.';
        } else if (analysis.comparison_result === 'improved') {
          if (user.fitness_goal === 'aumentare massa muscolare' && weightDifference < -1) { 
              calorieAdjustment = 50;
              reason = 'Aumento calorico per supportare ulteriormente la crescita muscolare, visti i progressi.';
          } else {
              calorieAdjustment = 0;
              reason = 'Il piano nutrizionale è efficace, manteniamo l\'apporto calorico per consolidare i progressi.';
          }
        } else if (analysis.comparison_result === 'first_photo') {
            calorieAdjustment = 0;
            reason = 'Prima analisi: nessuna modifica necessaria, il piano attuale è ottimale per iniziare.';
        }
        
        calorieAdjustment = Math.max(-100, Math.min(100, calorieAdjustment));

        if (calorieAdjustment !== 0) {
          const newCalories = Math.round(currentCalories + calorieAdjustment);
          
          proposals.diet.push({
            type: 'calorie_adjustment',
            current: currentCalories,
            proposed: newCalories,
            adjustment: calorieAdjustment,
            reason: reason
          });
        } else {
          proposals.diet.push({
            type: 'no_change',
            reason: reason
          });
        }
      }

      // PROPOSTA MODIFICA ALLENAMENTO - Solo se necessario
      if (analysis.workout_adjustment_needed) {
        const workoutPlans = await base44.entities.WorkoutPlan.filter({ user_id: user.id });
        
        const activeDays = workoutPlans.filter(p => p.workout_type !== 'rest' && p.exercises?.length > 0);
        
        if (activeDays.length > 0) {
          const targetMuscleGroups = {
            'pancia': ['addominali', 'core'],
            'petto': ['pettorali'],
            'schiena': ['dorsali', 'lombari', 'gran dorsale'],
            'braccia': ['bicipiti', 'tricipiti', 'avambraccio'],
            'gambe': ['quadricipiti', 'polpacci', 'femorali', 'glutei'],
            'glutei': ['glutei', 'femorali']
          };
          
          const relevantMuscles = targetMuscleGroups[selectedZone.id] || [];
          
          let dayToModify = null;
          let maxRelevantExercises = 0;
          let exerciseToReplace = null;
          
          for (const day of activeDays) {
            const relevantExercisesInDay = day.exercises.filter(ex => 
              relevantMuscles.some(muscle => 
                ex.muscle_groups?.some(mg => mg.toLowerCase().includes(muscle))
              )
            );
            
            if (relevantExercisesInDay.length > maxRelevantExercises) {
              maxRelevantExercises = relevantExercisesInDay.length;
              dayToModify = day;
              exerciseToReplace = relevantExercisesInDay[0];
            }
          }
          
          if (dayToModify && exerciseToReplace) {
            const allExercises = await base44.entities.Exercise.list();
            
            const availableExercises = allExercises.filter(ex => 
              relevantMuscles.some(muscle => 
                ex.muscle_groups?.some(mg => mg.toLowerCase().includes(muscle))
              ) && (user.equipment?.includes(ex.equipment) || ex.equipment === 'corpo_libero' || ex.equipment === 'nessuno')
            );
            
            if (availableExercises.length > 0) {
              const adjustmentPrompt = `You are an expert personal trainer. Based on the user's progress analysis, suggest ONE alternative exercise to replace "${exerciseToReplace.name}".
              
CRITICAL INSTRUCTIONS:
- Generate ALL content in ITALIAN language
- Suggest ONLY ONE exercise from this database. The new exercise must be DIFFERENT from "${exerciseToReplace.name}".
- The new exercise must target similar muscle groups but provide a slight variation or a new stimulus.
- Keep changes MINIMAL - we're making small adjustments, not overhauling the program.
- Ensure the exercise uses equipment available to the user.

Available exercises for ${selectedZone.label} and user's equipment:
${availableExercises.slice(0, 20).map(e => `"${e.name}" (equip: ${e.equipment}, diff: ${e.difficulty})`).join(', ')}

User's equipment: ${user.equipment?.join(', ') || 'corpo libero'}
User's experience: ${user.fitness_experience}

Current exercise to replace: "${exerciseToReplace.name}" (sets: ${exerciseToReplace.sets}, reps: ${exerciseToReplace.reps})

Task:
Suggest ONE single exercise replacement with Italian name, sets, reps (in Italian format, e.g., "12 ripetizioni"), rest (e.g., "60 secondi"), and brief explanation (2 sentences max) why this change helps for the ${selectedZone.label} area.`;

              const replacement = await base44.integrations.Core.InvokeLLM({
                prompt: adjustmentPrompt,
                response_json_schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "number" },
                    reps: { type: "string" },
                    rest: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["name", "sets", "reps", "rest", "explanation"]
                }
              });
              
              if (replacement && replacement.name && replacement.sets && replacement.reps && replacement.rest && replacement.explanation) {
                if (replacement.name.toLowerCase() === exerciseToReplace.name.toLowerCase()) {
                    const otherAvailableExercises = availableExercises.filter(ex => ex.name.toLowerCase() !== exerciseToReplace.name.toLowerCase());
                    if (otherAvailableExercises.length > 0) {
                        const fallbackReplacement = otherAvailableExercises[0];
                        proposals.workout.push({
                            type: 'exercise_replacement',
                            day: dayToModify.plan_name,
                            day_id: dayToModify.id,
                            current_exercise: exerciseToReplace,
                            proposed_exercise: {
                                name: fallbackReplacement.name,
                                sets: fallbackReplacement.sets,
                                reps: fallbackReplacement.reps,
                                rest: fallbackReplacement.rest,
                                explanation: `Sostituzione per variare lo stimolo sui ${selectedZone.label}.`
                            },
                            reason: `Sostituito "${exerciseToReplace.name}" con "${fallbackReplacement.name}" per variare lo stimolo.`
                        });
                    } else {
                        proposals.workout.push({
                            type: 'no_change',
                            reason: `Nessuna modifica all'allenamento per la zona ${selectedZone.label} suggerita (nessun esercizio alternativo idoneo trovato).`
                        });
                    }
                } else {
                    proposals.workout.push({
                        type: 'exercise_replacement',
                        day: dayToModify.plan_name,
                        day_id: dayToModify.id,
                        current_exercise: exerciseToReplace,
                        proposed_exercise: replacement,
                        reason: replacement.explanation
                    });
                }
              } else {
                  console.warn("LLM returned incomplete replacement data:", replacement);
                  proposals.workout.push({
                      type: 'no_change',
                      reason: `Nessuna modifica all'allenamento per la zona ${selectedZone.label} suggerita (LLM response incompleta).`
                  });
              }
            } else {
                proposals.workout.push({
                    type: 'no_change',
                    reason: `Nessuna modifica all'allenamento per la zona ${selectedZone.label} suggerita (nessun esercizio alternativo idoneo trovato).`
                });
            }
          } else {
              proposals.workout.push({
                  type: 'no_change',
                  reason: `Nessuna modifica all'allenamento per la zona ${selectedZone.label} suggerita (nessun giorno o esercizio rilevante trovato).`
              });
          }
        } else {
            proposals.workout.push({
                type: 'no_change',
                reason: `Nessuna modifica all'allenamento per la zona ${selectedZone.label} suggerita (nessun piano di allenamento attivo trovato).`
            });
        }
      }

      setProposedChanges(proposals);
    } catch (error) {
      console.error('Error generating proposals:', error);
      alert('Errore nella generazione delle proposte di modifica. Riprova.');
    }
    setIsGeneratingProposals(false);
  };

  const applyProposedChanges = async () => {
    if (!proposedChanges) return;
    
    setIsApplyingChanges(true);
    const changes = { diet: [], workout: [] };
    
    try {
      // 1. APPLICA MODIFICHE DIETA
      for (const proposal of proposedChanges.diet) {
        if (proposal.type === 'calorie_adjustment' && proposal.adjustment !== 0) {
          // Aggiorna target calorico utente
          await base44.auth.updateMe({ daily_calories: proposal.proposed });
          
          // 🔥 SCALA PROPORZIONALMENTE TUTTI I PASTI
          const scalingFactor = proposal.proposed / proposal.current;
          console.log('📊 Scaling factor for meals:', scalingFactor);
          
          const allMealPlans = await base44.entities.MealPlan.filter({ user_id: user.id });
          
          for (const meal of allMealPlans) {
            const scaledIngredients = meal.ingredients.map(ing => ({
              ...ing,
              quantity: Math.round(ing.quantity * scalingFactor * 10) / 10,
              calories: Math.round(ing.calories * scalingFactor),
              protein: Math.round(ing.protein * scalingFactor * 10) / 10,
              carbs: Math.round(ing.carbs * scalingFactor * 10) / 10,
              fat: Math.round(ing.fat * scalingFactor * 10) / 10
            }));
            
            const newTotals = scaledIngredients.reduce((acc, ing) => ({
              calories: acc.calories + ing.calories,
              protein: acc.protein + ing.protein,
              carbs: acc.carbs + ing.carbs,
              fat: acc.fat + ing.fat
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            
            await base44.entities.MealPlan.update(meal.id, {
              ingredients: scaledIngredients,
              total_calories: Math.round(newTotals.calories),
              total_protein: Math.round(newTotals.protein * 10) / 10,
              total_carbs: Math.round(newTotals.carbs * 10) / 10,
              total_fat: Math.round(newTotals.fat * 10) / 10,
              image_url: null // Reset immagine perché le porzioni sono cambiate
            });
          }
          
          changes.diet.push(`Target calorico ${proposal.adjustment > 0 ? 'aumentato' : 'ridotto'} di ${Math.abs(proposal.adjustment)} kcal (da ${proposal.current} a ${proposal.proposed} kcal). Tutti i pasti sono stati scalati proporzionalmente. ${proposal.reason}`);
        } else if (proposal.type === 'no_change') {
          changes.diet.push(proposal.reason);
        }
      }
      
      // 2. APPLICA MODIFICHE WORKOUT
      for (const proposal of proposedChanges.workout) {
        if (proposal.type === 'exercise_replacement') {
          const dayPlans = await base44.entities.WorkoutPlan.filter({ id: proposal.day_id });
          const dayPlan = dayPlans[0];

          if (dayPlan) {
            const updatedExercises = dayPlan.exercises.map(ex => 
              ex.name === proposal.current_exercise.name ? { ...proposal.proposed_exercise, id: ex.id } : ex
            );
            
            await base44.entities.WorkoutPlan.update(proposal.day_id, {
              exercises: updatedExercises
            });
            
            changes.workout.push(`${proposal.day}: sostituito "${proposal.current_exercise.name}" con "${proposal.proposed_exercise.name}" - ${proposal.reason}`);
          }
        } else if (proposal.type === 'no_change') {
          changes.workout.push(proposal.reason);
        }
      }

      console.log('✅ Modifiche applicate:', changes);
      setAppliedChanges(changes);
    } catch (error) {
      console.error('Error applying changes:', error);
      alert('Errore nell\'applicazione delle modifiche. L\'analisi verrà comunque salvata.');
    }
    setIsApplyingChanges(false);
  };

  const saveAnalysis = async () => {
    setIsSaving(true);
    
    try {
      console.log('💾 SAVING ANALYSIS...');
      console.log('💾 uploadedPhotoUrls.current:', uploadedPhotoUrls.current);
      
      const today = new Date().toISOString().split('T')[0];
      const { targetPhotoUrls, bodyPhotoUrls, photoHashes } = uploadedPhotoUrls.current || { targetPhotoUrls: [], bodyPhotoUrls: {}, photoHashes: [] };
      
      console.log('💾 targetPhotoUrls:', targetPhotoUrls);
      console.log('💾 bodyPhotoUrls:', bodyPhotoUrls);
      console.log('💾 Number of body photos:', Object.keys(bodyPhotoUrls).length);
      
      const dataToSave = {
        user_id: user.id,
        photo_url: targetPhotoUrls[0] || null,
        date: today,
        weight: user.current_weight,
        ai_analysis: {
          target_zone: analysisResult.target_zone,
          target_photo_urls: targetPhotoUrls,
          body_photo_urls: bodyPhotoUrls,
          photo_hashes: photoHashes,
          comparison_result: analysisResult.comparison_result,
          visible_characteristics: analysisResult.visible_characteristics,
          visible_differences: analysisResult.visible_differences,
          overall_assessment: analysisResult.overall_assessment,
          recommendations: analysisResult.recommendations,
          workout_adjustment_needed: analysisResult.workout_adjustment_needed,
          diet_adjustment_needed: analysisResult.diet_adjustment_needed,
          motivational_message: analysisResult.motivational_message,
          plans_adjusted: !!appliedChanges,
          applied_changes: appliedChanges,
          proposed_changes: proposedChanges
        },
        notes: notes
      };
      
      console.log('💾 FULL DATA TO SAVE:', JSON.stringify(dataToSave, null, 2));
      
      await base44.entities.ProgressPhoto.create(dataToSave);
      
      console.log('✅ SAVED TO DATABASE!');

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
      
      onClose();
    } catch (error) {
      console.error("❌ Error saving progress photos:", error);
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
              {step === 'analysis' && (isAnalyzing ? 'Analisi in corso...' : 'Analisi completata')}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'zone_selection' && (
              <motion.div key="zone-selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-1">Privacy Totale</p>
                      <p className="text-xs text-purple-800">Le foto sono analizzate SOLO dall'AI. Scatta in intimo per precisione.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quale zona vuoi migliorare?</h3>
                  <div className="space-y-2">
                    {TARGET_ZONES.map((zone) => (
                      <button key={zone.id} onClick={() => handleZoneSelection(zone)} className="w-full p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{zone.label}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{zone.description}</p>
                          </div>
                          <div className="text-xs text-purple-600 font-medium">{zone.photoCount} foto</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'target_photos' && selectedZone && (
              <motion.div key="target-photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">⚠️ Mantieni angolo e luci simili • Preferibilmente in intimo</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Foto: {selectedZone.label}</h3>
                  {TARGET_ZONES.find(z => z.id === selectedZone.id).photoCount === 1 ? (
                    <div>
                      {!targetPhotos.single ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <div className="flex gap-2 justify-center">
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'single')} className="hidden" id="target-camera-single" />
                            <Button type="button" onClick={() => document.getElementById('target-camera-single').click()} size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <Camera className="w-4 h-4 mr-1" />Scatta
                            </Button>
                            <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'single')} className="hidden" id="target-gallery-single" />
                            <Button type="button" onClick={() => document.getElementById('target-gallery-single').click()} variant="outline" size="sm">
                              <Upload className="w-4 h-4 mr-1" />Carica
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <img src={targetPhotos.single.previewUrl} alt="Foto zona" className="w-full h-64 object-cover rounded-lg border-2 border-green-400" />
                          <Button onClick={() => { setTargetPhotos(prev => { const updated = { ...prev }; delete updated.single; return updated; }); delete targetFileRefs.current.single; }} variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'left')} className="hidden" id="target-camera-left" />
                              <Button type="button" onClick={() => document.getElementById('target-camera-left').click()} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs">
                                <Camera className="w-3 h-3 mr-1" />Scatta
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'left')} className="hidden" id="target-gallery-left" />
                              <Button type="button" onClick={() => document.getElementById('target-gallery-left').click()} variant="outline" size="sm" className="w-full text-xs">
                                <Upload className="w-3 h-3 mr-1" />Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img src={targetPhotos.left.previewUrl} alt="Sinistro" className="w-full h-48 object-cover rounded-lg border-2 border-green-400" />
                            <Button onClick={() => { setTargetPhotos(prev => { const updated = { ...prev }; delete updated.left; return updated; }); delete targetFileRefs.current.left; }} variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'right')} className="hidden" id="target-camera-right" />
                              <Button type="button" onClick={() => document.getElementById('target-camera-right').click()} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs">
                                <Camera className="w-3 h-3 mr-1" />Scatta
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'right')} className="hidden" id="target-gallery-right" />
                              <Button type="button" onClick={() => document.getElementById('target-gallery-right').click()} variant="outline" size="sm" className="w-full text-xs">
                                <Upload className="w-3 h-3 mr-1" />Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img src={targetPhotos.right.previewUrl} alt="Destro" className="w-full h-48 object-cover rounded-lg border-2 border-green-400" />
                            <Button onClick={() => { setTargetPhotos(prev => { const updated = { ...prev }; delete updated.right; return updated; }); delete targetFileRefs.current.right; }} variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep('zone_selection')} variant="outline" size="sm" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-1" />Indietro
                  </Button>
                  <Button onClick={() => setStep('body_photos')} disabled={!canProceedFromTargetPhotos()} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                    Avanti<ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'body_photos' && (
              <motion.div key="body-photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium">📁 Foto per archivio storico (non analizzate, solo salvate)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Corpo intero (4 angolazioni)</h3>
                  <div className="space-y-2">
                    {BODY_PHOTOS.map((bodyPhoto) => (
                      <div key={bodyPhoto.id}>
                        <p className="text-xs font-medium text-gray-600 mb-2">{bodyPhoto.icon} {bodyPhoto.label}</p>
                        {!bodyPhotos[bodyPhoto.id] ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)} className="hidden" id={`body-camera-${bodyPhoto.id}`} />
                              <Button type="button" onClick={() => document.getElementById(`body-camera-${bodyPhoto.id}`).click()} size="sm" className="bg-gray-700 hover:bg-gray-800 text-xs">
                                <Camera className="w-3 h-3 mr-1" />Scatta
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)} className="hidden" id={`body-gallery-${bodyPhoto.id}`} />
                              <Button type="button" onClick={() => document.getElementById(`body-gallery-${bodyPhoto.id}`).click()} variant="outline" size="sm" className="text-xs">
                                <Upload className="w-3 h-3 mr-1" />Carica
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <img src={bodyPhotos[bodyPhoto.id].previewUrl} alt={bodyPhoto.label} className="w-full h-48 object-cover rounded-lg border-2 border-green-400" />
                            <Button onClick={() => { setBodyPhotos(prev => { const updated = { ...prev }; delete updated[bodyPhoto.id]; return updated; }); delete bodyFileRefs.current[bodyPhoto.id]; }} variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">Note (opzionali)</label>
                  <Textarea placeholder="Es: 'Mi sento più forte', 'Ho seguito il piano'..." value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20 text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep('target_photos')} variant="outline" size="sm" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-1" />Indietro
                  </Button>
                  <Button onClick={analyzePhotos} disabled={!canProceedFromBodyPhotos() || isAnalyzing} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-1" />Analizza
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'analysis' && isAnalyzing && !analysisResult && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-900 font-semibold text-base mb-2">Analisi AI in corso...</p>
                <p className="text-xs text-gray-600">Sto analizzando la zona {selectedZone?.label}</p>
              </motion.div>
            )}

            {analysisResult && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
                        <li key={idx} className="text-xs text-blue-800 flex gap-2"><span>•</span><span>{char}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.visible_differences?.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2 text-sm">Differenze (Sx vs Dx)</h4>
                    <ul className="space-y-1">
                      {analysisResult.visible_differences.map((diff, idx) => (
                        <li key={idx} className="text-xs text-yellow-800 flex gap-2"><span>↔️</span><span>{diff}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.recommendations?.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">Raccomandazioni</h4>
                    <ul className="space-y-1">
                      {analysisResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-purple-800 flex gap-2"><span>→</span><span>{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {!canApplyChanges && daysSinceLastAdjustment !== null && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-800 font-semibold mb-1">🔒 Modifiche ai Piani Non Disponibili</p>
                        <p className="text-xs text-amber-700">Sono passati {daysSinceLastAdjustment} giorni dall'ultima modifica. Potrai applicare nuove modifiche tra {7 - daysSinceLastAdjustment} giorni per dare tempo al corpo di adattarsi.</p>
                      </div>
                    </div>
                  </div>
                )}

                {isGeneratingProposals && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-800 font-medium">Generazione modifiche proposte dall'AI...</p>
                    </div>
                  </div>
                )}

                {proposedChanges && !appliedChanges && canApplyChanges && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                    <h4 className="font-bold text-green-900 mb-3 text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />Modifiche Proposte dall'AI
                    </h4>
                    {proposedChanges.diet.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-green-800 mb-2">🍽️ Piano Nutrizionale:</p>
                        {proposedChanges.diet.map((proposal, idx) => (
                          <div key={idx} className="bg-white/60 p-3 rounded-lg border border-green-200 mb-2">
                            {proposal.type === 'calorie_adjustment' ? (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">Target Calorico:</span>
                                  <span className="text-sm font-bold text-green-700">{proposal.current} → {proposal.proposed} kcal ({proposal.adjustment > 0 ? '+' : ''}{proposal.adjustment})</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{proposal.reason}</p>
                                <p className="text-xs text-purple-700 font-semibold">✨ Tutti i pasti verranno scalati proporzionalmente</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-700">✓ {proposal.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {proposedChanges.workout.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-green-800 mb-2">💪 Piano Allenamento:</p>
                        {proposedChanges.workout.map((proposal, idx) => (
                          <div key={idx} className="bg-white/60 p-3 rounded-lg border border-green-200 mb-2">
                            {proposal.type === 'exercise_replacement' ? (
                              <>
                                <p className="text-xs font-medium text-gray-700 mb-1">Giorno: <span className="font-bold">{proposal.day}</span></p>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-red-600 line-through">{proposal.current_exercise.name}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-green-700 font-bold">{proposal.proposed_exercise.name}</span>
                                </div>
                                <p className="text-xs text-gray-600">{proposal.proposed_exercise.sets} serie x {proposal.proposed_exercise.reps} • {proposal.proposed_exercise.rest} recupero</p>
                                <p className="text-xs text-gray-600 mt-1">{proposal.reason}</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-700">✓ {proposal.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button onClick={applyProposedChanges} className="w-full bg-green-600 hover:bg-green-700" disabled={isApplyingChanges}>
                      {isApplyingChanges ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applicazione in corso...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Applica Modifiche</>
                      )}
                    </Button>
                  </div>
                )}

                {appliedChanges && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />✅ Modifiche Applicate con Successo
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

                <Button onClick={saveAnalysis} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isSaving || isApplyingChanges || isGeneratingProposals}>
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvataggio...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Salva Analisi</>
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
