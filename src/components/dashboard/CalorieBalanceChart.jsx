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

  const calculateBMR = (user) => {
    if (!user?.gender || !user?.weight || !user?.height || !user?.age) return 0;
    
    // Mifflin-St Jeor formula
    if (user.gender === 'male') {
      return (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
    } else {
      return (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
    }
  };

  const calculateNEAT = (user) => {
    const bmr = calculateBMR(user);
    const activityMultipliers = {
      sedentary: 0.2,
      light: 0.375,
      moderate: 0.55,
      active: 0.725,
      very_active: 0.9
    };
    
    const multiplier = activityMultipliers[user?.activity_level] || 0.375;
    return bmr * multiplier;
  };

  const loadData = async () => {
    if (!user?.id) {
      console.log('⚠️ CalorieBalanceChart: No user ID');
      return;
    }
    
    console.log('🔄 CalorieBalanceChart: Loading data for user', user.id);
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

      // Calcola metabolismo basale e NEAT
      const bmr = calculateBMR(user);
      const neat = calculateNEAT(user);
      const totalBurned = bmr + neat;

      console.log('💪 BMR:', bmr, 'NEAT:', neat, 'Total burned:', totalBurned);
      console.log('🍴 Planned:', plannedCalories, 'Consumed:', consumedCalories);

      // Calcola bilancio
      const balance = consumedCalories - totalBurned;

      setData({
        plannedCalories: Math.round(plannedCalories),
        consumedCalories: Math.round(consumedCalories),
        bmr: Math.round(bmr),
        neat: Math.round(neat),
        totalBurned: Math.round(totalBurned),
        balance: Math.round(balance)
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

  return (
    <Card className="water-glass-effect border-gray-200/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-4 h-4 text-orange-600" />
          Bilancio Calorie Oggi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DEFICIT/SURPLUS - GROSSO E IN EVIDENZA */}
        <div className={`rounded-xl p-6 text-center border-2 ${
          data.balance < 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
        }`}>
          <p className="text-sm font-medium text-gray-600 mb-2">BILANCIO GIORNALIERO</p>
          <div className="flex items-center justify-center gap-3">
            {data.balance < 0 ? (
              <ArrowDown className="w-8 h-8 text-green-600" />
            ) : (
              <ArrowUp className="w-8 h-8 text-red-600" />
            )}
            <p className={`text-5xl font-bold ${data.balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.balance > 0 ? '+' : ''}{data.balance}
            </p>
            <span className="text-2xl font-semibold text-gray-600">kcal</span>
          </div>
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {data.balance < 0 
              ? `🎯 Deficit di ${Math.abs(data.balance)} kcal - Perfetto per dimagrire!`
              : data.balance === 0
              ? '⚖️ Mantenimento perfetto'
              : `⚠️ Surplus di ${data.balance} kcal`
            }
          </p>
        </div>

        {/* Progress Bar Calorie Assunte */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              Calorie Assunte
            </span>
            <span className="font-bold text-green-600">{data.consumedCalories} / {data.plannedCalories} kcal</span>
          </div>
          <Progress 
            value={consumedPercent} 
            className="h-3 bg-gray-200"
            indicatorClassName={consumedPercent > 100 ? 'bg-red-500' : 'bg-green-500'}
          />
        </div>

        {/* Progress Bar Calorie Bruciate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" />
              Calorie Bruciate
            </span>
            <span className="font-bold text-orange-600">{data.totalBurned} kcal</span>
          </div>
          <Progress 
            value={burnedPercent} 
            className="h-3 bg-gray-200"
            indicatorClassName="bg-gradient-to-r from-orange-500 to-red-500"
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>BMR: {data.bmr}</span>
            <span>NEAT: {data.neat}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}