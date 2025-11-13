import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Activity, BarChart3, Calendar, TrendingDown, Scale } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * Componente DEMO per Homepage - Dashboard
 * Replica esattamente il layout della dashboard con dati placeholder
 */
export default function DashboardPreviewDemo() {
  const weightData = [
    { date: '24 Set', weight: 83.0 },
    { date: '28 Set', weight: 81.5 },
    { date: '01 Ott', weight: 80.2 },
    { date: '02 Ott', weight: 79.0 }
  ];

  const startWeight = 83.0;
  const currentWeight = 79.0;
  const targetWeight = 73.0;
  const variation = currentWeight - startWeight;

  // Calcolo avanzamento
  const totalDistance = Math.abs(startWeight - targetWeight);
  const distanceCovered = Math.abs(startWeight - currentWeight);
  const progress = Math.round((distanceCovered / totalDistance) * 100);

  // Calcolo calorico
  const targetCalories = 7700; // kcal per kg
  const totalCaloriesToBurn = totalDistance * targetCalories;
  const caloriesBurned = distanceCovered * targetCalories;
  const caloriesRemaining = totalCaloriesToBurn - caloriesBurned;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonna Sinistra */}
      <div className="lg:col-span-2 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Peso Iniziale</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900">{startWeight}</span>
                <span className="text-lg text-gray-500 font-semibold">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Peso Target</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900">{targetWeight}</span>
                <span className="text-lg text-gray-500 font-semibold">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-md border-green-200/50 shadow-xl rounded-xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Variazione</p>
              <div className="flex items-baseline gap-2">
                <TrendingDown className="w-6 h-6 text-green-600" />
                <span className="text-4xl font-black text-green-700">{variation.toFixed(1)}</span>
                <span className="text-lg text-green-600 font-semibold">kg</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Chart */}
          <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[var(--brand-primary)]" />
                Traiettoria Massa Corporea
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      domain={[71, 85]}
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      stroke="#9ca3af"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <ReferenceLine 
                      y={73} 
                      stroke="#10b981" 
                      strokeDasharray="5 5" 
                      label={{ value: 'Target', fontSize: 9, fill: '#10b981', position: 'right' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#26847F" 
                      strokeWidth={3}
                      dot={{ fill: '#26847F', r: 3 }}
                      name="Peso attuale"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand-primary)]"></div>
                  <span className="text-gray-600 font-medium">Peso attuale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500"></div>
                  <span className="text-gray-600 font-medium">Target</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calorie Breakdown */}
          <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-900">
                Scomposizione Calorica Obiettivo
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-center justify-center mb-4 relative">
                {/* Circular Progress */}
                <svg className="w-32 h-32" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#26847F"
                    strokeWidth="10"
                    strokeDasharray={`${progress * 3.14} ${314 - progress * 3.14}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="55" textAnchor="middle" className="text-3xl font-black" fill="#1f2937">
                    {progress}%
                  </text>
                  <text x="60" y="72" textAnchor="middle" className="text-xs" fill="#6b7280">
                    completato
                  </text>
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--brand-primary-light)]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--brand-primary)]"></div>
                    <span className="text-sm font-semibold text-gray-700">Completato</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{caloriesBurned.toLocaleString('it-IT')} kcal</span>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span className="text-sm font-semibold text-gray-700">Rimanente</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{caloriesRemaining.toLocaleString('it-IT')} kcal</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3" />
                  Calcolo basato su 7700 kcal = 1kg di variazione
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Logger */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-[var(--brand-primary)]" />
              <h3 className="text-base font-bold text-gray-900">Registra Peso</h3>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  disabled
                  className="w-full h-12 px-4 pr-12 text-lg font-semibold rounded-xl border-2 border-gray-200 bg-white/70 cursor-not-allowed opacity-80"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">kg</span>
              </div>
              <button
                disabled
                className="px-6 h-12 bg-[var(--brand-primary)] text-white font-semibold rounded-xl cursor-not-allowed opacity-80"
              >
                Salva Peso
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonna Destra - Stats Cards */}
      <div className="space-y-4">
        {/* Target Calorico */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Calorico</p>
              <span className="text-xs text-green-600 font-bold">↗ +2.3%</span>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[var(--brand-primary)]" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">1935</span>
                <span className="text-base text-gray-500 font-semibold">kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metabolismo Basale */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Metabolismo Basale (BMR)</p>
              <span className="text-xs text-green-600 font-bold">↗ +1.8%</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">1876</span>
                <span className="text-base text-gray-500 font-semibold">kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Massa Grassa */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Massa Grassa</p>
              <span className="text-xs text-gray-500 font-medium">— stabile</span>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">18.3</span>
                <span className="text-base text-gray-500 font-semibold">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avanzamento Obiettivo */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Avanzamento Obiettivo</p>
              <span className="text-xs text-green-600 font-bold">↗ +15.2%</span>
            </div>
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">{progress}</span>
                <span className="text-base text-gray-500 font-semibold">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Giorni di Allenamento */}
        <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Giorni di Allenamento</p>
              <span className="text-xs text-gray-500 font-medium">— stabile</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">5</span>
                <span className="text-sm text-gray-500 font-semibold">giorni/sett</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Notice - Full Width */}
      <div className="lg:col-span-3 text-center">
        <p className="text-xs text-gray-400 italic">
          Anteprima interfaccia • Funzionalità disponibili dopo il signup
        </p>
      </div>
    </div>
  );
}