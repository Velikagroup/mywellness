import React from 'react';
import { Flame } from 'lucide-react';

export default function CalorieBalanceSection({ 
  user, 
  weightHistory = [], 
  todayCalorieBalance = null,
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

  return (
    <div className="flex flex-col bg-white/65 rounded-xl p-6 border border-gray-200/30 backdrop-blur-md shadow-xl">
      {/* Layout principale: Bilancio a sinistra, pesi a destra */}
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
    </div>
  );
}