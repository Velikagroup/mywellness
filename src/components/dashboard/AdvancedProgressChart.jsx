import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Scale, Save, RefreshCw } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { WeightHistory } from "@/entities/WeightHistory";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../i18n/LanguageContext';

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

export default function AdvancedProgressChart({ user, weightHistory = [], onWeightLogged, isMobile = false }) {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const lineData = useMemo(() => {
    console.log('📈 lineData calculation - weightHistory:', weightHistory?.length, 'entries');
    
    if (!weightHistory || weightHistory.length === 0) {
      console.log('📈 No weight history data');
      return [];
    }
    
    console.log('📈 First entry:', JSON.stringify(weightHistory[0]));
    
    // Ordina per data crescente (più vecchio a sinistra, più recente a destra)
    const sortedHistory = [...weightHistory].sort((a, b) => {
      const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
      const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // Se stessa data, ordina per created_date
      return new Date(a.created_date) - new Date(b.created_date);
    });

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
  }, [weightHistory]);

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
  
  // Trova il peso più recente (ordina per data decrescente)
  const sortedForCurrent = [...weightHistory].sort((a, b) => {
    const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
    const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
    return dateB.localeCompare(dateA);
  });
  const currentWeight = sortedForCurrent.length > 0 ? sortedForCurrent[0].weight : startWeight;
  
  console.log('📊 Weight calculation:', { startWeight, targetWeight, currentWeight, historyLength: weightHistory.length });

  const totalWeightToChange = startWeight - targetWeight;
  const remainingToTarget = currentWeight - targetWeight;
  const isWeightLoss = totalWeightToChange > 0;
  
  const isGoodProgress = isWeightLoss 
    ? (remainingToTarget > 0 && remainingToTarget < totalWeightToChange)
    : (remainingToTarget < 0 && Math.abs(remainingToTarget) < Math.abs(totalWeightToChange));

  let progressPercentage = 0;
  if (totalWeightToChange !== 0) {
      const weightProgress = startWeight - currentWeight;
      progressPercentage = (weightProgress / totalWeightToChange) * 100;
  } else if (startWeight === targetWeight) {
      progressPercentage = 100;
  }
  progressPercentage = Math.max(0, Math.min(100, progressPercentage));

  const allWeights = weightHistory.map(d => d.weight).concat([startWeight, targetWeight]).filter(w => w > 0);
  const yAxisDomain = allWeights.length > 0 
    ? [Math.floor(Math.min(...allWeights) - 2), Math.ceil(Math.max(...allWeights) + 2)]
    : [0, 100];

  const totalKcalToChange = Math.abs(totalWeightToChange) * KCAL_PER_KG;
  const weightProgress = startWeight - currentWeight;
  const kcalChangedSoFar = Math.abs(weightProgress) * KCAL_PER_KG;
  const kcalRemaining = totalKcalToChange - kcalChangedSoFar;

  const pieData = [
    { name: t('progressChart.completedLabel'), value: kcalChangedSoFar },
    { name: t('progressChart.remainingLabel'), value: kcalRemaining > 0 ? kcalRemaining : 0 },
  ];

  const COLORS = ['#26847F', '#e5e7eb'];

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
      <CardContent className="p-6">
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
                  {remainingToTarget >= 0 ? '+' : ''}{remainingToTarget.toFixed(1)}
                </p>
                <span className={`text-sm font-medium ${isGoodProgress ? 'text-green-600' : 'text-red-600'}`}>kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-4">
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

            <div className="bg-white/65 rounded-xl p-5 border border-gray-200/30 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#26847F]/10 rounded-full flex items-center justify-center shadow-sm">
                  <Scale className="w-5 h-5 text-[#26847F]" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{t('progressChart.logWeight')}</h3>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="text-center text-xl h-12 pr-12"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </span>
                </div>
                
                <Button
                  onClick={handleSaveWeight}
                  disabled={!weight || isSaving}
                  className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? t('progressChart.saving') : t('progressChart.saveWeight')}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col bg-white/65 rounded-xl p-5 border border-gray-200/30 backdrop-blur-md shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-4">{t('progressChart.calorieBreakdown')}</h3>
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={2} 
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${Math.round(value).toLocaleString('it-IT')} kcal`, '']} 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-3xl font-bold text-[#26847F]">{progressPercentage.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{t('progressChart.completed')}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-3 bg-white/65 rounded-lg border border-gray-200/30 backdrop-blur-sm shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                    <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{Math.round(entry.value).toLocaleString('it-IT')} kcal</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center bg-white/65 p-3 rounded-lg border border-gray-200/30 backdrop-blur-sm shadow-md">
              💡 {t('progressChart.calorieCalc')} <span className="font-semibold text-gray-700">7700 kcal = 1 kg</span> {t('progressChart.perKg')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}