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
import UpgradeCheckoutModal from "../components/modals/UpgradeCheckoutModal";
import RecentMealsHistory from "../components/meals/RecentMealsHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import CalorieMeter from "../components/dashboard/CalorieMeter";
import NutritionUnlockPrompt from "../components/dashboard/NutritionUnlockPrompt";
import CalorieBalanceChart from "../components/dashboard/CalorieBalanceChart";
import TermsAcceptanceModal from "../components/dashboard/TermsAcceptanceModal";
import { useLanguage } from "../components/i18n/LanguageContext";
import { rememberMeManager } from "../components/utils/rememberMeManager";
import PullToRefresh from "../components/mobile/PullToRefresh";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [todayMeals, setTodayMeals] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [photoAnalyzeMeal, setPhotoAnalyzeMeal] = useState(null);
  const [photoAnalyzeInitialFile, setPhotoAnalyzeInitialFile] = useState(null);
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
  const [mealsUpdateTrigger, setMealsUpdateTrigger] = useState(0);
  const [showNutritionUnlock, setShowNutritionUnlock] = useState(false);
  const [showUpgradeCheckout, setShowUpgradeCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('base');
  const [checkoutBilling, setCheckoutBilling] = useState('monthly');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState({ first: 1, second: 0.3 });
  const [showNEATModal, setShowNEATModal] = useState(false);
  const [selectedActivityLevel, setSelectedActivityLevel] = useState(null);

  // Re-defining loadUserData as useCallback to allow external calls (e.g. from handlePhotoAnalyzeClose)
  const loadUserData = useCallback(async () => {
    console.log('🔄 loadUserData called');
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      console.log('👤 User loaded:', currentUser.id, 'subscription:', currentUser.subscription_status);
      
      // ✅ Se l'utente ha completato il quiz ma non ha subscription, rimanda a PostQuizSubscription
      if (currentUser.quiz_completed && (!currentUser.subscription_status || 
          (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial'))) {
        console.warn('⚠️ User completed quiz but no subscription, redirecting to PostQuizSubscription');
        const userLanguage = currentUser.preferred_language || 'it';
        const langPageMap = {
          it: '/itpostquizsubscription',
          en: '/enpostquizsubscription',
          es: '/espostquizsubscription',
          pt: '/ptpostquizsubscription',
          de: '/depostquizsubscription',
          fr: '/frpostquizsubscription'
        };
        const targetUrl = langPageMap[userLanguage] || '/itpostquizsubscription';
        navigate(targetUrl, { replace: true });
        return;
      }
      
      // Se non ha completato il quiz, rimanda al quiz
      if (!currentUser.quiz_completed) {
        console.warn('⚠️ User has not completed quiz, redirecting to Quiz');
        navigate(createPageUrl('Quiz'), { replace: true });
        return;
      }
      
      setUser(currentUser);

      const todayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayDate = new Date().toISOString().split('T')[0];

      console.log('🔍 Fetching weight history for user_id:', currentUser.id);
      
      const basePromises = [
        base44.entities.WeightHistory.list('-date', 30), // Use list() - RLS will filter by user
        base44.entities.MealPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek }),
        base44.entities.MealLog.filter({ user_id: currentUser.id, date: todayDate, is_quick_scan: false })
      ];

      let workoutPlanPromise = Promise.resolve([]);
      if (hasFeatureAccess(currentUser.subscription_plan, 'workout_plan', currentUser.subscription_status)) {
        workoutPlanPromise = base44.entities.WorkoutPlan.filter({ user_id: currentUser.id, day_of_week: todayOfWeek });
      }

      const [fetchedWeightHistory, fetchedTodayMeals, fetchedMealLogs, fetchedWorkoutPlans] = 
        await Promise.all([...basePromises, workoutPlanPromise]);

      console.log('⚖️ Raw weight history from list():', fetchedWeightHistory.length, 'records');
      console.log('⚖️ Raw first entry:', JSON.stringify(fetchedWeightHistory[0]));
      
      // Già ordinato da list('-date'), ma filtriamo per user
      const userWeightHistory = fetchedWeightHistory.filter(w => w.user_id === currentUser.id);
      
      console.log('⚖️ Filtered for current user:', userWeightHistory.length, 'records');
      console.log('📊 User first entry:', JSON.stringify(userWeightHistory[0]));
      
      setWeightHistory(userWeightHistory);
      setTodayMeals(fetchedTodayMeals);
      setMealLogs(fetchedMealLogs);
      setTodayWorkout(fetchedWorkoutPlans?.[0] || null);
      
      console.log('✅ Dashboard data updated');

    } catch (error) {
      if (error?.response?.status === 401 || 
          error?.message?.includes('401') || 
          error?.message?.includes('Authentication required')) {
        console.warn("Authentication error, redirecting to Login.");
        setIsRedirecting(true);
        const dashboardUrl = window.location.origin + createPageUrl('Dashboard');
        base44.auth.redirectToLogin(dashboardUrl);
        return;
      } else {
        console.error("Errore nel caricamento dati:", error);
      }
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Imposta il titolo della pagina
    document.title = 'Dashboard | MyWellness';
    
    loadUserData();
    
    // Genera remember me token dopo login
    const generateToken = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          await rememberMeManager.saveToken();
        }
      } catch (error) {
        console.log('Could not generate remember me token:', error);
      }
    };
    generateToken();
  }, [loadUserData]);

  // Carica le foto progresso quando l'utente è disponibile
  useEffect(() => {
    if (user?.id) {
      loadProgressPhotos();
    }
  }, [user?.id]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const mealsSection = document.getElementById('meals-macros-section');
      if (!mealsSection) return;
      
      const mealsRect = mealsSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Se il secondo box è visibile nella parte superiore della viewport (scrollato in vista)
      if (mealsRect.top < windowHeight * 0.5) {
        mealsSection.style.opacity = '1';
      } else {
        // Altrimenti mantieni l'opacità al 30%
        mealsSection.style.opacity = '0.3';
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Check terms acceptance FIRST, then onboarding
  useEffect(() => {
    const checkTermsAndOnboarding = async () => {
      if (!user) return;

      // 1. Check if user has accepted terms
      if (!user.terms_accepted) {
        setShowTermsModal(true);
        return;
      }

      // 2. Check localStorage first - se è già stato completato in questa sessione, skip
      const onboardingCompletedKey = `onboarding_completed_${user.id}`;
      if (localStorage.getItem(onboardingCompletedKey) === 'true') {
        console.log('✅ Onboarding already completed in this session');
        return;
      }

      // 3. Query il DB per verificare stato reale
      try {
        console.log('🔍 Checking onboarding status in DB for user:', user.id);
        const onboardingRecords = await base44.entities.UserOnboarding.filter({ user_id: user.id });
        console.log('📋 Onboarding records found:', onboardingRecords.length);
        
        if (onboardingRecords.length > 0) {
          console.log('✅ Record exists - onboarding_completed:', onboardingRecords[0].onboarding_completed);
          if (onboardingRecords[0].onboarding_completed) {
            // Salva in localStorage per evitare query ripetute
            localStorage.setItem(onboardingCompletedKey, 'true');
            return;
          }
        }

        // Se non esiste record o non è completato, mostra modal
        console.log('📍 Showing onboarding modal');
        setShowOnboarding(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // Se c'è errore, non mostrare il modal (evita spam)
        localStorage.setItem(onboardingCompletedKey, 'true');
      }
    };

    if (user && !isLoading) {
      checkTermsAndOnboarding();
    }
  }, [user, isLoading]);

  // ✅ Nutrition unlock prompt RIMOSSO - tutti i piani hanno accesso completo

  const handleMealUpdate = (updatedMeal) => {
    const updatedMeals = todayMeals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    setTodayMeals(updatedMeals);
    setSelectedMeal(updatedMeal);
  };

  const handlePhotoAnalyzeCloseActual = async () => {
    setPhotoAnalyzeMeal(null);
    setPhotoAnalyzeInitialFile(null);
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
        alert(t('dashboard.noRemainingMeals'));
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
      alert(t('dashboard.rebalanceSuccess'));
    } catch (error) {
      console.error("Error rebalancing meals:", error);
      alert(t('dashboard.rebalanceError'));
    }
    setIsRebalancing(false);
  };

  const handlePhotoAnalyze = (meal, initialFile = null) => {
    if (!hasFeatureAccess(user.subscription_plan, 'meal_photo_analysis', user.subscription_status)) {
      setShowUpgradeModal(true);
      return;
    }
    setPhotoAnalyzeMeal(meal);
    setPhotoAnalyzeInitialFile(initialFile);
  };

  const handleProgressAnalysisComplete = async (analysisResult) => {
    setShowProgressPhoto(false);
    
    // Ricarica le foto dopo l'analisi
    await loadProgressPhotos();
  };

  const loadProgressPhotos = async () => {
    if (!user?.id) return;
    try {
      const rawPhotos = await base44.entities.ProgressPhoto.filter({ user_id: user.id }, '-created_date', 50);
      console.log('📸 Raw photos from API:', rawPhotos.length, 'total');
      console.log('📸 First raw photo structure:', rawPhotos.length > 0 ? JSON.stringify(rawPhotos[0], null, 2) : 'No photos');
      
      // I dati possono essere nested in 'data' o flat - gestiamo entrambi i casi
      const normalizedPhotos = rawPhotos
        .map(p => {
          const photoData = p.data || p;
          return {
            id: p.id,
            photo_url: photoData.photo_url,
            date: photoData.date,
            weight: photoData.weight,
            notes: photoData.notes,
            ai_analysis: photoData.ai_analysis,
            user_id: photoData.user_id
          };
        })
        .filter(p => p.photo_url && p.photo_url.trim() !== '');
      
      console.log('📸 Normalized photos for user:', normalizedPhotos.length, 'photos');
      if (normalizedPhotos.length > 0) {
        console.log('📸 First normalized photo:', JSON.stringify(normalizedPhotos[0], null, 2));
      }
      setProgressPhotos(normalizedPhotos);
    } catch (error) {
      console.error('Error loading progress photos:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await base44.entities.ProgressPhoto.delete(photoId);
      await loadProgressPhotos();
      alert(t('dashboard.photoDeleteSuccess'));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert(t('dashboard.photoDeleteError'));
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
      alert(t('dashboard.bmrInvalidValue'));
      return;
    }

    setIsSavingBMR(true);
    try {
      await base44.auth.updateMe({ bmr: Math.round(newBMR) });
      setShowEditBMR(false);
      await loadUserData();
      alert(t('dashboard.bmrUpdateSuccess'));
    } catch (error) {
      console.error('Error updating BMR:', error);
      alert(t('dashboard.bmrUpdateError'));
    }
    setIsSavingBMR(false);
  };

  const handleSaveBodyFat = async () => {
    const newBodyFat = parseFloat(editBodyFatValue);
    if (isNaN(newBodyFat) || newBodyFat < 0 || newBodyFat > 100) {
      alert(t('dashboard.bodyFatInvalidValue'));
      return;
    }

    setIsSavingBodyFat(true);
    try {
      await base44.auth.updateMe({ body_fat_percentage: parseFloat(newBodyFat.toFixed(1)) });
      await loadUserData();
      setShowEditBodyFat(false);
      alert(t('dashboard.bodyFatUpdateSuccess'));
    } catch (error) {
      console.error('Error updating body fat:', error);
      alert(t('dashboard.bodyFatUpdateError'));
    }
    setIsSavingBodyFat(false);
  };

  const handleSaveCalories = async () => {
    const newCalories = parseFloat(editCaloriesValue);
    if (isNaN(newCalories) || newCalories <= 0) {
      alert(t('dashboard.caloriesInvalidValue'));
      return;
    }

    setIsSavingCalories(true);
    try {
      await base44.auth.updateMe({ daily_calories: Math.round(newCalories) });
      await loadUserData();
      setShowEditCalories(false);
      alert(t('dashboard.caloriesUpdateSuccess'));
    } catch (error) {
      console.error('Error updating daily calories:', error);
      alert(t('dashboard.caloriesUpdateError'));
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
    // Naviga al Quiz in modalità ricalibrazione
    navigate(createPageUrl("Quiz") + "?from=dashboard");
  };

  const handleAcceptTerms = async () => {
    try {
      await base44.auth.updateMe({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
      });
      setShowTermsModal(false);
      await loadUserData(); // Reload user to update state
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert(t('dashboard.termsAcceptError'));
    }
  };

  const handleSaveActivityLevel = async () => {
    if (!selectedActivityLevel) {
      alert('Seleziona un livello di attività');
      return;
    }

    try {
      await base44.auth.updateMe({ activity_level: selectedActivityLevel });
      setShowNEATModal(false);
      await loadUserData();
      alert('✅ Livello di attività aggiornato');
    } catch (error) {
      console.error('Error updating activity level:', error);
      alert('Errore nell\'aggiornamento');
    }
  };

  if (isLoading || isRebalancing || isRedirecting || !user) {
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
            {isRedirecting ? t('dashboard.redirecting') : (isRebalancing ? t('common.loading') : t('common.loading'))}
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

      {showTermsModal && (
        <TermsAcceptanceModal
          isOpen={showTermsModal}
          onAccept={handleAcceptTerms}
        />
      )}

      {showOnboarding && user && (
        <OnboardingTour 
          user={user} 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}

      <div className="min-h-screen pb-20">
        <PullToRefresh onRefresh={loadUserData}>
        <div className="max-w-7xl mx-auto px-4 pt-0 pb-4 sm:p-6 space-y-4 sm:space-y-8" style={{ overflowX: 'clip' }}>

          <div className="flex justify-center">
            <div className="w-full max-w-5xl space-y-6 sm:space-y-8 onboarding-dashboard-overview">
              <div className="progress-chart-section">
                <AdvancedProgressChart 
                  user={user} 
                  weightHistory={weightHistory} 
                  onWeightLogged={loadUserData}
                  isMobile={isMobile}
                  onEditBMR={handleOpenEditBMR}
                  onEditBodyFat={handleOpenEditBodyFat}
                  onEditCalories={handleOpenEditCalories}
                  isSavingBMR={isSavingBMR}
                  isSavingBodyFat={isSavingBodyFat}
                  isSavingCalories={isSavingCalories}
                  mealsUpdateTrigger={mealsUpdateTrigger}
                  meals={todayMeals}
                  mealLogs={mealLogs}
                  onMealSelect={setSelectedMeal}
                  onPhotoAnalyze={handlePhotoAnalyze}
                  userPlan={user?.subscription_plan}
                  onDataReload={loadUserData}
                  onOpenPhotoGallery={async () => {
                    await loadProgressPhotos();
                    setShowPhotoGallery(true);
                  }}
                  onOpenProgressAnalysis={() => {
                    if (!hasFeatureAccess(user.subscription_plan, 'progress_photo_analysis', user.subscription_status)) {
                      setUpgradePlanTarget('premium');
                      setShowUpgradeModal(true);
                      return;
                    }
                    setShowProgressPhoto(true);
                  }}
                  onEditNEAT={() => {
                    setSelectedActivityLevel(user?.activity_level || 'lightly_active');
                    setShowNEATModal(true);
                  }}
                />
              </div>


            </div>
          </div>
        </div>
        </PullToRefresh>
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
          language={language}
          t={t}
          initialFile={photoAnalyzeInitialFile}
        />
      )}
      {showProgressPhoto && (
        <ProgressPhotoAnalyzer
          user={user}
          onClose={() => setShowProgressPhoto(false)}
          onAnalysisComplete={handleProgressAnalysisComplete}
          onOpenPhotoGallery={async () => {
            await loadProgressPhotos();
            setShowPhotoGallery(true);
          }}
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



      <UpgradeCheckoutModal
        isOpen={showUpgradeCheckout}
        onClose={() => setShowUpgradeCheckout(false)}
        selectedPlan={checkoutPlan}
        selectedBillingPeriod={checkoutBilling}
      />

      {/* Dialog Modifica BMR */}
      <Dialog open={showEditBMR} onOpenChange={setShowEditBMR}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{t('upgradeModal.editBMR')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                {t('upgradeModal.editBMRDesc')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label htmlFor="edit-bmr" className="text-sm font-bold text-gray-900 mb-3 block">
                {t('upgradeModal.bmrLabel')}
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
            
            {editBMRValue && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-amber-900 mb-2">{t('dashboard.calculatedValues')}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <span className="text-sm text-gray-700">🔥 BMR</span>
                    <span className="text-lg font-bold text-gray-900">{Math.round(parseFloat(editBMRValue))} kcal</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <span className="text-sm text-gray-700">⚡ NEAT</span>
                    <span className="text-lg font-bold text-gray-900">{Math.round(parseFloat(editBMRValue) * (user?.activity_level === 'sedentary' ? 0.2 : user?.activity_level === 'lightly_active' ? 0.375 : user?.activity_level === 'moderately_active' ? 0.55 : user?.activity_level === 'very_active' ? 0.725 : user?.activity_level === 'professional_athlete' ? 0.9 : 0.375))} kcal</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <span className="text-sm text-gray-700">💪 Totale</span>
                    <span className="text-lg font-bold text-gray-900">{Math.round(parseFloat(editBMRValue) * (1 + (user?.activity_level === 'sedentary' ? 0.2 : user?.activity_level === 'lightly_active' ? 0.375 : user?.activity_level === 'moderately_active' ? 0.55 : user?.activity_level === 'very_active' ? 0.725 : user?.activity_level === 'professional_athlete' ? 0.9 : 0.375)))} kcal</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveBMR}
                disabled={isSavingBMR}
                className="flex-1 bg-black hover:bg-gray-900 text-white h-12 rounded-full"
              >
                {isSavingBMR ? t('common.loading') : t('upgradeModal.save')}
              </Button>
              <Button
                onClick={() => setShowEditBMR(false)}
                variant="outline"
                className="flex-1 h-12 rounded-full"
              >
                {t('upgradeModal.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Massa Grassa */}
      <Dialog open={showEditBodyFat} onOpenChange={setShowEditBodyFat}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{t('upgradeModal.editBodyFat')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                {t('upgradeModal.editBodyFatDesc')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label htmlFor="edit-bodyfat" className="text-sm font-bold text-gray-900 mb-3 block">
                {t('upgradeModal.bodyFatLabel')}
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
                className="flex-1 bg-black hover:bg-gray-900 text-white h-12 rounded-full"
              >
                {isSavingBodyFat ? t('common.loading') : t('upgradeModal.save')}
              </Button>
              <Button
                onClick={() => setShowEditBodyFat(false)}
                variant="outline"
                className="flex-1 h-12 rounded-full"
              >
                {t('upgradeModal.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Target Calorico */}
      <Dialog open={showEditCalories} onOpenChange={setShowEditCalories}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{t('upgradeModal.editCalorieTarget')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                {t('upgradeModal.editCalorieTargetDesc')}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label htmlFor="edit-calories" className="text-sm font-bold text-gray-900 mb-3 block">
                {t('upgradeModal.calorieTargetLabel')}
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
                className="flex-1 bg-black hover:bg-gray-900 text-white h-12 rounded-full"
              >
                {isSavingCalories ? t('common.loading') : t('upgradeModal.save')}
              </Button>
              <Button
                onClick={() => setShowEditCalories(false)}
                variant="outline"
                className="flex-1 h-12 rounded-full"
              >
                {t('upgradeModal.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica NEAT */}
      <Dialog open={showNEATModal} onOpenChange={setShowNEATModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{t('dashboard.activityLevel')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 leading-relaxed">
                {t('dashboard.activityLevelDesc')}
              </p>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'sedentary', labelKey: 'sedentary', descKey: 'sedentaryDesc' },
                { value: 'lightly_active', labelKey: 'lightlyActive', descKey: 'lightlyActiveDesc' },
                { value: 'moderately_active', labelKey: 'moderatelyActive', descKey: 'moderatelyActiveDesc' },
                { value: 'very_active', labelKey: 'veryActive', descKey: 'veryActiveDesc' },
                { value: 'professional_athlete', labelKey: 'professionalAthlete', descKey: 'professionalAthleteDesc' }
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSelectedActivityLevel(level.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedActivityLevel === level.value
                      ? 'border-[#26847F] bg-[#26847F]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-semibold ${
                    selectedActivityLevel === level.value ? 'text-[#26847F]' : 'text-gray-900'
                  }`}>
                    {t(`dashboard.${level.labelKey}`)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{t(`dashboard.${level.descKey}`)}</p>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveActivityLevel}
                disabled={!selectedActivityLevel}
                className="flex-1 bg-black hover:bg-gray-900 text-white h-12 rounded-full"
              >
                {t('common.save')}
              </Button>
              <Button
                onClick={() => setShowNEATModal(false)}
                variant="outline"
                className="flex-1 h-12 rounded-full"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}