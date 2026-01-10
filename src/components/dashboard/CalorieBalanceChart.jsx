import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, ArrowUp, ArrowDown } from 'lucide-react';

export default function CalorieBalanceChart({ user }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const calculateBMR = (userData) => {
    if (!userData?.gender || !userData?.current_weight || !userData?.height) return 0;
    
    // Calcola età dalla data di nascita
    let age = 30; // default
    if (userData.birthdate) {
      const birthDate = new Date(userData.birthdate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Mifflin-St Jeor formula
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

  const loadData = async () => {
    if (!user?.id) {
      console.log('⚠️ CalorieBalanceChart: No user ID');
      return;
    }
    
    console.log('🔄 CalorieBalanceChart: Loading data for user', user.id);
    console.log('👤 User data:', { 
      gender: user.gender, 
      weight: user.current_weight, 
      height: user.height,
      birthdate: user.birthdate,
      activity: user.activity_level 
    });
    
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

      console.log('📅 Today:', today, 'Day:', dayOfWeek);

      // Carica piano nutrizionale di oggi
      const mealPlans = await base44.entities.MealPlan.filter({
        user_id: user.id,
        day_of_week: dayOfWeek
      });
      console.log('🍽️ Meal plans loaded:', mealPlans.length);

      // Carica pasti loggati di oggi
      const mealLogs = await base44.entities.MealLog.filter({
        user_id: user.id,
        date: today
      });
      console.log('📊 Meal logs loaded:', mealLogs.length);

      // Calcola calorie dal piano
      const plannedCalories = mealPlans.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);

      // Calcola calorie consumate
      const consumedCalories = mealLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0);

      // Calcola metabolismo basale e NEAT dai dati utente
      const bmr = calculateBMR(user);
      const neat = calculateNEAT(user);
      const totalBurned = bmr + neat;

      console.log('💪 BMR:', bmr, 'NEAT:', neat, 'Total burned:', totalBurned);
      console.log('🍴 Planned:', plannedCalories, 'Consumed:', consumedCalories);

      // Calcola bilancio
      const balance = consumedCalories - totalBurned;

      // Determina se obiettivo è dimagrimento o aumento massa
      const isWeightLoss = user.target_weight < user.current_weight;

      setData({
        plannedCalories: Math.round(plannedCalories),
        consumedCalories: Math.round(consumedCalories),
        bmr: Math.round(bmr),
        neat: Math.round(neat),
        totalBurned: Math.round(totalBurned),
        balance: Math.round(balance),
        isWeightLoss
      });

      console.log('✅ CalorieBalanceChart: Data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading calorie data:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="water-glass-effect border-gray-200/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="water-glass-effect border-gray-200/30">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 py-8">
            Dati non disponibili
          </div>
        </CardContent>
      </Card>
    );
  }

  const consumedPercent = Math.min((data.consumedCalories / data.plannedCalories) * 100, 100);
  const burnedPercent = 100;

  // Logica colori basata su obiettivo peso
  const consumedColor = data.isWeightLoss ? 'green' : 'red';
  const burnedColor = data.isWeightLoss ? 'green' : 'red';
  
  // Deficit: negativo = buono per dimagrimento, positivo = buono per aumento
  const isBalanceGood = data.isWeightLoss 
    ? data.balance < 0  // Dimagrimento: deficit è buono
    : data.balance > 0; // Aumento massa: surplus è buono

  return (
    <Card className="water-glass-effect border-gray-200/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Bilancio Calorie Oggi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DEFICIT/SURPLUS - GROSSO E IN EVIDENZA */}
        <div className={`rounded-xl p-6 text-center border-2 ${
          isBalanceGood
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
        }`}>
          <p className="text-sm font-medium text-gray-600 mb-2">BILANCIO GIORNALIERO</p>
          <div className="flex items-center justify-center gap-3">
            {isBalanceGood ? (
              <ArrowDown className="w-8 h-8 text-green-600" />
            ) : (
              <ArrowUp className="w-8 h-8 text-red-600" />
            )}
            <p className={`text-5xl font-bold ${isBalanceGood ? 'text-green-600' : 'text-red-600'}`}>
              {data.balance > 0 ? '+' : ''}{data.balance}
            </p>
            <span className="text-2xl font-semibold text-gray-600">kcal</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {data.isWeightLoss ? (
              data.balance < 0 
                ? `🎯 Deficit di ${Math.abs(data.balance)} kcal - Perfetto per dimagrire!`
                : data.balance === 0
                ? '⚖️ Mantenimento'
                : `⚠️ Surplus di ${data.balance} kcal - Rallenta il dimagrimento`
            ) : (
              data.balance > 0
                ? `💪 Surplus di ${data.balance} kcal - Perfetto per massa!`
                : data.balance === 0
                ? '⚖️ Mantenimento'
                : `⚠️ Deficit di ${Math.abs(data.balance)} kcal - Rallenta l'aumento`
            )}
          </p>
        </div>

        {/* Progress Bar Calorie Assunte */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <ArrowUp className={data.isWeightLoss ? "w-4 h-4 text-red-600" : "w-4 h-4 text-green-600"} />
              Calorie Assunte
            </span>
            <span className={data.isWeightLoss ? "font-bold text-red-600" : "font-bold text-green-600"}>{data.consumedCalories} / {data.plannedCalories} kcal</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${consumedPercent > 100 ? 'bg-red-500' : (data.isWeightLoss ? 'bg-red-500' : 'bg-green-500')}`}
              style={{ width: `${Math.min(consumedPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Progress Bar Calorie Bruciate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <Flame className={data.isWeightLoss ? "w-4 h-4 text-green-600" : "w-4 h-4 text-red-600"} />
              Calorie Bruciate
            </span>
            <span className={data.isWeightLoss ? "font-bold text-green-600" : "font-bold text-red-600"}>{data.totalBurned} kcal</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={data.isWeightLoss ? "h-full w-full bg-gradient-to-r from-green-500 to-green-600" : "h-full w-full bg-gradient-to-r from-red-500 to-red-600"}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-gray-600 mb-1">Metabolismo Basale</p>
              <p className="text-lg font-bold text-amber-700">{data.bmr} kcal</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs text-gray-600 mb-1">NEAT (Attività)</p>
              <p className="text-lg font-bold text-orange-700">{data.neat} kcal</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}