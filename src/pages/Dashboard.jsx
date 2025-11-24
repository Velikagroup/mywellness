import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess, PLANS, UpgradePrompt } from '@/components/utils/subscriptionPlans';
import { Target, TrendingUp, Calendar, Activity, ArrowRight, BarChart3, Users, Settings, RefreshCw, Info, Edit3, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import TechnicalStatsCard from "../components/dashboard/TechnicalStatsCard";
import AdvancedProgressChart from "../components/dashboard/AdvancedProgressChart";
import NutritionOverview from "../components/dashboard/NutritionOverview";
import TrainingStatus from "../components/dashboard/TrainingStatus";
import WeightLogger from "../components/dashboard/WeightLogger";
import MealDetailModal from "../components/meals/MealDetailModal";
import PhotoMealAnalyzer from "../components/meals/PhotoMealAnalyzer";
import ProgressPhotoAnalyzer from "../components/training/ProgressPhotoAnalyzer";
import ProgressPhotoGallery from "../components/training/ProgressPhotoGallery";
import UpgradeModal from "../components/meals/UpgradeModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import CalorieMeter from "../components/dashboard/CalorieMeter";
import NutritionUnlockPrompt from "../components/dashboard/NutritionUnlockPrompt";

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
  const [showPhotoGallery, setShowPhotoGallery] = React.useState(false);
  const [progressPhotos, setProgressPhotos] = React.useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlanTarget, setUpgradePlanTarget] = useState(null);
  const [showEditBMR, setShowEditBMR] = useState(false);
  const [showEditBodyFat, setShowEditBodyFat] = useState(false);
  const [showEditCalories, setShowEditCalories] = useState(false);
  const [editBMRValue, setEditBMRValue] = useState('');
  const [editBodyFatValue, setEditBodyFatValue] = useState('');
  const [editCaloriesValue, setEditCaloriesValue] = useState('');
  const [isSavingBMR, setIsSavingBMR] = useState(false);
  const [isSavingBodyFat, setIsSavingBodyFat] = useState(false);
  const [isSavingCalories, setIsSavingCalories] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCalorieMeter, setShowCalorieMeter] = useState(false);
  const [showNutritionUnlock, setShowNutritionUnlock] = useState(false);

  // Re-defining loadUserData as useCallback to allow external calls (e.g. from handlePhotoAnalyzeClose)
  const loadUserData = useCallback(async () => {
    console.log('🔄 loadUserData called');
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 User loaded:', currentUser.id);
      
      // ✅ Se l'utente non ha subscription, rimanda al quiz
      if (!currentUser.subscription_status || 
          (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial')) {
        console.warn('⚠️ User has no active subscription, redirecting to Quiz');
        navigate(createPageUrl('Quiz'), { replace: true });
        return;
      }
      
      setUser(currentUser);

      const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayDate = new Date().toISOString().split('T')[0];

      const basePromises = [
        base44.entities.WeightHistory.filter({ user_id: currentUser.id }), // Changed: Fetch all, then sort/slice client-side
        base44.entities.MealPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek }),
        base44.entities.MealLog.filter({ user_id: currentUser.id, date: todayDate })
      ];

      let workoutPlanPromise = Promise.resolve([]);
      if (hasFeatureAccess(currentUser.subscription_plan, 'workout_plan')) {
        workoutPlanPromise = base44.entities.WorkoutPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek });
      }

      const [fetchedWeightHistory, fetchedTodayMeals, fetchedMealLogs, fetchedWorkoutPlans] = 
        await Promise.all([...basePromises, workoutPlanPromise]);

      // Sort weight history client-side by date descending, then by created_date descending
      const sortedWeightHistory = fetchedWeightHistory.sort((a, b) => {
        const dateComparison = new Date(b.date) - new Date(a.date);
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.created_date) - new Date(a.created_date);
      }).slice(0, 30); // Keep only last 30 entries

      console.log('⚖️ Weight history fetched:', sortedWeightHistory.length, 'records');
      console.log('📊 Latest weights:', sortedWeightHistory.slice(0, 3).map(w => ({ date: w.date, weight: w.weight })));
      
      setWeightHistory(sortedWeightHistory); // Use sorted and sliced history
      setTodayMeals(fetchedTodayMeals);
      setMealLogs(fetchedMealLogs);
      setTodayWorkout(fetchedWorkoutPlans?.[0] || null);
      
      console.log('✅ Dashboard data updated');

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

  // ✅ Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !user.onboarding_completed) {
        // Check if user has already started onboarding
        try {
          const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
          if (onboardingRecords.length === 0 || !onboardingRecords[0].onboarding_completed) {
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error('Error checking onboarding:', error);
          // Show onboarding anyway if error
          setShowOnboarding(true);
        }
      }
    };

    if (user && !isLoading) {
      checkOnboarding();
    }
  }, [user, isLoading]);

  // ✅ Nutrition unlock prompt per utenti standard
  useEffect(() => {
    if (!user || isLoading) return;
    
    const isStandard = user.subscription_plan === 'standard' || 
                       user.subscription_plan === 'trial' || 
                       !user.subscription_plan;
    
    console.log('🔔 Nutrition unlock check:', { 
      plan: user.subscription_plan, 
      isStandard,
      showNutritionUnlock 
    });
    
    if (!isStandard) {
      console.log('❌ User has premium plan, skipping nutrition unlock');
      return;
    }

    console.log('✅ User is standard/trial - activating nutrition unlock');

    const showPrompt = () => {
      console.log('📢 Opening nutrition unlock prompt');
      setShowNutritionUnlock(true);
    };

    // Mostra dopo 5 secondi al caricamento
    const initialTimeout = setTimeout(showPrompt, 5000);

    // Ripeti ogni 30 secondi dopo il primo
    const interval = setInterval(showPrompt, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, isLoading]);

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
          await base44.entities.MealPlan.update(originalMeal.id, {
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

  const handleProgressAnalysisComplete = async (analysisResult) => {
    let message = `Analisi completata! Progresso: ${analysisResult.overall_progress}\n\n`;
    
    if (analysisResult.workout_adjustment_needed) {
      message += "💪 L'AI suggerisce modifiche al piano di allenamento.\n";
    }
    if (analysisResult.diet_adjustment_needed) {
      message += "🍽️ L'AI suggerisce modifiche al piano nutrizionale.\n";
    }
    
    alert(message);
    setShowProgressPhoto(false);
    
    // Ricarica le foto dopo l'analisi
    await loadProgressPhotos();
  };

  const loadProgressPhotos = async () => {
    if (!user?.id) return;
    try {
      const photos = await base44.entities.ProgressPhoto.filter({ user_id: user.id });
      setProgressPhotos(photos);
    } catch (error) {
      console.error('Error loading progress photos:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await base44.entities.ProgressPhoto.delete(photoId);
      await loadProgressPhotos();
      alert('✅ Foto eliminata con successo');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('❌ Errore durante l\'eliminazione della foto');
    }
  };

  const handleOpenEditBMR = () => {
    setEditBMRValue(user?.bmr || '');
    setShowEditBMR(true);
  };

  const handleOpenEditBodyFat = () => {
    setEditBodyFatValue(user?.body_fat_percentage || '');
    setShowEditBodyFat(true);
  };

  const handleOpenEditCalories = () => {
    setEditCaloriesValue(user?.daily_calories || '');
    setShowEditCalories(true);
  };

  const handleSaveBMR = async () => {
    const newBMR = parseFloat(editBMRValue);
    if (isNaN(newBMR) || newBMR <= 0) {
      alert('Inserisci un valore valido per il BMR');
      return;
    }

    setIsSavingBMR(true);
    try {
      await base44.auth.updateMe({ bmr: Math.round(newBMR) });
      await loadUserData();
      setShowEditBMR(false);
      alert('✅ Metabolismo Basale aggiornato con successo!');
    } catch (error) {
      console.error('Error updating BMR:', error);
      alert('Errore durante l\'aggiornamento del BMR');
    }
    setIsSavingBMR(false);
  };

  const handleSaveBodyFat = async () => {
    const newBodyFat = parseFloat(editBodyFatValue);
    if (isNaN(newBodyFat) || newBodyFat < 0 || newBodyFat > 100) {
      alert('Inserisci un valore valido per la Massa Grassa (0-100%)');
      return;
    }

    setIsSavingBodyFat(true);
    try {
      await base44.auth.updateMe({ body_fat_percentage: parseFloat(newBodyFat.toFixed(1)) });
      await loadUserData();
      setShowEditBodyFat(false);
      alert('✅ Massa Grassa aggiornata con successo!');
    } catch (error) {
      console.error('Error updating body fat:', error);
      alert('Errore durante l\'aggiornamento della Massa Grassa');
    }
    setIsSavingBodyFat(false);
  };

  const handleSaveCalories = async () => {
    const newCalories = parseFloat(editCaloriesValue);
    if (isNaN(newCalories) || newCalories <= 0) {
      alert('Inserisci un valore valido per il Target Calorico');
      return;
    }

    setIsSavingCalories(true);
    try {
      await base44.auth.updateMe({ daily_calories: Math.round(newCalories) });
      await loadUserData();
      setShowEditCalories(false);
      alert('✅ Target Calorico aggiornato con successo!');
    } catch (error) {
      console.error('Error updating daily calories:', error);
      alert('Errore durante l\'aggiornamento del Target Calorico');
    }
    setIsSavingCalories(false);
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

  const handleRecalibrate = () => {
    // Naviga al Quiz in modalità recap
    navigate(createPageUrl("Quiz") + "?mode=recap");
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
          <p className="text-gray-600 font-medium">
            {isRebalancing ? "Ribilanciamento pasti in corso..." : "Caricamento Dati di Sistema..."}
          </p>
        </div>
      </div>
    );
  }
    
  return (
    <>
      <style>{`
        .liquid-glass-button {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 251, 0.75) 100%
          );
          border: 1px solid rgba(156, 163, 175, 0.3);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        .liquid-glass-button:hover {
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.85) 0%,
            rgba(243, 244, 246, 0.75) 50%,
            rgba(249, 250, 251, 0.85) 100%
          );
          border: 1px solid rgba(156, 163, 175, 0.4);
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.12),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {showOnboarding && user && (
        <OnboardingTour 
          user={user} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}

      <div className="min-h-screen pb-20 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 pt-0 pb-4 sm:p-6 space-y-4 sm:space-y-8">
          {/* Header Desktop - nascosto su mobile */}
          <div className="hidden md:flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analisi Progressi</h1>
              <p className="text-gray-600">Tracciamento dettagliato e proiezioni</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRecalibrate}
                className="liquid-glass-button text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Ricalibra</span>
                </div>
              </button>
              <button
                onClick={() => setShowCalorieMeter(true)}
                className="liquid-glass-button text-[#26847F] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Conta Calorie</span>
                </div>
              </button>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRecalibrate}
                className="liquid-glass-button text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Ricalibra</span>
                </div>
              </button>
              <button
                onClick={() => setShowCalorieMeter(true)}
                className="liquid-glass-button text-[#26847F] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Conta Kcal</span>
                </div>
              </button>
            </div>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8 onboarding-dashboard-overview">
              <div className="progress-chart-section">
                <AdvancedProgressChart 
                  user={user} 
                  weightHistory={weightHistory} 
                  onWeightLogged={loadUserData}
                  isMobile={isMobile}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 dashboard-stats-section">
                <NutritionOverview 
                  meals={todayMeals}
                  mealLogs={mealLogs}
                  onMealSelect={setSelectedMeal}
                  onPhotoAnalyze={handlePhotoAnalyze}
                  userPlan={user?.subscription_plan}
                  onUpgradeClick={() => {
                    setUpgradePlanTarget('base');
                    setShowUpgradeModal(true);
                  }}
                />
                <TrainingStatus 
                  workout={todayWorkout} 
                  onProgressPhotoClick={() => {
                    if (!hasFeatureAccess(user.subscription_plan, 'progress_photo_analysis')) {
                      setUpgradePlanTarget('premium');
                      setShowUpgradeModal(true);
                      return;
                    }
                    setShowProgressPhoto(true);
                  }}
                  onViewGalleryClick={async () => {
                    await loadProgressPhotos();
                    setShowPhotoGallery(true);
                  }}
                  userPlan={user?.subscription_plan}
                  onUpgradeClick={() => {
                    setUpgradePlanTarget('pro');
                    setShowUpgradeModal(true);
                  }}
                />
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 onboarding-technical-stats-wrapper">
             <div className="relative">
              <TechnicalStatsCard
                title="Target Calorico"
                value={user.daily_calories || 2000}
                unit="kcal"
                icon={Activity}
                info="Le calorie giornaliere raccomandate per raggiungere il tuo obiettivo. Calcolate su metabolismo, attività e ritmo desiderato."
              />
              <button
                onClick={handleOpenEditCalories}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#26847F] hover:bg-gray-100 rounded-lg transition-all"
                title="Modifica Target Calorico"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <TechnicalStatsCard
                title="Metabolismo Basale (BMR)"
                value={Math.round(user.bmr || 1500)}
                unit="kcal"
                icon={TrendingUp}
              />
              <button
                onClick={handleOpenEditBMR}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#26847F] hover:bg-gray-100 rounded-lg transition-all"
                title="Modifica BMR"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <TechnicalStatsCard
                title="Massa Grassa"
                value={user.body_fat_percentage || 0}
                unit="%"
                icon={BarChart3}
                info="Percentuale di massa grassa calcolata con formula US Navy basata su circonferenze corporee."
              />
              <button
                onClick={handleOpenEditBodyFat}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#26847F] hover:bg-gray-100 rounded-lg transition-all"
                title="Modifica Massa Grassa"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            {/* ✅ Mostra "Giorni di Allenamento" SOLO se ha accesso al workout_plan */}
            {hasFeatureAccess(user?.subscription_plan, 'workout_plan') && (
              <TechnicalStatsCard
                title="Giorni di Allenamento"
                value={user.workout_days || 0}
                unit="giorni/sett"
                icon={Calendar}
                status="consistent"
              />
            )}
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
          onClose={() => {
            setShowUpgradeModal(false);
            setUpgradePlanTarget(null);
          }}
          currentPlan={user?.subscription_plan}
          targetPlan={upgradePlanTarget}
        />
      )}
      
      {showPhotoGallery && (
        <ProgressPhotoGallery
          isOpen={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
          photos={progressPhotos}
          onDeletePhoto={handleDeletePhoto}
        />
      )}

      <CalorieMeter
        isOpen={showCalorieMeter}
        onClose={() => setShowCalorieMeter(false)}
      />

      <NutritionUnlockPrompt
        isOpen={showNutritionUnlock}
        onClose={() => setShowNutritionUnlock(false)}
        onUpgrade={() => {
          setShowNutritionUnlock(false);
          setUpgradePlanTarget('base');
          setShowUpgradeModal(true);
        }}
      />

      {/* Dialog Modifica BMR */}
      <Dialog open={showEditBMR} onOpenChange={setShowEditBMR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Modifica Metabolismo Basale (BMR)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Inserisci il tuo valore personalizzato di BMR se lo hai già calcolato autonomamente. Questo valore verrà utilizzato per i calcoli nutrizionali.
            </p>
            <div>
              <Label htmlFor="edit-bmr" className="text-sm font-semibold text-gray-700 mb-2 block">
                Metabolismo Basale (kcal/giorno)
              </Label>
              <Input
                id="edit-bmr"
                type="number"
                value={editBMRValue}
                onChange={(e) => setEditBMRValue(e.target.value)}
                placeholder="Es: 1800"
                className="h-12 text-base"
                min="500"
                max="5000"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveBMR}
                disabled={isSavingBMR}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                {isSavingBMR ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button
                onClick={() => setShowEditBMR(false)}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Massa Grassa */}
      <Dialog open={showEditBodyFat} onOpenChange={setShowEditBodyFat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Modifica Massa Grassa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Inserisci la tua percentuale di massa grassa se l'hai già calcolata con altri metodi (plicometria, DEXA, bilancia impedenziometrica, ecc.).
            </p>
            <div>
              <Label htmlFor="edit-bodyfat" className="text-sm font-semibold text-gray-700 mb-2 block">
                Massa Grassa (%)
              </Label>
              <Input
                id="edit-bodyfat"
                type="number"
                step="0.1"
                value={editBodyFatValue}
                onChange={(e) => setEditBodyFatValue(e.target.value)}
                placeholder="Es: 18.5"
                className="h-12 text-base"
                min="3"
                max="60"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveBodyFat}
                disabled={isSavingBodyFat}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                {isSavingBodyFat ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button
                onClick={() => setShowEditBodyFat(false)}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Target Calorico */}
      <Dialog open={showEditCalories} onOpenChange={setShowEditCalories}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Modifica Target Calorico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-600">
              Inserisci il tuo target calorico personalizzato se hai un piano specifico o indicazioni dal tuo nutrizionista.
            </p>
            <div>
              <Label htmlFor="edit-calories" className="text-sm font-semibold text-gray-700 mb-2 block">
                Target Calorico (kcal/giorno)
              </Label>
              <Input
                id="edit-calories"
                type="number"
                value={editCaloriesValue}
                onChange={(e) => setEditCaloriesValue(e.target.value)}
                placeholder="Es: 2000"
                className="h-12 text-base"
                min="800"
                max="5000"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveCalories}
                disabled={isSavingCalories}
                className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                {isSavingCalories ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button
                onClick={() => setShowEditCalories(false)}
                variant="outline"
                className="flex-1"
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}