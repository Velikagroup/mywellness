import React, { useState, useMemo, useEffect } from 'react';

import { TrendingDown, TrendingUp, Scale, Save, RefreshCw, Activity, BarChart3, Edit3 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { WeightHistory } from "@/entities/WeightHistory";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../i18n/LanguageContext';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="p-5 bg-gradient-to-br from-blue-50/70 to-blue-100/30 rounded-xl border border-blue-200/40 backdrop-blur-sm shadow-lg">
             <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">{t('progressChart.startWeight')}</p>
             <div className="flex items-baseline gap-2">
               <p className="text-3xl font-bold text-blue-900">{startWeight.toFixed(1)}</p>
               <span className="text-sm font-medium text-blue-600">kg</span>
             </div>
           </div>

           <div className="p-5 bg-gradient-to-br from-[#e9f6f5]/70 to-emerald-50/30 rounded-xl border-2 border-[#26847F]/30 backdrop-blur-sm shadow-lg">
             <p className="text-xs font-semibold text-[#1a5753] uppercase tracking-wide mb-2">{t('progressChart.targetWeight')}</p>
             <div className="flex items-baseline gap-2">
               <p className="text-3xl font-bold text-[#26847F]">{targetWeight.toFixed(1)}</p>
               <span className="text-sm font-medium text-[#1a5753]">kg</span>
             </div>
           </div>

           <div className={`p-5 rounded-xl border backdrop-blur-sm shadow-lg ${
             isGoodProgress
               ? 'bg-gradient-to-br from-green-50/70 to-green-100/30 border-green-200/40' 
               : 'bg-gradient-to-br from-red-50/70 to-red-100/30 border-red-200/40'
           }`}>
             <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
               isGoodProgress ? 'text-green-700' : 'text-red-700'
             }`}>{t('progressChart.variation')}</p>
             <div className="flex items-center gap-2">
               {isGoodProgress ? (
                 <TrendingDown className="w-5 h-5 text-green-600" />
               ) : (
                 <TrendingUp className="w-5 h-5 text-red-600" />
               )}
               <div className="flex items-baseline gap-2">
                 <p className={`text-3xl font-bold ${isGoodProgress ? 'text-green-900' : 'text-red-900'}`}>
                   {weightVariation >= 0 ? '+' : ''}{weightVariation.toFixed(1)}
                 </p>
                 <span className={`text-sm font-medium ${isGoodProgress ? 'text-green-600' : 'text-red-600'}`}>kg</span>
               </div>
             </div>
           </div>
         </div>

         <div className="flex flex-col bg-white/65 rounded-xl p-5 border border-gray-200/30 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">{t('progressChart.bodyMassTrajectory')}</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 bg-[#26847F] rounded-full"></div>
              <span className="text-gray-600 font-medium">{t('progressChart.currentWeight')}</span>
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
        </div>


      </>
    );
}