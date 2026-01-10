import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

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

  const chartData = [
    {
      name: 'Calorie',
      'Piano Nutrizionale': data.plannedCalories,
      'Calorie Assunte': data.consumedCalories,
      'Metabolismo Basale': data.bmr,
      'NEAT': data.neat
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          {payload.map((entry, index) => (
            <div key={index} className="text-sm">
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="ml-2">{entry.value} kcal</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="water-glass-effect border-gray-200/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-4 h-4 text-orange-600" />
          Bilancio Calorie Oggi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grafico Mini */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar dataKey="Piano Nutrizionale" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Calorie Assunte" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry['Calorie Assunte'] > entry['Piano Nutrizionale'] ? '#ef4444' : '#10b981'} 
                />
              ))}
            </Bar>
            <Bar dataKey="Metabolismo Basale" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="NEAT" fill="#fb923c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Bilancio */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Bilancio</p>
              <div className="flex items-center gap-1">
                {data.balance < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-xl font-bold ${data.balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.balance > 0 ? '+' : ''}{data.balance}
                </p>
              </div>
            </div>
            
            <div className="text-right text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">In:</span>
                <span className="font-semibold text-green-600">+{data.consumedCalories}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Out:</span>
                <span className="font-semibold text-orange-600">-{data.totalBurned}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dettaglio mini */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">BMR:</span>
            <span className="font-semibold">{data.bmr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">NEAT:</span>
            <span className="font-semibold">{data.neat}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}