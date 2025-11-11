
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { WorkoutPlan } from "@/entities/WorkoutPlan";
import { Exercise } from "@/entities/Exercise";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Settings, Database, Clock, Zap, Target, ArrowLeft, ArrowRight, BrainCircuit, CheckCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ExerciseCard from "../components/workouts/ExerciseCard";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MealLog } from "@/entities/MealLog";

import JointPainStep from "../components/quiz/JointPainStep";
import FitnessExperienceStep from "../components/quiz/FitnessExperienceStep";
import WorkoutLocationStep from "../components/quiz/WorkoutLocationStep";
import EquipmentStep from "../components/quiz/EquipmentStep";
import WorkoutDaysStep from "../components/quiz/WorkoutDaysStep";
import SessionDurationStep from "../components/quiz/SessionDurationStep";
import FitnessGoalStep from "../components/quiz/FitnessGoalStep";
import WorkoutLogger from "../components/workouts/WorkoutLogger";

import { hasFeatureAccess, PLANS, UpgradePrompt } from '@/components/utils/subscriptionPlans';

import { motion } from "framer-motion";

const TRAINING_STEPS = [
  { id: 'fitness_goal', title: 'Obiettivo Fitness', component: FitnessGoalStep, autoAdvance: true },
  { id: 'fitness_experience', title: 'Esperienza', component: FitnessExperienceStep, autoAdvance: true },
  { id: 'workout_days', title: 'Frequenza Allenamenti', component: WorkoutDaysStep },
  { id: 'session_duration', title: 'Durata Sessione', autoAdvance: true, component: SessionDurationStep },
  { id: 'workout_location', title: 'Luogo Allenamento', autoAdvance: true, component: WorkoutLocationStep },
  { id: 'equipment', title: 'Attrezzatura', component: EquipmentStep },
  { id: 'joint_pain', title: 'Dolori Articolari', component: JointPainStep }
];

