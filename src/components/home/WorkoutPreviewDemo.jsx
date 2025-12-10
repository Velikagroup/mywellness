import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, Dumbbell, Clock, RotateCcw, Flame, Timer, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function WorkoutPreviewDemo() {
  const { t, language } = useLanguage();
  const [expandedExercise, setExpandedExercise] = useState(1);
  const [selectedDay, setSelectedDay] = useState('lun');

  const translations = React.useMemo(() => ({
    it: {
      weeklyPlan: 'Piano Settimanale',
      subtitle: 'Allenamenti personalizzati',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Gio', friday: 'Ven', saturday: 'Sab', sunday: 'Dom',
      exercises: 'Esercizi',
      warmup: 'Riscaldamento',
      cooldown: 'Defaticamento',
      rest: 'Riposo',
      completedSets: 'Serie completate',
      tips: 'Consigli',
      preview: 'Anteprima interfaccia • Funzionalità disponibili dopo il signup',
      warmup1: 'Cardio Leggero', warmup2: 'Mobilità Articolare',
      exercise1: 'Squat con Bilanciere', exercise2: 'Stacchi Rumeni', exercise3: 'Panca Piana',
      muscle1: 'Quadricipiti', muscle2: 'Glutei', muscle3: 'Core', muscle4: 'Femorali', muscle5: 'Lombari', muscle6: 'Pettorali',
      exercise1Desc: 'Re degli esercizi per le gambe', exercise2Desc: 'Catena posteriore completa', exercise3Desc: 'Fondamentale per il petto',
      tip1a: 'Scendi sotto il parallelo', tip1b: 'Spingi dai talloni', tip1c: 'Mantieni schiena dritta',
      tip2a: 'Ginocchia leggermente flesse', tip2b: 'Spingi con i glutei', tip2c: 'Mantieni barra vicina',
      tip3a: 'Gomiti a 45°', tip3b: 'Scendi al petto', tip3c: 'Spingi esplosivo',
      cooldown1: 'Stretching Gambe'
    },
    en: {
      weeklyPlan: 'Weekly Plan',
      subtitle: 'Personalized workouts',
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
      exercises: 'Exercises',
      warmup: 'Warmup',
      cooldown: 'Cooldown',
      rest: 'Rest',
      completedSets: 'Completed sets',
      tips: 'Tips',
      preview: 'Interface preview • Features available after signup',
      warmup1: 'Light Cardio', warmup2: 'Joint Mobility',
      exercise1: 'Barbell Squat', exercise2: 'Romanian Deadlift', exercise3: 'Bench Press',
      muscle1: 'Quadriceps', muscle2: 'Glutes', muscle3: 'Core', muscle4: 'Hamstrings', muscle5: 'Lower Back', muscle6: 'Chest',
      exercise1Desc: 'King of leg exercises', exercise2Desc: 'Complete posterior chain', exercise3Desc: 'Essential for chest',
      tip1a: 'Go below parallel', tip1b: 'Push through heels', tip1c: 'Keep back straight',
      tip2a: 'Slight knee bend', tip2b: 'Drive with glutes', tip2c: 'Keep bar close',
      tip3a: 'Elbows at 45°', tip3b: 'Lower to chest', tip3c: 'Push explosively',
      cooldown1: 'Leg Stretching'
    },
    es: {
      weeklyPlan: 'Plan Semanal',
      subtitle: 'Entrenamientos personalizados',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
      exercises: 'Ejercicios',
      warmup: 'Calentamiento',
      cooldown: 'Enfriamiento',
      rest: 'Descanso',
      completedSets: 'Series completadas',
      tips: 'Consejos',
      preview: 'Vista previa de interfaz • Funciones disponibles después del registro',
      warmup1: 'Cardio Ligero', warmup2: 'Movilidad Articular',
      exercise1: 'Sentadilla con Barra', exercise2: 'Peso Muerto Rumano', exercise3: 'Press de Banca',
      muscle1: 'Cuádriceps', muscle2: 'Glúteos', muscle3: 'Core', muscle4: 'Isquiotibiales', muscle5: 'Lumbar', muscle6: 'Pectorales',
      exercise1Desc: 'Rey de ejercicios de piernas', exercise2Desc: 'Cadena posterior completa', exercise3Desc: 'Fundamental para pecho',
      tip1a: 'Baja bajo paralelo', tip1b: 'Empuja con talones', tip1c: 'Mantén espalda recta',
      tip2a: 'Rodillas ligeramente flexionadas', tip2b: 'Empuja con glúteos', tip2c: 'Mantén barra cerca',
      tip3a: 'Codos a 45°', tip3b: 'Baja al pecho', tip3c: 'Empuja explosivo',
      cooldown1: 'Estiramiento Piernas'
    },
    pt: {
      weeklyPlan: 'Plano Semanal',
      subtitle: 'Treinos personalizados',
      monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
      exercises: 'Exercícios',
      warmup: 'Aquecimento',
      cooldown: 'Resfriamento',
      rest: 'Descanso',
      completedSets: 'Séries completadas',
      tips: 'Dicas',
      preview: 'Prévia da interface • Funcionalidades disponíveis após o cadastro',
      warmup1: 'Cardio Leve', warmup2: 'Mobilidade Articular',
      exercise1: 'Agachamento com Barra', exercise2: 'Levantamento Terra Romeno', exercise3: 'Supino Reto',
      muscle1: 'Quadríceps', muscle2: 'Glúteos', muscle3: 'Core', muscle4: 'Posteriores', muscle5: 'Lombar', muscle6: 'Peitorais',
      exercise1Desc: 'Rei dos exercícios de pernas', exercise2Desc: 'Cadeia posterior completa', exercise3Desc: 'Fundamental para peito',
      tip1a: 'Desça abaixo do paralelo', tip1b: 'Empurre pelos calcanhares', tip1c: 'Mantenha costas retas',
      tip2a: 'Joelhos levemente flexionados', tip2b: 'Empurre com glúteos', tip2c: 'Mantenha barra próxima',
      tip3a: 'Cotovelos a 45°', tip3b: 'Desça ao peito', tip3c: 'Empurre explosivo',
      cooldown1: 'Alongamento Pernas'
    },
    de: {
      weeklyPlan: 'Wochenplan',
      subtitle: 'Personalisierte Trainings',
      monday: 'Mo', tuesday: 'Di', wednesday: 'Mi', thursday: 'Do', friday: 'Fr', saturday: 'Sa', sunday: 'So',
      exercises: 'Übungen',
      warmup: 'Aufwärmen',
      cooldown: 'Abkühlen',
      rest: 'Ruhe',
      completedSets: 'Abgeschlossene Sätze',
      tips: 'Tipps',
      preview: 'Interface-Vorschau • Funktionen nach Anmeldung verfügbar',
      warmup1: 'Leichtes Cardio', warmup2: 'Gelenkmobilität',
      exercise1: 'Kniebeugen mit Langhantel', exercise2: 'Rumänisches Kreuzheben', exercise3: 'Bankdrücken',
      muscle1: 'Quadrizeps', muscle2: 'Gesäß', muscle3: 'Rumpf', muscle4: 'Beinbeuger', muscle5: 'Unterer Rücken', muscle6: 'Brustmuskulatur',
      exercise1Desc: 'König der Beinübungen', exercise2Desc: 'Komplette hintere Kette', exercise3Desc: 'Grundübung für Brust',
      tip1a: 'Unter Parallel gehen', tip1b: 'Über Fersen drücken', tip1c: 'Rücken gerade halten',
      tip2a: 'Knie leicht gebeugt', tip2b: 'Mit Gesäß drücken', tip2c: 'Stange nah halten',
      tip3a: 'Ellbogen bei 45°', tip3b: 'Zur Brust senken', tip3c: 'Explosiv drücken',
      cooldown1: 'Beindehnung'
    },
    fr: {
      weeklyPlan: 'Programme Hebdomadaire',
      subtitle: 'Entraînements personnalisés',
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim',
      exercises: 'Exercices',
      warmup: 'Échauffement',
      cooldown: 'Récupération',
      rest: 'Repos',
      completedSets: 'Séries terminées',
      tips: 'Conseils',
      preview: 'Aperçu de l\'interface • Fonctionnalités disponibles après inscription',
      warmup1: 'Cardio Léger', warmup2: 'Mobilité Articulaire',
      exercise1: 'Squat avec Barre', exercise2: 'Soulevé de Terre Roumain', exercise3: 'Développé Couché',
      muscle1: 'Quadriceps', muscle2: 'Fessiers', muscle3: 'Tronc', muscle4: 'Ischio-jambiers', muscle5: 'Bas du Dos', muscle6: 'Pectoraux',
      exercise1Desc: 'Roi des exercices jambes', exercise2Desc: 'Chaîne postérieure complète', exercise3Desc: 'Fondamental pour poitrine',
      tip1a: 'Descendre sous parallèle', tip1b: 'Pousser par talons', tip1c: 'Maintenir dos droit',
      tip2a: 'Genoux légèrement fléchis', tip2b: 'Pousser avec fessiers', tip2c: 'Maintenir barre proche',
      tip3a: 'Coudes à 45°', tip3b: 'Descendre à poitrine', tip3c: 'Pousser explosif',
      cooldown1: 'Étirement Jambes'
    }
  }), []);

  const tr = translations[language] || translations.it;

  const days = [
    { id: 'lun', label: tr.monday, active: true, type: 'strength' },
    { id: 'mar', label: tr.tuesday, active: true, type: 'cardio' },
    { id: 'mer', label: tr.wednesday, active: false, type: 'rest' },
    { id: 'gio', label: tr.thursday, active: true, type: 'strength' },
    { id: 'ven', label: tr.friday, active: true, type: 'hiit' },
    { id: 'sab', label: tr.saturday, active: false, type: 'rest' },
    { id: 'dom', label: tr.sunday, active: true, type: 'cardio' }
  ];

  const warmup = [
    { name: tr.warmup1, duration: '5 min' },
    { name: tr.warmup2, duration: '2 min' }
  ];

  const exercises = [
    {
      id: 1,
      name: tr.exercise1,
      sets: '4',
      reps: '10-12',
      rest: '90s',
      muscles: [tr.muscle1, tr.muscle2, tr.muscle3],
      description: tr.exercise1Desc,
      tips: [tr.tip1a, tr.tip1b, tr.tip1c]
    },
    {
      id: 2,
      name: tr.exercise2,
      sets: '4',
      reps: '12',
      rest: '90s',
      muscles: [tr.muscle4, tr.muscle5, tr.muscle3],
      description: tr.exercise2Desc,
      tips: [tr.tip2a, tr.tip2b, tr.tip2c]
    },
    {
      id: 3,
      name: tr.exercise3,
      sets: '3',
      reps: '15',
      rest: '60s',
      muscles: [tr.muscle6],
      description: tr.exercise3Desc,
      tips: [tr.tip3a, tr.tip3b, tr.tip3c]
    }
  ];

  const cooldown = [
    { name: tr.cooldown1, duration: '5 min' }
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
          <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-gray-900">
                {tr.weeklyPlan}
              </h2>
              <p className="text-xs text-gray-500">
                {tr.subtitle}
              </p>
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
                <span className="text-sm font-semibold text-gray-700">6 {tr.exercises.toLowerCase()}</span>
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
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr.warmup}</h3>
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
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {tr.exercises}
              </h3>
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
                        <span className="text-xs text-gray-500">{exercise.rest}</span>
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
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            {tr.completedSets}
                          </p>
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
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            💡 {tr.tips}
                          </p>
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
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{tr.cooldown}</h3>
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
            {tr.preview}
          </p>
        </div>
      </Card>
    </>
  );
}