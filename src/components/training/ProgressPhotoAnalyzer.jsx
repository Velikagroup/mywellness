import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Loader2, TrendingUp, TrendingDown, Minus, CheckCircle2, Sparkles, X, Info, Zap, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, Check, Microscope, Brain, FlaskConical, Target, Utensils, Dumbbell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProgressPhotoAnalyzer({ user, onClose, onAnalysisComplete }) {
  const { t, language } = useLanguage();

  const TARGET_ZONES = [
    { id: 'pancia', label: t('targetZones.belly'), photoCount: 1, description: t('targetZones.bellyDesc') },
    { id: 'petto', label: t('targetZones.chest'), photoCount: 1, description: t('targetZones.chestDesc') },
    { id: 'schiena', label: t('targetZones.back'), photoCount: 1, description: t('targetZones.backDesc') },
    { id: 'braccia', label: t('targetZones.arms'), photoCount: 2, description: t('targetZones.armsDesc') },
    { id: 'gambe', label: t('targetZones.legs'), photoCount: 2, description: t('targetZones.legsDesc') },
    { id: 'glutei', label: t('targetZones.glutes'), photoCount: 2, description: t('targetZones.glutesDesc') }
  ];

  const BODY_PHOTOS = [
    { id: 'front', label: t('bodyPhotos.front'), icon: '⬆️' },
    { id: 'side_left', label: t('bodyPhotos.sideLeft'), icon: '⬅️' },
    { id: 'side_right', label: t('bodyPhotos.sideRight'), icon: '➡️' },
    { id: 'back', label: t('bodyPhotos.back'), icon: '⬇️' }
  ];

  const ANALYSIS_STEPS = [
    { id: 'upload', label: t('progressAnalyzer.uploadStep'), icon: Upload },
    { id: 'current_analysis', label: t('progressAnalyzer.currentAnalysis'), icon: Microscope },
    { id: 'previous_data', label: t('progressAnalyzer.previousData'), icon: FlaskConical },
    { id: 'comparison', label: t('progressAnalyzer.comparison'), icon: Brain },
    { id: 'recommendations', label: t('progressAnalyzer.recommendations'), icon: Target },
    { id: 'proposals', label: t('progressAnalyzer.proposals'), icon: Sparkles }
  ];
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
  const [isApplyingNutritionRecs, setIsApplyingNutritionRecs] = useState(false);
  const [isApplyingWorkoutRecs, setIsApplyingWorkoutRecs] = useState(false);
  const [nutritionRecsApplied, setNutritionRecsApplied] = useState(false);
  const [workoutRecsApplied, setWorkoutRecsApplied] = useState(false);

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
      alert('🚫 ' + t('progressAnalyzer.duplicatePhoto') + '\n\n' + t('progressAnalyzer.duplicatePhotoDesc') + '\n\n' + t('progressAnalyzer.takeNewPhoto') + ' ' + selectedZone.label + '.');
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
      alert('🚫 ' + t('progressAnalyzer.duplicatePhoto') + '\n\n' + t('progressAnalyzer.duplicatePhotoDesc') + '\n\n' + t('progressAnalyzer.takeNewPhoto') + ' ' + bodyPhotoLabel + '.');
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
    // Le foto corpo intero sono opzionali, si può sempre procedere
    return true;
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

      const languageNames = {
        it: 'Italian',
        en: 'English',
        es: 'Spanish',
        pt: 'Portuguese',
        de: 'German',
        fr: 'French'
      };
      const userLang = t('common.lang') || language || 'en';
      const langName = languageNames[userLang] || 'English';
      
      const descriptionPrompt = `You are an EXPERT body composition analyst with 20+ years of experience. Describe this photo of the ${selectedZone.label} area in EXTREME SCIENTIFIC DETAIL.

CRITICAL: Generate ALL content in ${langName.toUpperCase()} language.

Analyze EVERY visible detail with NUMERICAL SCORES (0-10 scale):
1. SUPERFICIAL FAT (0-10): 0=very fat, 10=extremely lean. How much subcutaneous fat is visible?
2. MUSCLE DEFINITION (0-10): 0=none, 10=maximum. How visible and separated are the muscles?
3. SYMMETRY & PROPORTIONS (0-10): 0=asymmetric, 10=perfectly symmetric. Compare left vs right side.
4. SKIN QUALITY (0-10): 0=severe cellulite/stretch marks, 10=perfectly toned skin. Analyze: cellulite, stretch marks, tone.
5. SWELLING/RETENTION (0-10): 0=very swollen/evident retention, 10=no retention. Does the area appear swollen or retaining fluids?

For each score, provide detailed observations in ${langName.toUpperCase()}.

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
              description: `Detailed observations on visible fat in ${langName.toUpperCase()}` 
            },
            definizione_muscolare_score: { 
              type: "number", 
              description: "0-10: how defined are the muscles (0=none, 10=maximum)" 
            },
            definizione_muscolare_note: { 
              type: "string", 
              description: `Observations on visible muscles in ${langName.toUpperCase()}` 
            },
            simmetria_proporzioni_score: { 
              type: "number", 
              description: "0-10: how symmetric is the zone (0=asymmetric, 10=perfect)" 
            },
            simmetria_proporzioni_note: { 
              type: "string", 
              description: `Differences between left and right side in ${langName.toUpperCase()}` 
            },
            qualita_pelle_score: { 
              type: "number", 
              description: "0-10: skin quality (0=cellulite/stretch marks evident, 10=perfect)" 
            },
            qualita_pelle_note: { 
              type: "string", 
              description: `Details on cellulite, stretch marks, tone in ${langName.toUpperCase()}` 
            },
            gonfiore_ritenzione_score: { 
              type: "number", 
              description: "0-10: retention level (0=very swollen, 10=no swelling)" 
            },
            gonfiore_ritenzione_note: { 
              type: "string", 
              description: `Observations on swelling and fluid retention in ${langName.toUpperCase()}` 
            },
            detailed_description: { 
              type: "string", 
              description: `Complete forensic description in ${langName.toUpperCase()}` 
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

CRITICAL: Generate ALL responses in ${langName.toUpperCase()} language.

🔴 PREVIOUS PHOTO (${daysSincePrevious} days ago):
- Superficial Fat: ${previousPhotoDescription.grasso_superficiale_score || previousPhotoDescription.muscle_definition_score}/10
- Muscle Definition: ${previousPhotoDescription.definizione_muscolare_score || previousPhotoDescription.muscle_definition_score}/10
- Symmetry: ${previousPhotoDescription.simmetria_proporzioni_score || 5}/10
- Skin Quality: ${previousPhotoDescription.qualita_pelle_score || 5}/10
- Swelling/Retention: ${previousPhotoDescription.gonfiore_ritenzione_score || 5}/10

🟢 CURRENT PHOTO (TODAY):
- Superficial Fat: ${currentDescription.grasso_superficiale_score}/10
- Muscle Definition: ${currentDescription.definizione_muscolare_score}/10
- Symmetry: ${currentDescription.simmetria_proporzioni_score}/10
- Skin Quality: ${currentDescription.qualita_pelle_score}/10
- Swelling/Retention: ${currentDescription.gonfiore_ritenzione_score}/10

CRITICAL INSTRUCTIONS (in ${langName.toUpperCase()}):
1. COMPARE EVERY SINGLE METRIC above and calculate deltas
2. For each metric, explain if it improved, stayed same, or regressed
3. Write a MINIMUM 6-8 sentence paragraph in ${langName.toUpperCase()} explaining EVERY difference
4. Be BRUTALLY HONEST - if numbers improved but you don't see it visually, explain why (lighting, posture, etc)
5. If numbers show improvement, CELEBRATE IT with specifics

User: ${user.gender}, ${user.current_weight}kg, Goal: ${user.fitness_goal}, Area: ${selectedZone.label}
Days passed: ${daysSincePrevious}
User notes: ${notes || 'No notes'}`;

      } else {
        comparisonPrompt = `This is the user's FIRST progress photo. Provide a baseline assessment.

CRITICAL: Generate ALL responses in ${langName.toUpperCase()} language.

CURRENT PHOTO ANALYSIS:
- Superficial Fat: ${currentDescription.grasso_superficiale_score}/10
- Muscle Definition: ${currentDescription.definizione_muscolare_score}/10
- Symmetry: ${currentDescription.simmetria_proporzioni_score}/10
- Skin Quality: ${currentDescription.qualita_pelle_score}/10
- Swelling/Retention: ${currentDescription.gonfiore_ritenzione_score}/10

User: ${user.gender}, ${user.current_weight}kg, Goal: ${user.fitness_goal}, Area: ${selectedZone.label}

Task (in ${langName.toUpperCase()}):
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
              description: `DETAILED comparison in ${langName.toUpperCase()}, minimum 6 sentences`
            },
            overall_assessment: { 
              type: "string"
            },
            nutrition_recommendations: {
              type: "array",
              items: { type: "string" },
              description: `3-5 practical NUTRITION tips in ${langName.toUpperCase()} to improve this specific area`
            },
            workout_recommendations: {
              type: "array",
              items: { type: "string" },
              description: `3-5 practical WORKOUT tips in ${langName.toUpperCase()} to improve this specific area`
            },
            workout_adjustment_needed: { type: "boolean" },
            diet_adjustment_needed: { type: "boolean" },
            motivational_message: { type: "string" }
          },
          required: ["comparison_result", "visible_characteristics", "overall_assessment", "nutrition_recommendations", "workout_recommendations", "workout_adjustment_needed", "diet_adjustment_needed", "motivational_message"]
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

      // STEP 6: Proposte modifiche (sempre generate, anche se non applicabili subito)
      setCurrentAnalysisStep('proposals');
      await generateProposedChanges(analysis, currentDescription);
      markStepComplete('proposals');

      setCurrentAnalysisStep('');

    } catch (error) {
      console.error("Error analyzing photos:", error);
      alert(`${t('progressAnalyzer.analysisError')}: ${error.message || 'Errore sconosciuto'}`);
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
    
    const languageNames = {
      it: 'Italian',
      en: 'English',
      es: 'Spanish',
      pt: 'Portuguese',
      de: 'German',
      fr: 'French'
    };
    const userLang = t('common.lang') || language || 'en';
    const langName = languageNames[userLang] || 'English';
    
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
- Generate ALL content in ${langName.toUpperCase()} language
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
Suggest ONE single exercise replacement with name in ${langName.toUpperCase()}, sets, reps (in ${langName.toUpperCase()} format), rest (in ${langName.toUpperCase()}), and brief explanation (2 sentences max in ${langName.toUpperCase()}) why this change helps for the ${selectedZone.label} area.`;

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

  const applyNutritionRecommendations = async () => {
    if (!analysisResult?.nutrition_recommendations?.length) return;
    
    setIsApplyingNutritionRecs(true);
    try {
      // Genera prompt per l'AI per adattare il piano nutrizionale
      let currentMeals = [];
      try {
        currentMeals = await base44.entities.MealPlan.filter({ user_id: user.id });
      } catch (e) {
        console.warn('Could not load meals:', e);
      }
      
      const prompt = `Sei un nutrizionista esperto. Basandoti sulle seguenti raccomandazioni nutrizionali derivate dall'analisi foto progresso, suggerisci una modifica calorica appropriata.

RACCOMANDAZIONI AI:
${analysisResult.nutrition_recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

DATI UTENTE:
- Calorie giornaliere attuali: ${user.daily_calories || 2000} kcal
- Peso attuale: ${user.current_weight || 70} kg
- Peso obiettivo: ${user.target_weight || 65} kg
- Obiettivo: ${user.fitness_goal || 'dimagrimento'}

Basandoti sulle raccomandazioni, suggerisci un aggiustamento calorico (tra -100 e +100 kcal).
Se le raccomandazioni suggeriscono di aumentare proteine/ridurre carboidrati ma non cambiano calorie totali, suggerisci 0.`;

      const adjustment = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            calorie_adjustment: { type: "number", description: "Aggiustamento calorico da -100 a +100" },
            reason: { type: "string", description: "Breve spiegazione" }
          },
          required: ["calorie_adjustment", "reason"]
        }
      });

      const calorieAdjustment = Math.max(-100, Math.min(100, adjustment?.calorie_adjustment || 0));
      const reasonText = adjustment?.reason || 'Raccomandazioni applicate';
      
      if (calorieAdjustment !== 0 && user.daily_calories) {
        const newCalories = Math.round(user.daily_calories + calorieAdjustment);
        await base44.auth.updateMe({ daily_calories: newCalories });
        
        // Scala tutti i pasti proporzionalmente
        if (currentMeals.length > 0) {
          const scalingFactor = newCalories / user.daily_calories;
          for (const meal of currentMeals) {
            if (!meal.ingredients || meal.ingredients.length === 0) continue;
            
            const scaledIngredients = meal.ingredients.map(ing => ({
              ...ing,
              quantity: Math.round((ing.quantity || 0) * scalingFactor * 10) / 10,
              calories: Math.round((ing.calories || 0) * scalingFactor),
              protein: Math.round((ing.protein || 0) * scalingFactor * 10) / 10,
              carbs: Math.round((ing.carbs || 0) * scalingFactor * 10) / 10,
              fat: Math.round((ing.fat || 0) * scalingFactor * 10) / 10
            }));
            
            const newTotals = scaledIngredients.reduce((acc, ing) => ({
              calories: acc.calories + (ing.calories || 0),
              protein: acc.protein + (ing.protein || 0),
              carbs: acc.carbs + (ing.carbs || 0),
              fat: acc.fat + (ing.fat || 0)
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
            
            await base44.entities.MealPlan.update(meal.id, {
              ingredients: scaledIngredients,
              total_calories: Math.round(newTotals.calories),
              total_protein: Math.round(newTotals.protein * 10) / 10,
              total_carbs: Math.round(newTotals.carbs * 10) / 10,
              total_fat: Math.round(newTotals.fat * 10) / 10
            });
          }
        }
      }
      
      setNutritionRecsApplied(true);
      setAppliedChanges(prev => ({
        ...(prev || {}),
        diet: [`${reasonText}${calorieAdjustment !== 0 ? ` (${calorieAdjustment > 0 ? '+' : ''}${calorieAdjustment} kcal)` : ''}`]
      }));
    } catch (error) {
      console.error('Error applying nutrition recommendations:', error);
      alert(t('progressAnalyzer.applyError'));
    }
    setIsApplyingNutritionRecs(false);
  };

  const applyWorkoutRecommendations = async () => {
    if (!analysisResult?.workout_recommendations?.length) return;
    
    setIsApplyingWorkoutRecs(true);
    try {
      let workoutPlans = [];
      let allExercises = [];
      
      try {
        workoutPlans = await base44.entities.WorkoutPlan.filter({ user_id: user.id });
      } catch (e) {
        console.warn('Could not load workout plans:', e);
      }
      
      try {
        allExercises = await base44.entities.Exercise.list();
      } catch (e) {
        console.warn('Could not load exercises:', e);
      }
      
      const targetMuscleGroups = {
        'pancia': ['addominali', 'core'],
        'petto': ['pettorali'],
        'schiena': ['dorsali', 'lombari', 'gran dorsale'],
        'braccia': ['bicipiti', 'tricipiti', 'avambraccio'],
        'gambe': ['quadricipiti', 'polpacci', 'femorali', 'glutei'],
        'glutei': ['glutei', 'femorali']
      };
      
      const relevantMuscles = targetMuscleGroups[analysisResult.target_zone] || [];
      const activeDays = workoutPlans.filter(p => p.workout_type !== 'rest' && p.exercises?.length > 0);
      
      let changesMade = false;
      
      if (activeDays.length > 0 && relevantMuscles.length > 0 && allExercises.length > 0) {
        // Trova il giorno con più esercizi rilevanti
        let dayToModify = null;
        let maxRelevantExercises = 0;
        let exerciseToReplace = null;
        
        for (const day of activeDays) {
          const relevantExercisesInDay = (day.exercises || []).filter(ex => 
            relevantMuscles.some(muscle => 
              (ex.muscle_groups || []).some(mg => mg.toLowerCase().includes(muscle))
            )
          );
          
          if (relevantExercisesInDay.length > maxRelevantExercises) {
            maxRelevantExercises = relevantExercisesInDay.length;
            dayToModify = day;
            exerciseToReplace = relevantExercisesInDay[0];
          }
        }
        
        if (dayToModify && exerciseToReplace) {
          const availableExercises = allExercises.filter(ex => 
            relevantMuscles.some(muscle => 
              (ex.muscle_groups || []).some(mg => mg.toLowerCase().includes(muscle))
            ) && 
            ex.name.toLowerCase() !== exerciseToReplace.name.toLowerCase() &&
            ((user.equipment || []).includes(ex.equipment) || ex.equipment === 'corpo_libero' || ex.equipment === 'nessuno')
          );
          
          if (availableExercises.length > 0) {
            const newExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
            
            const updatedExercises = dayToModify.exercises.map(ex => 
              ex.name === exerciseToReplace.name ? {
                ...ex,
                name: newExercise.name,
                description: newExercise.description,
                muscle_groups: newExercise.muscle_groups
              } : ex
            );
            
            await base44.entities.WorkoutPlan.update(dayToModify.id, { exercises: updatedExercises });
            
            changesMade = true;
            setAppliedChanges(prev => ({
              ...(prev || {}),
              workout: [`${dayToModify.plan_name}: sostituito "${exerciseToReplace.name}" con "${newExercise.name}" per migliorare ${analysisResult.target_zone}`]
            }));
          }
        }
      }
      
      // Segna come applicato anche se non ci sono modifiche specifiche
      setWorkoutRecsApplied(true);
      if (!changesMade) {
        setAppliedChanges(prev => ({
          ...(prev || {}),
          workout: ['Raccomandazioni di allenamento registrate']
        }));
      }
      
    } catch (error) {
      console.error('Error applying workout recommendations:', error);
      alert(t('progressAnalyzer.applyError'));
    }
    setIsApplyingWorkoutRecs(false);
  };

  const applyProposedChanges = async (changeType = 'both') => {
    if (!proposedChanges) return;
    
    setIsApplyingChanges(true);
    const changes = { diet: appliedChanges?.diet || [], workout: appliedChanges?.workout || [] };
    
    try {
      if ((changeType === 'both' || changeType === 'diet') && proposedChanges.diet.length > 0 && !(appliedChanges?.diet?.length > 0)) {
        for (const proposal of proposedChanges.diet) {
          if (proposal.type === 'calorie_adjustment' && proposal.adjustment !== 0) {
            await base44.auth.updateMe({ daily_calories: proposal.proposed });
            
            const scalingFactor = proposal.proposed / proposal.current;
            const allMealPlans = await base44.entities.MealPlan.filter({ user_id: user.id });
            
            for (const meal of allMealPlans) {
              if (!meal.ingredients || meal.ingredients.length === 0) continue;
              
              const scaledIngredients = meal.ingredients.map(ing => ({
                ...ing,
                quantity: Math.round((ing.quantity || 0) * scalingFactor * 10) / 10,
                calories: Math.round((ing.calories || 0) * scalingFactor),
                protein: Math.round((ing.protein || 0) * scalingFactor * 10) / 10,
                carbs: Math.round((ing.carbs || 0) * scalingFactor * 10) / 10,
                fat: Math.round((ing.fat || 0) * scalingFactor * 10) / 10
              }));
              
              const newTotals = scaledIngredients.reduce((acc, ing) => ({
                calories: acc.calories + (ing.calories || 0),
                protein: acc.protein + (ing.protein || 0),
                carbs: acc.carbs + (ing.carbs || 0),
                fat: acc.fat + (ing.fat || 0)
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
      
      if ((changeType === 'both' || changeType === 'workout') && proposedChanges.workout.length > 0 && !(appliedChanges?.workout?.length > 0)) {
        for (const proposal of proposedChanges.workout) {
          if (proposal.type === 'exercise_replacement') {
            try {
              const dayPlans = await base44.entities.WorkoutPlan.filter({ id: proposal.day_id });
              const dayPlan = dayPlans[0];

              if (dayPlan && dayPlan.exercises) {
                const updatedExercises = dayPlan.exercises.map(ex => 
                  ex.name === proposal.current_exercise.name ? { 
                    ...ex,
                    name: proposal.proposed_exercise.name,
                    sets: proposal.proposed_exercise.sets,
                    reps: proposal.proposed_exercise.reps,
                    rest: proposal.proposed_exercise.rest,
                    description: proposal.proposed_exercise.explanation || proposal.reason
                  } : ex
                );
                
                await base44.entities.WorkoutPlan.update(proposal.day_id, {
                  exercises: updatedExercises
                });
                
                changes.workout.push(`${proposal.day}: sostituito "${proposal.current_exercise.name}" con "${proposal.proposed_exercise.name}" - ${proposal.reason}`);
              } else {
                console.warn('WorkoutPlan not found for id:', proposal.day_id);
              }
            } catch (err) {
              console.error('Error updating workout:', err);
            }
          } else if (proposal.type === 'no_change') {
            changes.workout.push(proposal.reason);
          }
        }
      }

      console.log('✅ Modifiche applicate:', changes);
      setAppliedChanges(changes);
    } catch (error) {
      console.error('Error applying changes:', error);
      alert(t('progressAnalyzer.applyError'));
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
          nutrition_recommendations: analysisResult.nutrition_recommendations || [],
          workout_recommendations: analysisResult.workout_recommendations || [],
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
      alert(t('progressAnalyzer.saveError') + ": " + (error.message || 'Riprova'));
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
        label: t('progressAnalyzer.firstAnalysis')
      },
      improved: { 
        icon: TrendingUp, 
        color: 'from-green-500 to-emerald-500',
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-300',
        label: t('progressAnalyzer.visibleProgress')
      },
      maintained: { 
        icon: Minus, 
        color: 'from-yellow-500 to-amber-500',
        bgColor: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-300',
        label: t('progressAnalyzer.maintenance')
      },
      regressed: { 
        icon: TrendingDown, 
        color: 'from-orange-500 to-red-500',
        bgColor: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-300',
        label: t('progressAnalyzer.needsAttention')
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
              {t('progressAnalyzer.title')}
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal">
              {step === 'zone_selection' && t('progressAnalyzer.selectZone')}
              {step === 'target_photos' && `${t('progressAnalyzer.photoZone')}: ${selectedZone?.label}`}
              {step === 'body_photos' && t('progressAnalyzer.bodyPhotos')}
              {step === 'analysis' && (isAnalyzing ? t('progressAnalyzer.analyzing') : t('progressAnalyzer.analysisComplete'))}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'zone_selection' && (
              <motion.div key="zone-selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-1">{t('progressAnalyzer.privacyTitle')}</p>
                      <p className="text-xs text-purple-800">{t('progressAnalyzer.privacyDesc')}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">{t('progressAnalyzer.whichZone')}</h3>
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
                  <p className="text-xs text-blue-800">⚠️ {t('progressAnalyzer.photoTip')}</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{t('progressAnalyzer.photoZone')}: {selectedZone.label}</h3>
                  {TARGET_ZONES.find(z => z.id === selectedZone.id).photoCount === 1 ? (
                    <div>
                      {!targetPhotos.single ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <div className="flex gap-2 justify-center">
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'single')} className="hidden" id="target-camera-single" />
                            <Button type="button" onClick={() => document.getElementById('target-camera-single').click()} size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <Camera className="w-4 h-4 mr-1" />{t('progressAnalyzer.takePhoto')}
                            </Button>
                            <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'single')} className="hidden" id="target-gallery-single" />
                            <Button type="button" onClick={() => document.getElementById('target-gallery-single').click()} variant="outline" size="sm">
                              <Upload className="w-4 h-4 mr-1" />{t('progressAnalyzer.upload')}
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
                        <p className="text-xs font-medium text-gray-600 mb-2">{t('progressAnalyzer.left')}</p>
                        {!targetPhotos.left ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <div className="space-y-1">
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'left')} className="hidden" id="target-camera-left" />
                              <Button type="button" onClick={() => document.getElementById('target-camera-left').click()} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs">
                                <Camera className="w-3 h-3 mr-1" />{t('progressAnalyzer.takePhoto')}
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'left')} className="hidden" id="target-gallery-left" />
                              <Button type="button" onClick={() => document.getElementById('target-gallery-left').click()} variant="outline" size="sm" className="w-full text-xs">
                                <Upload className="w-3 h-3 mr-1" />{t('progressAnalyzer.upload')}
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
                        <p className="text-xs font-medium text-gray-600 mb-2">{t('progressAnalyzer.right')}</p>
                        {!targetPhotos.right ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <div className="space-y-1">
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleTargetPhotoSelect(e, 'right')} className="hidden" id="target-camera-right" />
                              <Button type="button" onClick={() => document.getElementById('target-camera-right').click()} size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs">
                                <Camera className="w-3 h-3 mr-1" />{t('progressAnalyzer.takePhoto')}
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleTargetPhotoSelect(e, 'right')} className="hidden" id="target-gallery-right" />
                              <Button type="button" onClick={() => document.getElementById('target-gallery-right').click()} variant="outline" size="sm" className="w-full text-xs">
                                <Upload className="w-3 h-3 mr-1" />{t('progressAnalyzer.upload')}
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
                    <ArrowLeft className="w-4 h-4 mr-1" />{t('progressAnalyzer.back')}
                  </Button>
                  <Button onClick={() => setStep('body_photos')} disabled={!canProceedFromTargetPhotos()} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                    {t('progressAnalyzer.next')}<ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'body_photos' && (
              <motion.div key="body-photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium">ℹ️ {t('progressAnalyzer.optionalPhotos')}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-medium">📁 {t('progressAnalyzer.archiveNote')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">{t('progressAnalyzer.fullBody')}</h3>
                  <div className="space-y-2">
                    {BODY_PHOTOS.map((bodyPhoto) => (
                      <div key={bodyPhoto.id}>
                        <p className="text-xs font-medium text-gray-600 mb-2">{bodyPhoto.icon} {bodyPhoto.label}</p>
                        {!bodyPhotos[bodyPhoto.id] ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)} className="hidden" id={`body-camera-${bodyPhoto.id}`} />
                              <Button type="button" onClick={() => document.getElementById(`body-camera-${bodyPhoto.id}`).click()} size="sm" className="bg-gray-700 hover:bg-gray-800 text-xs">
                                <Camera className="w-3 h-3 mr-1" />{t('progressAnalyzer.takePhoto')}
                              </Button>
                              <input type="file" accept="image/*" onChange={(e) => handleBodyPhotoSelect(e, bodyPhoto.id)} className="hidden" id={`body-gallery-${bodyPhoto.id}`} />
                              <Button type="button" onClick={() => document.getElementById(`body-gallery-${bodyPhoto.id}`).click()} variant="outline" size="sm" className="text-xs">
                                <Upload className="w-3 h-3 mr-1" />{t('progressAnalyzer.upload')}
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
                  <label className="text-xs font-medium text-gray-700 mb-2 block">{t('progressAnalyzer.notesOptional')}</label>
                  <Textarea placeholder={t('progressAnalyzer.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20 text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => setStep('target_photos')} variant="outline" size="sm" className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-1" />{t('progressAnalyzer.back')}
                  </Button>
                  <Button onClick={analyzePhotos} disabled={isAnalyzing} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="w-4 h-4 mr-1" />{t('progressAnalyzer.analyze')}
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
                  <p className="text-gray-900 font-bold text-lg mb-1">{t('progressAnalyzer.aiAnalyzing')}</p>
                  <p className="text-xs text-gray-600">{t('progressAnalyzer.aiAnalyzingDesc')}</p>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200/60 space-y-3">
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">{t('progressAnalyzer.aiProtocol')}</h4>
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
                        📊 {t('progressAnalyzer.beforeAfter')} {analysisResult.days_since_previous && `(${analysisResult.days_since_previous} ${t('progressAnalyzer.daysAgo')})`}
                      </h4>
                    </div>
                    
                    {/* Foto affiancate PRIMA vs DOPO */}
                    {previousPhoto?.ai_analysis?.target_photo_urls && uploadedPhotoUrls.current?.targetPhotoUrls && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-red-700 text-center">🔴 {t('progressAnalyzer.before')} ({analysisResult.days_since_previous} {t('progressAnalyzer.daysAgo')})</p>
                          <img 
                            src={previousPhoto.ai_analysis.target_photo_urls[0]} 
                            alt="Foto precedente" 
                            className="w-full h-48 object-cover rounded-lg border-2 border-red-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-green-700 text-center">🟢 {t('progressAnalyzer.after')}</p>
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
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">{t('progressAnalyzer.currentStateAI')}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.overall_assessment}</p>
                </div>

                {currentPhotoDescription && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-300 space-y-3">
                    <h4 className="font-bold text-blue-900 mb-3 text-base flex items-center gap-2">
                      <Microscope className="w-5 h-5" />
                      📊 {t('progressAnalyzer.detailedAnalysis')}
                    </h4>

                    <div className="space-y-2">
                      <div className="bg-white/60 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">🔥 {t('progressAnalyzer.superficialFat')}</span>
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
                          <span className="text-xs font-semibold text-gray-700">💪 {t('progressAnalyzer.muscleDefinition')}</span>
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
                          <span className="text-xs font-semibold text-gray-700">⚖️ {t('progressAnalyzer.symmetry')}</span>
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
                          <span className="text-xs font-semibold text-gray-700">✨ {t('progressAnalyzer.skinQuality')}</span>
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
                          <span className="text-xs font-semibold text-gray-700">💧 {t('progressAnalyzer.swelling')}</span>
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
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">{t('progressAnalyzer.visibleCharacteristics')}</h4>
                    <ul className="space-y-1">
                      {analysisResult.visible_characteristics.map((char, idx) => (
                        <li key={idx} className="text-xs text-blue-800 flex gap-2"><span>•</span><span>{char}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.visible_differences?.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2 text-sm">{t('progressAnalyzer.differences')}</h4>
                    <ul className="space-y-1">
                      {analysisResult.visible_differences.map((diff, idx) => (
                        <li key={idx} className="text-xs text-yellow-800 flex gap-2"><span>↔️</span><span>{diff}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raccomandazioni Nutrizionali - solo visualizzazione */}
                {analysisResult.nutrition_recommendations?.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                    <h4 className="font-bold text-orange-900 text-sm flex items-center gap-2 mb-2">
                      <Utensils className="w-4 h-4" />
                      🍽️ {t('progressAnalyzer.nutritionRecommendations')}
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.nutrition_recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-orange-800 flex gap-2"><span>→</span><span>{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Raccomandazioni Allenamento - solo visualizzazione */}
                {analysisResult.workout_recommendations?.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-300">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2 mb-2">
                      <Dumbbell className="w-4 h-4" />
                      💪 {t('progressAnalyzer.workoutRecommendations')}
                    </h4>
                    <ul className="space-y-1">
                      {analysisResult.workout_recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-indigo-800 flex gap-2"><span>→</span><span>{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {!canApplyChanges && daysSinceLastAdjustment !== null && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-800 font-semibold mb-1">🔒 {t('progressAnalyzer.changesNotAvailable')}</p>
                        <p className="text-xs text-amber-700">{daysSinceLastAdjustment} {t('progressAnalyzer.daysPassedSince')}. {t('progressAnalyzer.waitDays')} {7 - daysSinceLastAdjustment} {t('progressAnalyzer.daysToAdapt')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isGeneratingProposals && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm text-blue-800 font-medium">{t('progressAnalyzer.generatingProposals')}</p>
                    </div>
                  </div>
                )}



                {proposedChanges && canApplyChanges && (proposedChanges.diet.length > 0 || proposedChanges.workout.length > 0) && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                    <h4 className="font-bold text-green-900 mb-3 text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />{t('progressAnalyzer.proposedChanges')}
                    </h4>
                    
                    {proposedChanges.diet.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-orange-800 flex items-center gap-1">
                            <Utensils className="w-4 h-4" />
                            🍽️ {t('progressAnalyzer.nutritionPlan')}
                          </p>
                          {!appliedChanges?.diet?.length && (
                            <Button 
                              onClick={() => applyProposedChanges('diet')} 
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700" 
                              disabled={isApplyingChanges}
                            >
                              {isApplyingChanges ? (
                                <><Loader2 className="w-3 h-3 animate-spin mr-1" />{t('progressAnalyzer.applying')}</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3 mr-1" />{t('progressAnalyzer.applyChanges')}</>
                              )}
                            </Button>
                          )}
                          {appliedChanges?.diet?.length > 0 && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('progressAnalyzer.applied')}
                            </span>
                          )}
                        </div>
                        
                        {proposedChanges.diet.map((proposal, idx) => (
                          <div key={idx} className="bg-white/60 p-3 rounded-lg border border-orange-200 mb-2">
                            {proposal.type === 'calorie_adjustment' ? (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{t('progressAnalyzer.caloricTarget')}</span>
                                  <span className="text-sm font-bold text-orange-700">{proposal.current} → {proposal.proposed} kcal ({proposal.adjustment > 0 ? '+' : ''}{proposal.adjustment})</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{proposal.reason}</p>
                                <p className="text-xs text-purple-700 font-semibold">✨ {t('progressAnalyzer.allMealsScaled')}</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-700">✓ {proposal.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {proposedChanges.workout.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-indigo-800 flex items-center gap-1">
                            <Dumbbell className="w-4 h-4" />
                            💪 {t('progressAnalyzer.workoutPlan')}
                          </p>
                          {!(appliedChanges?.workout?.length > 0) && (
                            <Button 
                              onClick={() => applyProposedChanges('workout')} 
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700" 
                              disabled={isApplyingChanges}
                            >
                              {isApplyingChanges ? (
                                <><Loader2 className="w-3 h-3 animate-spin mr-1" />{t('progressAnalyzer.applying')}</>
                              ) : (
                                <><CheckCircle2 className="w-3 h-3 mr-1" />{t('progressAnalyzer.applyChanges')}</>
                              )}
                            </Button>
                          )}
                          {appliedChanges?.workout?.length > 0 && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {t('progressAnalyzer.applied')}
                            </span>
                          )}
                        </div>
                        
                        {proposedChanges.workout.map((proposal, idx) => (
                          <div key={idx} className="bg-white/60 p-3 rounded-lg border border-indigo-200 mb-2">
                            {proposal.type === 'exercise_replacement' ? (
                              <>
                                <p className="text-xs font-medium text-gray-700 mb-1">{t('progressAnalyzer.day')} <span className="font-bold">{proposal.day}</span></p>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-red-600 line-through">{proposal.current_exercise.name}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-green-700 font-bold">{proposal.proposed_exercise.name}</span>
                                </div>
                                <p className="text-xs text-gray-600">{proposal.proposed_exercise.sets} serie x {proposal.proposed_exercise.reps} • {proposal.proposed_exercise.rest} {t('progressAnalyzer.recovery')}</p>
                                <p className="text-xs text-gray-600 mt-1">{proposal.reason}</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-700">✓ {proposal.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {appliedChanges && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />✅ {t('progressAnalyzer.changesApplied')}
                    </h4>
                    {appliedChanges.diet.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-green-800 mb-1">🍽️ {t('upgradeModal.diet')}</p>
                        <ul className="space-y-0.5">
                          {appliedChanges.diet.map((change, idx) => (
                            <li key={idx} className="text-xs text-green-700">• {change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {appliedChanges.workout.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-800 mb-1">💪 {t('upgradeModal.workout')}</p>
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
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t('progressAnalyzer.savingAnalysis')}</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />{t('progressAnalyzer.saveAnalysis')}</>
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