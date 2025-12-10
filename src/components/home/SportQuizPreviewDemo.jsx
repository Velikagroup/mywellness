import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Target, Trophy, Dumbbell, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

export default function SportQuizPreviewDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);

  const { t, language } = useLanguage();

  const translations = React.useMemo(() => ({
    it: {
      questions: 'domande',
      goalTitle: 'Qual è il tuo obiettivo principale?',
      goalSubtitle: 'Personalizzeremo tutto in base al tuo obiettivo',
      goalWeightLoss: 'Perdita Peso',
      goalWeightLossDesc: 'Dimagrire e tonificare',
      goalMuscle: 'Aumento Massa',
      goalMuscleDesc: 'Costruire muscoli',
      goalPerformance: 'Performance',
      goalPerformanceDesc: 'Migliorare prestazioni',
      yesSport: 'Sì, pratico uno sport',
      yesSportDesc: 'Allenamento specifico per il mio sport',
      noSport: 'No, solo palestra',
      noSportDesc: 'Allenamento generale in palestra',
      sportHint: '💡 Adatteremo esercizi e intensità al tuo sport specifico',
      whichSport: 'Quale sport pratichi?',
      whichSportSubtitle: 'Ottimizzeremo allenamento e alimentazione',
      others: 'Altro',
      sportSelected: '✓ Ottimo! Creeremo un piano specifico per te',
      footer: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup'
    },
    en: {
      questions: 'questions',
      goalTitle: 'What is your main goal?',
      goalSubtitle: 'We\'ll personalize everything based on your goal',
      goalWeightLoss: 'Weight Loss',
      goalWeightLossDesc: 'Lose weight and tone',
      goalMuscle: 'Muscle Gain',
      goalMuscleDesc: 'Build muscle',
      goalPerformance: 'Performance',
      goalPerformanceDesc: 'Improve performance',
      yesSport: 'Yes, I play a sport',
      yesSportDesc: 'Training specific to my sport',
      noSport: 'No, just gym',
      noSportDesc: 'General gym training',
      sportHint: '💡 We\'ll adapt exercises and intensity to your specific sport',
      whichSport: 'Which sport do you practice?',
      whichSportSubtitle: 'We\'ll optimize training and nutrition',
      others: 'Other',
      sportSelected: '✓ Great! We\'ll create a specific plan for you',
      footer: 'Interface preview • Features available after signup'
    },
    es: {
      questions: 'preguntas',
      goalTitle: '¿Cuál es tu objetivo principal?',
      goalSubtitle: 'Personalizaremos todo según tu objetivo',
      goalWeightLoss: 'Pérdida de Peso',
      goalWeightLossDesc: 'Adelgazar y tonificar',
      goalMuscle: 'Aumento Masa',
      goalMuscleDesc: 'Construir músculo',
      goalPerformance: 'Rendimiento',
      goalPerformanceDesc: 'Mejorar rendimiento',
      yesSport: 'Sí, practico un deporte',
      yesSportDesc: 'Entrenamiento específico para mi deporte',
      noSport: 'No, solo gimnasio',
      noSportDesc: 'Entrenamiento general en gimnasio',
      sportHint: '💡 Adaptaremos ejercicios e intensidad a tu deporte específico',
      whichSport: '¿Qué deporte practicas?',
      whichSportSubtitle: 'Optimizaremos entrenamiento y nutrición',
      others: 'Otro',
      sportSelected: '✓ ¡Genial! Crearemos un plan específico para ti',
      footer: 'Vista previa de interfaz • Funciones disponibles después del registro'
    },
    pt: {
      questions: 'perguntas',
      goalTitle: 'Qual é o seu objetivo principal?',
      goalSubtitle: 'Personalizaremos tudo com base no seu objetivo',
      goalWeightLoss: 'Perda de Peso',
      goalWeightLossDesc: 'Emagrecer e tonificar',
      goalMuscle: 'Ganho de Massa',
      goalMuscleDesc: 'Construir músculos',
      goalPerformance: 'Performance',
      goalPerformanceDesc: 'Melhorar desempenho',
      yesSport: 'Sim, pratico um esporte',
      yesSportDesc: 'Treino específico para meu esporte',
      noSport: 'Não, só academia',
      noSportDesc: 'Treino geral na academia',
      sportHint: '💡 Adaptaremos exercícios e intensidade ao seu esporte específico',
      whichSport: 'Qual esporte você pratica?',
      whichSportSubtitle: 'Otimizaremos treino e nutrição',
      others: 'Outro',
      sportSelected: '✓ Ótimo! Criaremos um plano específico para você',
      footer: 'Prévia da interface • Funcionalidades disponíveis após o cadastro'
    },
    de: {
      questions: 'Fragen',
      goalTitle: 'Was ist Ihr Hauptziel?',
      goalSubtitle: 'Wir personalisieren alles basierend auf Ihrem Ziel',
      goalWeightLoss: 'Gewichtsverlust',
      goalWeightLossDesc: 'Abnehmen und straffen',
      goalMuscle: 'Muskelaufbau',
      goalMuscleDesc: 'Muskeln aufbauen',
      goalPerformance: 'Leistung',
      goalPerformanceDesc: 'Leistung verbessern',
      yesSport: 'Ja, ich treibe Sport',
      yesSportDesc: 'Training spezifisch für meinen Sport',
      noSport: 'Nein, nur Fitnessstudio',
      noSportDesc: 'Allgemeines Fitnessstudio-Training',
      sportHint: '💡 Wir passen Übungen und Intensität an Ihren spezifischen Sport an',
      whichSport: 'Welchen Sport betreiben Sie?',
      whichSportSubtitle: 'Wir optimieren Training und Ernährung',
      others: 'Andere',
      sportSelected: '✓ Großartig! Wir erstellen einen spezifischen Plan für Sie',
      footer: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar'
    },
    fr: {
      questions: 'questions',
      goalTitle: 'Quel est votre objectif principal?',
      goalSubtitle: 'Nous personnaliserons tout selon votre objectif',
      goalWeightLoss: 'Perte de Poids',
      goalWeightLossDesc: 'Perdre du poids et tonifier',
      goalMuscle: 'Prise de Masse',
      goalMuscleDesc: 'Construire du muscle',
      goalPerformance: 'Performance',
      goalPerformanceDesc: 'Améliorer les performances',
      yesSport: 'Oui, je pratique un sport',
      yesSportDesc: 'Entraînement spécifique à mon sport',
      noSport: 'Non, juste la gym',
      noSportDesc: 'Entraînement général en salle',
      sportHint: '💡 Nous adapterons les exercices et l\'intensité à votre sport spécifique',
      whichSport: 'Quel sport pratiquez-vous?',
      whichSportSubtitle: 'Nous optimiserons l\'entraînement et la nutrition',
      others: 'Autre',
      sportSelected: '✓ Super! Nous créerons un plan spécifique pour vous',
      footer: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription'
    }
  }), []);

  const tr = translations[language] || translations.it;
  
  const goals = [
    { id: 'weight_loss', label: tr.goalWeightLoss, icon: '⬇️', desc: tr.goalWeightLossDesc },
    { id: 'muscle_gain', label: tr.goalMuscle, icon: '💪', desc: tr.goalMuscleDesc },
    { id: 'performance', label: tr.goalPerformance, icon: '🏆', desc: tr.goalPerformanceDesc }
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
    { id: 'altro', label: tr.others, icon: '➕' }
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
            {currentStep === 0 
              ? `4 / 12 ${tr.questions}` 
              : currentStep === 1 
              ? `5 / 12 ${tr.questions}` 
              : currentStep === 2 
              ? `6 / 12 ${tr.questions}` 
              : `7 / 12 ${tr.questions}`}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 h-[565px] overflow-hidden">
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
                <h3 className="text-2xl font-bold text-center mb-2">{tr.goalTitle}</h3>
                <p className="text-gray-500 text-center mb-6 text-sm">{tr.goalSubtitle}</p>
                
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
                        <p className="font-bold text-gray-900 text-lg">{tr.yesSport}</p>
                        <p className="text-sm text-gray-500">{tr.yesSportDesc}</p>
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
                        <p className="font-bold text-gray-900 text-lg">{tr.noSport}</p>
                        <p className="text-sm text-gray-500">{tr.noSportDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 text-center">
                    {tr.sportHint}
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
                <h3 className="text-2xl font-bold text-center mb-2">{tr.whichSport}</h3>
                <p className="text-gray-500 text-center mb-5 text-sm">{tr.whichSportSubtitle}</p>
                
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
                      {tr.sportSelected}
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
            {tr.footer}
          </p>
        </div>
      </Card>
    </>
  );
}