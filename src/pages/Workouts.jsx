import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Database, Target, ArrowLeft, ArrowRight, BrainCircuit, CheckCircle, ShieldAlert, AlertCircle, Crown, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ExerciseCard from "../components/workouts/ExerciseCard";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import JointPainStep from "../components/quiz/JointPainStep";
import FitnessExperienceStep from "../components/quiz/FitnessExperienceStep";
import WorkoutLocationStep from "../components/quiz/WorkoutLocationStep";
import EquipmentStep from "../components/quiz/EquipmentStep";
import WorkoutDaysStep from "../components/quiz/WorkoutDaysStep";
import SessionDurationStep from "../components/quiz/SessionDurationStep";
import FitnessGoalStep from "../components/quiz/FitnessGoalStep";
import PerformanceOrientedStep from "../components/quiz/PerformanceOrientedStep";
import WorkoutStyleStep from "../components/workouts/WorkoutStyleStep";
import SportSpecificQuestionsStep from "../components/workouts/SportSpecificQuestionsStep";
import StrengthLevelStep from "../components/workouts/StrengthLevelStep";

import { hasFeatureAccess, getGenerationLimit, PLANS } from '@/components/utils/subscriptionPlans';
import UpgradeModal from '../components/meals/UpgradeModal';
import ReplaceExerciseModal from '../components/workouts/ReplaceExerciseModal';
import AddExerciseModal from '../components/workouts/AddExerciseModal';
import DeleteExerciseDialog from '../components/workouts/DeleteExerciseDialog';
import { useLanguage } from '../components/i18n/LanguageContext';

import { motion } from "framer-motion";

const getAllTrainingSteps = (isPerformanceOriented, workoutStyle) => {
  const steps = [
    { id: 'fitness_goal', title: 'Obiettivo Fitness', component: FitnessGoalStep, autoAdvance: true },
    { id: 'performance_oriented', title: 'Tipo Obiettivo', component: PerformanceOrientedStep, autoAdvance: true }
  ];
  
  if (isPerformanceOriented) {
    steps.push({ id: 'workout_style', title: 'Stile Allenamento', component: WorkoutStyleStep, autoAdvance: true });
    steps.push({ id: 'sport_specific', title: 'Dati Specifici', component: SportSpecificQuestionsStep });
  }
  
  steps.push(
    { id: 'fitness_experience', title: 'Esperienza', component: FitnessExperienceStep, autoAdvance: true },
    { id: 'strength_level', title: 'Livello Forza', component: StrengthLevelStep, autoAdvance: true },
    { id: 'workout_days', title: 'Frequenza Allenamenti', component: WorkoutDaysStep },
    { id: 'session_duration', title: 'Durata Sessione', autoAdvance: true, component: SessionDurationStep },
    { id: 'workout_location', title: 'Luogo Allenamento', autoAdvance: true, component: WorkoutLocationStep },
    { id: 'equipment', title: 'Attrezzatura', component: EquipmentStep },
    { id: 'joint_pain', title: 'Dolori Articolari', component: JointPainStep }
  );
  
  return steps;
};

// Mappa dolori articolari -> gruppi muscolari da evitare
const JOINT_PAIN_RESTRICTIONS = {
  'ginocchia': ['quadricipiti', 'polpacci'],
  'schiena': ['lombari'],
  'spalle': ['deltoidi', 'deltoidi anteriori', 'deltoidi laterali', 'deltoidi posteriori'],
  'gomiti': ['bicipiti', 'tricipiti'],
  'polsi': ['avambracci'],
  'anche': ['glutei', 'adduttori', 'abduttori'],
  'caviglie': ['polpacci']
};

