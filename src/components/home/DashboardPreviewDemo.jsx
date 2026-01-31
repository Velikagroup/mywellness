import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Dashboard
 * Replica ESATTAMENTE il layout della dashboard reale
 */
export default function DashboardPreviewDemo() {
  const { language } = useLanguage();
  
  const weightData = React.useMemo(() => [
    { date: '06 Jan', weight: 83.0 },
    { date: '22 Dec', weight: 82.2 },
    { date: '22 Dec', weight: 81.5 },
    { date: '11 Jan', weight: 81.9 }
  ], []);

  const meals = [
    {
      name: "Pranzo",
      description: "Bowl di Lenticchie e Avocado",
      calories: 796,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
    },
    {
      name: "Afternoon Snack",
      description: "Frutta Mista con Noci",
      calories: 315,
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop"
    },
    {
      name: "Dinner",
      description: "Antipasto di Ceci e Verdure",
      calories: 598,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop"
    }
  ];

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }
      `}</style>

      <Card className="water-glass-effect border-gray-200/40 shadow-2xl overflow-hidden">
        <CardContent className="p-6">
          {/* Header: Bilancio Calorico + Weight Box */}
          <div className="relative flex items-start justify-between mb-6 pb-6">
            {/* Left: Bilancio Calorico */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-lg">🔥</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {language === 'it' ? 'Bilancio di oggi' : language === 'es' ? 'Balance de hoy' : language === 'pt' ? 'Balanço de hoje' : language === 'de' ? 'Heutiger Saldo' : language === 'fr' ? 'Bilan d\'aujourd\'hui' : 'Today\'s Balance'}
                </p>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-5xl font-bold text-green-700 leading-tight" style={{
                  filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.18)) drop-shadow(0 0 16px rgba(34, 197, 94, 0.12))'
                }}>
                  -1721
                </p>
                <p className="text-xl font-medium text-green-700">kcal</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium inline-block bg-green-100/70 text-green-700">
                {language === 'it' ? 'In forte deficit' : language === 'es' ? 'En fuerte déficit' : language === 'pt' ? 'Em forte déficit' : language === 'de' ? 'Stark im Defizit' : language === 'fr' ? 'En fort déficit' : 'Strong deficit'}
              </div>
            </div>

            {/* Right: Peso Attuale → Target */}
            <div className="absolute top-0 right-0 flex items-center gap-1 border border-gray-200/60 rounded-lg px-2 py-1">
              <div className="text-right">
                <div className="flex items-baseline gap-0.5">
                  <p className="font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent" style={{ fontSize: '16px' }}>81.9</p>
                  <p className="text-xs font-semibold text-green-600">kg</p>
                </div>
              </div>
              <div className="font-light text-gray-400" style={{ fontSize: '16px' }}>&gt;</div>
              <div className="text-left">
                <div className="flex items-baseline gap-0.5">
                  <p className="font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent" style={{ fontSize: '16px' }}>76.0</p>
                  <p className="text-xs font-semibold text-teal-600">kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="weightLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#26847F" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#26847F" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#26847F" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={{ stroke: '#e0e0e0' }} style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} domain={[76, 84]} tickFormatter={(value) => `${value}kg`} style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <ReferenceLine 
                  y={76} 
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
                  stroke="url(#weightLineGradient)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#26847F', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 2 }} 
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Bars - Calorie Consumate e Bruciate */}
          <div className="space-y-4 mb-6 pt-4 border-t border-gray-200/50">
            {/* Calorie Consumate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  {language === 'it' ? 'Calorie Consumate' : language === 'es' ? 'Calorías Consumidas' : language === 'pt' ? 'Calorias Consumidas' : language === 'de' ? 'Verbrauchte Kalorien' : language === 'fr' ? 'Calories Consommées' : 'Calories Consumed'}
                </span>
                <span className="font-bold text-red-500">1709 kcal</span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-gray-600 text-xs">
                  {language === 'it' ? 'Target Calorico' : 'Calorie Target'}: <span className="font-bold text-red-500">2000 kcal</span>
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-400" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Calorie Bruciate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  {language === 'it' ? 'Calorie Bruciate' : language === 'es' ? 'Calorías Quemadas' : language === 'pt' ? 'Calorias Queimadas' : language === 'de' ? 'Verbrannte Kalorien' : language === 'fr' ? 'Calories Brûlées' : 'Calories Burned'}
                </span>
                <span className="font-bold text-green-600">2475 kcal</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600 text-xs">
                  BMR: <span className="text-green-600">1800 kcal</span>
                </span>
                <span className="font-medium text-gray-600 text-xs">
                  NEAT: <span className="text-green-400">675 kcal</span>
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div className="h-full bg-green-600" style={{ width: '72%' }}></div>
                  <div className="w-[2px] h-full bg-white opacity-80"></div>
                  <div className="h-full bg-green-400" style={{ width: '27%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Macros + Meals */}
          <div className="space-y-6">
            {/* Macro Circles */}
            <div className="flex items-center justify-around py-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🥩</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Proteine' : language === 'es' ? 'Proteínas' : language === 'pt' ? 'Proteínas' : language === 'de' ? 'Proteine' : language === 'fr' ? 'Protéines' : 'Protein'}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🌾</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Carboidrati' : language === 'es' ? 'Carbohidratos' : language === 'pt' ? 'Carboidratos' : language === 'de' ? 'Kohlenhydrate' : language === 'fr' ? 'Glucides' : 'Carbs'}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <span className="text-xl">🥑</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0g</p>
                <p className="text-xs text-gray-600">{language === 'it' ? 'Grassi' : language === 'es' ? 'Grasas' : language === 'pt' ? 'Gorduras' : language === 'de' ? 'Fette' : language === 'fr' ? 'Graisses' : 'Fat'}</p>
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3">
              {meals.map((meal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <img src={meal.image} alt={meal.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{meal.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{meal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{meal.calories}</p>
                    <p className="text-xs text-gray-600">kcal</p>
                    <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}