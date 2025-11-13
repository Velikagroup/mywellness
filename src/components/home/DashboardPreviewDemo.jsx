import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * Componente DEMO per Homepage - Dashboard
 * Mostra un esempio della dashboard scientifica con grafici e statistiche
 */
export default function DashboardPreviewDemo() {
  // Dati demo per il grafico peso
  const weightData = [
    { date: '1 Gen', weight: 85, target: 75 },
    { date: '8 Gen', weight: 84.2, target: 75 },
    { date: '15 Gen', weight: 83.1, target: 75 },
    { date: '22 Gen', weight: 82.5, target: 75 },
    { date: '29 Gen', weight: 81.8, target: 75 },
    { date: '5 Feb', weight: 80.9, target: 75 }
  ];

  const stats = [
    { title: 'Target Calorico', value: '1850', unit: 'kcal', icon: Activity, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary-light)]' },
    { title: 'Metabolismo Basale', value: '1620', unit: 'kcal', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Massa Grassa', value: '22.5', unit: '%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Avanzamento', value: '42', unit: '%', icon: Target, color: 'text-green-600', bg: 'bg-green-50' }
  ];

  return (
    <div className="space-y-4">
      {/* Grafico Peso */}
      <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--brand-primary)]" />
            📊 Andamento Peso e Proiezioni
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  domain={[73, 87]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine 
                  y={75} 
                  stroke="#22c55e" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Obiettivo', fontSize: 10, fill: '#22c55e', position: 'right' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#26847F" 
                  strokeWidth={3}
                  dot={{ fill: '#26847F', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Peso attuale"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Peso Iniziale</p>
              <p className="text-lg font-bold text-gray-900">85.0 kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Peso Attuale</p>
              <p className="text-lg font-bold text-[var(--brand-primary)]">80.9 kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Obiettivo</p>
              <p className="text-lg font-bold text-green-600">75.0 kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card 
            key={index}
            className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                <span className="text-sm text-gray-500 font-semibold">{stat.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-400 italic">
          Anteprima interfaccia • Funzionalità disponibili dopo il signup
        </p>
      </div>
    </div>
  );
}