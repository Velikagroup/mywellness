import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Target, Trophy, Dumbbell, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SportQuizPreviewDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);

  const goals = [
    { id: 'weight_loss', label: 'Perdita Peso', icon: '⬇️', desc: 'Dimagrire e tonificare' },
    { id: 'muscle_gain', label: 'Massa Muscolare', icon: '💪', desc: 'Aumentare forza e volume' },
    { id: 'performance', label: 'Performance', icon: '🏆', desc: 'Migliorare nello sport' }
  ];

  const sports = [
    { id: 'bodybuilding', label: 'Bodybuilding', icon: '💪' },
    { id: 'powerlifting', label: 'Powerlifting', icon: '🏋️' },
    { id: 'crossfit', label: 'CrossFit', icon: '🔥' },
    { id: 'hiit', label: 'HIIT', icon: '⚡' },
    { id: 'calisthenics', label: 'Calisthenics', icon: '🤸' },
    { id: 'yoga', label: 'Yoga', icon: '🧘' },
    { id: 'pilates', label: 'Pilates', icon: '🎯' },
    { id: 'kickboxing', label: 'Kickboxing', icon: '🥊' },
    { id: 'mma', label: 'MMA', icon: '👊' },
    { id: 'spinning', label: 'Spinning', icon: '🚴' },
    { id: 'zumba', label: 'Zumba', icon: '💃' },
    { id: 'altro', label: '60+ Altri...', icon: '➕' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev === 0) {
          setSelectedGoal('performance');
          return 1;
        } else if (prev === 1) {
          setSelectedPerformance(true);
          return 2;
        } else if (prev === 2) {
          setSelectedSport('calcio');
          return 3;
        } else {
          // Reset
          setSelectedGoal(null);
          setSelectedPerformance(null);
          setSelectedSport(null);
          return 0;
        }
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

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

        .goal-card {
          transition: all 0.3s ease;
        }

        .goal-card.selected {
          transform: scale(1.02);
          border-color: #26847F;
          background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%);
        }

        .sport-chip {
          transition: all 0.2s ease;
        }

        .sport-chip.selected {
          background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%);
          color: white;
          transform: scale(1.05);
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#26847F] to-teal-400 rounded-r-full"
            initial={{ width: '33%' }}
            animate={{ width: currentStep === 0 ? '33%' : currentStep === 1 ? '50%' : currentStep === 2 ? '67%' : '83%' }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <p className="text-sm text-gray-500 text-center">
            {currentStep === 0 ? '4 / 12 domande' : currentStep === 1 ? '5 / 12 domande' : currentStep === 2 ? '6 / 12 domande' : '7 / 12 domande'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 h-[650px] overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Obiettivo */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#26847F] to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Qual è il tuo obiettivo?</h3>
                <p className="text-gray-500 text-center mb-6 text-sm">Scegli l'obiettivo principale</p>
                
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`goal-card p-4 bg-white rounded-xl border-2 cursor-pointer ${
                        selectedGoal === goal.id ? 'selected border-[#26847F]' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{goal.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{goal.label}</p>
                          <p className="text-xs text-gray-500">{goal.desc}</p>
                        </div>
                        {selectedGoal === goal.id && (
                          <div className="w-6 h-6 bg-[#26847F] rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Performance Oriented */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Pratichi uno sport?</h3>
                <p className="text-gray-500 text-center mb-6 text-sm">
                  Adatteremo l'allenamento al tuo sport
                </p>
                
                <div className="space-y-4">
                  <div
                    className={`goal-card p-5 bg-white rounded-xl border-2 cursor-pointer ${
                      selectedPerformance === true ? 'selected border-[#26847F]' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🏆</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">Sì, pratico uno sport</p>
                        <p className="text-sm text-gray-500">L'AI creerà un programma specifico</p>
                      </div>
                      {selectedPerformance === true && (
                        <div className="w-6 h-6 bg-[#26847F] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`goal-card p-5 bg-white rounded-xl border-2 border-gray-200 opacity-60`}>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🏋️</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">No, solo fitness</p>
                        <p className="text-sm text-gray-500">Programma generale di allenamento</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 text-center">
                    💡 Se pratichi uno sport, creeremo un piano che migliora le tue prestazioni specifiche
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Sport Selection */}
            {(currentStep === 2 || currentStep === 3) && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Dumbbell className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center mb-2">Quale sport pratichi?</h3>
                <p className="text-gray-500 text-center mb-5 text-sm">Seleziona il tuo sport principale</p>
                
                <div className="grid grid-cols-3 gap-2">
                  {sports.map((sport) => (
                    <div
                      key={sport.id}
                      className={`sport-chip p-3 bg-white rounded-xl border-2 cursor-pointer text-center ${
                        selectedSport === sport.id ? 'selected border-[#26847F]' : 'border-gray-200'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{sport.icon}</span>
                      <p className="text-xs font-semibold truncate">{sport.label}</p>
                    </div>
                  ))}
                </div>

                {selectedSport && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200"
                  >
                    <p className="text-sm text-green-800 text-center font-medium">
                      ✅ L'AI creerà un piano specifico per il Calcio
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            Anteprima Quiz • Personalizzazione sport inclusa
          </p>
        </div>
      </Card>
    </>
  );
}