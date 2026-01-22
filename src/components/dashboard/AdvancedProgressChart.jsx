import React, { useState, useMemo, useEffect } from 'react';

import { TrendingDown, TrendingUp, Scale, Save, RefreshCw, Activity, BarChart3, Edit3, Flame, Gauge, Beef, Wheat, Droplet } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { WeightHistory } from "@/entities/WeightHistory";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../i18n/LanguageContext';
import CalorieBalanceChart from './CalorieBalanceChart';
import TechnicalStatsCard from './TechnicalStatsCard';

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
    light: 0.375,
    moderate: 0.55,
    active: 0.725,
    very_active: 0.9
  };
  
  const multiplier = activityMultipliers[userData?.activity_level] || 0.375;
  return bmr * multiplier;
};

export default function AdvancedProgressChart({ user, weightHistory = [], onWeightLogged, isMobile = false, onEditBMR, onEditBodyFat, onEditCalories, isSavingBMR, isSavingBodyFat, isSavingCalories }) {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [todayCalorieBalance, setTodayCalorieBalance] = useState(null);
  const [accumulatedCalories, setAccumulatedCalories] = useState(0);
  const [todayMacros, setTodayMacros] = useState({ 
    planned: { protein: 0, carbs: 0, fat: 0 },
    consumed: { protein: 0, carbs: 0, fat: 0 }
  });

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
          date: today
        });

        const plannedCalories = mealPlans.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
        const plannedProtein = mealPlans.reduce((sum, meal) => sum + (meal.total_protein || 0), 0);
        const plannedCarbs = mealPlans.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0);
        const plannedFat = mealPlans.reduce((sum, meal) => sum + (meal.total_fat || 0), 0);

        // Calcola i macro consumati dai pasti completati
        const consumedProtein = mealPlans
          .filter(meal => meal.is_completed)
          .reduce((sum, meal) => sum + (meal.total_protein || 0), 0);
        const consumedCarbs = mealPlans
          .filter(meal => meal.is_completed)
          .reduce((sum, meal) => sum + (meal.total_carbs || 0), 0);
        const consumedFat = mealPlans
          .filter(meal => meal.is_completed)
          .reduce((sum, meal) => sum + (meal.total_fat || 0), 0);

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
  }, [user, weightHistory]);

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
            weight: entry.weight
        };
    });
    
    console.log('📈 lineData result:', result);
    return result;
  }, [weightHistory, user]);

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
      const weightData = {
        user_id: user.id,
        weight: parseFloat(weight),
        date: today
      };
      
      console.log('💾 Saving weight:', weightData);
      
      await base44.entities.WeightHistory.create(weightData);
      
      console.log('✅ Weight saved successfully');
      setWeight('');
      
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

  if (!user) {
    return null;
  }
  
  const startWeight = user.current_weight || 0;
  const targetWeight = user.target_weight || 0;
  
  // Ordina per data per trovare primo e ultimo peso registrato
  const sortedByDate = [...weightHistory].sort((a, b) => {
    const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
    const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
    return dateA.localeCompare(dateB);
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

  return (
    <>
      {(() => {
        const totalWeightToChange = startWeight - targetWeight;
        const actualDirection = lastRecordedWeight - startWeight;

        // Verde se movimento è coerente con l'obiettivo
        const isAligned = (totalWeightToChange > 0 && actualDirection < 0) || 
                         (totalWeightToChange < 0 && actualDirection > 0) ||
                         (totalWeightToChange === 0);

        return (
          <div className="flex flex-col bg-white/65 rounded-xl p-5 border border-gray-200/30 backdrop-blur-md shadow-xl">
            {/* Macronutrienti giornalieri */}
            <div className="flex justify-center gap-6 mb-6">
              {/* Proteine */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#ef4444"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Beef className="w-4 h-4 text-red-600 mb-0.5" />
                    <p className="text-xs font-bold text-red-700">{todayMacros.protein}g</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 font-medium">Proteine</p>
              </div>

              {/* Carboidrati */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#f59e0b"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Wheat className="w-4 h-4 text-amber-600 mb-0.5" />
                    <p className="text-xs font-bold text-amber-700">{todayMacros.carbs}g</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 font-medium">Carboidrati</p>
              </div>

              {/* Grassi */}
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#8b5cf6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Droplet className="w-4 h-4 text-violet-600 mb-0.5" />
                    <p className="text-xs font-bold text-violet-700">{todayMacros.fat}g</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 font-medium">Grassi</p>
              </div>
            </div>

            {/* Box peso attuale e target integrati */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                isAligned
                  ? 'bg-gradient-to-br from-green-50/70 to-green-100/30 border-green-200/40' 
                  : 'bg-gradient-to-br from-red-50/70 to-red-100/30 border-red-200/40'
              }`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                  isAligned ? 'text-green-700' : 'text-red-700'
                }`}>{t('progressChart.currentWeight')}</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-2xl font-bold ${isAligned ? 'text-green-900' : 'text-red-900'}`}>{lastRecordedWeight.toFixed(1)}</p>
                  <span className={`text-xs font-medium ${isAligned ? 'text-green-600' : 'text-red-600'}`}>kg</span>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-[#e9f6f5]/70 to-emerald-50/30 rounded-lg border-2 border-[#26847F]/30 backdrop-blur-sm">
                <p className="text-xs font-semibold text-[#1a5753] uppercase tracking-wide mb-1">{t('progressChart.targetWeight')}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-[#26847F]">{targetWeight.toFixed(1)}</p>
                  <span className="text-xs font-medium text-[#1a5753]">kg</span>
                </div>
              </div>
            </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                  formatter={(value) => [`${value.toFixed(1)} kg`, 'Peso']} 
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
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#26847F" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#26847F', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2 }} 
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dati sotto il grafico */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200/50">
          {/* Target Calorie */}
          <div className="relative group cursor-pointer">
            <div className="flex flex-col items-center" onClick={onEditCalories}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 border-2 border-orange-300 flex items-center justify-center hover:shadow-lg transition-all hover:scale-110">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-bold text-orange-700 mt-2">{user.daily_calories || 2000}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {t('dashboard.targetCalories')}
            </div>
          </div>

          {/* BMR */}
          <div className="relative group cursor-pointer">
            <div className="flex flex-col items-center" onClick={onEditBMR}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 flex items-center justify-center hover:shadow-lg transition-all hover:scale-110">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-blue-700 mt-2">{Math.round(user.bmr || 1500)}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {t('dashboard.bmr')}
            </div>
          </div>

          {/* Body Fat */}
          <div className="relative group cursor-pointer">
            <div className="flex flex-col items-center" onClick={onEditBodyFat}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 border-2 border-pink-300 flex items-center justify-center hover:shadow-lg transition-all hover:scale-110">
                <Gauge className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-sm font-bold text-pink-700 mt-2">{(user.body_fat_percentage || 0).toFixed(1)}</p>
              <p className="text-xs text-gray-500">%</p>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {t('dashboard.bodyFat')}
            </div>
          </div>
          </div>
          </div>
          );
          })()}

          {/* Bilancio Calorie Oggi */}
          <div className="mt-6">
          <CalorieBalanceChart user={user} />
          </div>
          </>
          );
          }