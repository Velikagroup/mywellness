import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, X, Info, Zap, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, Check, Microscope, Brain, FlaskConical, Target, Utensils, Dumbbell } from 'lucide-react';
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

const ANALYSIS_STEPS = [
  { id: 'upload', label: 'Caricamento foto sul server', icon: Upload },
  { id: 'current_analysis', label: 'Analisi forense foto corrente', icon: Microscope },
  { id: 'previous_data', label: 'Recupero dati foto precedente', icon: FlaskConical },
  { id: 'comparison', label: 'Confronto scientifico Prima vs Dopo', icon: Brain },
  { id: 'recommendations', label: 'Generazione raccomandazioni personalizzate', icon: Target },
  { id: 'proposals', label: 'Creazione proposte modifiche ai piani', icon: Sparkles }
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
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentPhotoDescription, setCurrentPhotoDescription] = useState(null);

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

    console.log('🔍 TARGET PHOTO - Checking for duplicates...');
    const fileHash = await getFileHash(file);
    console.log('🔍 TARGET PHOTO - File hash:', fileHash);
    
    const existingPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
    console.log('🔍 TARGET PHOTO - Found', existingPhotos.length, 'existing photos');
    
    const existingHashes = existingPhotos
      .map(p => p.ai_analysis?.photo_hashes || [])
      .flat();
    console.log('🔍 TARGET PHOTO - Existing hashes:', existingHashes);
    
    if (existingHashes.includes(fileHash)) {
      console.log('🚫 TARGET PHOTO - DUPLICATE DETECTED! Blocking upload.');
      alert('🚫 FOTO DUPLICATA!\n\nHai già caricato questa foto in precedenza.\n\nPer un confronto accurato, scatta una NUOVA foto della zona ' + selectedZone.label + '.');
      e.target.value = '';
      return;
    }

    console.log('✅ TARGET PHOTO - No duplicate, proceeding...');

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
    console.log('🔍 BODY PHOTO - File hash:', fileHash);
    
    const existingPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
    console.log('🔍 BODY PHOTO - Found', existingPhotos.length, 'existing photos');
    
    const existingHashes = existingPhotos
      .map(p => p.ai_analysis?.photo_hashes || [])
      .flat();
    console.log('🔍 BODY PHOTO - Existing hashes:', existingHashes);
    
    if (existingHashes.includes(fileHash)) {
      console.log('🚫 BODY PHOTO - DUPLICATE DETECTED! Blocking upload.');
      const bodyPhotoLabel = BODY_PHOTOS.find(bp => bp.id === photoType)?.label || photoType;
      alert('🚫 FOTO DUPLICATA!\n\nHai già caricato questa foto in precedenza.\n\nPer l\'archivio, scatta una NUOVA foto ' + bodyPhotoLabel + '.');
      e.target.value = '';
      return;
    }

    console.log('✅ BODY PHOTO - No duplicate, proceeding...');

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

  const markStepComplete = (stepId) => {
    setCompletedSteps(prev => [...prev, stepId]);
  };

  const analyzePhotos = async () => {
    if (!selectedZone) return;
    
    setIsAnalyzing(true);
    setStep('analysis');
    setAnalysisResult(null);
    setProposedChanges(null);
    setAppliedChanges(null);
    setCompletedSteps([]);
    setCurrentAnalysisStep('upload');
    
    try {
      console.log('🔵 STARTING ANALYSIS...');
      
      const targetPhotoUrls = [];
      const photoHashes = [];
      const zone = TARGET_ZONES.find(z => z.id === selectedZone.id);
      
      // STEP 1: Upload foto
      if (zone.photoCount === 1 && targetFileRefs.current.single) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.single.file });
        targetPhotoUrls.push(file_url);
        photoHashes.push(targetFileRefs.current.single.hash);
      } else if (zone.photoCount === 2) {
        if (targetFileRefs.current.left) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.left.file });
          targetPhotoUrls.push(file_url);
          photoHashes.push(targetFileRefs.current.left.hash);
        }
        if (targetFileRefs.current.right) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: targetFileRefs.current.right.file });
          targetPhotoUrls.push(file_url);
          photoHashes.push(targetFileRefs.current.right.hash);
        }
      }

      const bodyPhotoUrls = {};
      for (const photoType of ['front', 'side_left', 'side_right', 'back']) {
        if (bodyFileRefs.current[photoType]) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: bodyFileRefs.current[photoType].file });
          bodyPhotoUrls[photoType] = file_url;
          photoHashes.push(bodyFileRefs.current[photoType].hash);
        }
      }

      uploadedPhotoUrls.current = { targetPhotoUrls, bodyPhotoUrls, photoHashes };
      markStepComplete('upload');

      // STEP 2: Analisi foto corrente
      setCurrentAnalysisStep('current_analysis');
      
      const descriptionPrompt = `You are an EXPERT body composition analyst with 20+ years of experience. Describe this photo of the ${selectedZone.label} area in EXTREME SCIENTIFIC DETAIL.

CRITICAL: Generate ALL content in ITALIAN language.

Analyze EVERY visible detail with NUMERICAL SCORES (0-10 scale):
1. GRASSO SUPERFICIALE (0-10): 0=molto grasso, 10=estremamente magro. Quanto grasso sottocutaneo è visibile?
2. DEFINIZIONE MUSCOLARE (0-10): 0=nessuna, 10=massima. Quanto sono visibili e separati i muscoli?
3. SIMMETRIA E PROPORZIONI (0-10): 0=asimmetrico, 10=perfettamente simmetrico. Confronta lato sx e dx.
4. QUALITÀ PELLE (0-10): 0=cellulite grave/smagliature evidenti, 10=pelle perfettamente tonica. Analizza: cellulite, smagliature, tonicità.
5. GONFIORE/RITENZIONE (0-10): 0=molto gonfio/ritenzione evidente, 10=nessuna ritenzione. La zona appare gonfia o trattenendo liquidi?

For each score, provide detailed observations in Italian.

User: ${user.gender}, ${user.current_weight}kg, Goal: ${user.fitness_goal}
Target Area: ${selectedZone.label}

Be FORENSICALLY detailed. Describe what you see like you're writing a medical report.`;

      const currentDescription = await base44.integrations.Core.InvokeLLM({
        prompt: descriptionPrompt,
        file_urls: targetPhotoUrls,
        response_json_schema: {
          type: "object",
          properties: {
            grasso_superficiale_score: { 
              type: "number", 
              description: "0-10: quanto grasso è visibile (0=molto, 10=niente)" 
            },
            grasso_superficiale_note: { 
              type: "string", 
              description: "Osservazioni dettagliate sul grasso visibile in italiano" 
            },
            definizione_muscolare_score: { 
              type: "number", 
              description: "0-10: quanto sono definiti i muscoli (0=niente, 10=massimo)" 
            },
            definizione_muscolare_note: { 
              type: "string", 
              description: "Osservazioni sui muscoli visibili in italiano" 
            },
            simmetria_proporzioni_score: { 
              type: "number", 
              description: "0-10: quanto è simmetrica la zona (0=asimmetrico, 10=perfetto)" 
            },
            simmetria_proporzioni_note: { 
              type: "string", 
              description: "Differenze tra lato sx e dx in italiano" 
            },
            qualita_pelle_score: { 
              type: "number", 
              description: "0-10: qualità pelle (0=cellulite/smagliature evidenti, 10=perfetta)" 
            },
            qualita_pelle_note: { 
              type: "string", 
              description: "Dettagli su cellulite, smagliature, tonicità in italiano" 
            },
            gonfiore_ritenzione_score: { 
              type: "number", 
              description: "0-10: livello ritenzione (0=molto gonfio, 10=nessun gonfiore)" 
            },
            gonfiore_ritenzione_note: { 
              type: "string", 
              description: "Osservazioni su gonfiore e ritenzione liquidi in italiano" 
            },
            detailed_description: { 
              type: "string", 
              description: "Descrizione forense completa in italiano" 
            }
          },
          required: [
            "grasso_superficiale_score", "grasso_superficiale_note",
            "definizione_muscolare_score", "definizione_muscolare_note",
            "simmetria_proporzioni_score", "simmetria_proporzioni_note",
            "qualita_pelle_score", "qualita_pelle_note",
            "gonfiore_ritenzione_score", "gonfiore_ritenzione_note",
            "detailed_description"
          ]
        }
      });

      setCurrentPhotoDescription(currentDescription);
      markStepComplete('current_analysis');

      // STEP 3: Recupero foto precedente
      setCurrentAnalysisStep('previous_data');
      
      let previousPhotoUrls = [];
      let daysSincePrevious = null;
      let previousPhotoDescription = null;
      
      if (previousPhoto && previousPhoto.ai_analysis?.target_photo_urls) {
        previousPhotoUrls.push(...previousPhoto.ai_analysis.target_photo_urls);
        daysSincePrevious = Math.floor((new Date() - new Date(previousPhoto.date)) / (1000 * 60 * 60 * 24));
        previousPhotoDescription = previousPhoto.ai_analysis?.photo_description || null;
      }
      
      markStepComplete('previous_data');

      // STEP 4: Confronto
      setCurrentAnalysisStep('comparison');

      let comparisonPrompt;

      if (previousPhotoDescription && daysSincePrevious !== null) {
        comparisonPrompt = `You are an EXPERT body composition analyst. COMPARE these two detailed analyses:

🔴 FOTO PRECEDENTE (${daysSincePrevious} giorni fa):
- Grasso Superficiale: ${previousPhotoDescription.grasso_superficiale_score || previousPhotoDescription.muscle_definition_score}/10
- Definizione Muscolare: ${previousPhotoDescription.definizione_muscolare_score || previousPhotoDescription.muscle_definition_score}/10
- Simmetria: ${previousPhotoDescription.simmetria_proporzioni_score || 5}/10
- Qualità Pelle: ${previousPhotoDescription.qualita_pelle_score || 5}/10
- Gonfiore/Ritenzione: ${previousPhotoDescription.gonfiore_ritenzione_score || 5}/10

🟢 FOTO CORRENTE (OGGI):
- Grasso Superficiale: ${currentDescription.grasso_superficiale_score}/10
- Definizione Muscolare: ${currentDescription.definizione_muscolare_score}/10
- Simmetria: ${currentDescription.simmetria_proporzioni_score}/10
- Qualità Pelle: ${currentDescription.qualita_pelle_score}/10
- Gonfiore/Ritenzione: ${currentDescription.gonfiore_ritenzione_score}/10

CRITICAL INSTRUCTIONS (in ITALIAN):
1. COMPARE EVERY SINGLE METRIC above and calculate deltas
2. For each metric, explain if it improved, stayed same, or regressed
3. Write a MINIMUM 6-8 sentence paragraph in Italian explaining EVERY difference
4. Be BRUTALLY HONEST - if numbers improved but you don't see it visually, explain why (lighting, posture, etc)
5. If numbers show improvement, CELEBRATE IT with specifics

User: ${user.gender}, ${user.current_weight}kg, Goal: ${user.fitness_goal}, Area: ${selectedZone.label}
Days passed: ${daysSincePrevious}
User notes: ${notes || 'Nessuna nota'}`;

      } else {
        comparisonPrompt = `This is the user's FIRST progress photo. Provide a baseline assessment.

CURRENT PHOTO ANALYSIS:
- Grasso Superficiale: ${currentDescription.grasso_superficiale_score}/10
- Definizione Muscolare: ${currentDescription.definizione_muscolare_score}/10
- Simmetria: ${currentDescription.simmetria_proporzioni_score}/10
- Qualità Pelle: ${currentDescription.qualita_pelle_score}/10
- Gonfiore/Ritenzione: ${currentDescription.gonfiore_ritenzione_score}/10

User: ${user.gender}, ${user.current_weight}kg, Goal: ${user.fitness_goal}, Area: ${selectedZone.label}

Task (in ITALIAN):
1. Describe current state as baseline
2. Set comparison_result to "first_photo"
3. List visible characteristics based on the 5 scores above
4. Provide 3-5 recommendations to improve this area
5. Suggest if adjustments needed
6. Write encouraging message`;
      }

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: comparisonPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            comparison_result: { 
              type: "string", 
              enum: ["first_photo", "improved", "maintained", "regressed"] 
            },
            visible_characteristics: {
              type: "array",
              items: { type: "string" }
            },
            visible_differences: {
              type: "array",
              items: { type: "string" }
            },
            comparison_with_previous: {
              type: "string",
              description: "DETAILED comparison in Italian, minimum 6 sentences"
            },
            overall_assessment: { 
              type: "string"
            },
            recommendations: { 
              type: "array", 
              items: { type: "string" }
            },
            workout_adjustment_needed: { type: "boolean" },
            diet_adjustment_needed: { type: "boolean" },
            motivational_message: { type: "string" }
          },
          required: ["comparison_result", "visible_characteristics", "overall_assessment", "recommendations", "workout_adjustment_needed", "diet_adjustment_needed", "motivational_message"]
        }
      });

      markStepComplete('comparison');

      // STEP 5: Raccomandazioni (già completate dall'analisi precedente)
      setCurrentAnalysisStep('recommendations');
      markStepComplete('recommendations');

      setAnalysisResult({
        ...analysis,
        target_zone: selectedZone.id,
        days_since_previous: daysSincePrevious
      });

      // STEP 6: Proposte modifiche
      if (canApplyChanges && (analysis.workout_adjustment_needed || analysis.diet_adjustment_needed)) {
        setCurrentAnalysisStep('proposals');
        await generateProposedChanges(analysis, currentDescription);
        markStepComplete('proposals');
      } else {
        markStepComplete('proposals');
      }

      setCurrentAnalysisStep('');

    } catch (error) {
      console.error("Error analyzing photos:", error);
      alert(`Errore nell'analisi: ${error.message || 'Errore sconosciuto'}`);
      setStep('body_photos');
      setIsAnalyzing(false);
      setCurrentAnalysisStep('');
      setCompletedSteps([]);
    }
    setIsAnalyzing(false);
  };

  const generateProposedChanges = async (analysis, currentDesc) => {
    setIsGeneratingProposals(true);
    const proposals = { diet: [], workout: [] };
    
    try {
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
                                sets: fallbackReplacement.sets || 3,
                                reps: fallbackReplacement.reps || "12 ripetizioni",
                                rest: fallbackReplacement.rest || "60 secondi",
                                explanation: `Sostituzione per variare lo stimolo sui ${selectedZone.label}.`
                            },
                            reason: `Sostituito "${exerciseToReplace.name}" con "${fallbackReplacement.name}" per variare lo stimolo.`
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
              }
            }
          }
        }
      }

      setProposedChanges(proposals);
    } catch (error) {
      console.error('Error generating proposals:', error);
    }
    setIsGeneratingProposals(false);
  };

  const applyProposedChanges = async (changeType = 'both') => {
    if (!proposedChanges) return;
    
    setIsApplyingChanges(true);
    const changes = { diet: [], workout: [] };
    
    try {
      if ((changeType === 'both' || changeType === 'diet') && proposedChanges.diet.length > 0) {
        for (const proposal of proposedChanges.diet) {
          if (proposal.type === 'calorie_adjustment' && proposal.adjustment !== 0) {
            await base44.auth.updateMe({ daily_calories: proposal.proposed });
            
            const scalingFactor = proposal.proposed / proposal.current;
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
                image_url: null
              });
            }
            
            changes.diet.push(`Target calorico ${proposal.adjustment > 0 ? 'aumentato' : 'ridotto'} di ${Math.abs(proposal.adjustment)} kcal (da ${proposal.current} a ${proposal.proposed} kcal). Tutti i pasti sono stati scalati proporzionalmente. ${proposal.reason}`);
          } else if (proposal.type === 'no_change') {
            changes.diet.push(proposal.reason);
          }
        }
      }
      
      if ((changeType === 'both' || changeType === 'workout') && proposedChanges.workout.length > 0) {
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
      }

      console.log('✅ Modifiche applicate:', changes);
      setAppliedChanges(prev => ({
        diet: [...(prev?.diet || []), ...changes.diet],
        workout: [...(prev?.workout || []), ...changes.workout]
      }));
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
      
      const today = new Date().toISOString().split('T')[0];
      const { targetPhotoUrls, bodyPhotoUrls, photoHashes } = uploadedPhotoUrls.current || { targetPhotoUrls: [], bodyPhotoUrls: {}, photoHashes: [] };
      
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
          photo_description: currentPhotoDescription,
          comparison_result: analysisResult.comparison_result,
          visible_characteristics: analysisResult.visible_characteristics || [],
          visible_differences: analysisResult.visible_differences || [],
          comparison_with_previous: analysisResult.comparison_with_previous || '',
          days_since_previous: analysisResult.days_since_previous,
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
      alert("Errore nel salvataggio: " + (error.message || 'Riprova'));
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
              {step === 'analysis' && (isAnalyzing ? 'Analisi AI in corso...' : 'Analisi completata')}
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
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 py-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-1">Analisi AI in Corso</p>
                  <p className="text-xs text-gray-600">L'intelligenza artificiale sta analizzando i tuoi progressi</p>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200/60 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">Protocollo Analisi AI:</h4>
                  {ANALYSIS_STEPS.map((analysisStep, idx) => {
                    const StepIcon = analysisStep.icon;
                    const isCompleted = completedSteps.includes(analysisStep.id);
                    const isCurrent = currentAnalysisStep === analysisStep.id;
                    
                    return (
                      <div key={analysisStep.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-green-500' : isCurrent ? 'bg-purple-500' : 'bg-gray-200'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : isCurrent ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <StepIcon className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${isCompleted ? 'text-green-700 font-semibold' : isCurrent ? 'text-purple-700 font-semibold' : 'text-gray-500'}`}>
                            {analysisStep.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

                {analysisResult.comparison_with_previous && analysisResult.comparison_result !== 'first_photo' && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-indigo-300 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-indigo-900 text-base">
                        📊 Confronto Prima vs Dopo {analysisResult.days_since_previous && `(${analysisResult.days_since_previous} giorni)`}
                      </h4>
                    </div>
                    
                    {/* Foto affiancate PRIMA vs DOPO */}
                    {previousPhoto?.ai_analysis?.target_photo_urls && uploadedPhotoUrls.current?.targetPhotoUrls && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-red-700 text-center">🔴 PRIMA ({analysisResult.days_since_previous} giorni fa)</p>
                          <img 
                            src={previousPhoto.ai_analysis.target_photo_urls[0]} 
                            alt="Foto precedente" 
                            className="w-full h-48 object-cover rounded-lg border-2 border-red-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-green-700 text-center">🟢 DOPO (OGGI)</p>
                          <img 
                            src={uploadedPhotoUrls.current.targetPhotoUrls[0]} 
                            alt="Foto attuale" 
                            className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-white/60 p-4 rounded-lg">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                        {analysisResult.comparison_with_previous}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Valutazione AI Stato Attuale</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.overall_assessment}</p>
                </div>

                {currentPhotoDescription && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-300 space-y-3">
                    <h4 className="font-bold text-blue-900 mb-3 text-base flex items-center gap-2">
                      <Microscope className="w-5 h-5" />
                      📊 Analisi Dettagliata Zona Target
                    </h4>

                    <div className="space-y-2">
                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">🔥 Grasso Superficiale</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                                style={{ width: `${currentPhotoDescription.grasso_superficiale_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-700">{currentPhotoDescription.grasso_superficiale_score}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{currentPhotoDescription.grasso_superficiale_note}</p>
                      </div>

                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">💪 Definizione Muscolare</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                                style={{ width: `${currentPhotoDescription.definizione_muscolare_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-700">{currentPhotoDescription.definizione_muscolare_score}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{currentPhotoDescription.definizione_muscolare_note}</p>
                      </div>

                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">⚖️ Simmetria e Proporzioni</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                                style={{ width: `${currentPhotoDescription.simmetria_proporzioni_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-700">{currentPhotoDescription.simmetria_proporzioni_score}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{currentPhotoDescription.simmetria_proporzioni_note}</p>
                      </div>

                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">✨ Qualità Pelle</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                                style={{ width: `${currentPhotoDescription.qualita_pelle_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-700">{currentPhotoDescription.qualita_pelle_score}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{currentPhotoDescription.qualita_pelle_note}</p>
                      </div>

                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">💧 Gonfiore / Ritenzione</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" 
                                style={{ width: `${currentPhotoDescription.gonfiore_ritenzione_score * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-blue-700">{currentPhotoDescription.gonfiore_ritenzione_score}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{currentPhotoDescription.gonfiore_ritenzione_note}</p>
                      </div>
                    </div>
                  </div>
                )}

                {analysisResult.visible_characteristics?.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">Caratteristiche Visibili Oggi</h4>
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
                    <h4 className="font-semibold text-purple-900 mb-2 text-sm">💡 Raccomandazioni per Migliorare</h4>
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
                    
                    <div className="space-y-2">
                      {proposedChanges.diet.length > 0 && (
                        <Button 
                          onClick={() => applyProposedChanges('diet')} 
                          className="w-full bg-orange-600 hover:bg-orange-700" 
                          disabled={isApplyingChanges}
                        >
                          {isApplyingChanges ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applicazione...</>
                          ) : (
                            <><Utensils className="w-4 h-4 mr-2" />Applica Solo Modifiche Nutrizionali</>
                          )}
                        </Button>
                      )}
                      
                      {proposedChanges.workout.length > 0 && (
                        <Button 
                          onClick={() => applyProposedChanges('workout')} 
                          className="w-full bg-blue-600 hover:bg-blue-700" 
                          disabled={isApplyingChanges}
                        >
                          {isApplyingChanges ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Applicazione...</>
                          ) : (
                            <><Dumbbell className="w-4 h-4 mr-2" />Applica Solo Modifiche Allenamento</>
                          )}
                        </Button>
                      )}
                    </div>
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