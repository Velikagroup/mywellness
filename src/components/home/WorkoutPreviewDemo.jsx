import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, Dumbbell, Clock, RotateCcw } from 'lucide-react';

export default function WorkoutPreviewDemo() {
  const [expandedExercise, setExpandedExercise] = useState(null);

  const warmup = [
    { name: 'Corsa sul Posto', duration: '5 minuti' },
    { name: 'Rotazioni delle Braccia', duration: '2 minuti' }
  ];

  const exercises = [
    {
      id: 1,
      name: 'Flessioni a Terra',
      sets: '4 set',
      reps: '10-12 rip',
      rest: '90 secondi',
      muscles: ['Pettorali', 'Tricipiti', 'Core'],
      description: 'Posizionati a terra con le mani alla larghezza delle spalle. Mantieni il corpo dritto e abbassati fino a sfiorare il pavimento.',
      tips: ['Mantieni addominali contratti', 'Non flettere la schiena', 'Scendi lentamente']
    },
    {
      id: 2,
      name: 'Squat a Corpo Libero',
      sets: '4 set',
      reps: '12 ripetizioni',
      rest: '90 secondi',
      muscles: ['Gambe', 'Glutei', 'Core'],
      description: 'Piedi alla larghezza delle spalle, scendi come se ti sedessi su una sedia mantenendo il peso sui talloni.',
      tips: ['Ginocchia in linea con le punte dei piedi', 'Schiena dritta', 'Scendi fino a 90°']
    },
    {
      id: 3,
      name: 'Crunch Addominali',
      sets: '3 set',
      reps: '15 ripetizioni',
      rest: '60 secondi',
      muscles: ['Addominali'],
      description: 'Sdraiato sulla schiena con ginocchia piegate, solleva le spalle dal pavimento contraendo gli addominali.',
      tips: ['Non tirare il collo', 'Contrai nella fase di salita', 'Movimento controllato']
    }
  ];

  const cooldown = [
    { name: 'Stretching Totale', duration: '5 minuti' }
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

        @keyframes expand {
          from { max-height: 0; opacity: 0; }
          to { max-height: 500px; opacity: 1; }
        }
        
        .expand-animation {
          animation: expand 0.3s ease-out forwards;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Piano di Allenamento</h2>
              <p className="text-sm text-gray-600 mt-1">Forza e Resistenza</p>
              <p className="text-xs text-gray-500 mt-0.5">Lunedì • 75 min • 500 kcal</p>
            </div>
          </div>
          

        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Warmup */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 px-2">Riscaldamento</h3>
            <div className="space-y-2">
              {warmup.map((exercise, idx) => (
                <div key={idx} className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">{exercise.name} <span className="text-blue-600">({exercise.duration})</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Exercises */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 px-2">Esercizi Principali</h3>
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                    className="w-full px-3 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">{exercise.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {exercise.sets} × {exercise.reps}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Riposo: {exercise.rest}
                        </span>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedExercise === exercise.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedExercise === exercise.id && (
                    <div className="px-3 pb-3 border-t border-gray-100 expand-animation">
                      <div className="pt-3 space-y-3">
                        {/* Set Tracker */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Registra Serie</p>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-green-50 border-2 border-green-500 rounded-lg px-3 py-2">
                              <p className="text-xs font-bold text-green-700">Set 1 ✓</p>
                              <p className="text-xs text-green-600">12 rip • 0kg</p>
                            </div>
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-60">
                              <p className="text-xs font-semibold text-gray-500">Set 2</p>
                              <p className="text-xs text-gray-400">- rip • -kg</p>
                            </div>
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-60">
                              <p className="text-xs font-semibold text-gray-500">Set 3</p>
                              <p className="text-xs text-gray-400">- rip • -kg</p>
                            </div>
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 opacity-60">
                              <p className="text-xs font-semibold text-gray-500">Set 4</p>
                              <p className="text-xs text-gray-400">- rip • -kg</p>
                            </div>
                          </div>
                        </div>

                        {/* Muscle Tags */}
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscles.map((muscle, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                              {muscle}
                            </span>
                          ))}
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Descrizione</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{exercise.description}</p>
                        </div>

                        {/* Tips */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Consigli</p>
                          <ul className="space-y-1">
                            {exercise.tips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-teal-500 mt-0.5">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 px-2">Defaticamento</h3>
            <div className="space-y-2">
              {cooldown.map((exercise, idx) => (
                <div key={idx} className="bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                  <p className="text-sm font-semibold text-green-900">{exercise.name} <span className="text-green-600">({exercise.duration})</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </Card>
    </>
  );
}