export default function Workouts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // ✅ Imposta il giorno corrente come default
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };
  
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [trainingData, setTrainingData] = useState({});

  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentProblem, setAdjustmentProblem] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState(null);
  const [adjustedWorkout, setAdjustedWorkout] = useState(null);

  const [showCheatCompensation, setShowCheatCompensation] = useState(false);
  const [cheatData, setCheatData] = useState(null);
  const [isCompensating, setIsCompensating] = useState(false);
  const [cheatPromptShown, setCheatPromptShown] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(null);
  const [generationLimitReached, setGenerationLimitReached] = useState(false);

  // ✅ SEMPLIFICATO: Usa solo exerciseSets per tracciare tutto
  const [exerciseSets, setExerciseSets] = useState({}); // { "Squat con Manubri": [1,2,3], "Panca Piana": [1,2] }
  const [workoutCompleted, setWorkoutCompleted] = useState(false); // Se l'allenamento di OGGI è stato completato
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);
  
  // Stati per sostituzione/eliminazione/aggiunta esercizi
  const [replaceExerciseTarget, setReplaceExerciseTarget] = useState(null);
  const [deleteExerciseTarget, setDeleteExerciseTarget] = useState(null);
  const [isDeletingExercise, setIsDeletingExercise] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  // Query per workout plans - usa list() e filtra client-side per evitare problemi RLS
  const { data: workoutPlans = [], isLoading: isLoadingWorkouts, refetch: refetchWorkouts } = useQuery({
    queryKey: ['workoutPlans', trainingData.user_id],
    queryFn: async () => {
      if (!trainingData.user_id) return [];
      // Usa list() senza filtro e poi filtra client-side
      const allPlans = await base44.entities.WorkoutPlan.list();
      const userPlans = allPlans.filter(p => p.user_id === trainingData.user_id);
      return userPlans;
    },
    enabled: !!trainingData.user_id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Query per esercizi dal database
  const { data: allExercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
    staleTime: Infinity,
  });

  // ✅ FUNZIONE PER ARRICCHIRE GLI ESERCIZI CON DATI DAL DATABASE
  const enrichExerciseWithDetails = useCallback((exercise) => {
    if (!exercise || !exercise.name) return exercise;
    
    // Cerca l'esercizio nel database per nome (match esatto o parziale)
    const exerciseNameLower = exercise.name.toLowerCase().trim();
    const dbExercise = allExercises.find(e => {
      const dbNameLower = e.name?.toLowerCase().trim();
      // Match esatto o parziale (contiene)
      return dbNameLower === exerciseNameLower || 
             dbNameLower?.includes(exerciseNameLower) || 
             exerciseNameLower.includes(dbNameLower);
    });
    
    if (dbExercise) {
      // Merge: mantieni i dati del workout plan (sets, reps, rest) e aggiungi i dettagli dal DB
      return {
        ...exercise,
        detailed_description: dbExercise.detailed_description,
        form_tips: dbExercise.form_tips,
        target_muscles: dbExercise.target_muscles,
        muscle_image_url: dbExercise.muscle_image_url,
        difficulty: dbExercise.difficulty || exercise.difficulty,
        equipment: dbExercise.equipment || exercise.equipment,
        muscle_groups: dbExercise.muscle_groups || exercise.muscle_groups
      };
    }
    
    // Se l'esercizio non è nel database, restituisci comunque con i dati disponibili
    // L'utente vedrà solo le info base (sets, reps, rest) senza il pulsante "Dettagli"
    console.warn(`⚠️ Esercizio "${exercise.name}" non trovato nel database. Verifica che sia stato aggiunto o rigenera il piano.`);
    return exercise;
  }, [allExercises]);

  const createWorkoutMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workoutPlans'] }),
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkoutPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workoutPlans'] }),
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workoutPlans'] }),
  });

  const checkForCheats = useCallback(async (userId) => {
    if (cheatPromptShown) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await base44.entities.MealLog.filter({ user_id: userId, date: today });
      
      if (logs.length > 0) {
        const totalDelta = logs.reduce((sum, log) => sum + (log.delta_calories || 0), 0);
        const hasUncompensatedCheat = logs.some(log => !log.rebalanced && Math.abs(log.delta_calories || 0) > 0);
        
        if (Math.abs(totalDelta) > 200 && hasUncompensatedCheat) {
          setCheatData({
            totalDelta,
            logsCount: logs.length
          });
          setShowCheatCompensation(true);
          setCheatPromptShown(true);
        }
      }
    } catch (error) {
      if (error?.response?.status !== 401 && !error?.message?.includes('401')) {
        console.error("Error checking for cheats:", error);
      }
    }
  }, [cheatPromptShown]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
          navigate(createPageUrl('Home'));
          return;
        }

        // ✅ CRITICAL: Verifica se l'utente ha una subscription attiva o in trial
        if (!currentUser.subscription_status || 
            (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial')) {
          console.warn('⚠️ User has no active subscription, redirecting to TrialSetup');
          navigate(createPageUrl('TrialSetup'), { replace: true });
          return;
        }

        if (!hasFeatureAccess(currentUser.subscription_plan, 'workout_plan')) {
          setTrainingData({ user_id: currentUser.id, subscription_plan: currentUser.subscription_plan });
          setIsLoading(false);
          return;
        }

        // 🔧 DEBUG: Log i dati caricati dall'utente
        console.log('📊 LOADED USER DATA:', {
          workout_days: currentUser.workout_days,
          workout_days_selected: currentUser.workout_days_selected
        });
        
        setTrainingData({
          user_id: currentUser.id,
          subscription_plan: currentUser.subscription_plan,
          joint_pain: currentUser.joint_pain || [],
          fitness_experience: currentUser.fitness_experience,
          workout_location: currentUser.workout_location,
          equipment: currentUser.equipment || [],
          workout_days: currentUser.workout_days,
          workout_days_selected: currentUser.workout_days_selected || [],
          session_duration: currentUser.session_duration,
          fitness_goal: currentUser.fitness_goal,
          is_performance_oriented: currentUser.is_performance_oriented ?? null,
          workout_style: currentUser.workout_style,
          sport_specific_data: currentUser.sport_specific_data || {},
          age: currentUser.age,
          gender: currentUser.gender,
          current_weight: currentUser.current_weight,
          strength_level: currentUser.strength_level || 'moderate',
          weight_guidance: currentUser.weight_guidance
        });

        await checkForCheats(currentUser.id);
      } catch (error) {
        if (error?.response?.status === 401 || error?.message?.includes('401')) {
          navigate(createPageUrl("Home"));
        } else {
          console.error("Error loading data:", error);
          navigate(createPageUrl("Home")); // Redirect on other critical errors too
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [checkForCheats, navigate]);

  // ✅ CARICA LOGS PER IL GIORNO CORRENTE (oggi)
  useEffect(() => {
    const loadWorkoutLogs = async () => {
      if (!trainingData.user_id) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const logs = await base44.entities.WorkoutLog.filter({ 
          user_id: trainingData.user_id, 
          date: today 
        });
        
        if (logs.length > 0) {
          // Carica lo stato di completamento
          setWorkoutCompleted(logs[0].completed === true);
          
          if (logs[0].exercises_log) {
            const savedSets = {};
            logs[0].exercises_log.forEach(exLog => {
              savedSets[exLog.exercise_name] = exLog.completed_sets || [];
            });
            setExerciseSets(savedSets);
          }
        } else {
          setExerciseSets({});
          setWorkoutCompleted(false);
        }
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    };
    
    loadWorkoutLogs();
  }, [trainingData.user_id]);

  const checkRemainingGenerations = useCallback(async () => {
    if (!trainingData.user_id || !trainingData.subscription_plan) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const limit = getGenerationLimit(trainingData.subscription_plan, 'workout');

    if (limit === -1) { // Unlimited
      setRemainingGenerations(-1);
      setGenerationLimitReached(false);
      return;
    }

    if (limit === 0) { // No access
      setRemainingGenerations(0);
      setGenerationLimitReached(true);
      return;
    }

    try {
      const [allGenerations, allCredits] = await Promise.all([
        base44.entities.PlanGeneration.list(),
        base44.entities.PlanGenerationCredit.list()
      ]);
      
      const generations = allGenerations.filter(g => 
        g.user_id === trainingData.user_id && 
        g.plan_type === 'workout' && 
        g.generation_month === currentMonth
      );

      const extraCredits = allCredits.filter(c => 
        c.user_id === trainingData.user_id && 
        c.plan_type === 'workout'
      );

      const extraCreditsAvailable = extraCredits
        .filter(c => !c.expiration_month || c.expiration_month >= currentMonth)
        .reduce((sum, c) => sum + c.credits_amount, 0);
      
      console.log(`📊 Workout credits: limit=${limit}, used=${generations.length}, extra=${extraCreditsAvailable}`);

      const used = generations.length;
      const totalLimit = limit + extraCreditsAvailable;
      const remaining = Math.max(0, totalLimit - used);

      setRemainingGenerations(remaining);
      setGenerationLimitReached(remaining === 0);
    } catch (error) {
      console.error('Error checking workout generations:', error);
    }
  }, [trainingData.user_id, trainingData.subscription_plan]);

  useEffect(() => {
    checkRemainingGenerations();
  }, [checkRemainingGenerations]);

  useEffect(() => {
    setAdjustedWorkout(null);
    setAdjustmentResult(null);
  }, [selectedDay]);

  const TRAINING_STEPS = React.useMemo(() => 
    getAllTrainingSteps(trainingData.is_performance_oriented, trainingData.workout_style), 
    [trainingData.is_performance_oriented, trainingData.workout_style]
  );

  const handleStepData = (stepData) => setTrainingData(prev => ({ ...prev, ...stepData }));
  const nextStep = () => { if (currentStep < TRAINING_STEPS.length - 1) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const startGeneration = async () => {
    // Controlla limite generazioni
    if (generationLimitReached && remainingGenerations === 0) {
      setShowAssessment(false);
      setShowUpgradeModal(true);
      return;
    }
    
    // 🔧 DEBUG: Log i dati prima di salvare
    console.log('🚀 START GENERATION - trainingData:', {
      workout_days: trainingData.workout_days,
      workout_days_selected: trainingData.workout_days_selected
    });
    
    await base44.auth.updateMe(trainingData);
    setShowAssessment(false);
    await generateWorkoutPlan();
  };

  // Filtra esercizi dal database per attrezzatura, dolori E OBIETTIVO
  const getAvailableExercises = useCallback(() => {
    if (!allExercises || allExercises.length === 0) return [];
    
    const userEquipment = trainingData.equipment || [];
    const jointPain = trainingData.joint_pain || [];
    const fitnessLevel = trainingData.fitness_experience || 'beginner';
    const fitnessGoal = trainingData.fitness_goal; 

    // Gruppi muscolari da evitare in base ai dolori
    const restrictedMuscleGroups = jointPain.flatMap(pain => 
      JOINT_PAIN_RESTRICTIONS[pain] || []
    );

    return allExercises.filter(exercise => {
      // 1. Filtra per attrezzatura disponibile
      // 'corpo_libero' è sempre disponibile
      if (exercise.equipment !== 'corpo_libero' && !userEquipment.includes(exercise.equipment)) {
        return false;
      }

      // 2. Escludi esercizi che stressano articolazioni doloranti
      const hasRestrictedMuscle = exercise.muscle_groups?.some(mg => 
        restrictedMuscleGroups.some(rmg => mg.toLowerCase().includes(rmg.toLowerCase()))
      );
      if (hasRestrictedMuscle) {
        return false;
      }

      // 3. Filtra per livello di difficoltà (semplificazione, potrebbe essere più granulare)
      // Se l'utente è beginner, non mostriamo esercizi advanced
      if (fitnessLevel === 'beginner' && exercise.difficulty === 'advanced') {
        return false;
      }
      // Se l'utente è intermediate, non mostriamo solo esercizi advanced
      if (fitnessLevel === 'intermediate' && exercise.difficulty === 'advanced') {
        return false;
      }

      // 4. Filtra per obiettivo fitness (soft filter - priorità ma non esclusivo)
      // Se l'utente ha un obiettivo specifico, diamo priorità agli esercizi che lo supportano
      // Ma NON escludiamo completamente gli altri (perché serve varietà e allenamento completo)
      // Questo verrà usato dall'AI per dare priorità, non per escludere
      if (fitnessGoal && exercise.primary_goals && !exercise.primary_goals.includes(fitnessGoal)) {
        // Non escludiamo, ma l'AI riceverà info che questo esercizio non è primario per l'obiettivo
        exercise._is_secondary_for_goal = true;
      } else {
        exercise._is_secondary_for_goal = false;
      }

      return true;
    });
  }, [allExercises, trainingData.equipment, trainingData.joint_pain, trainingData.fitness_experience, trainingData.fitness_goal]);

  // ✅ SALVA IMMEDIATAMENTE SOLO PER OGGI
  const saveWorkoutProgress = useCallback(async (exerciseName, completedSetsArray, totalSets) => {
    if (!trainingData.user_id) return;
    
    // ✅ SALVA SOLO SE STIAMO GUARDANDO IL GIORNO DI OGGI
    const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (selectedDay !== todayOfWeek) {
      console.log('⚠️ Not saving - viewing different day than today');
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const workoutPlan = workoutPlans.find(p => p.day_of_week === todayOfWeek);
      
      const logs = await base44.entities.WorkoutLog.filter({ 
        user_id: trainingData.user_id, 
        date: today 
      });
      
      const isCompleted = completedSetsArray.length === totalSets && totalSets > 0;
      
      if (logs.length === 0) {
        await base44.entities.WorkoutLog.create({
          user_id: trainingData.user_id,
          workout_plan_id: workoutPlan?.id || 'unknown',
          date: today,
          completed: false,
          exercises_log: [{
            exercise_name: exerciseName,
            exercise_key: exerciseName,
            completed_sets: completedSetsArray,
            total_sets: totalSets,
            is_completed: isCompleted
          }]
        });
        console.log('💾 CREATED NEW LOG:', exerciseName, '→', completedSetsArray);
      } else {
        const log = logs[0];
        const exercises = [...(log.exercises_log || [])];
        const idx = exercises.findIndex(e => e.exercise_name === exerciseName);
        
        if (idx >= 0) {
          exercises[idx].completed_sets = completedSetsArray;
          exercises[idx].is_completed = isCompleted;
        } else {
          exercises.push({
            exercise_name: exerciseName,
            exercise_key: exerciseName,
            completed_sets: completedSetsArray,
            total_sets: totalSets,
            is_completed: isCompleted
          });
        }
        
        await base44.entities.WorkoutLog.update(log.id, { exercises_log: exercises });
        console.log('💾 UPDATED LOG:', exerciseName, '→', completedSetsArray);
      }
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  }, [trainingData.user_id, workoutPlans, selectedDay]);

  // ✅ COMPLETA ALLENAMENTO - Salva con completed: true
  const handleCompleteWorkout = async () => {
    if (!trainingData.user_id) return;
    
    const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const workoutPlan = workoutPlans.find(p => p.day_of_week === todayOfWeek);
    
    if (!workoutPlan || workoutPlan.workout_type === 'rest') return;
    
    setIsCompletingWorkout(true);
    
    try {
      const logs = await base44.entities.WorkoutLog.filter({ 
        user_id: trainingData.user_id, 
        date: today 
      });
      
      // Costruisci l'array completo di esercizi
      const exercisesLog = workoutPlan.exercises.map(ex => ({
        exercise_name: ex.name,
        exercise_key: ex.name,
        completed_sets: exerciseSets[ex.name] || Array.from({ length: ex.sets }, (_, i) => i + 1),
        total_sets: ex.sets,
        is_completed: true
      }));
      
      if (logs.length === 0) {
        await base44.entities.WorkoutLog.create({
          user_id: trainingData.user_id,
          workout_plan_id: workoutPlan.id,
          date: today,
          completed: true,
          exercises_log: exercisesLog
        });
      } else {
        await base44.entities.WorkoutLog.update(logs[0].id, { 
          completed: true,
          exercises_log: exercisesLog
        });
      }
      
      setWorkoutCompleted(true);
      
      // Segna tutti gli esercizi come completati nella UI
      const allSets = {};
      workoutPlan.exercises.forEach(ex => {
        allSets[ex.name] = Array.from({ length: ex.sets }, (_, i) => i + 1);
      });
      setExerciseSets(allSets);
      
      alert('🎉 Allenamento completato! Ottimo lavoro!');
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Errore nel salvare il completamento. Riprova.');
    }
    
    setIsCompletingWorkout(false);
  };

  // Ottieni la lingua corrente
  const { language } = useLanguage();
  
  const generateWorkoutPlan = async () => {
    if (!trainingData.user_id) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus(t('workouts.genFilter', { goal: trainingData.fitness_goal }));

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, t('workouts.genDatabase', { count: allExercises.length }));

      // PESCA ESERCIZI DAL DATABASE
      const availableExercises = getAvailableExercises();
      
      if (availableExercises.length === 0) {
        throw new Error("Nessun esercizio disponibile con le tue attrezzature o restrizioni. Riprova modificando le preferenze.");
      }

      const workoutDays = trainingData.workout_days || 3;
      let selectedDays = trainingData.workout_days_selected || [];
      
      // 🔧 FIX: Se selectedDays è vuoto, genera giorni di default basati su workoutDays
      if (selectedDays.length === 0 && workoutDays > 0) {
        const defaultDaysOrder = ['monday', 'wednesday', 'friday', 'tuesday', 'thursday', 'saturday', 'sunday'];
        selectedDays = defaultDaysOrder.slice(0, workoutDays);
        console.log(`⚠️ workout_days_selected era vuoto! Generati giorni di default: ${selectedDays.join(', ')}`);
      }

      console.log(`✅ ${availableExercises.length} esercizi disponibili dal database di ${allExercises.length}`);
      console.log(`📅 Numero giorni workout richiesti: ${workoutDays}`);
      console.log(`📅 Giorni workout selezionati dall'utente: ${selectedDays.join(', ') || 'NESSUNO'}`);
      console.log(`📅 Giorni riposo: ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].filter(d => !selectedDays.includes(d)).join(', ')}`);

      updateProgress(20, t('workouts.genFilter', { goal: trainingData.fitness_goal }));

      // CREA LISTA ESERCIZI FORMATTATA PER L'AI (con nomi nella lingua corretta)
      const exercisesByMuscleGroup = availableExercises.reduce((acc, ex) => {
        ex.muscle_groups.forEach(mg => {
          if (!acc[mg]) acc[mg] = [];
          const isPrimary = !ex._is_secondary_for_goal;
          // Usa la traduzione nella lingua corrente se disponibile
          const exerciseName = ex.name_translations?.[language] || ex.name;
          acc[mg].push({
            name: exerciseName,
            original_name: ex.name, // mantieni anche nome originale per riferimento
            equipment: ex.equipment,
            difficulty: ex.difficulty,
            primary_for_goal: isPrimary,
            description: ex.description,
            name_translations: ex.name_translations
          });
        });
        return acc;
      }, {});

      // Priorità esercizi primari
      const exerciseListForAI = Object.entries(exercisesByMuscleGroup)
        .map(([muscleGroup, exercises]) => {
          const primaryExs = exercises.filter(e => e.primary_for_goal).map(e => `"${e.name}"`).slice(0, 15);
          const secondaryExs = exercises.filter(e => !e.primary_for_goal).map(e => `"${e.name}"`).slice(0, 5); 
          
          let list = `${muscleGroup.toUpperCase()}:\n  PRIMARI per ${trainingData.fitness_goal}: ${primaryExs.join(', ')}`;
          if (secondaryExs.length > 0) {
            list += `\n  SECONDARI: ${secondaryExs.join(', ')}`;
          }
          return list;
        })
        .join('\n\n');

      // Determina la lingua target per la generazione
      const langNames = {
        'it': 'Italian',
        'en': 'English', 
        'es': 'Spanish', 
        'pt': 'Portuguese', 
        'de': 'German', 
        'fr': 'French'
      };
      const targetLanguage = langNames[language] || 'Italian';
      
      // Traduzioni per nomi giorni della settimana
      const dayTranslations = {
        it: { monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì', thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica' },
        en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' },
        es: { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' },
        pt: { monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo' },
        de: { monday: 'Montag', tuesday: 'Dienstag', wednesday: 'Mittwoch', thursday: 'Donnerstag', friday: 'Freitag', saturday: 'Samstag', sunday: 'Sonntag' },
        fr: { monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' }
      };
      
      // Termini comuni tradotti
      const termTranslations = {
        it: { warmup: 'Riscaldamento', cooldown: 'Defaticamento', rest: 'Recupero Attivo', sets: 'serie', reps: 'ripetizioni', seconds: 'secondi', minutes: 'minuti', lightJog: 'Corsa Leggera', dynamicStretch: 'Stretching Dinamico', staticStretch: 'Stretching Statico', finalRelax: 'Rilassamento Finale', mobilityWork: 'Mobilità Articolare' },
        en: { warmup: 'Warm-up', cooldown: 'Cool-down', rest: 'Active Recovery', sets: 'sets', reps: 'reps', seconds: 'seconds', minutes: 'minutes', lightJog: 'Light Jogging', dynamicStretch: 'Dynamic Stretching', staticStretch: 'Static Stretching', finalRelax: 'Final Relaxation', mobilityWork: 'Joint Mobility' },
        es: { warmup: 'Calentamiento', cooldown: 'Enfriamiento', rest: 'Recuperación Activa', sets: 'series', reps: 'repeticiones', seconds: 'segundos', minutes: 'minutos', lightJog: 'Trote Ligero', dynamicStretch: 'Estiramiento Dinámico', staticStretch: 'Estiramiento Estático', finalRelax: 'Relajación Final', mobilityWork: 'Movilidad Articular' },
        pt: { warmup: 'Aquecimento', cooldown: 'Resfriamento', rest: 'Recuperação Ativa', sets: 'séries', reps: 'repetições', seconds: 'segundos', minutes: 'minutos', lightJog: 'Corrida Leve', dynamicStretch: 'Alongamento Dinâmico', staticStretch: 'Alongamento Estático', finalRelax: 'Relaxamento Final', mobilityWork: 'Mobilidade Articular' },
        de: { warmup: 'Aufwärmen', cooldown: 'Abkühlen', rest: 'Aktive Erholung', sets: 'Sätze', reps: 'Wiederholungen', seconds: 'Sekunden', minutes: 'Minuten', lightJog: 'Leichtes Joggen', dynamicStretch: 'Dynamisches Dehnen', staticStretch: 'Statisches Dehnen', finalRelax: 'Abschlussentspannung', mobilityWork: 'Gelenksmobilität' },
        fr: { warmup: 'Échauffement', cooldown: 'Récupération', rest: 'Récupération Active', sets: 'séries', reps: 'répétitions', seconds: 'secondes', minutes: 'minutes', lightJog: 'Jogging Léger', dynamicStretch: 'Étirement Dynamique', staticStretch: 'Étirement Statique', finalRelax: 'Relaxation Finale', mobilityWork: 'Mobilité Articulaire' }
      };
      
      const terms = termTranslations[language] || termTranslations.it;

      const workoutPlanPrompt = `You are a world-class AI personal trainer, physical therapist, and motivational coach. Create a hyper-personalized, 7-day weekly workout plan. You MUST select exercises ONLY from the provided database.

CRITICAL RULES:
1. Generate ALL content in ${targetLanguage.toUpperCase()} language. ALL text including plan names, warm-up names, cool-down names, descriptions, reps format, rest format MUST be in ${targetLanguage}.
2. ONLY use exercise names from this database - DO NOT invent new names. Use the name_translations.${language} field if available for exercise names in ${targetLanguage}.
3. PRIORITIZE "PRIMARI" exercises for user's goal: ${trainingData.fitness_goal}
4. You can use "SECONDARI" exercises for variety, but focus on PRIMARI for the main lifts/movements.
5. ADAPT the workout structure to match the preferred training style: ${trainingData.workout_style || 'standard'}
6. MANDATORY WORKOUT DAYS: The user has selected ${selectedDays.join(', ')} as their workout days. YOU MUST create a full workout plan for these days. ALL OTHER DAYS must be rest days. Do NOT assign rest days on the user's selected workout days.

EXERCISE DATABASE (${availableExercises.length} available):
${exerciseListForAI}

User Profile & Vitals:
- Age: ${trainingData.age}, Gender: ${trainingData.gender}, Weight: ${trainingData.current_weight}kg
- Primary Fitness Goal: ${trainingData.fitness_goal}
- PREFERRED TRAINING STYLE: ${trainingData.workout_style || 'not specified'} - ADAPT the workout plan to match this style's characteristics, tempo, exercise selection, and rep ranges.
${trainingData.sport_specific_data && Object.keys(trainingData.sport_specific_data).length > 0 ? `- SPORT-SPECIFIC DATA: ${JSON.stringify(trainingData.sport_specific_data)} - USE THIS DATA TO CALIBRATE WEIGHTS, INTENSITIES, AND EXERCISE SELECTION PRECISELY` : ''}
- Experience: ${trainingData.fitness_experience}
- Workout Location: ${trainingData.workout_location}
- Available Equipment: ${trainingData.equipment?.join(', ') || 'none'}. Use ONLY exercises that require this equipment or bodyweight.
- Joint Pain/Limitations: ${trainingData.joint_pain?.join(', ') || 'none'}. Do NOT include exercises that stress these joints.
- Desired workouts per week: ${workoutDays}
- Specific days selected: ${selectedDays.length > 0 ? selectedDays.join(', ') : 'any ' + workoutDays + ' days'}
- Preferred session duration: ${trainingData.session_duration}

TRAINING STYLE GUIDELINES:
${trainingData.workout_style ? `- The user wants a ${trainingData.workout_style} style workout. Adapt exercise selection, set/rep schemes, rest periods, and workout structure to match this style's principles and methodology.` : ''}

GOAL-SPECIFIC GUIDELINES:
${trainingData.fitness_goal === 'forza_massimale' ? '- Focus: Heavy compound lifts, 3-6 reps, 3-5 sets, 3-5 min rest. Progressive overload is key.' : ''}
${trainingData.fitness_goal === 'ipertrofia' ? '- Focus: 8-12 reps, 3-4 sets, 60-90 sec rest, mix compound + isolation. Emphasize muscle fatigue.' : ''}
${trainingData.fitness_goal === 'dimagrimento' ? '- Focus: High volume, 12-15 reps, supersets, minimal rest, consider adding short cardio bursts. Maximize calorie expenditure.' : ''}
${trainingData.fitness_goal === 'resistenza' ? '- Focus: 15-20 reps, circuit training, minimal rest, higher frequency workouts, include bodyweight and cardio elements.' : ''}
${trainingData.fitness_goal === 'esplosivita' ? '- Focus: Plyometric exercises, explosive movements, 3-6 reps, full recovery between sets. Prioritize speed and power.' : ''}
${trainingData.fitness_goal === 'mobilita' ? '- Focus: Dynamic stretching, mobility drills, controlled movements, incorporate yoga/pilates style exercises. Improve range of motion.' : ''}
${trainingData.fitness_goal === 'tonificazione' ? '- Focus: 10-15 reps, moderate weight, focus on form and muscle activation, incorporate supersets for higher intensity.' : ''}

WEIGHT/INTENSITY GUIDELINES (CRITICAL - MUST INCLUDE FOR EVERY EXERCISE):
- FOR EVERY EXERCISE you MUST provide 'intensity_tips' array with 2-4 specific load/intensity recommendations IN ITALIAN
- User weight: ${trainingData.current_weight || 'unknown'}kg - use this to estimate appropriate loads where relevant
- User strength level: ${trainingData.strength_level || 'moderate'} - ${trainingData.weight_guidance || 'Use moderate weights'}

STRENGTH LEVEL WEIGHT RECOMMENDATIONS:
${trainingData.strength_level === 'never_lifted' ? '- User is a COMPLETE BEGINNER: Suggest bodyweight only or very light weights (1-3kg dumbbells max). Focus on form over weight.' : ''}
${trainingData.strength_level === 'light' ? '- User lifts LIGHT weights: Suggest 4-8kg dumbbells, 10-25kg barbells. Emphasize controlled movements.' : ''}
${trainingData.strength_level === 'moderate' ? '- User lifts MODERATE weights: Suggest 8-15kg dumbbells, 30-50kg barbells, machine weights accordingly.' : ''}
${trainingData.strength_level === 'intermediate' ? '- User is INTERMEDIATE: Can handle significant weights. Suggest 70-75% of typical maxes. Squat ~60-80kg, Bench ~50-70kg.' : ''}
${trainingData.strength_level === 'advanced' ? '- User is ADVANCED: Calculate weights as percentages of 1RM. They know their maxes. Suggest RPE-based loading.' : ''}

${trainingData.sport_specific_data ? `
- If user provided MAX LIFTS (squat_max, deadlift_max, bench_max, etc.): Calculate working weights as percentages. Example: if squat_max=100kg, use 80kg for 5x5 strength work (80%), 65kg for 3x12 hypertrophy (65%), etc.
- CRITICAL: If user specified WEAK PHASES of lifts (e.g., squat_weak_phase="Uscita dalla buca"): 
  * Include ACCESSORY EXERCISES that target that specific phase
  * In the main lift's 'description' field, provide TECHNICAL CUES in Italian focused on that weak phase
  * Add tempo variations to address the weak phase
- If user provided performance times (100m, 500m row, etc.): Use these as benchmarks for interval work and progression targets.
- For bodyweight exercises: If user gave max reps, adjust set/rep schemes accordingly.
` : ''}

🚨🚨🚨 INTENSITY TIPS - ABSOLUTELY MANDATORY FOR EVERY SINGLE EXERCISE 🚨🚨🚨

EVERY exercise object MUST contain an "intensity_tips" array with 2-3 strings in Italian.
WITHOUT intensity_tips, the exercise is INVALID and will be rejected.

Examples of valid intensity_tips arrays:
- For Squat: ["Usa il 70-75% del tuo massimale", "RPE 7-8: dovresti riuscire a fare altre 2-3 ripetizioni", "Le ultime 2 ripetizioni devono essere impegnative"]
- For Flessioni: ["Se troppo facile, rallenta la discesa a 3 secondi", "Dovresti sentire bruciore muscolare nelle ultime 3-4 ripetizioni"]  
- For Plank: ["Quando inizi a tremare, hai raggiunto l'intensità giusta", "Se riesci a tenere oltre 60 sec, aggiungi peso sulla schiena"]

RULES by exercise type:
1. WEIGHTED (bilanciere, manubri, macchine): Use % of 1RM or RPE scale
2. BODYWEIGHT (flessioni, trazioni): How to increase/decrease difficulty
3. CARDIO/HIIT: Heart rate zones or perceived exertion
4. ISOMETRIC (plank, wall sit): Duration progression and form cues

CRITICAL REQUIREMENTS:
1. You MUST create EXACTLY 7 workout plans, one for each day: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" (all lowercase).
2. EVERY workout plan MUST have a "day_of_week" field with one of these exact values: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
3. USER'S WORKOUT SCHEDULE - THIS IS ABSOLUTELY CRITICAL:
${selectedDays.length > 0 ? `
   🚨🚨🚨 CRITICAL REQUIREMENT 🚨🚨🚨
   
   THE USER HAS SELECTED EXACTLY ${selectedDays.length} WORKOUT DAYS: ${selectedDays.map(d => d.toUpperCase()).join(', ')}
   
   YOU MUST CREATE A FULL WORKOUT (with exercises, warm_up, cool_down, workout_type NOT "rest") FOR EACH OF THESE DAYS:
   ${selectedDays.map(d => `- ${d.toUpperCase()}: MUST BE A FULL WORKOUT (NOT REST)`).join('\n   ')}
   
   REST DAYS (workout_type: "rest", empty exercises array) ARE ONLY FOR:
   ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].filter(d => !selectedDays.includes(d)).map(d => `- ${d.toUpperCase()}: REST DAY`).join('\n   ') || '   - NONE (all days are workout days)'}
   
   ❌ FAILURE CONDITIONS - DO NOT DO THIS:
   - DO NOT make ${selectedDays.map(d => d.toUpperCase()).join(' or ')} a rest day
   - DO NOT skip any of the ${selectedDays.length} selected workout days
   - The user MUST have exactly ${selectedDays.length} workout days with exercises
` : `
   The user wants ${workoutDays} workout days total. Choose ${workoutDays} days from Monday to Friday for workouts, keeping Saturday and Sunday as rest days if possible.
`}
4. For workout days: provide 'plan_name' (in ${targetLanguage}), 'workout_type', 'warm_up' array (in ${targetLanguage}), 'exercises' array (in ${targetLanguage}), 'cool_down' array (in ${targetLanguage}), 'total_duration', 'calories_burned', 'difficulty_level'.
5. For rest days: provide 'plan_name' (e.g., "${terms.rest}"), 'workout_type': "rest", 'warm_up': [], 'exercises': [], 'cool_down': [], 'total_duration': 0, 'calories_burned': 0, 'difficulty_level': "easy".
6. Each exercise name MUST be in ${targetLanguage}. Use the name_translations.${language} field from the database when available. DO NOT invent exercises.
7. 'reps' field must be in ${targetLanguage} format (e.g., "12 ${terms.reps}", "10-12 ${terms.reps}", "30 ${terms.seconds}").
8. 'rest' field must be in ${targetLanguage} (e.g., "60 ${terms.seconds}", "90 ${terms.seconds}", "2 ${terms.minutes}").
9. 'difficulty_level' must be one of: "beginner", "intermediate", "advanced" (in English).
10. 'description' field for each exercise should include execution tips.
11. CRITICAL: 'intensity_tips' array is MANDATORY for EVERY exercise - provide 2-4 specific load/intensity recommendations following the INTENSITY TIPS RULES above.
12. Don't train the same muscle groups on consecutive workout days.
13. Ensure variety and progressive overload where appropriate for the user's fitness level and goal.
`;

      updateProgress(40, t('workouts.genSelection'));

      // Aggiungi istruzione finale al prompt per garantire 7 piani
      const finalPrompt = workoutPlanPrompt + `

      FINAL REMINDER - ABSOLUTELY CRITICAL:
      You MUST return EXACTLY 7 workout plans in the "workout_plans" array, one for EACH day:
      1. monday
      2. tuesday  
      3. wednesday
      4. thursday
      5. friday
      6. saturday
      7. sunday

      DO NOT skip any day. Every single day must have a plan object.`;

      let response;
      try {
        response = await base44.integrations.Core.InvokeLLM({
          prompt: finalPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              workout_plans: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day_of_week: { 
                      type: "string", 
                      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
                      description: "REQUIRED: Must be one of the 7 days of the week"
                    },
                    plan_name: { type: "string" },
                    workout_type: { type: "string" },
                    exercises: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          name: { type: "string" }, 
                          sets: { type: "number" }, 
                          reps: { type: "string" }, 
                          rest: { type: "string" },
                          description: { type: "string" },
                          muscle_groups: {
                            type: "array",
                            items: { type: "string" },
                            description: "Gruppi muscolari principali"
                          },
                          difficulty: {
                            type: "string",
                            enum: ["beginner", "intermediate", "advanced"]
                          },
                          intensity_tips: {
                            type: "array",
                            items: { type: "string" },
                            minItems: 2,
                            maxItems: 4,
                            description: "OBBLIGATORIO: 2-4 consigli specifici sul carico/intensità in italiano (es: 'Usa il 70% del massimale', 'RPE 7-8')"
                          }
                        },
                        required: ["name", "sets", "reps", "rest", "intensity_tips", "muscle_groups", "difficulty"]
                      } 
                    },
                    warm_up: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          name: { type: "string" }, 
                          duration: { type: "string" },
                          description: { type: "string" }
                        },
                        required: ["name", "duration"]
                      } 
                    },
                    cool_down: { 
                      type: "array", 
                      items: { 
                        type: "object", 
                        properties: { 
                          name: { type: "string" }, 
                          duration: { type: "string" },
                          description: { type: "string" }
                        },
                        required: ["name", "duration"]
                      } 
                    },
                    total_duration: { type: "number" },
                    calories_burned: { type: "number" },
                    difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                  },
                  required: ["day_of_week", "plan_name", "workout_type", "exercises", "warm_up", "cool_down", "total_duration", "calories_burned", "difficulty_level"]
                }
              }
            },
            required: ["workout_plans"]
          }
        });
      } catch (llmError) {
        console.error('❌ Errore LLM:', llmError);
        // Se l'LLM fallisce, creiamo una risposta vuota che verrà completata dopo
        response = { workout_plans: [] };
      }

      updateProgress(60, t('workouts.genValidation'));

      // Inizializza l'array se non esiste
      if (!response.workout_plans) {
        response.workout_plans = [];
      }

      console.log(`🔍 AI ha restituito ${response.workout_plans.length} piani. Giorni: ${response.workout_plans.map(p => p.day_of_week).join(', ')}`);

      // Se l'AI non ha generato 7 piani, completiamo automaticamente i mancanti
      if (response.workout_plans.length < 7) {
        console.warn(`⚠️ L'AI ha generato solo ${response.workout_plans.length} piani. Completamento automatico...`);

        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const existingDays = response.workout_plans.map(p => p.day_of_week);
        const missingDays = allDays.filter(d => !existingDays.includes(d));

        console.log(`📅 Giorni mancanti: ${missingDays.join(', ')}`);

        // Trova un template workout esistente
        const templateWorkout = response.workout_plans.find(p => p.workout_type !== 'rest' && p.exercises?.length > 0);

        // Se non c'è nessun template, creiamo un workout base nella lingua corretta
        const defaultExercisesTranslations = {
          it: [
            { name: "Flessioni", sets: 3, reps: "10-15 ripetizioni", rest: "60 secondi", description: "Esercizio per petto e tricipiti" },
            { name: "Squat a Corpo Libero", sets: 3, reps: "15 ripetizioni", rest: "60 secondi", description: "Esercizio per gambe e glutei" },
            { name: "Plank", sets: 3, reps: "30 secondi", rest: "45 secondi", description: "Esercizio per core" }
          ],
          en: [
            { name: "Push-ups", sets: 3, reps: "10-15 reps", rest: "60 seconds", description: "Exercise for chest and triceps" },
            { name: "Bodyweight Squat", sets: 3, reps: "15 reps", rest: "60 seconds", description: "Exercise for legs and glutes" },
            { name: "Plank", sets: 3, reps: "30 seconds", rest: "45 seconds", description: "Core exercise" }
          ],
          es: [
            { name: "Flexiones", sets: 3, reps: "10-15 repeticiones", rest: "60 segundos", description: "Ejercicio para pecho y tríceps" },
            { name: "Sentadilla", sets: 3, reps: "15 repeticiones", rest: "60 segundos", description: "Ejercicio para piernas y glúteos" },
            { name: "Plancha", sets: 3, reps: "30 segundos", rest: "45 segundos", description: "Ejercicio para core" }
          ],
          pt: [
            { name: "Flexões", sets: 3, reps: "10-15 repetições", rest: "60 segundos", description: "Exercício para peito e tríceps" },
            { name: "Agachamento", sets: 3, reps: "15 repetições", rest: "60 segundos", description: "Exercício para pernas e glúteos" },
            { name: "Prancha", sets: 3, reps: "30 segundos", rest: "45 segundos", description: "Exercício para core" }
          ],
          de: [
            { name: "Liegestütze", sets: 3, reps: "10-15 Wiederholungen", rest: "60 Sekunden", description: "Übung für Brust und Trizeps" },
            { name: "Kniebeugen", sets: 3, reps: "15 Wiederholungen", rest: "60 Sekunden", description: "Übung für Beine und Gesäß" },
            { name: "Unterarmstütz", sets: 3, reps: "30 Sekunden", rest: "45 Sekunden", description: "Core-Übung" }
          ],
          fr: [
            { name: "Pompes", sets: 3, reps: "10-15 répétitions", rest: "60 secondes", description: "Exercice pour pectoraux et triceps" },
            { name: "Squat", sets: 3, reps: "15 répétitions", rest: "60 secondes", description: "Exercice pour jambes et fessiers" },
            { name: "Gainage", sets: 3, reps: "30 secondes", rest: "45 secondes", description: "Exercice pour le core" }
          ]
        };
        const defaultExercises = defaultExercisesTranslations[language] || defaultExercisesTranslations.it;

        for (const day of missingDays) {
          const isWorkoutDay = selectedDays.includes(day);

          // Nomi giorni e termini nella lingua corretta
          const dayName = dayTranslations[language]?.[day] || day;
          const workoutLabel = { it: 'Allenamento', en: 'Workout', es: 'Entrenamiento', pt: 'Treino', de: 'Training', fr: 'Entraînement' }[language] || 'Allenamento';
          const warmupItems = {
            it: [{ name: "Corsa sul posto", duration: "3 minuti", description: "Riscaldamento cardio" }],
            en: [{ name: "Jogging in Place", duration: "3 minutes", description: "Cardio warmup" }],
            es: [{ name: "Trote en el Lugar", duration: "3 minutos", description: "Calentamiento cardio" }],
            pt: [{ name: "Corrida no Lugar", duration: "3 minutos", description: "Aquecimento cardio" }],
            de: [{ name: "Joggen auf der Stelle", duration: "3 Minuten", description: "Cardio Aufwärmen" }],
            fr: [{ name: "Course sur Place", duration: "3 minutes", description: "Échauffement cardio" }]
          };
          const cooldownItems = {
            it: [{ name: "Stretching", duration: "5 minuti", description: "Defaticamento" }],
            en: [{ name: "Stretching", duration: "5 minutes", description: "Cool down" }],
            es: [{ name: "Estiramiento", duration: "5 minutos", description: "Enfriamiento" }],
            pt: [{ name: "Alongamento", duration: "5 minutos", description: "Resfriamento" }],
            de: [{ name: "Dehnen", duration: "5 Minuten", description: "Abkühlen" }],
            fr: [{ name: "Étirement", duration: "5 minutes", description: "Récupération" }]
          };
          
          if (isWorkoutDay) {
            if (templateWorkout) {
              // Crea un workout basato sul template
              response.workout_plans.push({
                day_of_week: day,
                plan_name: `${workoutLabel} ${dayName}`,
                workout_type: templateWorkout.workout_type,
                exercises: [...templateWorkout.exercises],
                warm_up: [...(templateWorkout.warm_up || [])],
                cool_down: [...(templateWorkout.cool_down || [])],
                total_duration: templateWorkout.total_duration,
                calories_burned: templateWorkout.calories_burned,
                difficulty_level: templateWorkout.difficulty_level
              });
            } else {
              // Crea un workout base di fallback
              response.workout_plans.push({
                day_of_week: day,
                plan_name: `${workoutLabel} ${dayName}`,
                workout_type: 'strength',
                exercises: defaultExercises,
                warm_up: warmupItems[language] || warmupItems.it,
                cool_down: cooldownItems[language] || cooldownItems.it,
                total_duration: 45,
                calories_burned: 300,
                difficulty_level: trainingData.fitness_experience || 'beginner'
              });
            }
            console.log(`✅ Aggiunto workout per ${day}`);
          } else {
            // Crea un giorno di riposo
            response.workout_plans.push({
              day_of_week: day,
              plan_name: terms.rest,
              workout_type: 'rest',
              exercises: [],
              warm_up: [],
              cool_down: [],
              total_duration: 0,
              calories_burned: 0,
              difficulty_level: 'easy'
            });
            console.log(`✅ Aggiunto riposo per ${day}`);
          }
        }
      }

      // Valida che i giorni selezionati abbiano workout e non riposo
      const workoutDaysGenerated = response.workout_plans.filter(p => p.workout_type !== 'rest').map(p => p.day_of_week);
      const restDaysGenerated = response.workout_plans.filter(p => p.workout_type === 'rest').map(p => p.day_of_week);
      
      console.log(`📋 AI ha generato workout per: ${workoutDaysGenerated.join(', ')}`);
      console.log(`📋 AI ha generato riposo per: ${restDaysGenerated.join(', ')}`);
      
      // Verifica se l'AI ha rispettato i giorni selezionati
      const missingWorkoutDays = selectedDays.filter(d => !workoutDaysGenerated.includes(d));
      if (missingWorkoutDays.length > 0) {
        console.warn(`⚠️ L'AI ha mancato questi giorni workout: ${missingWorkoutDays.join(', ')}. Correggo automaticamente...`);
        
        // Correggi automaticamente: per ogni giorno mancante, cambia il tipo da rest a workout
        for (const plan of response.workout_plans) {
          if (missingWorkoutDays.includes(plan.day_of_week) && plan.workout_type === 'rest') {
            console.log(`🔧 Correzione: ${plan.day_of_week} da rest a workout`);
            // Trova un workout esistente da copiare come template
            const templateWorkout = response.workout_plans.find(p => p.workout_type !== 'rest' && p.exercises?.length > 0);
            if (templateWorkout) {
              plan.workout_type = templateWorkout.workout_type;
              plan.exercises = [...templateWorkout.exercises];
              plan.warm_up = [...(templateWorkout.warm_up || [])];
              plan.cool_down = [...(templateWorkout.cool_down || [])];
              plan.total_duration = templateWorkout.total_duration;
              plan.calories_burned = templateWorkout.calories_burned;
              plan.difficulty_level = templateWorkout.difficulty_level;
              plan.plan_name = `Allenamento ${plan.day_of_week.charAt(0).toUpperCase() + plan.day_of_week.slice(1)}`;
            }
          }
        }
      }

      const allExerciseNamesFromDB = new Set(availableExercises.map(e => e.name.toLowerCase()));
      
      let invalidExercisesCount = 0;
      for (const plan of response.workout_plans) {
        if (plan.exercises && Array.isArray(plan.exercises)) {
          for (const exercise of plan.exercises) {
            if (!allExerciseNamesFromDB.has(exercise.name.toLowerCase())) {
              console.warn(`⚠️ Esercizio "${exercise.name}" non trovato nel database o non è tra quelli disponibili. L'AI ha allucinazioni?`);
              invalidExercisesCount++;
            }
          }
        }
      }

      if (invalidExercisesCount > 0) {
        console.warn(`⚠️ L'AI ha suggerito ${invalidExercisesCount} esercizi che non erano nel database o non erano disponibili. Si consiglia di rigenerare il piano.`);
      } else {
        console.log(`✅ Tutti gli esercizi provengono dal database!`);
      }

      // 🔧 VALIDAZIONE FINALE: Assicuriamoci di avere esattamente 7 piani
      if (response.workout_plans.length !== 7) {
        console.error(`❌ ERRORE: Dopo il completamento abbiamo ${response.workout_plans.length} piani invece di 7!`);
        console.log(`📋 Piani esistenti: ${response.workout_plans.map(p => p.day_of_week).join(', ')}`);
      } else {
        console.log(`✅ VALIDAZIONE OK: 7 piani generati correttamente`);
        console.log(`📋 Giorni con workout: ${response.workout_plans.filter(p => p.workout_type !== 'rest').map(p => p.day_of_week).join(', ')}`);
        console.log(`📋 Giorni di riposo: ${response.workout_plans.filter(p => p.workout_type === 'rest').map(p => p.day_of_week).join(', ')}`);
      }

      // 🔧 POST-PROCESSING FINALE: Aggiungi intensity_tips a TUTTI gli esercizi PRIMA di salvare
      console.log('🔧 POST-PROCESSING: Verifico intensity_tips per tutti gli esercizi...');
      let tipsAdded = 0;
      const strengthLevel = trainingData.strength_level || 'moderate';
      
      // Pesi consigliati in base al livello
      const weightsByLevel = {
        never_lifted: { dumbbell: '1-3kg', barbell: 'solo bilanciere scarico (10-15kg)', machine: 'carico minimo' },
        light: { dumbbell: '4-8kg', barbell: '15-25kg', machine: '20-35kg' },
        moderate: { dumbbell: '8-15kg', barbell: '30-50kg', machine: '40-60kg' },
        intermediate: { dumbbell: '12-20kg', barbell: '50-80kg', machine: '60-90kg' },
        advanced: { dumbbell: '18-30kg', barbell: '70-120kg', machine: '80-120kg' }
      };
      const userWeights = weightsByLevel[strengthLevel] || weightsByLevel.moderate;
      
      for (const plan of response.workout_plans) {
        if (plan.exercises && Array.isArray(plan.exercises)) {
          for (const exercise of plan.exercises) {
            // SEMPRE aggiungi intensity_tips se mancanti o vuoti
            if (!exercise.intensity_tips || !Array.isArray(exercise.intensity_tips) || exercise.intensity_tips.length === 0) {
              tipsAdded++;
              const exerciseNameLower = (exercise.name || '').toLowerCase();
              const equipmentLower = (exercise.equipment || '').toLowerCase();
              
              // Determina tipo esercizio
              const isWeighted = ['bilanciere', 'manubri', 'manubrio', 'kettlebell', 'macchina', 'cable', 'cavo', 'press', 'curl', 'row', 'leg'].some(eq => 
                exerciseNameLower.includes(eq) || equipmentLower.includes(eq)
              );
              const isBodyweight = ['flessioni', 'piegamenti', 'trazioni', 'dip', 'push-up', 'pull-up', 'crunch', 'sit-up', 'squat a corpo'].some(kw => 
                exerciseNameLower.includes(kw)
              );
              const isIsometric = ['plank', 'isometr', 'hold', 'tenuta', 'wall sit'].some(kw => 
                exerciseNameLower.includes(kw)
              );
              const isExplosive = ['jump', 'box', 'salto', 'thruster', 'clean', 'snatch', 'swing', 'burpee', 'corda', 'battle'].some(kw => 
                exerciseNameLower.includes(kw)
              );
              const isLunge = ['affond', 'lunge', 'camminat'].some(kw => 
                exerciseNameLower.includes(kw)
              );
              const isDumbbell = exerciseNameLower.includes('manubr');
              const isBarbell = exerciseNameLower.includes('bilanciere');
              const isMachine = exerciseNameLower.includes('macchina') || exerciseNameLower.includes('leg press') || exerciseNameLower.includes('cable');
              
              // Assegna tips specifici CON PESI CONCRETI
              if (isIsometric) {
                exercise.intensity_tips = [
                  "⏱️ Tieni per 30-45 secondi per serie",
                  "💪 Quando inizi a tremare, l'intensità è giusta",
                  "⬆️ Se troppo facile, aggiungi peso sulla schiena"
                ];
              } else if (isExplosive) {
                exercise.intensity_tips = [
                  "⚡ Concentrati su velocità e potenza esplosiva",
                  "😤 Recupera 90-120 sec tra le serie",
                  "📉 Se perdi velocità, riduci le ripetizioni"
                ];
              } else if (isDumbbell) {
                exercise.intensity_tips = [
                  `🏋️ Usa manubri da ${userWeights.dumbbell} per lato`,
                  "🔥 Le ultime 2-3 reps devono essere impegnative",
                  "📊 RPE 7-8: potresti fare ancora 2-3 reps"
                ];
              } else if (isBarbell) {
                exercise.intensity_tips = [
                  `🏋️ Carica il bilanciere con ${userWeights.barbell} totali`,
                  "🔥 Le ultime 2-3 reps devono essere dure",
                  "📊 RPE 7-8: dovresti poter fare ancora 2-3 reps"
                ];
              } else if (isMachine) {
                exercise.intensity_tips = [
                  `🏋️ Imposta la macchina su ${userWeights.machine}`,
                  "🔥 Le ultime 2-3 reps devono essere impegnative",
                  "⚙️ Regola il sedile per la tua altezza"
                ];
              } else if (isBodyweight) {
                exercise.intensity_tips = [
                  "⏱️ Se troppo facile, rallenta la discesa a 3 secondi",
                  "🔥 Senti bruciore nelle ultime 3-4 ripetizioni",
                  "✅ Mantieni forma perfetta, riduci reps se necessario"
                ];
              } else if (isLunge) {
                exercise.intensity_tips = [
                  `🏋️ Usa manubri da ${userWeights.dumbbell} per lato`,
                  "🦵 Piega entrambe le ginocchia a 90 gradi",
                  "⚖️ Mantieni il busto eretto"
                ];
              } else {
                exercise.intensity_tips = [
                  "💪 Scegli un carico che renda le ultime reps dure",
                  "📊 RPE 7-8: dovresti poter fare ancora 2-3 reps",
                  "✅ Riduci il carico se la forma peggiora"
                ];
              }
            }
            
            // Assicurati che muscle_groups e difficulty siano presenti
            if (!exercise.muscle_groups || !Array.isArray(exercise.muscle_groups)) {
              exercise.muscle_groups = [];
            }
            if (!exercise.difficulty) {
              exercise.difficulty = trainingData.fitness_experience || 'intermediate';
            }
          }
        }
      }
      
      console.log(`✅ POST-PROCESSING COMPLETATO: Aggiunti intensity_tips a ${tipsAdded} esercizi con pesi per livello ${strengthLevel}`);

      updateProgress(75, t('workouts.genBuilding'));
      
      // ✅ FIX: Fetch TUTTI i piani esistenti per l'utente e cancellali
      // Usa list() senza filtro e poi filtra client-side per evitare problemi RLS
      const allPlans = await base44.entities.WorkoutPlan.list();
      const existingPlans = allPlans.filter(p => p.user_id === trainingData.user_id);
      console.log(`🗑️ Found ${existingPlans.length} existing workout plans to delete (from ${allPlans.length} total)`);
      
      // Cancella tutti i piani esistenti per questo utente
      const deletePromises = existingPlans.map(async (plan) => {
        try {
          await base44.entities.WorkoutPlan.delete(plan.id);
          console.log(`✅ Deleted workout plan ${plan.id} (${plan.day_of_week})`);
          return true;
        } catch (deleteError) {
          console.warn(`⚠️ Could not delete workout plan ${plan.id}:`, deleteError);
          return false;
        }
      });
      
      await Promise.all(deletePromises);
      console.log(`🧹 Cleanup complete, proceeding to create new plans...`);

      updateProgress(85, t('workouts.genBuilding'));

      for (const workoutData of response.workout_plans) {
        if (!workoutData.day_of_week) {
          console.error("Missing day_of_week in workout plan:", workoutData);
          continue;
        }
        
        // 🔧 DEBUG: Verifica che intensity_tips siano presenti prima del salvataggio
        if (workoutData.exercises?.length > 0) {
          console.log(`📦 Saving ${workoutData.day_of_week} with ${workoutData.exercises.length} exercises`);
          console.log(`📦 First exercise intensity_tips:`, workoutData.exercises[0]?.intensity_tips);
        }
        
        await createWorkoutMutation.mutateAsync({ 
          user_id: trainingData.user_id, 
          ...workoutData 
        });
      }

      updateProgress(100, t('workouts.loadingTitle'));
      
      // Registra la generazione
      const currentMonth = new Date().toISOString().slice(0, 7);
      await base44.entities.PlanGeneration.create({
        user_id: trainingData.user_id,
        plan_type: 'workout',
        generation_month: currentMonth,
        subscription_plan: trainingData.subscription_plan
      });
      
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      
      // Aggiorna contatore generazioni
      await checkRemainingGenerations();

      setExerciseSets({});

      setTimeout(() => setIsGenerating(false), 1500);

    } catch (error) {
      console.error("Error generating workout plan:", error);
      setGenerationStatus(`Errore: ${error.message}. Riprova.`);
      setTimeout(() => setIsGenerating(false), 3000);
    }
  };

  const handleDailyAdjustment = async () => {
    const selectedDayWorkout = workoutPlans.find(plan => plan.day_of_week === selectedDay);
    if (!adjustmentProblem || !selectedDayWorkout) return;

    setIsAdjusting(true);
    setAdjustmentResult(null);
    
    try {
      const availableExercises = getAvailableExercises();
      const primaryExercises = availableExercises.filter(e => !e._is_secondary_for_goal);
      const exerciseNames = primaryExercises.map(e => `"${e.name}"`).join(', ');

      // Determina la lingua dell'utente
      const userLang = t('common.lang') || 'it';
      const langNames = {
        'it': 'Italian',
        'en': 'English', 
        'es': 'Spanish', 
        'pt': 'Portuguese', 
        'de': 'German', 
        'fr': 'French'
      };
      const targetLanguage = langNames[userLang] || 'Italian';

      const adjustmentPrompt = `You are an expert AI personal trainer and physical therapist. A user needs an immediate adjustment to their workout for today due to a specific issue.

CRITICAL: Generate ALL content in ${targetLanguage}. Exercise names MUST come ONLY from this database of primary exercises for the user's goal:
${exerciseNames}

User Profile: Age ${trainingData.age}, ${trainingData.gender}, Fitness Experience: ${trainingData.fitness_experience}, Fitness Goal: ${trainingData.fitness_goal}
Today's Original Workout Plan: ${JSON.stringify(selectedDayWorkout)}

User's Reported Problem TODAY: "${adjustmentProblem}"

Your Task:
1. Provide empathetic and actionable advice in ${targetLanguage} in a 'consiglio_esperto' field (string, markdown format).
2. Analyze the original workout and the user's problem. Create a NEW, modified list of 'esercizi_modificati' with exercise names. Use your knowledge of exercises, ensuring they are safe and adhere to the user's available equipment: ${trainingData.equipment?.join(', ') || 'bodyweight'}. These exercises should work around the user's problem and MUST be selected ONLY from the provided database. For each exercise, provide name, sets, reps (in ${targetLanguage} like "10 repetitions" or "10 ripetizioni"), and rest (in ${targetLanguage} like "60 seconds" or "60 secondi"). If a safe exercise exists, you can keep it. If no safe alternative exists for a muscle group, omit it. DO NOT invent new exercises.
3. Provide a brief 'spiegazione_modifiche' (string, in ${targetLanguage}) explaining why you made the changes.
4. Return ONLY a JSON object with 'consiglio_esperto', 'spiegazione_modifiche', and 'esercizi_modificati'.
5. ALL TEXT MUST BE IN ${targetLanguage.toUpperCase()}.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: adjustmentPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            consiglio_esperto: { type: "string" },
            spiegazione_modifiche: { type: "string" },
            esercizi_modificati: { 
              type: "array", 
              items: { 
                type: "object", 
                properties: { 
                  name: { type: "string" }, 
                  sets: { type: "number" }, 
                  reps: { type: "string" }, 
                  rest: { type: "string" } 
                },
                required: ["name", "sets", "reps", "rest"]
              } 
            }
          },
          required: ["consiglio_esperto", "spiegazione_modifiche", "esercizi_modificati"]
        }
      });
      setAdjustmentResult(response);
      setAdjustedWorkout({ ...selectedDayWorkout, exercises: response.esercizi_modificati });
    } catch (e) { 
      console.error(e);
      alert("Errore nella modifica. Riprova.");
    }
    setIsAdjusting(false);
  };

  const compensateWithWorkout = async () => {
    if (!trainingData.user_id || !cheatData) return;
    
    setIsCompensating(true);
    try {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayWorkout = workoutPlans.find(w => w.day_of_week === today);
      
      if (!todayWorkout) {
        alert("Nessun workout pianificato per oggi. Impossibile adattare.");
        setIsCompensating(false);
        return;
      }

      const availableExercises = getAvailableExercises();
      const exerciseNames = availableExercises.map(e => `"${e.name}"`).join(', ');

      const compensationPrompt = `You are an expert personal trainer. The user has consumed ${cheatData.totalDelta > 0 ? 'extra' : 'fewer'} calories today: ${Math.abs(cheatData.totalDelta)} kcal.

CRITICAL: Generate ALL content in ITALIAN language. Exercise names MUST come from this database:
${exerciseNames}

Current workout plan for today:
${JSON.stringify(todayWorkout)}

User's constraints:
- Experience: ${trainingData.fitness_experience}
- Equipment: ${trainingData.equipment?.join(', ') || 'corpo libero'}
- Joint pain: ${trainingData.joint_pain?.join(', ') || 'none'}
- Fitness Goal: ${trainingData.fitness_goal}

Task:
${cheatData.totalDelta > 0 
  ? `Modify the workout to burn approximately ${Math.abs(cheatData.totalDelta)} extra calories. You can: increase sets/reps, add cardio exercises (with Italian names), reduce rest times, or add high-intensity intervals. Ensure the workout remains safe and effective given the user's constraints. The new total_duration and calories_burned should reflect the changes. All exercise names must be in Italian and MUST be chosen ONLY from the provided database.`
  : `The user has eaten less. Slightly reduce workout intensity to match their energy levels, aiming to decrease calorie expenditure and total duration. Ensure the workout remains safe and effective given the user's constraints. The new total_duration and calories_burned should reflect the changes. All exercise names must be in Italian and MUST be chosen ONLY from the provided database.`
}

Return a modified workout plan with Italian exercise names, reps (like "12 ripetizioni"), and rest (like "60 secondi"). The structure should match the original plan, including 'plan_name', 'workout_type', 'exercises', 'warm_up', 'cool_down', 'total_duration', 'calories_burned', 'difficulty_level'.`;

      const modifiedWorkout = await base44.integrations.Core.InvokeLLM({
        prompt: compensationPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            plan_name: { type: "string" },
            workout_type: { type: "string" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sets: { type: "number" },
                  reps: { type: "string" },
                  rest: { type: "string" },
                  description: { type: "string" }
                },
                required: ["name", "sets", "reps", "rest"]
              }
            },
            warm_up: { 
              type: "array", 
              items: { 
                type: "object", 
                properties: { 
                  name: { type: "string" }, 
                  duration: { type: "string" },
                  description: { type: "string" }
                },
                required: ["name", "duration"]
              } 
            },
            cool_down: { 
              type: "array", 
              items: { 
                type: "object", 
                properties: { 
                  name: { type: "string" }, 
                  duration: { type: "string" },
                  description: { type: "string" }
                },
                required: ["name", "duration"]
              } 
            },
            total_duration: { type: "number" },
            calories_burned: { type: "number" },
            difficulty_level: { type: "string" }
          },
          required: ["plan_name", "workout_type", "exercises", "warm_up", "cool_down", "total_duration", "calories_burned", "difficulty_level"]
        }
      });
      
      await updateWorkoutMutation.mutateAsync({
        id: todayWorkout.id,
        data: modifiedWorkout
      });
      
      const todayISO = new Date().toISOString().split('T')[0];
      const logs = await base44.entities.MealLog.filter({ user_id: trainingData.user_id, date: todayISO });
      for (const log of logs) {
        if (!log.rebalanced) {
          await base44.entities.MealLog.update(log.id, { rebalanced: true });
        }
      }
      
      setShowCheatCompensation(false);
      setAdjustedWorkout(modifiedWorkout);
      alert("✅ Workout modificato per compensare le calorie!");
    } catch (error) {
      console.error("Error compensating workout:", error);
      alert("Errore nella modifica del workout. Riprova.");
    }
    setIsCompensating(false);
  };

  const handleCloseCheatCompensation = async () => {
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const logs = await base44.entities.MealLog.filter({ user_id: trainingData.user_id, date: todayISO });
      for (const log of logs) {
        if (!log.rebalanced) {
          await base44.entities.MealLog.update(log.id, { rebalanced: true });
        }
      }
    } catch (error) {
      console.error("Error updating meal logs:", error);
    }
    setShowCheatCompensation(false);
  };

  // Conferma eliminazione esercizio
  const confirmDeleteExercise = async () => {
    if (!deleteExerciseTarget) return;
    
    const { exercise, workoutPlan } = deleteExerciseTarget;
    setIsDeletingExercise(true);
    
    try {
      const updatedExercises = workoutPlan.exercises.filter(ex => ex.name !== exercise.name);
      
      await base44.entities.WorkoutPlan.update(workoutPlan.id, {
        exercises: updatedExercises
      });
      
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      setDeleteExerciseTarget(null);
    } catch (error) {
      console.error("Error deleting exercise:", error);
      alert("Errore nell'eliminazione dell'esercizio. Riprova.");
    } finally {
      setIsDeletingExercise(false);
    }
  };

  // Calcola il numero di esercizi nella scheda settimanale
  const totalExercisesInWeeklyPlan = React.useMemo(() => {
    return workoutPlans.reduce((total, plan) => {
      if (plan.exercises && Array.isArray(plan.exercises)) {
        return total + plan.exercises.length;
      }
      return total;
    }, 0);
  }, [workoutPlans]);

// Formatta l'obiettivo fitness per display
  const formatFitnessGoal = (goal) => {
    const goalLabels = {
      'forza_massimale': 'Forza Massimale',
      'ipertrofia': 'Ipertrofia',
      'dimagrimento': 'Dimagrimento',
      'resistenza': 'Resistenza',
      'esplosivita': 'Esplosività',
      'mobilita': 'Mobilità',
      'tonificazione': 'Tonificazione',
      'cardio': 'Cardio',
      'riabilitazione': 'Riabilitazione'
    };
    return goalLabels[goal] || goal;
  };
  
  // Traduci il nome del workout plan
  const translateWorkoutName = (planName) => {
    if (!planName) return '';
    const lang = t('common.lang') || 'it';
    if (lang === 'it') return planName;
    
    const cacheKey = `workout_name_${planName}_${lang}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
    
    // Traduzioni immediate per pattern comuni
    const translations = {
      en: {
        'Sfrutta la Tua Velocità': 'Leverage Your Speed',
        'Allenamento': 'Workout',
        'Recupero Attivo': 'Active Recovery',
        'Sprint di Lavoro Finale': 'Final Work Sprint',
        'Resistenza': 'Endurance',
        'Forza': 'Strength',
        'Potenza': 'Power',
        'Mobilità': 'Mobility'
      },
      es: {
        'Sfrutta la Tua Velocità': 'Aprovecha Tu Velocidad',
        'Allenamento': 'Entrenamiento',
        'Recupero Attivo': 'Recuperación Activa',
        'Sprint di Lavoro Finale': 'Sprint de Trabajo Final',
        'Resistenza': 'Resistencia',
        'Forza': 'Fuerza',
        'Potenza': 'Potencia',
        'Mobilità': 'Movilidad'
      },
      pt: {
        'Sfrutta la Tua Velocità': 'Aproveite Sua Velocidade',
        'Allenamento': 'Treino',
        'Recupero Attivo': 'Recuperação Ativa',
        'Sprint di Lavoro Finale': 'Sprint de Trabalho Final',
        'Resistenza': 'Resistência',
        'Forza': 'Força',
        'Potenza': 'Potência',
        'Mobilità': 'Mobilidade'
      },
      de: {
        'Sfrutta la Tua Velocità': 'Nutzen Sie Ihre Geschwindigkeit',
        'Allenamento': 'Training',
        'Recupero Attivo': 'Aktive Erholung',
        'Sprint di Lavoro Finale': 'Finaler Arbeitssprint',
        'Resistenza': 'Ausdauer',
        'Forza': 'Kraft',
        'Potenza': 'Power',
        'Mobilità': 'Mobilität'
      },
      fr: {
        'Sfrutta la Tua Velocità': 'Exploitez Votre Vitesse',
        'Allenamento': 'Entraînement',
        'Recupero Attivo': 'Récupération Active',
        'Sprint di Lavoro Finale': 'Sprint de Travail Final',
        'Resistenza': 'Endurance',
        'Forza': 'Force',
        'Potenza': 'Puissance',
        'Mobilità': 'Mobilité',
        'Giorno della Resistenza': 'Jour de l\'Endurance'
      }
    };
    
    // Aggiungi traduzioni per nomi workout comuni
    const additionalTranslations = {
      en: {
        'Giorno della Resistenza': 'Endurance Day',
        'Giorno della Forza': 'Strength Day',
        'Giorno della Potenza': 'Power Day',
        'Giorno del Cardio': 'Cardio Day',
        'Giorno della Mobilità': 'Mobility Day',
        'Giorno delle Gambe': 'Leg Day',
        'Giorno del Petto': 'Chest Day',
        'Giorno della Schiena': 'Back Day',
        'Giorno delle Spalle': 'Shoulder Day',
        'Giorno delle Braccia': 'Arm Day',
        'Full Body': 'Full Body',
        'Upper Body': 'Upper Body',
        'Lower Body': 'Lower Body',
        'Push Day': 'Push Day',
        'Pull Day': 'Pull Day'
      },
      es: {
        'Giorno della Resistenza': 'Día de Resistencia',
        'Giorno della Forza': 'Día de Fuerza',
        'Giorno della Potenza': 'Día de Potencia',
        'Giorno del Cardio': 'Día de Cardio',
        'Giorno della Mobilità': 'Día de Movilidad',
        'Giorno delle Gambe': 'Día de Piernas',
        'Giorno del Petto': 'Día de Pecho',
        'Giorno della Schiena': 'Día de Espalda',
        'Giorno delle Spalle': 'Día de Hombros',
        'Giorno delle Braccia': 'Día de Brazos',
        'Full Body': 'Cuerpo Completo',
        'Upper Body': 'Tren Superior',
        'Lower Body': 'Tren Inferior',
        'Push Day': 'Día de Empuje',
        'Pull Day': 'Día de Tirón'
      },
      pt: {
        'Giorno della Resistenza': 'Dia de Resistência',
        'Giorno della Forza': 'Dia de Força',
        'Giorno della Potenza': 'Dia de Potência',
        'Giorno del Cardio': 'Dia de Cardio',
        'Giorno della Mobilità': 'Dia de Mobilidade',
        'Giorno delle Gambe': 'Dia de Pernas',
        'Giorno del Petto': 'Dia de Peito',
        'Giorno della Schiena': 'Dia de Costas',
        'Giorno delle Spalle': 'Dia de Ombros',
        'Giorno delle Braccia': 'Dia de Braços',
        'Full Body': 'Corpo Inteiro',
        'Upper Body': 'Superior',
        'Lower Body': 'Inferior',
        'Push Day': 'Dia de Empurrar',
        'Pull Day': 'Dia de Puxar'
      },
      de: {
        'Giorno della Resistenza': 'Ausdauertag',
        'Giorno della Forza': 'Krafttag',
        'Giorno della Potenza': 'Powertag',
        'Giorno del Cardio': 'Kardiotag',
        'Giorno della Mobilità': 'Mobilitätstag',
        'Giorno delle Gambe': 'Beintag',
        'Giorno del Petto': 'Brusttag',
        'Giorno della Schiena': 'Rückentag',
        'Giorno delle Spalle': 'Schultertag',
        'Giorno delle Braccia': 'Armtag',
        'Full Body': 'Ganzkörper',
        'Upper Body': 'Oberkörper',
        'Lower Body': 'Unterkörper',
        'Push Day': 'Drücktag',
        'Pull Day': 'Zugtag'
      },
      fr: {
        'Giorno della Resistenza': 'Jour d\'Endurance',
        'Giorno della Forza': 'Jour de Force',
        'Giorno della Potenza': 'Jour de Puissance',
        'Giorno del Cardio': 'Jour Cardio',
        'Giorno della Mobilità': 'Jour de Mobilité',
        'Giorno delle Gambe': 'Jour des Jambes',
        'Giorno del Petto': 'Jour Pectoraux',
        'Giorno della Schiena': 'Jour Dos',
        'Giorno delle Spalle': 'Jour Épaules',
        'Giorno delle Braccia': 'Jour Bras',
        'Full Body': 'Corps Entier',
        'Upper Body': 'Haut du Corps',
        'Lower Body': 'Bas du Corps',
        'Push Day': 'Jour Poussée',
        'Pull Day': 'Jour Tirage'
      }
    };
    
    // Cerca prima nelle traduzioni specifiche, poi nelle addizionali
    let translated = translations[lang]?.[planName];
    if (!translated) {
      translated = additionalTranslations[lang]?.[planName];
    }
    if (!translated) {
      translated = planName;
    }
    sessionStorage.setItem(cacheKey, translated);
    return translated;
  };
  
  // Warm-up e cool-down ora sono generati direttamente nella lingua corretta dall'AI
  // Non serve più traduzione client-side


  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-8 md:pt-4">
        <style>{`
          @keyframes dumbellRotate {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(10deg); }
          }

          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.4), 0 0 40px rgba(38, 132, 127, 0.2); }
            50% { box-shadow: 0 0 35px rgba(38, 132, 127, 0.6), 0 0 70px rgba(38, 132, 127, 0.4); }
          }

          .animated-workout-container {
            animation: pulseGlow 2s ease-in-out infinite;
            background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%);
          }

          .animated-dumbbell {
            animation: dumbellRotate 2.5s ease-in-out infinite;
          }
        `}</style>
        
        <div className="max-w-xl w-full">
          <Card className="bg-white/60 backdrop-blur-md border-gray-200/40 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden animated-workout-container flex items-center justify-center shadow-lg">
                <Dumbbell className="w-8 h-8 text-white animated-dumbbell" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 text-center">
                {t('workouts.loadingTitle')}
              </CardTitle>
              <p className="text-sm text-gray-600 text-center mt-2">
                {t('workouts.loadingDesc', { count: allExercises.length, goal: trainingData.fitness_goal })}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <Progress value={generationProgress} className="w-full h-2.5 [&>div]:bg-[#26847F]" />
                <p className="text-sm text-[#26847F] font-semibold text-center min-h-[20px]">
                  {generationStatus}
                </p>
              </div>
              
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60">
                <h4 className="font-semibold text-gray-800 text-sm mb-3">{t('workouts.genProtocol')}</h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center">
                    <CheckCircle className={`inline w-4 h-4 mr-2 ${generationProgress >= 10 ? 'text-[#26847F]' : 'text-gray-300'}`} />
                    <span className="text-gray-700">{t('workouts.genDatabase', { count: allExercises.length })}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`inline w-4 h-4 mr-2 ${generationProgress >= 20 ? 'text-[#26847F]' : 'text-gray-300'}`} />
                    <span className="text-gray-700">{t('workouts.genFilter', { goal: trainingData.fitness_goal })}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`inline w-4 h-4 mr-2 ${generationProgress >= 40 ? 'text-[#26847F]' : 'text-gray-300'}`} />
                    <span className="text-gray-700">{t('workouts.genSelection')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`inline w-4 h-4 mr-2 ${generationProgress >= 60 ? 'text-[#26847F]' : 'text-gray-300'}`} />
                    <span className="text-gray-700">{t('workouts.genValidation')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className={`inline w-4 h-4 mr-2 ${generationProgress >= 85 ? 'text-[#26847F]' : 'text-gray-300'}`} />
                    <span className="text-gray-700">{t('workouts.genBuilding')}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingWorkouts) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl text-center p-8">
          <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BrainCircuit className="w-8 h-8 text-white animate-bounce" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">{t('common.loading')}</CardTitle>
          <p className="text-gray-600 mt-2">{t('workouts.loadingWait')}</p>
        </Card>
      </div>
    );
  }

  if (!hasFeatureAccess(trainingData.subscription_plan, 'workout_plan') && remainingGenerations === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Crown className="w-5 h-5 mr-2" />
            {t('workouts.upgradeAccess')}
          </Button>
        </div>
      </div>
    );
  }
  
  if (showAssessment) {
    const CurrentStepComponent = TRAINING_STEPS[currentStep]?.component;
    if (!CurrentStepComponent) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <p>Errore: Componente del passo non trovato.</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen p-4 pt-2 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card className="water-glass-effect rounded-xl shadow-lg border-[#26847F]/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">
                {t('workouts.configureWorkout')}
              </CardTitle>
              <p className="text-gray-600 text-center">{t('workouts.stepOf', { current: currentStep + 1, total: TRAINING_STEPS.length })}</p>
            </CardHeader>
            <CardContent className="p-6">
              <CurrentStepComponent data={trainingData} onDataChange={handleStepData} nextStep={nextStep} />
            </CardContent>
          </Card>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-between items-center px-6"
          >
            <div className="water-glass-effect rounded-full shadow-lg">
              <Button 
                onClick={prevStep} 
                disabled={currentStep === 0} 
                variant="ghost" 
                className="text-gray-700 hover:text-gray-900 hover:bg-white/50 font-semibold px-6 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> 
                {t('common.back')}
              </Button>
            </div>

            {currentStep < TRAINING_STEPS.length - 1 ? (
              <div className="water-glass-effect rounded-full shadow-lg">
                <Button 
                  onClick={nextStep} 
                  className="bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-full shadow-[0_4px_20px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_25px_rgba(38,132,127,0.4)]"
                >
                  {t('common.next')} 
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="water-glass-effect rounded-full shadow-lg">
                <Button 
                  onClick={startGeneration} 
                  className="bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-full shadow-[0_4px_20px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_25px_rgba(38,132,127,0.4)]"
                  disabled={generationLimitReached && remainingGenerations === 0}
                >
                  {t('workouts.generateWithAI')} 
                  <BrainCircuit className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

const workoutForSelectedDay = adjustedWorkout || workoutPlans.find(plan => plan.day_of_week === selectedDay);
  
  const getDayLabel = (dayId) => {
    const dayLabels = {
      it: {
        monday: 'Lunedì',
        tuesday: 'Martedì',
        wednesday: 'Mercoledì',
        thursday: 'Giovedì',
        friday: 'Venerdì',
        saturday: 'Sabato',
        sunday: 'Domenica'
      },
      en: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
      },
      es: {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
      },
      pt: {
        monday: 'Segunda',
        tuesday: 'Terça',
        wednesday: 'Quarta',
        thursday: 'Quinta',
        friday: 'Sexta',
        saturday: 'Sábado',
        sunday: 'Domingo'
      },
      de: {
        monday: 'Montag',
        tuesday: 'Dienstag',
        wednesday: 'Mittwoch',
        thursday: 'Donnerstag',
        friday: 'Freitag',
        saturday: 'Samstag',
        sunday: 'Sonntag'
      },
      fr: {
        monday: 'Lundi',
        tuesday: 'Mardi',
        wednesday: 'Mercredi',
        thursday: 'Jeudi',
        friday: 'Vendredi',
        saturday: 'Samedi',
        sunday: 'Dimanche'
      }
    };
    
    return dayLabels[t('common.lang') || 'it']?.[dayId] || dayId;
  };

  const days = [
    { id: 'monday', label: getDayLabel('monday') },
    { id: 'tuesday', label: getDayLabel('tuesday') },
    { id: 'wednesday', label: getDayLabel('wednesday') },
    { id: 'thursday', label: getDayLabel('thursday') },
    { id: 'friday', label: getDayLabel('friday') },
    { id: 'saturday', label: getDayLabel('saturday') },
    { id: 'sunday', label: getDayLabel('sunday') }
  ];

  return (
    <>
      {showCheatCompensation && cheatData && (
        <Dialog open={true} onOpenChange={(open) => !open && handleCloseCheatCompensation()}>
          <DialogContent className="bg-white/80 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>🔥 {t('workouts.cheatTitle')}</DialogTitle>
              <DialogDescription>
                {t('workouts.cheatDesc', { delta: `${cheatData.totalDelta > 0 ? '+' : ''}${cheatData.totalDelta}` })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-[#e9f6f5] p-4 rounded-lg border border-[#26847F]/30">
                <p className="text-sm text-gray-700">
                  {cheatData.totalDelta > 0 
                    ? `💪 ${t('workouts.cheatExtraDesc')}`
                    : `😌 ${t('workouts.cheatLessDesc')}`
                  }
                </p>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCloseCheatCompensation}
                disabled={isCompensating}
              >
                {t('workouts.cheatKeepNormal')}
              </Button>
              <Button
                onClick={compensateWithWorkout}
                className="bg-[#26847F] hover:bg-[#1f6b66] shadow-[0_4px_16px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_20px_rgba(38,132,127,0.4)]"
                disabled={isCompensating}
              >
                {isCompensating ? t('workouts.cheatProcessing') : t('workouts.cheatAdapt')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('workouts.title')}</h1>
              <p className="text-gray-600">
                {workoutPlans.length > 0 
                  ? `${t('workouts.exerciseCount', { count: totalExercisesInWeeklyPlan })} • ${t('common.goal')}: ${formatFitnessGoal(trainingData.fitness_goal)}`
                  : `${t('workouts.noPlanGenerated')} • ${t('common.goal')}: ${trainingData.fitness_goal ? formatFitnessGoal(trainingData.fitness_goal) : t('common.notSet')}`
                }
              </p>
              {remainingGenerations !== null && remainingGenerations !== -1 && remainingGenerations !== 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <BrainCircuit className="w-4 h-4 text-[#26847F]" />
                    <span className={`font-semibold ${remainingGenerations === 0 ? 'text-red-600' : 'text-[#26847F]'}`}>
                      {t('workouts.generationsRemaining', { count: remainingGenerations })}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={() => {
                if (generationLimitReached && remainingGenerations === 0) {
                  setShowUpgradeModal(true);
                } else {
                  setShowAssessment(true);
                }
              }}
              className="bg-[#26847F] hover:bg-[#1f6b66] text-white flex items-center gap-2 shadow-[0_4px_20px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_25px_rgba(38,132,127,0.4)] transition-all px-6 py-6 text-base font-semibold rounded-xl w-full lg:w-auto relative"
              disabled={!hasFeatureAccess(trainingData.subscription_plan, 'workout_plan') && remainingGenerations === 0}
            >
              <BrainCircuit className="w-5 h-5" /> 
              {t('workouts.generateWithAI')}
              {generationLimitReached && remainingGenerations === 0 && (
                <AlertCircle className="w-4 h-4 ml-1 animate-pulse" />
              )}
            </Button>
          </div>

          {generationLimitReached && remainingGenerations === 0 && hasFeatureAccess(trainingData.subscription_plan, 'workout_plan') && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xl rounded-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-8 h-8 text-amber-700" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                      🚫 {t('workouts.limitReached')}
                    </h3>
                    <p className="text-amber-800 mb-1">
                      {t('workouts.limitReachedDesc')}
                    </p>
                    <p className="text-sm text-amber-700">
                      💡 {t('workouts.upgradeUnlimited')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      ⬆️ {t('workouts.upgradeUnlimited')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {workoutPlans.length > 0 ? (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardHeader className="border-b border-gray-200/30">
                  <CardTitle>{t('workouts.weeklySchedule')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200/80">
                  {days.map((day) => (
                    <button 
                      key={day.id} 
                      onClick={() => setSelectedDay(day.id)} 
                      className={`px-4 py-2 text-sm font-medium rounded-t-md transition-all border-b-2 ${
                        selectedDay === day.id 
                          ? 'text-[#26847F] border-[#26847F] bg-[#e9f6f5] shadow-[0_2px_8px_rgba(38,132,127,0.15)]' 
                          : 'text-gray-500 border-transparent hover:text-[#26847F] hover:border-[#26847F]/50 hover:bg-[#e9f6f5]/30'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <div className="min-h-[300px]">
                  {workoutForSelectedDay ? (
                    workoutForSelectedDay.workout_type !== 'rest' ? (
                      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                        <CardHeader className="border-b border-gray-200/30">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900 mb-1">{translateWorkoutName(workoutForSelectedDay.plan_name)}</CardTitle>
                              <p className="text-sm text-gray-500">
                                {getDayLabel(selectedDay)} • {workoutForSelectedDay.total_duration || 0} min • {workoutForSelectedDay.calories_burned || 0} kcal
                              </p>
                            </div>
                            
                            {/* Pulsante Desktop - nascosto su mobile */}
                            <div className="hidden md:block">
                              {!hasFeatureAccess(trainingData.subscription_plan, 'workout_modification') ? (
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative whitespace-nowrap cursor-pointer"
                                  onClick={() => setShowUpgradeModal(true)}
                                >
                                  <ShieldAlert className="w-4 h-4 mr-2"/> {t('workouts.modifySession')}
                                  <span 
                                    className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-purple-600 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowUpgradeModal(true);
                                    }}
                                  >
                                    Premium
                                  </span>
                                </Button>
                              ) : (
                                <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="secondary" 
                                      size="sm"
                                      className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative whitespace-nowrap"
                                    >
                                      <ShieldAlert className="w-4 h-4 mr-2"/> {t('workouts.modifySession')}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-sm">
                                    <DialogHeader>
                                      <DialogTitle>{t('workouts.adjustTitle')}</DialogTitle>
                                    </DialogHeader>
                                    {!adjustmentResult ? (
                                      <div className="space-y-4 py-4">
                                        <p className="text-sm text-gray-600">{t('workouts.adjustDesc')}</p>
                                        <Textarea placeholder={t('workouts.adjustPlaceholder')} value={adjustmentProblem} onChange={(e) => setAdjustmentProblem(e.target.value)} />
                                      </div>
                                    ) : (
                                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                        <div>
                                          <h4 className="font-semibold text-gray-800">{t('workouts.adjustExpert')}</h4>
                                          <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg prose-sm" dangerouslySetInnerHTML={{ __html: adjustmentResult.consiglio_esperto.replace(/\n/g, '<br />') }} />
                                        </div>
                                        <div>
                                          <h4 className="font-semibold text-gray-800">{t('workouts.adjustExplanation')}</h4>
                                          <p className="text-sm text-gray-600 mt-2">{adjustmentResult.spiegazione_modifiche}</p>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      {!adjustmentResult ? (
                                        <Button 
                                          onClick={handleDailyAdjustment} 
                                          disabled={isAdjusting || !adjustmentProblem}
                                          className="bg-[#26847F] hover:bg-[#1f6b66] text-white shadow-[0_4px_16px_rgba(38,132,127,0.3)]"
                                        >
                                          {isAdjusting ? t('workouts.adjustThinking') : t('workouts.adjustRequest')}
                                        </Button>
                                      ) : (
                                        <Button onClick={() => {setShowAdjustmentDialog(false); setAdjustmentResult(null); setAdjustmentProblem('');}}>
                                          {t('common.close')}
                                        </Button>
                                      )}
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-6">
                          {/* Pulsante Mobile - nascosto su desktop */}
                          <div className="flex md:hidden flex-col gap-3 pb-4 border-b border-gray-200/30">
                            {!hasFeatureAccess(trainingData.subscription_plan, 'workout_modification') ? (
                              <Button 
                                variant="secondary" 
                                className="w-full bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative cursor-pointer"
                                onClick={() => setShowUpgradeModal(true)}
                              >
                                <ShieldAlert className="w-4 h-4 mr-2"/> {t('workouts.modifySession')}
                                <span 
                                  className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-purple-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowUpgradeModal(true);
                                  }}
                                >
                                  Premium
                                </span>
                              </Button>
                            ) : (
                              <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="secondary" 
                                    className="w-full bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative"
                                  >
                                    <ShieldAlert className="w-4 h-4 mr-2"/> {t('workouts.modifySession')}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-sm">
                                  <DialogHeader>
                                    <DialogTitle>{t('workouts.adjustTitle')}</DialogTitle>
                                  </DialogHeader>
                                  {!adjustmentResult ? (
                                    <div className="space-y-4 py-4">
                                      <p className="text-sm text-gray-600">{t('workouts.adjustDesc')}</p>
                                      <Textarea placeholder={t('workouts.adjustPlaceholder')} value={adjustmentProblem} onChange={(e) => setAdjustmentProblem(e.target.value)} />
                                    </div>
                                  ) : (
                                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                      <div>
                                        <h4 className="font-semibold text-gray-800">{t('workouts.adjustExpert')}</h4>
                                        <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg prose-sm" dangerouslySetInnerHTML={{ __html: adjustmentResult.consiglio_esperto.replace(/\n/g, '<br />') }} />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-800">{t('workouts.adjustExplanation')}</h4>
                                        <p className="text-sm text-gray-600 mt-2">{adjustmentResult.spiegazione_modifiche}</p>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    {!adjustmentResult ? (
                                      <Button 
                                        onClick={handleDailyAdjustment} 
                                        disabled={isAdjusting || !adjustmentProblem}
                                        className="bg-[#26847F] hover:bg-[#1f6b66] text-white shadow-[0_4px_16px_rgba(38,132,127,0.3)]"
                                      >
                                        {isAdjusting ? t('workouts.adjustThinking') : t('workouts.adjustRequest')}
                                      </Button>
                                    ) : (
                                      <Button onClick={() => {setShowAdjustmentDialog(false); setAdjustmentResult(null); setAdjustmentProblem('');}}>
                                        {t('common.close')}
                                      </Button>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>

                          {adjustedWorkout && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-amber-800 font-semibold text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {t('workouts.adjustModified')}</p>
                            </div>
                          )}
                          
                          {workoutForSelectedDay.warm_up?.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-2">{t('workouts.warmup')}</h5>
                              <div className="grid gap-2">
                                {workoutForSelectedDay.warm_up.map((ex, idx) => {
                                  const translated = translateWarmupCooldown(ex.name, ex.duration);
                                  return (
                                    <div key={idx} className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-3 text-sm">
                                      <span className="font-medium text-blue-900">{translated.name}</span>{" "}
                                      <span className="text-blue-700">({translated.duration})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {workoutForSelectedDay.exercises?.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-gray-800">{t('workouts.mainExercises')}</h5>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowAddExerciseModal(true)}
                                  className="text-[#26847F] border-[#26847F] hover:bg-[#e9f6f5]"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  {t('workouts.addExercise')}
                                </Button>
                              </div>
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {workoutForSelectedDay.exercises.map((ex, idx) => {
                                   const enrichedExercise = enrichExerciseWithDetails(ex);
                                   const exerciseName = ex.name;

                                   // ✅ MOSTRA I SET SOLO SE STIAMO GUARDANDO OGGI
                                   const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                   const isToday = selectedDay === todayOfWeek;
                                   const completedSets = isToday ? (exerciseSets[exerciseName] || []) : [];
                                   const isCompleted = completedSets.length === ex.sets && ex.sets > 0;

                                   return (
                                     <ExerciseCard 
                                       key={idx} 
                                       exercise={enrichedExercise}
                                       isCompleted={isCompleted}
                                       completedSets={completedSets}
                                       onSetToggle={(newSets) => {
                                         console.log('🔄 SET TOGGLE:', exerciseName, '→', newSets);
                                         setExerciseSets(prev => ({ ...prev, [exerciseName]: newSets }));
                                         saveWorkoutProgress(exerciseName, newSets, ex.sets);
                                       }}
                                       onToggleComplete={() => {
                                         const newSets = isCompleted ? [] : Array.from({ length: ex.sets }, (_, i) => i + 1);
                                         console.log('✅ COMPLETE TOGGLE:', exerciseName, '→', newSets);
                                         setExerciseSets(prev => ({ ...prev, [exerciseName]: newSets }));
                                         saveWorkoutProgress(exerciseName, newSets, ex.sets);
                                       }}
                                       isToday={isToday}
                                       onReplace={() => setReplaceExerciseTarget({ exercise: ex, workoutPlan: workoutForSelectedDay })}
                                       onDelete={() => setDeleteExerciseTarget({ exercise: ex, workoutPlan: workoutForSelectedDay })}
                                       isDeleting={false}
                                       userStrengthLevel={trainingData.strength_level || 'moderate'}
                                     />
                                   );
                                 })}
                              </div>
                            </div>
                          )}
                          {workoutForSelectedDay.cool_down?.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-2">{t('workouts.cooldown')}</h5>
                              <div className="grid gap-2">
                                {workoutForSelectedDay.cool_down.map((ex, idx) => {
                                  const translated = translateWarmupCooldown(ex.name, ex.duration);
                                  return (
                                    <div key={idx} className="bg-purple-50/50 border border-purple-200/60 rounded-lg p-3 text-sm">
                                      <span className="font-medium text-purple-900">{translated.name}</span>{" "}
                                      <span className="text-purple-700">({translated.duration})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* ✅ PULSANTE COMPLETA ALLENAMENTO - Solo per oggi */}
                          {(() => {
                            const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                            const isToday = selectedDay === todayOfWeek;
                            
                            if (!isToday) return null;
                            
                            return (
                              <div className="pt-6 border-t border-gray-200/50">
                                {workoutCompleted ? (
                                  <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <span className="text-green-800 font-semibold text-lg">
                                      ✅ {t('workouts.workoutCompleted')}
                                    </span>
                                  </div>
                                  ) : (
                                  <Button
                                    onClick={handleCompleteWorkout}
                                    disabled={isCompletingWorkout}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                  >
                                    {isCompletingWorkout ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        {t('settings.saving')}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-6 h-6 mr-2" />
                                        {t('workouts.completeWorkout')}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] bg-white/50 backdrop-blur-sm">
                          <div className="w-16 h-16 bg-[#26847F]/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Target className="w-8 h-8 text-[#26847F]" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg">{t('workouts.restDay')}</p>
                          <p className="text-sm text-gray-500 mt-1">{t('workouts.restDayDesc')}</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] bg-white/50 backdrop-blur-sm">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-semibold text-lg">{t('workouts.noWorkout')} {getDayLabel(selectedDay)}</p>
                      <p className="text-sm text-gray-500 mt-1">{t('workouts.regeneratePrompt')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
              <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#26847F]/10 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Database className="w-8 h-8 text-[#26847F]" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 mb-4">Nessun Protocollo di Allenamento</CardTitle>
                  <p className="text-gray-600 mb-6">
                    Genera il tuo piano personalizzato dal database di {allExercises.length} esercizi per iniziare.
                  </p>
                </CardContent>
              </Card>
            )
          }
        </div>
      </div>
      
      {showUpgradeModal && (
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
          currentPlan={trainingData.subscription_plan || 'base'} 
        />
      )}
      
      {replaceExerciseTarget && (
        <ReplaceExerciseModal
          isOpen={!!replaceExerciseTarget}
          onClose={() => setReplaceExerciseTarget(null)}
          exercise={replaceExerciseTarget.exercise}
          workoutPlan={replaceExerciseTarget.workoutPlan}
          onExerciseReplaced={() => {
            queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
            setReplaceExerciseTarget(null);
          }}
        />
      )}
      
      {showAddExerciseModal && workoutForSelectedDay && (
        <AddExerciseModal
          isOpen={showAddExerciseModal}
          onClose={() => setShowAddExerciseModal(false)}
          workoutPlan={workoutForSelectedDay}
          onExerciseAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
            setShowAddExerciseModal(false);
          }}
        />
      )}
      
      {deleteExerciseTarget && (
        <DeleteExerciseDialog
          isOpen={!!deleteExerciseTarget}
          onClose={() => setDeleteExerciseTarget(null)}
          exercise={deleteExerciseTarget.exercise}
          onConfirm={confirmDeleteExercise}
          isDeleting={isDeletingExercise}
        />
      )}
    </>
  );
}