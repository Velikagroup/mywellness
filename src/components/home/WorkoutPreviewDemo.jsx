import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, Dumbbell, Clock, RotateCcw, Flame, Timer, ChevronRight } from 'lucide-react';

export default function WorkoutPreviewDemo() {
  const [expandedExercise, setExpandedExercise] = useState(1);
  const [selectedDay, setSelectedDay] = useState('lun');

  const days = [
    { id: 'lun', label: 'Lun', active: true, type: 'strength' },
    { id: 'mar', label: 'Mar', active: true, type: 'cardio' },
    { id: 'mer', label: 'Mer', active: false, type: 'rest' },
    { id: 'gio', label: 'Gio', active: true, type: 'strength' },
    { id: 'ven', label: 'Ven', active: true, type: 'hiit' },
    { id: 'sab', label: 'Sab', active: false, type: 'rest' },
    { id: 'dom', label: 'Dom', active: true, type: 'cardio' }
  ];

  const warmup = [
    { name: 'Corsa sul Posto', duration: '5 min' },
    { name: 'Rotazioni Braccia', duration: '2 min' }
  ];

  const exercises = [
    {
      id: 1,
      name: 'Flessioni a Terra',
      sets: '4',
      reps: '10-12',
      rest: '90s',
      muscles: ['Pettorali', 'Tricipiti', 'Core'],
      description: 'Posizionati a terra con le mani alla larghezza delle spalle. Mantieni il corpo dritto e abbassati fino a sfiorare il pavimento.',
      tips: ['Mantieni addominali contratti', 'Non flettere la schiena', 'Scendi lentamente']
    },
    {
      id: 2,
      name: 'Squat a Corpo Libero',
      sets: '4',
      reps: '12',
      rest: '90s',
      muscles: ['Gambe', 'Glutei', 'Core'],
      description: 'Piedi alla larghezza delle spalle, scendi come se ti sedessi su una sedia mantenendo il peso sui talloni.',
      tips: ['Ginocchia in linea con le punte dei piedi', 'Schiena dritta', 'Scendi fino a 90°']
    },
    {
      id: 3,
      name: 'Crunch Addominali',
      sets: '3',
      reps: '15',
      rest: '60s',
      muscles: ['Addominali'],
      description: 'Sdraiato sulla schiena con ginocchia piegate, solleva le spalle dal pavimento contraendo gli addominali.',
      tips: ['Non tirare il collo', 'Contrai nella fase di salita', 'Movimento controllato']
    }
  ];

  const cooldown = [
    { name: 'Stretching Totale', duration: '5 min' }
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
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Piano Settimanale</h2>
              <p className="text-xs text-gray-500">Forza & Resistenza • Personalizzato</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-lg">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-bold text-orange-700">2.5k</span>
              </div>
            </div>
          </div>
          
          {/* Days Selector */}
          <div className="flex gap-1.5 mb-3">
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === day.id
                    ? 'bg-[#26847F] text-white shadow-md'
                    : day.active
                    ? 'bg-white text-gray-700 border border-gray-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Today's Stats */}
          <div className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700">75 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">~500 kcal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">6 esercizi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-3 max-h-[420px] overflow-y-auto">
          {/* Warmup */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs">🔥</span>
              </div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Riscaldamento</h3>
            </div>
            <div className="flex gap-2">
              {warmup.map((exercise, idx) => (
                <div key={idx} className="flex-1 bg-blue-50/70 rounded-lg px-2.5 py-2 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-900">{exercise.name}</p>
                  <p className="text-xs text-blue-600">{exercise.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Exercises */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <Dumbbell className="w-3 h-3 text-purple-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Esercizi</h3>
            </div>
            <div className="space-y-2">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 text-sm">{exercise.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500 font-medium">{exercise.sets} × {exercise.reps}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">Riposo {exercise.rest}</span>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedExercise === exercise.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedExercise === exercise.id && (
                    <div className="px-3 pb-3 border-t border-gray-100 expand-animation">
                      <div className="pt-2.5 space-y-2.5">
                        {/* Set Tracking Boxes */}
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Serie completate</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[...Array(parseInt(exercise.sets))].map((_, i) => (
                              <div 
                                key={i}
                                className={`py-2.5 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                  i === 0 
                                    ? 'bg-green-50 border-green-500' 
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span className={`text-xs font-bold ${i === 0 ? 'text-green-700' : 'text-gray-500'}`}>
                                  Set {i + 1}
                                </span>
                                <div className={`w-5 h-5 mt-1 rounded-full flex items-center justify-center ${
                                  i === 0 ? 'bg-green-500' : 'border-2 border-gray-300'
                                }`}>
                                  {i === 0 && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Muscle Tags */}
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscles.map((muscle, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                              {muscle}
                            </span>
                          ))}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed">{exercise.description}</p>

                        {/* Tips */}
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">💡 Consigli</p>
                          <ul className="space-y-0.5">
                            {exercise.tips.map((tip, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                <span className="text-teal-500">•</span>
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
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs">🧘</span>
              </div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Defaticamento</h3>
            </div>
            {cooldown.map((exercise, idx) => (
              <div key={idx} className="bg-green-50/70 rounded-lg px-3 py-2 border border-green-100">
                <p className="text-sm font-semibold text-green-900">{exercise.name} <span className="text-green-600 font-normal">• {exercise.duration}</span></p>
              </div>
            ))}
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