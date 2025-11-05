import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/entities/User";
import { MealPlan } from "@/entities/MealPlan";
import { WorkoutPlan } from "@/entities/WorkoutPlan";
import { WeightHistory } from "@/entities/WeightHistory";
import { MealLog } from "@/entities/MealLog";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess, PLANS, UpgradePrompt } from '@/components/utils/subscriptionPlans';
import { Target, TrendingUp, Calendar, Activity, ArrowRight, BarChart3, Users, Settings, RefreshCw, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import TechnicalStatsCard from "../components/dashboard/TechnicalStatsCard";
import AdvancedProgressChart from "../components/dashboard/AdvancedProgressChart";
import NutritionOverview from "../components/dashboard/NutritionOverview";
import TrainingStatus from "../components/dashboard/TrainingStatus";
import WeightLogger from "../components/dashboard/WeightLogger";
import MealDetailModal from "../components/meals/MealDetailModal";
import PhotoMealAnalyzer from "../components/meals/PhotoMealAnalyzer";
import ProgressPhotoAnalyzer from "../components/training/ProgressPhotoAnalyzer";
import UpgradeModal from "../components/meals/UpgradeModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [photoAnalyzeMeal, setPhotoAnalyzeMeal] = useState(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [mealLogs, setMealLogs] = useState([]);
  const [showProgressPhoto, setShowProgressPhoto] = React.useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Re-defining loadUserData as useCallback to allow external calls (e.g. from handlePhotoAnalyzeClose)
  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayDate = new Date().toISOString().split('T')[0];

      const basePromises = [
        WeightHistory.filter({ user_id: currentUser.id }, ['-date', '-created_date'], 30),
        MealPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek }),
        MealLog.filter({ user_id: currentUser.id, date: todayDate })
      ];

      let workoutPlanPromise = Promise.resolve([]);
      if (hasFeatureAccess(currentUser.subscription_plan, 'workout_plan')) {
        workoutPlanPromise = WorkoutPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek });
      }

      const [fetchedWeightHistory, fetchedTodayMeals, fetchedMealLogs, fetchedWorkoutPlans] = 
        await Promise.all([...basePromises, workoutPlanPromise]);

      setWeightHistory(fetchedWeightHistory);
      setTodayMeals(fetchedTodayMeals);
      setMealLogs(fetchedMealLogs);
      setTodayWorkout(fetchedWorkoutPlans?.[0] || null);

    } catch (error) {
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        console.warn("Authentication error (401), redirecting to Home.");
        navigate(createPageUrl('Home'));
      } else {
        console.error("Errore nel caricamento dati:", error);
      }
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMealUpdate = (updatedMeal) => {
    const updatedMeals = todayMeals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    setTodayMeals(updatedMeals);
    setSelectedMeal(updatedMeal);
  };

  const handlePhotoAnalyzeCloseActual = async () => {
    setPhotoAnalyzeMeal(null);
    await loadUserData();
  };


  const handleRebalanceNeeded = async (deltaCalories, currentMealType) => {
    setPhotoAnalyzeMeal(null);
    setIsRebalancing(true);

    try {
      const mealTypeOrder = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
      const currentIndex = mealTypeOrder.indexOf(currentMealType);
      const remainingMealTypes = mealTypeOrder.slice(currentIndex + 1);
      
      const remainingMeals = todayMeals.filter(m => remainingMealTypes.includes(m.meal_type));

      if (remainingMeals.length === 0) {
        alert("Non ci sono pasti rimanenti oggi da ribilanciare. Lo sgarro sarà compensato domani.");
        setIsRebalancing(false);
        await loadUserData();
        return;
      }

      const rebalancePrompt = `You are an expert nutritionist. The user has consumed ${deltaCalories > 0 ? 'more' : 'less'} calories than planned (${Math.abs(deltaCalories)} kcal difference).

      CRITICAL: Generate ALL content in ITALIAN language. Meal names, ingredient names, and instructions MUST be in Italian.

      User's daily target: ${user.daily_calories} kcal
      Calorie delta to compensate: ${deltaCalories} kcal
      
      Remaining meals today:
      ${JSON.stringify(remainingMeals.map(m => ({ meal_type: m.meal_type, name: m.name, calories: m.total_calories, ingredients: m.ingredients })))}

      Task:
      Adjust the remaining meals to compensate for this delta. ${deltaCalories > 0 ? 'Reduce calories in remaining meals' : 'Can slightly increase remaining meals'}.
      For each remaining meal, provide a modified version with:
      - Italian meal name (e.g., "Insalata Leggera di Pollo", "Salmone al Forno con Verdure")
      - Adjusted ingredients with Italian names (e.g., "petto di pollo", "zucchine", "olio di oliva")
      - Italian units (e.g., "g", "ml", "cucchiaio")
      - Instructions in Italian
      Keep meals realistic, tasty, and nutritionally balanced.

      Return an array of modified meals with the same structure as the originals, but all in Italian.`;

      const rebalancedMeals = await InvokeLLM({
        prompt: rebalancePrompt,
        response_json_schema: {
          type: "object",
          properties: {
            modified_meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meal_type: { type: "string" },
                  name: { type: "string" },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" }
                      }
                    }
                  },
                  instructions: { type: "array", items: { type: "string" } },
                  total_calories: { type: "number" },
                  total_protein: { type: "number" },
                  total_carbs: { type: "number" },
                  total_fat: { type: "number" },
                  prep_time: { type: "number" },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      for (const modifiedMeal of rebalancedMeals.modified_meals) {
        const originalMeal = remainingMeals.find(m => m.meal_type === modifiedMeal.meal_type);
        if (originalMeal) {
          await MealPlan.update(originalMeal.id, {
            ...modifiedMeal,
            image_url: null
          });
        }
      }

      await loadUserData();
      alert("✅ Pasti successivi ribilanciati con successo!");
    } catch (error) {
      console.error("Error rebalancing meals:", error);
      alert("Errore nel ribilanciamento. Riprova.");
    }
    setIsRebalancing(false);
  };

  const handlePhotoAnalyze = (meal) => {
    if (!hasFeatureAccess(user.subscription_plan, 'meal_photo_analysis')) {
      setShowUpgradeModal(true);
      return;
    }
    setPhotoAnalyzeMeal(meal);
  };

  const handleProgressAnalysisComplete = (analysisResult) => {
    let message = `Analisi completata! Progresso: ${analysisResult.overall_progress}\n\n`;
    
    if (analysisResult.workout_adjustment_needed) {
      message += "💪 L'AI suggerisce modifiche al piano di allenamento.\n";
    }
    if (analysisResult.diet_adjustment_needed) {
      message += "🍽️ L'AI suggerisce modifiche al piano nutrizionale.\n";
    }
    
    alert(message);
    setShowProgressPhoto(false);
  };
    
  const { progress: goalProgress, status: goalStatus } = useMemo(() => {
    let progressValue = 0;
    let statusValue = 'off-track';

    if (user && user.target_weight !== undefined && user.current_weight !== undefined) {
      const startWeight = user.current_weight;
      const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : user.current_weight;
      const targetWeight = user.target_weight;

      if (startWeight === targetWeight) {
        progressValue = 100;
      } else if (currentWeight === undefined) {
        progressValue = 0;
      } else {
        const totalDistance = Math.abs(startWeight - targetWeight);
        const distanceCovered = Math.abs(startWeight - currentWeight);

        if (totalDistance === 0) {
          progressValue = 100;
        } else {
          let calculatedProgress = (distanceCovered / totalDistance) * 100;
          
          if (
              (targetWeight < startWeight && currentWeight > startWeight) ||
              (targetWeight > startWeight && currentWeight < startWeight)
             ) {
            calculatedProgress = 0;
          } else if (currentWeight === targetWeight) {
            calculatedProgress = 100;
          } else if (
              (targetWeight < startWeight && currentWeight < targetWeight) ||
              (targetWeight > startWeight && currentWeight > targetWeight)
          ) {
              calculatedProgress = 100;
          }

          progressValue = Math.max(0, Math.min(100, Math.round(calculatedProgress)));
        }
      }
    }

    if (progressValue === 0) {
      statusValue = 'off-track';
    } else if (progressValue === 100) {
      statusValue = 'achieved';
    } else {
      statusValue = 'on-track';
    }

    return { progress: progressValue, status: statusValue };
  }, [user, weightHistory]);

  if (isLoading || isRebalancing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: '#f9fafb',
        backgroundImage: `
          radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
          radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
          radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
          radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%)
        `,
        backgroundAttachment: 'fixed'
      }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
          <p className="text-gray-600 font-medium">
            {isRebalancing ? "Ribilanciamento pasti in corso..." : "Caricamento Dati di Sistema..."}
          </p>
        </div>
      </div>
    );
  }
    
  return (
    <>
      <div className="min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-0 pb-4 sm:p-6 space-y-4 sm:space-y-8">
          {/* Header Desktop - nascosto su mobile */}
          <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analisi Progressi</h1>
              <p className="text-gray-600">Tracciamento dettagliato e proiezioni</p>
            </div>
            <Link to={createPageUrl("Quiz") + "?mode=recap"}>
              <Button 
                variant="outline" 
                className="bg-white/60 backdrop-blur-md hover:bg-white/70 border-gray-200/40 transition-all px-6 py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl w-full lg:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ricalibra
              </Button>
            </Link>
          </div>

        {/* Header Mobile - visibile solo su mobile */}
        {isMobile && (
          <div className="md:hidden mb-6 pb-6 border-b border-gray-200/30">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Analisi Progressi</h1>
                <p className="text-sm text-gray-600">Tracciamento dettagliato e proiezioni</p>
              </div>
            </div>
            <Link to={createPageUrl("Quiz") + "?mode=recap"} className="block">
              <Button 
                variant="outline" 
                className="w-full bg-white/60 backdrop-blur-md hover:bg-white/70 border-gray-200/40 transition-all px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ricalibra
              </Button>
            </Link>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AdvancedProgressChart 
                user={user} 
                weightHistory={weightHistory} 
                onWeightLogged={loadUserData}
                isMobile={isMobile}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <NutritionOverview 
                  meals={todayMeals}
                  mealLogs={mealLogs}
                  onMealSelect={setSelectedMeal}
                  onPhotoAnalyze={handlePhotoAnalyze}
                  userPlan={user?.subscription_plan}
                />
                {hasFeatureAccess(user?.subscription_plan, 'workout_plan') ? (
                  <TrainingStatus 
                    workout={todayWorkout} 
                    onProgressPhotoClick={() => {
                      if (!hasFeatureAccess(user.subscription_plan, 'progress_photo_analysis')) {
                        setShowUpgradeModal(true);
                        return;
                      }
                      setShowProgressPhoto(true);
                    }}
                    userPlan={user?.subscription_plan}
                  />
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl p-6">
                    <UpgradePrompt 
                      requiredPlan={PLANS.PRO} 
                      featureName="Piano di Allenamento"
                      onUpgradeClick={() => setShowUpgradeModal(true)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
             <TechnicalStatsCard
              title="Target Calorico"
              value={user.daily_calories || 2000}
              unit="kcal"
              icon={Activity}
              info="Le calorie giornaliere raccomandate per raggiungere il tuo obiettivo. Calcolate su metabolismo, attività e ritmo desiderato."
            />
            <TechnicalStatsCard
              title="Metabolismo Basale (BMR)"
              value={Math.round(user.bmr || 1500)}
              unit="kcal"
              icon={TrendingUp}
            />
            <TechnicalStatsCard
              title="Massa Grassa"
              value={user.body_fat_percentage || 0}
              unit="%"
              icon={BarChart3}
              info="Percentuale di massa grassa calcolata con formula US Navy basata su circonferenze corporee."
            />
            <TechnicalStatsCard
              title="Avanzamento Obiettivo"
              value={goalProgress}
              unit="%"
              icon={Target}
              status={goalStatus}
            />
            <TechnicalStatsCard
              title="Giorni di Allenamento"
              value={user.workout_days || 0}
              unit="giorni/sett"
              icon={Calendar}
              status="consistent"
            />
          </div>
          </div>
        </div>
      </div>
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onMealUpdate={handleMealUpdate}
        />
      )}
      {photoAnalyzeMeal && (
        <PhotoMealAnalyzer
          meal={photoAnalyzeMeal}
          user={user}
          onClose={handlePhotoAnalyzeCloseActual}
          onRebalanceNeeded={handleRebalanceNeeded}
        />
      )}
      {showProgressPhoto && (
        <ProgressPhotoAnalyzer
          user={user}
          onClose={() => setShowProgressPhoto(false)}
          onAnalysisComplete={handleProgressAnalysisComplete}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user?.subscription_plan}
        />
      )}
    </>
  );
}