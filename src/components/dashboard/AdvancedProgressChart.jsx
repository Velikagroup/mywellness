import React, { useState, useMemo, useEffect } from 'react';

import { TrendingDown, TrendingUp, Scale, Save, RefreshCw, Activity, BarChart3, Edit3, Flame, Gauge, Flame as FlameIcon, HelpCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { WeightHistory } from "@/entities/WeightHistory";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../i18n/LanguageContext';
import CalorieBalanceChart from './CalorieBalanceChart';
import CalorieBalanceSection from './CalorieBalanceSection';
import TechnicalStatsCard from './TechnicalStatsCard';
import MealsAndMacrosCard from './MealsAndMacrosCard';
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

const KCAL_PER_KG = 7700;

const getActivityMultiplier = (activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    professional_athlete: 1.9
  };
  return multipliers[activityLevel] || 1.2;
};

const calculateBMR = (userData) => {
  // Se BMR è customizzato, usa quello
  if (userData?.bmr) {
    return userData.bmr;
  }
  
  if (!userData?.gender || !userData?.current_weight || !userData?.height) return 0;
  
  let age = 30;
  if (userData.birthdate) {
    const birthDate = new Date(userData.birthdate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  
  const weight = userData.current_weight;
  const height = userData.height;
  
  if (userData.gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

const calculateNEAT = (userData) => {
  const bmr = calculateBMR(userData);
  const activityMultipliers = {
    sedentary: 0.2,
    lightly_active: 0.375,
    moderately_active: 0.55,
    very_active: 0.725,
    professional_athlete: 0.9
  };
  
  const multiplier = activityMultipliers[userData?.activity_level] || 0.375;
  return bmr * multiplier;
};

export default function AdvancedProgressChart({ user, weightHistory = [], onWeightLogged, isMobile = false, onEditBMR, onEditBodyFat, onEditCalories, onEditNEAT, isSavingBMR, isSavingBodyFat, isSavingCalories, mealsUpdateTrigger, meals = [], mealLogs = [], onMealSelect, onPhotoAnalyze, userPlan, onDataReload, onOpenPhotoGallery, onOpenProgressAnalysis }) {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [isSaving, setIsSaving] = useState(false);
  const [todayCalorieBalance, setTodayCalorieBalance] = useState(null);
  const [accumulatedCalories, setAccumulatedCalories] = useState(0);
  const [todayMacros, setTodayMacros] = useState({ 
    planned: { protein: 0, carbs: 0, fat: 0 },
    consumed: { protein: 0, carbs: 0, fat: 0 }
  });
  const [savingMealId, setSavingMealId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showBodyFatModal, setShowBodyFatModal] = useState(false);
  const [neckCirc, setNeckCirc] = useState(user?.neck_circumference || '');
  const [waistCirc, setWaistCirc] = useState(user?.waist_circumference || '');
  const [hipCirc, setHipCirc] = useState(user?.hip_circumference || '');
  const [savingBodyFat, setSavingBodyFat] = useState(false);

  useEffect(() => {
    const loadCalorieData = async () => {
      if (!user?.id) return;
      
      try {
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

        const mealPlans = await base44.entities.MealPlan.filter({
          user_id: user.id,
          day_of_week: dayOfWeek
        });

        const mealLogs = await base44.entities.MealLog.filter({
          user_id: user.id,
          date: today,
          is_quick_scan: false
        });

        const plannedCalories = mealPlans.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
        const plannedProtein = mealPlans.reduce((sum, meal) => sum + (meal.total_protein || 0), 0);
        const plannedCarbs = mealPlans.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0);
        const plannedFat = mealPlans.reduce((sum, meal) => sum + (meal.total_fat || 0), 0);

        // Calcola i macro consumati SOLO dai meal log del giorno corrente
        const consumedProtein = mealLogs.reduce((sum, log) => sum + (log.actual_protein || 0), 0);
        const consumedCarbs = mealLogs.reduce((sum, log) => sum + (log.actual_carbs || 0), 0);
        const consumedFat = mealLogs.reduce((sum, log) => sum + (log.actual_fat || 0), 0);

        setTodayMacros({
          planned: {
            protein: Math.round(plannedProtein),
            carbs: Math.round(plannedCarbs),
            fat: Math.round(plannedFat)
          },
          consumed: {
            protein: Math.round(consumedProtein),
            carbs: Math.round(consumedCarbs),
            fat: Math.round(consumedFat)
          }
        });

        let consumedCalories = 0;
        const loggedMealTypes = new Set(mealLogs.map(log => log.meal_type));
        
        consumedCalories += mealLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0);
        
        mealPlans.forEach(meal => {
          if (!loggedMealTypes.has(meal.meal_type)) {
            consumedCalories += (meal.total_calories || 0);
          }
        });

        const bmr = calculateBMR(user);
        const neat = calculateNEAT(user);
        const totalBurned = bmr + neat;
        const balance = consumedCalories - totalBurned;

        setTodayCalorieBalance(balance);

        // Carica l'accumulo dai CalorieBalance records dopo l'ultima registrazione peso
        const lastWeightLog = weightHistory.length > 0 ? weightHistory[0] : null;
        const lastWeightDate = lastWeightLog?.date || lastWeightLog?.created_date?.split('T')[0];

        if (lastWeightDate) {
          // Carica tutti i CalorieBalance DOPO l'ultima registrazione peso
          const calorieBalances = await base44.entities.CalorieBalance.filter({
            user_id: user.id
          }, '-date', 1000);

          // Filtra solo quelli dopo l'ultima registrazione peso
          const balancesAfterWeight = calorieBalances.filter(b => b.date > lastWeightDate);
          
          // Prendi l'ultimo accumulo (il più recente)
          const latestBalance = balancesAfterWeight.length > 0 ? balancesAfterWeight[0] : null;
          
          if (latestBalance) {
            setAccumulatedCalories(latestBalance.accumulated_balance || 0);
          } else {
            setAccumulatedCalories(0);
          }
        } else {
          // Nessuna registrazione peso, usa l'ultimo accumulo totale
          const calorieBalances = await base44.entities.CalorieBalance.filter({
            user_id: user.id
          }, '-date', 1);

          if (calorieBalances.length > 0) {
            setAccumulatedCalories(calorieBalances[0].accumulated_balance || 0);
          }
        }

      } catch (error) {
        console.error('Error loading calorie data:', error);
      }
    };

    loadCalorieData();
  }, [user, weightHistory, mealsUpdateTrigger, refreshTrigger]);

  const [calorieBalanceMap, setCalorieBalanceMap] = React.useState({});
  const [showConsumedTooltip, setShowConsumedTooltip] = React.useState(false);
  const [showBurnedTooltip, setShowBurnedTooltip] = React.useState(false);
  const [consumedTooltipClicked, setConsumedTooltipClicked] = React.useState(false);
  const [burnedTooltipClicked, setBurnedTooltipClicked] = React.useState(false);

  // Carica i CalorieBalance per mostrare i dati accanto ai punti del peso
  useEffect(() => {
    const loadCalorieBalances = async () => {
      if (!user?.id) return;
      try {
        const balances = await base44.entities.CalorieBalance.filter({
          user_id: user.id
        }, '-date', 1000);
        
        const map = {};
        balances.forEach(b => {
          map[b.date] = Math.round(b.daily_balance || 0);
        });
        setCalorieBalanceMap(map);
      } catch (error) {
        console.error('Error loading calorie balances:', error);
      }
    };
    
    loadCalorieBalances();
  }, [user?.id, refreshTrigger]);

  const lineData = useMemo(() => {
    console.log('📈 lineData calculation - weightHistory:', weightHistory?.length, 'entries');
    
    // Usa il peso iniziale dal profilo utente
    const startWeight = user?.current_weight || 0;
    const userCreatedDate = user?.created_date;
    
    // Se non c'è storico, mostra almeno il peso iniziale
    if (!weightHistory || weightHistory.length === 0) {
      console.log('📈 No weight history, using startWeight:', startWeight);
      if (startWeight > 0) {
        const dateLabel = userCreatedDate 
          ? format(new Date(userCreatedDate), 'dd MMM')
          : format(new Date(), 'dd MMM');
        return [{ name: dateLabel, weight: startWeight }];
      }
      return [];
    }
    
    console.log('📈 First entry:', JSON.stringify(weightHistory[0]));
    
    // Ordina per data crescente (più vecchio a sinistra, più recente a destra)
    let sortedHistory = [...weightHistory].sort((a, b) => {
      const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
      const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // Se stessa data, ordina per created_date
      return new Date(a.created_date) - new Date(b.created_date);
    });

    // Controlla se il primo peso registrato è diverso dal peso iniziale del profilo
    // Se sì, aggiungi il peso iniziale come primo punto
    const firstRecordedWeight = sortedHistory[0]?.weight;
    if (startWeight > 0 && Math.abs(firstRecordedWeight - startWeight) > 0.01) {
      // Il peso iniziale del profilo è diverso dalla prima registrazione
      // Aggiungi il peso iniziale come primo punto del grafico
      const startDate = userCreatedDate 
        ? new Date(userCreatedDate).toISOString().substring(0, 10)
        : new Date(sortedHistory[0].created_date).toISOString().substring(0, 10);
      
      const firstRecordDate = sortedHistory[0].date || new Date(sortedHistory[0].created_date).toISOString().substring(0, 10);
      
      // Aggiungi solo se la data del peso iniziale è prima o uguale alla prima registrazione
      if (startDate <= firstRecordDate) {
        sortedHistory = [{
          weight: startWeight,
          date: startDate,
          created_date: userCreatedDate || sortedHistory[0].created_date,
          isInitialWeight: true
        }, ...sortedHistory];
      }
    }

    const entriesByDay = sortedHistory.reduce((acc, entry) => {
        const dayKey = entry.date || new Date(entry.created_date).toISOString().substring(0, 10);
        if (!acc[dayKey]) {
            acc[dayKey] = [];
        }
        acc[dayKey].push(entry);
        return acc;
    }, {});

    const result = sortedHistory.map(entry => {
        const dayKey = entry.date || new Date(entry.created_date).toISOString().substring(0, 10);
        const entriesForDay = entriesByDay[dayKey];
        
        const dateToFormat = entry.date ? new Date(entry.date + 'T12:00:00') : new Date(entry.created_date);
        
        const label = entriesForDay.length > 1 
            ? format(dateToFormat, 'dd MMM HH:mm') 
            : format(dateToFormat, 'dd MMM'); 
        
        return {
            name: label,
            weight: entry.weight,
            calorieBalance: calorieBalanceMap[dayKey] || null
        };
    });
    
    console.log('📈 lineData result:', result);
    return result;
  }, [weightHistory, user, calorieBalanceMap]);

  const calculateBodyFatNavyFormula = (userData) => {
    if (userData.gender === 'male') {
      // Men: neck, waist (cm), height (cm)
      if (!userData.neck_circumference || !userData.waist_circumference || !userData.height) {
        return null;
      }
      const abdomen = userData.waist_circumference;
      const neck = userData.neck_circumference;
      const heightCm = userData.height;

      const ratio = (abdomen - neck) / 2.54;
      const heightInches = heightCm / 2.54;

      const bodyFat = 86.010 * Math.log10(ratio) - 70.041 * Math.log10(heightInches) + 36.76;
      return Math.max(0, parseFloat(bodyFat.toFixed(1)));
    } else {
      // Women: neck, waist, hip (cm), height (cm)
      if (!userData.neck_circumference || !userData.waist_circumference || !userData.hip_circumference || !userData.height) {
        return null;
      }
      const waist = userData.waist_circumference;
      const hip = userData.hip_circumference;
      const neck = userData.neck_circumference;
      const heightCm = userData.height;

      const circumference = waist + hip - neck;
      const heightInches = heightCm / 2.54;

      const bodyFat = 163.205 * Math.log10(circumference) - 97.684 * Math.log10(heightInches) - 78.387;
      return Math.max(0, parseFloat(bodyFat.toFixed(1)));
    }
  };

  const handleSaveBodyFatCircumferences = async () => {
    if (!neckCirc || !waistCirc || (user.gender === 'female' && !hipCirc)) {
      alert('Inserisci tutti i dati richiesti');
      return;
    }

    setSavingBodyFat(true);
    try {
      // Aggiorna le circonferenze nel profilo
      const updateData = {
        neck_circumference: parseFloat(neckCirc),
        waist_circumference: parseFloat(waistCirc)
      };

      if (user.gender === 'female') {
        updateData.hip_circumference = parseFloat(hipCirc);
      }

      await base44.auth.updateMe(updateData);

      // Calcola la nuova massa grassa
      const updatedUser = { ...user, ...updateData };
      const calculatedBodyFat = calculateBodyFatNavyFormula(updatedUser);

      if (calculatedBodyFat !== null) {
        await base44.auth.updateMe({ body_fat_percentage: calculatedBodyFat });
      }

      alert('✅ Massa grassa aggiornata con successo!');
      setShowBodyFatModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving body fat data:', error);
      alert('Errore durante il salvataggio');
    }
    setSavingBodyFat(false);
  };

  const handleSaveWeight = async () => {
    console.log('🔍 handleSaveWeight called', { weight, user: user?.id, isSaving });

    if (!weight || !user) {
      console.warn('⚠️ Missing weight or user', { weight, userId: user?.id });
      alert(t('progressChart.enterValidWeight'));
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weightValue = weightUnit === 'lbs' 
        ? parseFloat(weight) / 2.20462 
        : parseFloat(weight);

      const weightData = {
        user_id: user.id,
        weight: weightValue,
        date: today
      };

      console.log('💾 Saving weight:', weightData);

      await base44.entities.WeightHistory.create(weightData);

      // Calcola automaticamente la massa grassa usando formula Navy
      const calculatedBodyFat = calculateBodyFatNavyFormula(user);
      if (calculatedBodyFat !== null) {
        console.log('📊 Updating body fat percentage:', calculatedBodyFat);
        await base44.auth.updateMe({ body_fat_percentage: calculatedBodyFat });
      }

      console.log('✅ Weight saved successfully');
      setWeight('');
      setWeightUnit('kg');
      setRefreshTrigger(prev => prev + 1);

      if (onWeightLogged) {
        console.log('🔄 Calling onWeightLogged callback');
        await onWeightLogged();
      }

      alert('✅ ' + t('progressChart.weightSaved'));
    } catch (error) {
      console.error("❌ Errore nel salvare il peso:", error);
      alert(`${t('progressChart.saveError')}: ${error.message || 'Riprova'}`);
      }
      setIsSaving(false);
      };

      const handleCheckMeal = async (meal, checked) => {
      if (!checked) return;

      setSavingMealId(meal.id);
      try {
      const todayDate = new Date().toISOString().split('T')[0];
      const currentUser = await base44.auth.me();

      await base44.entities.MealPlan.update(meal.id, {
        is_completed: true
      });

      await base44.entities.MealLog.create({
        user_id: currentUser.id,
        original_meal_id: meal.id,
        date: todayDate,
        meal_type: meal.meal_type,
        actual_calories: meal.total_calories,
        actual_protein: meal.total_protein,
        actual_carbs: meal.total_carbs,
        actual_fat: meal.total_fat,
        planned_calories: meal.total_calories,
        delta_calories: 0,
        rebalanced: false
      });

      if (onDataReload) {
        await onDataReload();
      }
      } catch (error) {
      console.error('Error logging meal:', error);
      alert(t('nutrition.errorSavingMeal') || 'Errore nel salvare il pasto');
      }
      setSavingMealId(null);
      };

      const getMealLog = (mealId) => {
      return mealLogs.find(log => log.original_meal_id === mealId);
      };

      const getMealTypeLabel = (type) => {
      return t(`meals.${type}`) || type;
      };

      if (!user) {
      return null;
      }
  
  const startWeight = user.current_weight || 0;
  const targetWeight = user.target_weight || 0;
  
  // Ordina per data per trovare primo e ultimo peso registrato
  const sortedByDate = [...weightHistory].sort((a, b) => {
    const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
    const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    // Se stessa data, ordina per created_date (più recente ultimo)
    return new Date(a.created_date) - new Date(b.created_date);
  });
  
  // Ultimo peso registrato (più recente)
  const lastRecordedWeight = sortedByDate.length > 0 ? parseFloat(sortedByDate[sortedByDate.length - 1].weight) : startWeight;
  
  // Variazione = ultimo peso - peso iniziale dal profilo (non dalla prima registrazione!)
  // Il peso iniziale è quello inserito nel quiz (startWeight), non la prima registrazione
  const weightVariation = lastRecordedWeight - startWeight;
  
  const totalWeightToChange = startWeight - targetWeight;
  const remainingToTarget = lastRecordedWeight - targetWeight;
  const isWeightLoss = totalWeightToChange > 0;
  
  // Progresso positivo: se vuoi perdere peso e hai perso, o se vuoi aumentare e hai aumentato
  const isGoodProgress = isWeightLoss 
    ? (weightVariation < 0)
    : (weightVariation > 0);

  // Calcola il progresso reale (positivo = avanzato verso obiettivo, negativo = regresso)
  const weightProgressTowardsGoal = isWeightLoss 
    ? (startWeight - lastRecordedWeight)  // Per perdita peso: positivo se hai perso
    : (lastRecordedWeight - startWeight); // Per aumento peso: positivo se hai guadagnato
  
  let progressPercentage = 0;
  if (totalWeightToChange !== 0) {
      progressPercentage = (weightProgressTowardsGoal / Math.abs(totalWeightToChange)) * 100;
  } else if (startWeight === targetWeight) {
      progressPercentage = 100;
  }
  // Permetti valori negativi per mostrare regresso, ma limita a -100% e +100%
  const clampedProgressPercentage = Math.max(-100, Math.min(100, progressPercentage));
  const displayProgressPercentage = Math.max(0, clampedProgressPercentage); // Per il display mostra minimo 0%

  const allWeights = weightHistory.map(d => d.weight).concat([startWeight, targetWeight]).filter(w => w > 0);
  const yAxisDomain = allWeights.length > 0 
    ? [Math.floor(Math.min(...allWeights) - 2), Math.ceil(Math.max(...allWeights) + 2)]
    : [0, 100];

  const totalKcalToChange = Math.abs(totalWeightToChange) * KCAL_PER_KG;
  
  // Se il progresso è negativo (regresso), le kcal completate sono 0 e le restanti aumentano
  const isRegressing = weightProgressTowardsGoal < 0;
  let kcalCompleted = isRegressing ? 0 : Math.abs(weightProgressTowardsGoal) * KCAL_PER_KG;
  
  // Aggiungi l'accumulo dei deficit calorici dal cron DOPO l'ultima registrazione peso
  if (accumulatedCalories !== 0) {
    const accumulatedContribution = isWeightLoss
      ? Math.max(0, -accumulatedCalories)  // Per dimagrimento: solo deficit negativi
      : Math.max(0, accumulatedCalories);   // Per aumento: solo surplus positivi
    
    kcalCompleted += accumulatedContribution;
  }
  
  // Aggiungi il contributo di oggi se l'obiettivo è coerente con il balance
  if (todayCalorieBalance !== null) {
    const todayContribution = isWeightLoss 
      ? Math.max(0, -todayCalorieBalance)  // Per dimagrimento: solo se deficit (negativo)
      : Math.max(0, todayCalorieBalance);   // Per aumento: solo se surplus (positivo)
    
    kcalCompleted += todayContribution;
  }
  
  const kcalRemaining = isRegressing 
    ? totalKcalToChange + Math.abs(weightProgressTowardsGoal) * KCAL_PER_KG
    : Math.max(0, totalKcalToChange - kcalCompleted);

  const pieData = [
    { name: t('progressChart.completedLabel'), value: kcalCompleted },
    { name: t('progressChart.remainingLabel'), value: Math.max(0, kcalRemaining) },
  ];

  // Colori: verde per completato, grigio normale per restante, rosso se in regresso
  const COLORS = isRegressing ? ['#26847F', '#ef4444'] : ['#26847F', '#e5e7eb'];

  const uniqueMeals = meals.reduce((acc, meal) => {
    const existing = acc.find(m => m.meal_type === meal.meal_type);
    if (!existing || new Date(meal.created_date) > new Date(existing.created_date)) {
      return [...acc.filter(m => m.meal_type !== meal.meal_type), meal];
    }
    return acc;
  }, []);

  const mealOrder = { breakfast: 1, snack1: 2, lunch: 3, snack2: 4, dinner: 5 };
  const sortedMeals = uniqueMeals.sort((a, b) => (mealOrder[a.meal_type] || 999) - (mealOrder[b.meal_type] || 999));

  return (
    <>
      {(() => {
        const totalWeightToChange = startWeight - targetWeight;
        const actualDirection = lastRecordedWeight - startWeight;

        // Verde se movimento è coerente con l'obiettivo
        const isAligned = (totalWeightToChange > 0 && actualDirection < 0) || 
                         (totalWeightToChange < 0 && actualDirection > 0) ||
                         (totalWeightToChange === 0);

        // Logica colori per le calorie di oggi
        const isWeightLoss = totalWeightToChange > 0;
        const isCalorieAligned = isWeightLoss 
          ? (todayCalorieBalance !== null && todayCalorieBalance < 0)
          : (todayCalorieBalance !== null && todayCalorieBalance > 0);
        const calorieColor = isCalorieAligned ? 'text-green-700' : 'text-red-700';
        const calorieBackground = isCalorieAligned ? 'from-green-50/70 to-green-100/30 border-green-200/40' : 'from-red-50/70 to-red-100/30 border-red-200/40';

        return (
          <div className="flex flex-col bg-white/65 rounded-xl p-6 border border-gray-200/30 backdrop-blur-md shadow-xl" id="progress-section">
            
            {/* Riga superiore: Bilancio Calorico + Peso Attuale → Target */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-2 pb-6">
              
              {/* Bilancio Calorico */}
              <div className="flex-1">
                {todayCalorieBalance !== null ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-8 h-8 text-orange-500" />
                      <p className="text-sm font-semibold text-gray-700">{t('nutrition.todayBalance')}</p>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <p className={`text-5xl font-['Inter'] font-bold ${calorieColor} leading-tight`} style={{
                        filter: isCalorieAligned 
                          ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.18)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.12))'
                          : 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.18)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.12))'
                      }}>
                        {todayCalorieBalance > 0 ? '+' : ''}{Math.round(todayCalorieBalance)}
                      </p>
                      <p className={`text-xl font-medium ${calorieColor}`}>kcal</p>
                    </div>
                    {todayCalorieBalance !== null && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        isCalorieAligned 
                          ? 'bg-green-100/70 text-green-700'
                          : 'bg-red-100/70 text-red-700'
                      }`}>
                        {isWeightLoss 
                          ? (isCalorieAligned ? t('nutrition.inStrongDeficit') : t('nutrition.inSurplus'))
                          : (isCalorieAligned ? t('nutrition.inSurplus') : t('nutrition.inDeficit'))
                        }
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic mb-3">Dati non disponibili</p>
                )}
              </div>

              {/* Peso Attuale → Target */}
              <div className="absolute md:relative top-0 md:top-auto right-0 md:right-auto flex flex-row items-center justify-center md:justify-end gap-1 md:gap-3 w-auto border border-gray-200/60 rounded-lg px-2 py-1 md:px-4 md:py-3 md:-mt-12">
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5 md:gap-1.5">
                    <p className={`font-bold bg-gradient-to-r ${isAligned ? 'from-green-600 to-emerald-500' : 'from-red-600 to-rose-500'} bg-clip-text text-transparent`} style={{ fontSize: '16px' }}>{lastRecordedWeight.toFixed(1)}</p>
                    <p className={`text-xs md:text-sm font-semibold ${isAligned ? 'text-green-600' : 'text-red-600'}`}>kg</p>
                  </div>
                </div>
                <div className="font-light text-gray-400" style={{ fontSize: '16px' }}>&gt;</div>
                <div className="text-left">
                  <div className="flex items-baseline gap-0.5 md:gap-1.5">
                    <p className="font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent" style={{ fontSize: '16px' }}>{targetWeight.toFixed(1)}</p>
                    <p className="text-xs md:text-sm font-semibold text-teal-600">kg</p>
                  </div>
                </div>
              </div>

            </div>

          {/* Grafico Peso */}
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="bodyFatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="weightLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#26847F" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#26847F" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#26847F" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tickLine={false} axisLine={{ stroke: '#e0e0e0' }} style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} domain={yAxisDomain} tickFormatter={(value) => `${value}kg`} style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                  formatter={(value, name, props) => {
                    if (name === 'weight') {
                      return [`${value.toFixed(1)} kg`, 'Peso'];
                    }
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg">
                          <p className="font-semibold text-gray-900">{data.name}</p>
                          <p className="text-sm text-gray-700">{data.weight.toFixed(1)} kg</p>
                          {data.calorieBalance !== null && (
                            <p className={`text-sm font-semibold ${data.calorieBalance < 0 ? 'text-green-600' : data.calorieBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              Bilancio: {data.calorieBalance > 0 ? '+' : ''}{data.calorieBalance} kcal
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }} 
                  cursor={{ stroke: '#26847F', strokeWidth: 2, strokeDasharray: '5 5' }} 
                />
                <ReferenceLine 
                  y={targetWeight} 
                  stroke="#26847F" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Target', 
                    position: 'insideTopRight', 
                    fill: '#26847F', 
                    fontSize: 13,
                    fontWeight: 'bold'
                  }}
                />
                {lineData.length > 0 && user.body_fat_percentage && (
                  <ReferenceLine 
                    x={lineData[lineData.length - 1].name}
                    stroke="url(#bodyFatGradient)"
                    strokeWidth={100}
                    isFront={false}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="url(#weightLineGradient)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#26847F', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2 }} 
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="absolute top-2 right-8 flex flex-col gap-2">
              <button 
                onClick={() => setShowBodyFatModal(true)}
                className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border-2 border-purple-400 shadow-lg hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-2"
              >
                <div>
                  {user.body_fat_percentage ? (
                    <>
                      <p className="text-sm font-bold text-purple-700">{parseFloat(user.body_fat_percentage).toFixed(1)}%</p>
                      <p className="text-xs text-purple-600">{t('nutrition.bodyFat')}</p>
                    </>
                  ) : (
                    <HelpCircle className="w-6 h-6 text-purple-600" />
                  )}
                </div>
              </button>
            </div>
          </div>



            {/* Progress Bar Calorie - tra icone e macro */}
            <div className="space-y-4 mt-6 pt-4 border-t border-gray-200/50">
              {/* Calorie Consumate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp className={isWeightLoss ? "w-4 h-4 text-red-600" : "w-4 h-4 text-green-600"} />
                    {t('nutrition.caloriesConsumed')}
                  </span>
                  <span className={`font-bold ${isWeightLoss ? "text-red-500" : "text-green-500"}`}>
                    {(() => {
                      const consumed = sortedMeals.reduce((sum, meal) => {
                        const mealLog = getMealLog(meal.id);
                        return sum + (mealLog ? mealLog.actual_calories : meal.total_calories || 0);
                      }, 0);
                      return Math.round(consumed);
                    })()} kcal
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <span 
                    className="font-medium text-gray-600 text-xs cursor-pointer hover:underline"
                    onClick={onEditCalories}
                  >
                    {t('nutrition.calorieTarget')}: <span className={`font-bold ${isWeightLoss ? "text-red-500" : "text-green-500"}`}>{user.daily_calories || 2000} kcal</span>
                  </span>
                </div>
                <div 
                  className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative cursor-help group"
                  onMouseEnter={() => !consumedTooltipClicked && setShowConsumedTooltip(true)}
                  onMouseLeave={() => !consumedTooltipClicked && setShowConsumedTooltip(false)}
                  onClick={() => {
                    setConsumedTooltipClicked(!consumedTooltipClicked);
                    setShowConsumedTooltip(!consumedTooltipClicked);
                  }}
                >
                  <div className="h-full flex">
                    {sortedMeals.map((meal, index) => {
                      const mealLog = getMealLog(meal.id);
                      const isLogged = !!mealLog;
                      const calories = isLogged ? mealLog.actual_calories : meal.total_calories || 0;
                      const totalConsumed = sortedMeals.reduce((sum, m) => {
                        const log = getMealLog(m.id);
                        return sum + (log ? log.actual_calories : m.total_calories || 0);
                      }, 0);
                      const bmr = calculateBMR(user);
                      const neat = calculateNEAT(user);
                      const totalBurned = bmr + neat;
                      const segmentWidth = (calories / Math.max(totalConsumed, totalBurned)) * 100;
                      const baseColor = isWeightLoss ? 'red' : 'green';

                      return (
                        <React.Fragment key={meal.id}>
                          <div 
                            className={`h-full transition-all ${
                              isLogged 
                                ? (baseColor === 'red' ? 'bg-red-500' : 'bg-green-500')
                                : (baseColor === 'red' ? 'bg-red-300' : 'bg-green-300')
                            } ${!isLogged ? 'opacity-60' : ''}`}
                            style={{ 
                              width: `${segmentWidth}%`,
                              backgroundImage: !isLogged 
                                ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 10px)'
                                : 'none'
                            }}
                          />
                          {index < sortedMeals.length - 1 && (
                            <div className="w-[2px] h-full bg-white opacity-80" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {showConsumedTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-100 z-50 pointer-events-none">
                      I pasti con pattern tratteggiato sono pianificati ma non ancora consumati
                    </div>
                  )}
                </div>
              </div>

              {/* Calorie Bruciate */}
              <div className="space-y-2">
               <div className="flex items-center justify-between text-sm">
                 <span className="font-medium text-gray-700 flex items-center gap-2">
                   <Flame className={isWeightLoss ? "w-4 h-4 text-green-600" : "w-4 h-4 text-red-600"} />
                   {t('nutrition.caloriesBurned')}
                 </span>
                 <span className={`font-bold ${isWeightLoss ? "text-green-600" : "text-red-600"}`}>
                   {(() => {
                     const bmr = calculateBMR(user);
                     const neat = calculateNEAT(user);
                     return Math.round(bmr + neat);
                   })()} kcal
                 </span>
               </div>
               <div className="flex items-center gap-3">
                 <span 
                   className="font-medium text-gray-600 text-xs cursor-pointer hover:underline"
                   onClick={onEditBMR}
                 >
                   BMR: <span className={isWeightLoss ? "text-green-600" : "text-red-600"}>{user.bmr ? Math.round(user.bmr) : Math.round(calculateBMR(user))} kcal</span>
                 </span>
                 <span 
                   className="font-medium text-gray-600 text-xs cursor-pointer hover:underline"
                   onClick={onEditNEAT}
                 >
                   NEAT: <span className={isWeightLoss ? "text-green-400" : "text-red-400"}>{Math.round(calculateNEAT(user))} kcal</span>
                 </span>
               </div>
               <div 
                 className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative cursor-help group"
                 onMouseEnter={() => !burnedTooltipClicked && setShowBurnedTooltip(true)}
                 onMouseLeave={() => !burnedTooltipClicked && setShowBurnedTooltip(false)}
                 onClick={() => {
                   setBurnedTooltipClicked(!burnedTooltipClicked);
                   setShowBurnedTooltip(!burnedTooltipClicked);
                 }}
               >
                 <div className="h-full flex">
                   {(() => {
                     const bmr = calculateBMR(user);
                     const neat = calculateNEAT(user);
                     const totalBurned = bmr + neat;
                     const totalConsumed = sortedMeals.reduce((sum, m) => {
                       const log = getMealLog(m.id);
                       return sum + (log ? log.actual_calories : m.total_calories || 0);
                     }, 0);
                     const bmrWidth = (bmr / Math.max(totalConsumed, totalBurned)) * 100;
                     const neatWidth = (neat / Math.max(totalConsumed, totalBurned)) * 100;
                     const baseColor = isWeightLoss ? 'green' : 'red';

                     return (
                       <>
                         <div 
                           className={baseColor === 'green' ? "h-full bg-green-600" : "h-full bg-red-600"}
                           style={{ width: `${bmrWidth}%` }}
                         />
                         <div className="w-[2px] h-full bg-white opacity-80" />
                         <div 
                           className={baseColor === 'green' ? "h-full bg-green-400" : "h-full bg-red-400"}
                           style={{ width: `${neatWidth}%` }}
                         />
                       </>
                     );
                   })()}
                 </div>
                 {showBurnedTooltip && (
                   <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-100 z-50 pointer-events-none">
                     Segmento scuro: BMR · Segmento chiaro: NEAT
                   </div>
                 )}
               </div>

              </div>
            </div>

            </div>
            );
            })()}

            {/* Meals and Macros Card - Separate Box Below */}
            <div className="mt-6 transition-opacity duration-300 opacity-30" id="meals-macros-section">
              <MealsAndMacrosCard
                todayMacros={todayMacros}
                sortedMeals={sortedMeals}
                mealLogs={mealLogs}
                savingMealId={savingMealId}
                onMealSelect={onMealSelect}
                onPhotoAnalyze={onPhotoAnalyze}
                onCheckMeal={handleCheckMeal}
                userPlan={userPlan}
                getMealLog={getMealLog}
                getMealTypeLabel={getMealTypeLabel}
                t={t}
              />
            </div>

            {/* Body Fat Modal */}
            <Dialog open={showBodyFatModal} onOpenChange={setShowBodyFatModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-900">{t('dashboard.updateBodyFat')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {t('dashboard.updateBodyFatDesc')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        {t('dashboard.neckCircumference')}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={neckCirc}
                        onChange={(e) => setNeckCirc(e.target.value)}
                        placeholder={t('dashboard.neckCircumferencePlaceholder')}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-bold text-gray-900 mb-3">
                        {t('dashboard.waistCircumference')}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={waistCirc}
                        onChange={(e) => setWaistCirc(e.target.value)}
                        placeholder={t('dashboard.waistCircumferencePlaceholder')}
                        className="h-12 text-base"
                      />
                    </div>

                    {user.gender === 'female' && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                          {t('dashboard.hipCircumference')}
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={hipCirc}
                          onChange={(e) => setHipCirc(e.target.value)}
                          placeholder={t('dashboard.hipCircumferencePlaceholder')}
                          className="h-12 text-base"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleSaveBodyFatCircumferences}
                      disabled={savingBodyFat || !neckCirc || !waistCirc || (user.gender === 'female' && !hipCirc)}
                      className="flex-1 bg-black hover:bg-gray-900 text-white h-12 rounded-full"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {savingBodyFat ? t('dashboard.saving') : t('dashboard.calculate')}
                    </Button>
                    <Button
                      onClick={() => setShowBodyFatModal(false)}
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