import React from 'react';
import { Flame } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export default function CalorieBalanceSection({ 
  user, 
  weightHistory = [], 
  todayCalorieBalance = null,
  lineData = [],
  calorieBalanceMap = {},
  t 
}) {
  // Calcolo peso attuale e target
  const startWeight = user?.current_weight || 0;
  const targetWeight = user?.target_weight || 0;
  
  // Ordina per data per trovare l'ultimo peso registrato
  const sortedByDate = [...weightHistory].sort((a, b) => {
    const dateA = a.date || new Date(a.created_date).toISOString().substring(0, 10);
    const dateB = b.date || new Date(b.created_date).toISOString().substring(0, 10);
    return dateA.localeCompare(dateB);
  });
  
  const lastRecordedWeight = sortedByDate.length > 0 ? 
    parseFloat(sortedByDate[sortedByDate.length - 1].weight) : 
    startWeight;
  
  // Logica colori per il peso
  const totalWeightToChange = startWeight - targetWeight;
  const isWeightLoss = totalWeightToChange > 0;
  const actualWeightChange = lastRecordedWeight - startWeight;
  
  // Colore peso: verde se movimento coerente con obiettivo, rosso se opposto
  const isWeightAligned = (isWeightLoss && actualWeightChange < 0) || 
                          (!isWeightLoss && actualWeightChange > 0) ||
                          (totalWeightToChange === 0);
  
  // Logica colori per le calorie di oggi
  // Se obiettivo è perdere peso:
  //   - Bilancio negativo (deficit) = VERDE
  //   - Bilancio positivo (surplus) = ROSSO
  // Se obiettivo è aumentare peso:
  //   - Bilancio positivo (surplus) = VERDE
  //   - Bilancio negativo (deficit) = ROSSO
  const isCalorieAligned = isWeightLoss 
    ? (todayCalorieBalance !== null && todayCalorieBalance < 0)
    : (todayCalorieBalance !== null && todayCalorieBalance > 0);
  
  const calorieColor = isCalorieAligned ? 'text-green-700' : 'text-red-700';
  const calorieBackground = isCalorieAligned ? 'from-green-50/70 to-green-100/30 border-green-200/40' : 'from-red-50/70 to-red-100/30 border-red-200/40';

  // Calcolo asse Y per il grafico
  const allWeights = weightHistory.map(d => d.weight).concat([startWeight, targetWeight]).filter(w => w > 0);
  const yAxisDomain = allWeights.length > 0 
    ? [Math.floor(Math.min(...allWeights) - 2), Math.ceil(Math.max(...allWeights) + 2)]
    : [0, 100];

  return (
    <div className="flex flex-col bg-white/65 rounded-xl p-6 border border-gray-200/30 backdrop-blur-md shadow-xl">
      {/* SEZIONE SUPERIORE: Bilancio + Pesi */}
      <div className="flex items-start justify-between gap-6 mb-6">
        
        {/* SINISTRA: Bilancio Calorico Principale */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-8 h-8 text-orange-500" />
            <p className="text-sm font-semibold text-gray-700">Bilancio di oggi</p>
          </div>
          
          {todayCalorieBalance !== null ? (
            <>
              <p className={`text-5xl font-bold ${calorieColor} leading-tight`}>
                {todayCalorieBalance > 0 ? '+' : ''}{Math.round(todayCalorieBalance)}
              </p>
              <p className="text-xl text-gray-600 font-medium">kcal</p>
              
              {/* Descrizione stato */}
              <div className={`mt-3 inline-block px-4 py-2 rounded-full text-sm font-medium ${
                isCalorieAligned 
                  ? 'bg-green-100/70 text-green-700'
                  : 'bg-red-100/70 text-red-700'
              }`}>
                {isWeightLoss 
                  ? (isCalorieAligned ? 'In forte deficit' : 'In surplus')
                  : (isCalorieAligned ? 'In surplus' : 'In deficit')
                }
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">Dati non disponibili</p>
          )}
        </div>

        {/* DESTRA: Peso Attuale → Target */}
        <div className="flex-1 flex items-center justify-end">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 px-6 py-4 shadow-lg flex items-center gap-4">
            
            {/* Peso Attuale */}
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Attuale
              </p>
              <p className={`text-2xl font-bold ${isWeightAligned ? 'text-green-700' : 'text-red-700'}`}>
                {lastRecordedWeight.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 font-medium">kg</p>
            </div>

            {/* Freccia */}
            <div className="text-2xl text-gray-400 font-light">
              &gt;
            </div>

            {/* Peso Target */}
            <div className="text-left">
              <p className="text-xs font-semibold text-[#1a5753] uppercase tracking-wide mb-1">
                Target
              </p>
              <p className="text-2xl font-bold text-[#26847F]">
                {targetWeight.toFixed(1)}
              </p>
              <p className="text-xs text-[#1a5753] font-medium">kg</p>
            </div>

          </div>
        </div>

      </div>

      {/* SEZIONE INFERIORE: Grafico Peso */}
      {lineData.length > 0 && (
        <div className="h-64 relative pt-6 border-t border-gray-200/50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 25, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="bodyFatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="weightLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#26847F" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#26847F" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#26847F" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
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
                formatter={(value, name, props) => {
                  if (name === 'weight') {
                    return [`${value.toFixed(1)} kg`, 'Peso'];
                  }
                  return [value, name];
                }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-lg">
                        <p className="font-semibold text-gray-900">{data.name}</p>
                        <p className="text-sm text-gray-700">{data.weight.toFixed(1)} kg</p>
                        {data.calorieBalance !== null && (
                          <p className={`text-sm font-semibold ${data.calorieBalance < 0 ? 'text-green-600' : data.calorieBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            Bilancio: {data.calorieBalance > 0 ? '+' : ''}{data.calorieBalance} kcal
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
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
              {lineData.length > 0 && user.body_fat_percentage && (
                <ReferenceLine 
                  x={lineData[lineData.length - 1].name}
                  stroke="url(#bodyFatGradient)"
                  strokeWidth={100}
                  isFront={false}
                />
              )}
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
          <div className="absolute top-2 right-8 flex flex-col gap-2">
            {lineData.length > 0 && user.body_fat_percentage && (
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border-2 border-purple-400 shadow-lg">
                <p className="text-sm font-bold text-purple-700">{parseFloat(user.body_fat_percentage).toFixed(1)}%</p>
                <p className="text-xs text-purple-600">Massa Grassa</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}