export default function Workouts() {
  const [user, setUser] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showAssessment, setShowAssessment] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [trainingData, setTrainingData] = useState({});
  const navigate = useNavigate();

  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentProblem, setAdjustmentProblem] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState(null);
  const [adjustedWorkout, setAdjustedWorkout] = useState(null);

  const [showCheatCompensation, setShowCheatCompensation] = useState(false);
  const [cheatData, setCheatData] = useState(null);
  const [isCompensating, setIsCompensating] = useState(false);
  const [cheatPromptShown, setCheatPromptShown] = useState(false);

  const [logWorkout, setLogWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkoutPlans = useCallback(async (userId) => {
    try {
      const plans = await WorkoutPlan.filter({ user_id: userId });
      setWorkoutPlans(plans);
    } catch (error) {
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        console.warn("Authentication error (401) in loadWorkoutPlans.");
        navigate(createPageUrl('Home'));
      } else {
        console.error("Error loading workout plans:", error);
      }
    }
  }, [navigate]);

  const checkForCheats = useCallback(async (userId) => {
    if (cheatPromptShown) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await MealLog.filter({ user_id: userId, date: today });
      
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
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        console.warn("Authentication error (401) in checkForCheats.");
      } else {
        console.error("Error checking for cheats:", error);
      }
    }
  }, [cheatPromptShown]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        
        if (!currentUser) {
          navigate(createPageUrl('Home'));
          return;
        }

        if (!hasFeatureAccess(currentUser.subscription_plan, 'workout_plan')) {
          setIsLoading(false);
          return;
        }

        if (currentUser.id) {
          await loadWorkoutPlans(currentUser.id);
          await checkForCheats(currentUser.id);
          setTrainingData({
            joint_pain: currentUser.joint_pain || [],
            fitness_experience: currentUser.fitness_experience,
            workout_location: currentUser.workout_location,
            equipment: currentUser.equipment || [],
            workout_days: currentUser.workout_days,
            workout_days_selected: currentUser.workout_days_selected || [],
            session_duration: currentUser.session_duration,
            fitness_goal: currentUser.fitness_goal
          });
        }
      } catch (error) {
        if (error?.response?.status === 401 || error?.message?.includes('401')) {
          console.warn("Authentication error (401), redirecting to Home.");
          navigate(createPageUrl("Home"));
        } else {
          console.error("Error loading data:", error);
          navigate(createPageUrl("Home"));
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [loadWorkoutPlans, checkForCheats, navigate]);

  useEffect(() => {
    setAdjustedWorkout(null);
    setAdjustmentResult(null);
  }, [selectedDay]);

  const handleStepData = (stepData) => setTrainingData(prev => ({ ...prev, ...stepData }));
  const nextStep = () => { if (currentStep < TRAINING_STEPS.length - 1) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const startGeneration = async () => {
    await User.updateMyUserData(trainingData);
    setShowAssessment(false);
    await generateWorkoutPlan();
  };

  const generateWorkoutPlan = async () => {
    if (!user) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Avvio protocollo AI Allenamento...");

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, "Accesso a database di protocolli...");

      const workoutDays = trainingData.workout_days || user.workout_days || 3;
      const selectedDays = trainingData.workout_days_selected || user.workout_days_selected || [];

      const workoutPlanPrompt = `You are a world-class AI personal trainer, physical therapist, and motivational coach. Create a hyper-personalized, 7-day weekly workout plan.

      CRITICAL: Generate ALL content in ITALIAN language. Exercise names, descriptions, and all text MUST be in Italian.

      User Profile & Vitals:
      - Age: ${user.age}, Gender: ${user.gender}, Weight: ${user.current_weight}kg
      - Primary Fitness Goal: ${trainingData.fitness_goal || user.fitness_goal}
      - Calorie Target from Diet: ${user.daily_calories} kcal

      User's Training Preferences & Constraints:
      - Fitness Experience: ${trainingData.fitness_experience || user.fitness_experience}
      - Workout Location: ${trainingData.workout_location || user.workout_location}
      - Available Equipment: ${trainingData.equipment?.join(', ') || user.equipment?.join(', ') || 'none'}. Use ONLY exercises that require this equipment or bodyweight.
      - Joint Pain/Limitation s: ${trainingData.joint_pain?.join(', ') || user.joint_pain?.join(', ') || 'none'}. Do NOT include exercises that stress these joints.
      - Desired workouts per week: ${workoutDays}
      - Specific days selected: ${selectedDays.length > 0 ? selectedDays.join(', ') : 'any ' + workoutDays + ' days'}
      - Preferred session duration: ${trainingData.session_duration || user.session_duration}

      CRITICAL REQUIREMENTS:
      1. You MUST create EXACTLY 7 workout plans, one for each day: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" (all lowercase).
      2. EVERY workout plan MUST have a "day_of_week" field with one of these exact values: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
      3. ${selectedDays.length > 0 ? `The user wants to workout ONLY on these specific days: ${selectedDays.join(', ') || ''}. Create full workout plans for ONLY these days. For all other days, create rest plans.` : `The user wants ${workoutDays} workout days total. Distribute them logically across the week.`}
      4. For workout days: provide 'plan_name' (in Italian), 'workout_type', 'warm_up' array (in Italian), 'exercises' array (in Italian), 'cool_down' array (in Italian), 'total_duration', 'calories_burned', 'difficulty_level'.
      5. For rest days: provide 'plan_name' (e.g., "Recupero Attivo"), 'workout_type': "rest", 'warm_up': [], 'exercises': [], 'cool_down': [], 'total_duration': 0, 'calories_burned': 0, 'difficulty_level': "easy".
      6. Each exercise MUST have Italian names (e.g., "Squat con Manubri", "Flessioni", "Plank", "Affondi", "Curl Bicipiti").
      7. 'reps' field must be in Italian format (e.g., "12 ripetizioni", "10-12 rip.", "30 secondi", "fino a cedimento").
      8. 'rest' field must be in Italian (e.g., "60 secondi", "90 sec", "2 minuti").
      9. 'difficulty_level' must be one of: "beginner", "intermediate", "advanced" (in English).
      10. Don't train the same muscle groups on consecutive workout days.
      
      EXAMPLE of correct JSON format with day_of_week:
      {
        "day_of_week": "monday",
        "plan_name": "Allenamento Full Body",
        "workout_type": "strength",
        "exercises": [
          {
            "name": "Squat con Manubri",
            "sets": 3,
            "reps": "12 ripetizioni",
            "rest": "90 secondi"
          }
        ],
        "warm_up": [],
        "cool_down": [],
        "total_duration": 45,
        "calories_burned": 300,
        "difficulty_level": "intermediate"
      }`;

      updateProgress(30, "Analisi vincoli fisici e attrezzatura...");

      const response = await InvokeLLM({
        prompt: workoutPlanPrompt,
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
                        rest: { type: "string" } 
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
                        duration: { type: "string" } 
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
                        duration: { type: "string" } 
                      },
                      required: ["name", "duration"]
                    } 
                  },
                  total_duration: { type: "number" },
                  calories_burned: { type: "number" },
                  difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                },
                required: ["day_of_week", "plan_name", "workout_type", "exercises", "warm_up", "cool_down", "total_duration", "calories_burned", "difficulty_level"]
              },
              minItems: 7,
              maxItems: 7
            }
          },
          required: ["workout_plans"]
        }
      });

      updateProgress(60, "Progettazione sessioni e selezione esercizi...");

      if (response.workout_plans && Array.isArray(response.workout_plans) && response.workout_plans.length === 7) {
        const invalidPlans = response.workout_plans.filter(plan => !plan.day_of_week);
        if (invalidPlans.length > 0) {
          throw new Error(`${invalidPlans.length} piani senza day_of_week. Rigenerare.`);
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const missingDays = days.filter(day => !response.workout_plans.some(plan => plan.day_of_week === day));
        if (missingDays.length > 0) {
          throw new Error(`Giorni mancanti: ${missingDays.join(', ')}. Rigenerare.`);
        }

        updateProgress(75, "Rimozione piani precedenti...");
        try {
          const existingPlans = await WorkoutPlan.filter({ user_id: user.id });
          
          const deletePromises = existingPlans.map(async (plan) => {
            try {
              await WorkoutPlan.delete(plan.id);
            } catch (deleteError) {
              console.warn(`Impossibile cancellare workout plan ${plan.id}:`, deleteError);
            }
          });
          
          await Promise.allSettled(deletePromises);
        } catch (error) {
          console.error("Errore durante la cancellazione dei piani esistenti:", error);
        }

        updateProgress(85, "Salvataggio protocollo personalizzato...");

        for (const workoutData of response.workout_plans) {
            if (!workoutData.day_of_week) {
              console.error("Missing day_of_week in workout plan:", workoutData);
              continue;
            }
            await WorkoutPlan.create({ user_id: user.id, ...workoutData });
        }

        updateProgress(100, "Protocollo di allenamento generato!");
        await loadWorkoutPlans(user.id);
        setTimeout(() => setIsGenerating(false), 1500);
      } else {
        throw new Error("L'AI non ha generato un piano completo di 7 giorni");
      }
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
      const adjustmentPrompt = `You are an expert AI personal trainer and physical therapist. A user needs an immediate adjustment to their workout for today due to a specific issue.

      CRITICAL: Generate ALL content in ITALIAN language. Exercise names, advice, and explanations MUST be in Italian.

      User Profile: ${JSON.stringify({age: user.age, gender: user.gender, fitness_experience: user.fitness_experience, joint_pain: user.joint_pain})}
      Today's Original Workout Plan: ${JSON.stringify(selectedDayWorkout)}

      User's Reported Problem TODAY (in Italian): "${adjustmentProblem}"

      Your Task:
      1. Provide empathetic and actionable advice in Italian in a 'consiglio_esperto' field (string, markdown format).
      2. Analyze the original workout and the user's problem. Create a NEW, modified list of 'esercizi_modificati' with Italian exercise names (e.g., "Squat Bulgaro", "Flessioni su Ginocchia", "Plank Laterale"). Use your knowledge of exercises, ensuring they are safe and adhere to the user's available equipment: ${user.equipment?.join(', ') || 'corpo libero'}. These exercises should work around the user's problem. For each exercise, provide Italian name, sets, reps (in Italian like "10 ripetizioni"), and rest (in Italian like "60 secondi"). If a safe exercise exists, you can keep it. If no safe alternative exists for a muscle group, omit it.
      3. Provide a brief 'spiegazione_modifiche' (string, in Italian) explaining why you made the changes.
      4. Return ONLY a JSON object with 'consiglio_esperto', 'spiegazione_modifiche', and 'esercizi_modificati'.`;

      const response = await InvokeLLM({
        prompt: adjustmentPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            consiglio_esperto: { type: "string" },
            spiegazione_modifiche: { type: "string" },
            esercizi_modificati: { type: "array", items: { type: "object", properties: { name: { type: "string" }, sets: { type: "number" }, reps: { type: "string" }, rest: { type: "string" } } } }
          },
          required: ["consiglio_esperto", "spiegazione_modifiche", "esercizi_modificati"]
        }
      });
      setAdjustmentResult(response);
      setAdjustedWorkout({ ...selectedDayWorkout, exercises: response.esercizi_modificati });
    } catch (e) { console.error(e) }
    setIsAdjusting(false);
  };

  const compensateWithWorkout = async () => {
    if (!user || !cheatData) return;
    
    setIsCompensating(true);
    try {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayWorkout = workoutPlans.find(w => w.day_of_week === today);
      
      if (!todayWorkout) {
        alert("Nessun workout pianificato per oggi. Impossibile adattare.");
        setIsCompensating(false);
        return;
      }

      const compensationPrompt = `You are an expert personal trainer. The user has consumed ${cheatData.totalDelta > 0 ? 'extra' : 'fewer'} calories today: ${Math.abs(cheatData.totalDelta)} kcal.

      CRITICAL: Generate ALL content in ITALIAN language. Exercise names and all text MUST be in Italian.

      Current workout plan for today:
      ${JSON.stringify(todayWorkout)}

      User's constraints:
      - Experience: ${user.fitness_experience}
      - Equipment: ${user.equipment?.join(', ') || 'corpo libero'}
      - Joint pain: ${user.joint_pain?.join(', ') || 'none'}

      Task:
      ${cheatData.totalDelta > 0 
        ? `Modify the workout to burn approximately ${Math.abs(cheatData.totalDelta)} extra calories. You can: increase sets/reps, add cardio exercises (with Italian names like "Corsa sul posto", "Burpees", "Mountain Climbers"), reduce rest times, or add high-intensity intervals. Ensure the workout remains safe and effective given the user's constraints. The new total_duration and calories_burned should reflect the changes. All exercise names must be in Italian.`
        : `The user has eaten less. Slightly reduce workout intensity to match their energy levels, aiming to decrease calorie expenditure and total duration. Ensure the workout remains safe and effective given the user's constraints. The new total_duration and calories_burned should reflect the changes. All exercise names must be in Italian.`
      }

      Return a modified workout plan with Italian exercise names, reps (like "12 ripetizioni"), and rest (like "60 secondi"). The structure should match the original plan, including 'plan_name', 'workout_type', 'exercises', 'warm_up', 'cool_down', 'total_duration', 'calories_burned', 'difficulty_level'.`;

      const modifiedWorkout = await InvokeLLM({
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
                  rest: { type: "string" }
                }
              }
            },
            warm_up: { type: "array", items: { type: "object", properties: { name: { type: "string" }, duration: { type: "string" } } } },
            cool_down: { type: "array", items: { type: "object", properties: { name: { type: "string" }, duration: { type: "string" } } } },
            total_duration: { type: "number" },
            calories_burned: { type: "number" },
            difficulty_level: { type: "string" }
          },
          required: ["plan_name", "workout_type", "exercises", "warm_up", "cool_down", "total_duration", "calories_burned", "difficulty_level"]
        }
      });
      
      await WorkoutPlan.update(todayWorkout.id, modifiedWorkout);
      
      const todayISO = new Date().toISOString().split('T')[0];
      const logs = await MealLog.filter({ user_id: user.id, date: todayISO });
      for (const log of logs) {
        if (!log.rebalanced) {
          await MealLog.update(log.id, { rebalanced: true });
        }
      }
      
      await loadWorkoutPlans(user.id);
      
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
      const logs = await MealLog.filter({ user_id: user.id, date: todayISO });
      for (const log of logs) {
        if (!log.rebalanced) {
          await MealLog.update(log.id, { rebalanced: true });
        }
      }
    } catch (error) {
      console.error("Error updating meal logs:", error);
    }
    setShowCheatCompensation(false);
  };

  const handleLogWorkout = (workout) => {
    setLogWorkout(workout);
  };

  const handleLogSaved = async () => {
    await loadWorkoutPlans(user.id);
    setLogWorkout(null);
    setAdjustedWorkout(null);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-0">
        <div className="max-w-2xl mx-auto">
          <Card className="max-w-2xl w-full bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl text-center">
            <CardHeader>
              <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/videos/ai-generation-loop.mp4" type="video/mp4" />
                </video>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Creazione Protocollo Allenamento AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <p className="text-gray-600">L'AI sta progettando il tuo allenamento personalizzato, analizzando ogni dettaglio del tuo profilo.</p>
              <Progress value={generationProgress} className="w-full [&>div]:bg-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--brand-primary)] font-semibold h-5">{generationStatus}</p>
              <div className="text-xs text-gray-500 list-inside text-left mx-auto max-w-md bg-gray-50/70 p-4 rounded-lg border border-gray-200/60">
                <h4 className="font-semibold text-gray-700 mb-2">Analisi in corso:</h4>
                <ul className="space-y-1">
                  <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 10 ? 'text-green-500' : 'text-gray-300'}`} />Obiettivo: {trainingData.fitness_goal || user?.fitness_goal}</li>
                  <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 30 ? 'text-green-500' : 'text-gray-300'}`} />Vincoli: Dolori, attrezzatura, esperienza</li>
                  <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 60 ? 'text-green-500' : 'text-gray-300'}`} />Sinergia con protocollo nutrizionale</li>
                  <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 85 ? 'text-green-500' : 'text-gray-300'}`} />Costruzione e bilanciamento settimana</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl text-center p-8">
          <BrainCircuit className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-4 animate-bounce" />
          <CardTitle className="text-xl font-bold text-gray-900">Caricamento Profilo Utente...</CardTitle>
          <p className="text-gray-600 mt-2">Attendere mentre recuperiamo i tuoi dati.</p>
        </Card>
      </div>
    );
  }

  if (!hasFeatureAccess(user?.subscription_plan, 'workout_plan')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl p-8">
            <UpgradePrompt requiredPlan={PLANS.PRO} featureName="Piano di Allenamento Personalizzato" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
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
          <Card className="water-glass-effect rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">
                Configura il tuo Piano di Allenamento
              </CardTitle>
              <p className="text-gray-600 text-center">Passo {currentStep + 1} di {TRAINING_STEPS.length}</p>
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
                Indietro
              </Button>
            </div>

            {currentStep < TRAINING_STEPS.length - 1 ? (
              <div className="water-glass-effect rounded-full shadow-lg">
                <Button 
                  onClick={nextStep} 
                  className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-full"
                >
                  Avanti 
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="water-glass-effect rounded-full shadow-lg">
                <Button 
                  onClick={startGeneration} 
                  className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white px-6 py-3 font-semibold rounded-full"
                >
                  Genera Piano 
                  <BrainCircuit className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const days = [
    { id: 'monday', label: 'Lunedì' },
    { id: 'tuesday', label: 'Martedì' },
    { id: 'wednesday', label: 'Mercoledì' },
    { id: 'thursday', label: 'Giovedì' },
    { id: 'friday', label: 'Venerdì' },
    { id: 'saturday', label: 'Sabato' },
    { id: 'sunday', label: 'Domenica' }
  ];
  
  const workoutForSelectedDay = adjustedWorkout || workoutPlans.find(plan => plan.day_of_week === selectedDay);
  
  const getDayLabel = (dayId) => days.find(d => d.id === dayId)?.label || dayId;

  return (
    <>
      {showCheatCompensation && cheatData && (
        <Dialog open={true} onOpenChange={(open) => !open && handleCloseCheatCompensation()}>
          <DialogContent className="bg-white/80 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>🔥 Workout Adattivo AI</DialogTitle>
              <DialogDescription>
                Hai registrato pasti con una differenza di <strong>{cheatData.totalDelta > 0 ? '+' : ''}{cheatData.totalDelta} kcal</strong> rispetto al piano di oggi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-[var(--brand-primary-light)] p-4 rounded-lg border border-[var(--brand-primary)]/30">
                <p className="text-sm text-gray-700">
                  {cheatData.totalDelta > 0 
                    ? `💪 L'AI può intensificare il tuo workout di oggi per bruciare queste calorie extra e mantenerti in linea con i tuoi obiettivi. Vuoi adattare il workout?`
                    : `😌 L'AI può ridurre leggermente l'intensità del workout per adattarsi al tuo intake calorico ridotto. Vuoi adattare il workout?`
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
                Mantieni Workout Normale
              </Button>
              <Button
                onClick={compensateWithWorkout}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                disabled={isCompensating}
              >
                {isCompensating ? "Elaborazione..." : "Adatta Workout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Protocollo di Allenamento</h1>
              <p className="text-gray-600">Programmazione AI e gestione allenamenti personalizzati</p>
            </div>
            <Button 
              onClick={() => setShowAssessment(true)} 
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all px-6 py-6 text-base font-semibold rounded-xl w-full lg:w-auto"
            >
              <BrainCircuit className="w-5 h-5" /> 
              Rigenera Piano con AI
            </Button>
          </div>

          {workoutPlans.length > 0 ? (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardHeader className="border-b border-gray-200/30">
                  <CardTitle>Programmazione Settimanale</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200/80">
                  {days.map((day) => (
                    <button key={day.id} onClick={() => setSelectedDay(day.id)} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 ${selectedDay === day.id ? 'text-[var(--brand-primary)] border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/50' : 'text-gray-500 border-transparent hover:text-[var(--brand-primary)] hover:border-teal-300'}`}>{day.label.substring(0,3)}</button>
                  ))}
                </div>
                <div className="min-h-[300px]">
                  {workoutForSelectedDay ? (
                    workoutForSelectedDay.workout_type !== 'rest' ? (
                      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                        <CardHeader className="border-b border-gray-200/30">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <CardTitle className="text-xl font-bold text-gray-900 mb-1">{workoutForSelectedDay.plan_name}</CardTitle>
                              <p className="text-sm text-gray-500">
                                {getDayLabel(selectedDay)} • {workoutForSelectedDay.total_duration || 0} min • {workoutForSelectedDay.calories_burned || 0} kcal
                              </p>
                            </div>
                            
                            {/* Pulsanti Desktop - nascosti su mobile, IN RIGA */}
                            <div className="hidden md:flex md:flex-row gap-2">
                              <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative whitespace-nowrap"
                                    disabled={!hasFeatureAccess(user?.subscription_plan, 'workout_modification')}
                                  >
                                    <ShieldAlert className="w-4 h-4 mr-2"/> Modifica Sessione
                                    {!hasFeatureAccess(user?.subscription_plan, 'workout_modification') && (
                                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                        Premium
                                      </span>
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-sm">
                                  <DialogHeader>
                                    <DialogTitle>Consulenza AI per la sessione di oggi</DialogTitle>
                                  </DialogHeader>
                                  {!adjustmentResult ? (
                                    <div className="space-y-4 py-4">
                                      <p className="text-sm text-gray-600">Descrivi un dolore, un affaticamento o qualsiasi problema tu stia riscontrando oggi. L'AI modificherà l'allenamento odierno per te.</p>
                                      <Textarea placeholder="Es: 'Oggi sento un leggero dolore al ginocchio destro quando piego la gamba' oppure 'Sono molto stanco, preferirei una sessione più leggera'." value={adjustmentProblem} onChange={(e) => setAdjustmentProblem(e.target.value)} />
                                    </div>
                                  ) : (
                                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                      <div>
                                        <h4 className="font-semibold text-gray-800">Consiglio dell'Esperto AI</h4>
                                        <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg prose-sm" dangerouslySetInnerHTML={{ __html: adjustmentResult.consiglio_esperto.replace(/\n/g, '<br />') }} />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-800">Spiegazione Modifiche</h4>
                                        <p className="text-sm text-gray-600 mt-2">{adjustmentResult.spiegazione_modifiche}</p>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    {!adjustmentResult ? (
                                      <Button onClick={handleDailyAdjustment} disabled={isAdjusting || !adjustmentProblem}>
                                        {isAdjusting ? "L'AI sta pensando..." : "Richiedi Modifica"}
                                      </Button>
                                    ) : (
                                      <Button onClick={() => {setShowAdjustmentDialog(false); setAdjustmentResult(null); setAdjustmentProblem('');}}>Chiudi</Button>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                onClick={() => handleLogWorkout(workoutForSelectedDay)}
                                size="sm"
                                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Registra Allenamento
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-6">
                          {/* Pulsanti Mobile - nascosti su desktop */}
                          <div className="flex md:hidden flex-col gap-3 pb-4 border-b border-gray-200/30">
                            <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="secondary" 
                                  className="w-full bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300 relative"
                                  disabled={!hasFeatureAccess(user?.subscription_plan, 'workout_modification')}
                                >
                                  <ShieldAlert className="w-4 h-4 mr-2"/> Modifica Sessione
                                  {!hasFeatureAccess(user?.subscription_plan, 'workout_modification') && (
                                    <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                      Premium
                                    </span>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px] bg-white/90 backdrop-blur-sm">
                                <DialogHeader>
                                  <DialogTitle>Consulenza AI per la sessione di oggi</DialogTitle>
                                </DialogHeader>
                                {!adjustmentResult ? (
                                  <div className="space-y-4 py-4">
                                    <p className="text-sm text-gray-600">Descrivi un dolore, un affaticamento o qualsiasi problema tu stia riscontrando oggi. L'AI modificherà l'allenamento odierno per te.</p>
                                    <Textarea placeholder="Es: 'Oggi sento un leggero dolore al ginocchio destro quando piego la gamba' oppure 'Sono molto stanco, preferirei una sessione più leggera'." value={adjustmentProblem} onChange={(e) => setAdjustmentProblem(e.target.value)} />
                                  </div>
                                ) : (
                                  <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                    <div>
                                      <h4 className="font-semibold text-gray-800">Consiglio dell'Esperto AI</h4>
                                      <div className="text-sm text-gray-600 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg prose-sm" dangerouslySetInnerHTML={{ __html: adjustmentResult.consiglio_esperto.replace(/\n/g, '<br />') }} />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-800">Spiegazione Modifiche</h4>
                                      <p className="text-sm text-gray-600 mt-2">{adjustmentResult.spiegazione_modifiche}</p>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  {!adjustmentResult ? (
                                    <Button onClick={handleDailyAdjustment} disabled={isAdjusting || !adjustmentProblem}>
                                      {isAdjusting ? "L'AI sta pensando..." : "Richiedi Modifica"}
                                    </Button>
                                  ) : (
                                    <Button onClick={() => {setShowAdjustmentDialog(false); setAdjustmentResult(null); setAdjustmentProblem('');}}>Chiudi</Button>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              onClick={() => handleLogWorkout(workoutForSelectedDay)}
                              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Registra Allenamento
                            </Button>
                          </div>

                          {adjustedWorkout && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-amber-800 font-semibold text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Allenamento modificato dall'AI per la giornata odierna.</p>
                            </div>
                          )}
                          
                          {workoutForSelectedDay.warm_up?.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-2">Riscaldamento</h5>
                              <div className="grid gap-2">
                                {workoutForSelectedDay.warm_up.map((ex, idx) => (
                                  <div key={idx} className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-3 text-sm">
                                    <span className="font-medium text-blue-900">{ex.name}</span>{" "}
                                    <span className="text-blue-700">({ex.duration})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {workoutForSelectedDay.exercises?.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-2">Esercizi Principali</h5>
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {workoutForSelectedDay.exercises.map((ex, idx) => (
                                  <ExerciseCard key={idx} exercise={ex} />
                                ))}
                              </div>
                            </div>
                          )}
                          {workoutForSelectedDay.cool_down?.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-2">Defaticamento</h5>
                              <div className="grid gap-2">
                                {workoutForSelectedDay.cool_down.map((ex, idx) => (
                                  <div key={idx} className="bg-purple-50/50 border border-purple-200/60 rounded-lg p-3 text-sm">
                                    <span className="font-medium text-purple-900">{ex.name}</span>{" "}
                                    <span className="text-purple-700">({ex.duration})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] bg-white/50 backdrop-blur-sm">
                          <Target className="w-10 h-10 text-gray-400 mb-3" />
                          <p className="text-gray-600 font-semibold text-lg">Giorno di Riposo Attivo</p>
                          <p className="text-sm text-gray-500 mt-1">Focus su recupero e mobilità.</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] bg-white/50 backdrop-blur-sm">
                      <Database className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-semibold text-lg">Nessun allenamento per {getDayLabel(selectedDay)}</p>
                      <p className="text-sm text-gray-500 mt-1">Rigenera il piano per creare un programma completo.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <CardTitle className="text-xl text-gray-900 mb-4">Nessun Protocollo di Allenamento</CardTitle>
                <p className="text-gray-600 mb-6">
                  Configura e genera il tuo piano personalizzato per iniziare.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {logWorkout && (
        <WorkoutLogger
          workout={logWorkout}
          user={user}
          onClose={() => setLogWorkout(null)}
          onLogSaved={handleLogSaved}
        />
      )}
    </>
  );
}
