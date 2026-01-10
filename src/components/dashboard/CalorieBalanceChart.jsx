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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-600" />
          Bilancio Calorico Giornaliero
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Grafico */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" label={{ value: 'kcal', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Calorie in entrata */}
              <Bar dataKey="Piano Nutrizionale" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Calorie Assunte" fill="#10b981" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry['Calorie Assunte'] > entry['Piano Nutrizionale'] ? '#ef4444' : '#10b981'} 
                  />
                ))}
              </Bar>
              
              {/* Calorie in uscita */}
              <Bar dataKey="Metabolismo Basale" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="NEAT" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bilancio Giornaliero */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bilancio Giornaliero</p>
              <div className="flex items-center gap-2">
                {data.balance < 0 ? (
                  <TrendingDown className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-red-600" />
                )}
                <p className={`text-3xl font-bold ${data.balance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.balance > 0 ? '+' : ''}{data.balance} kcal
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.balance < 0 
                  ? `Deficit di ${Math.abs(data.balance)} kcal - Ottimo per perdere peso!`
                  : data.balance === 0
                  ? 'In mantenimento perfetto'
                  : `Surplus di ${data.balance} kcal - Rischi di ingrassare`
                }
              </p>
            </div>
            
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Entrate</p>
                  <p className="text-lg font-bold text-green-600">+{data.consumedCalories} kcal</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uscite</p>
                  <p className="text-lg font-bold text-orange-600">-{data.totalBurned} kcal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dettaglio Uscite */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Metabolismo Basale:</span>
                <span className="font-semibold text-amber-600">{data.bmr} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">NEAT (Attività):</span>
                <span className="font-semibold text-orange-600">{data.neat} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}