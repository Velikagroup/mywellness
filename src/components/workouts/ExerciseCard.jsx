import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dumbbell, Info, Zap, Eye, Check, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
// base44 non più necessario per traduzioni real-time

export default function ExerciseCard({ 
  exercise, 
  isCompleted, 
  onToggleComplete, 
  completedSets = [], 
  onSetToggle, 
  isToday = true,
  onReplace,
  onDelete,
  isDeleting = false,
  userStrengthLevel = 'moderate'
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { t, language } = useLanguage();
  
  // Genera intensity tips una volta per evitare loop infiniti
  const intensityTipsRef = React.useRef(null);
  
  const getIntensityTipsStable = React.useCallback(() => {
    if (intensityTipsRef.current) return intensityTipsRef.current;
    
    if (exercise.intensity_tips && exercise.intensity_tips.length > 0) {
      intensityTipsRef.current = exercise.intensity_tips;
      return exercise.intensity_tips;
    }
    
    const exerciseNameLower = (exercise.name || '').toLowerCase();
    
    const weightsByLevel = {
      never_lifted: { dumbbell: '1-3kg', barbell: 'solo bilanciere (10-15kg)', machine: 'carico minimo' },
      light: { dumbbell: '4-8kg', barbell: '15-25kg', machine: '20-35kg' },
      moderate: { dumbbell: '8-15kg', barbell: '30-50kg', machine: '40-60kg' },
      intermediate: { dumbbell: '12-20kg', barbell: '50-80kg', machine: '60-90kg' },
      advanced: { dumbbell: '18-30kg', barbell: '70-120kg', machine: '80-120kg' }
    };
    const weights = weightsByLevel[userStrengthLevel] || weightsByLevel.moderate;
    
    const isIsometric = ['plank', 'isometr', 'hold', 'tenuta', 'plancha', 'prancha', 'unterarm', 'gainage'].some(kw => exerciseNameLower.includes(kw));
    const isDumbbell = exerciseNameLower.includes('manubr') || exerciseNameLower.includes('dumbbell') || exerciseNameLower.includes('mancuerna') || exerciseNameLower.includes('haltere') || exerciseNameLower.includes('kurzhantel');
    const isBarbell = exerciseNameLower.includes('bilanciere') || exerciseNameLower.includes('barbell') || exerciseNameLower.includes('barra') || exerciseNameLower.includes('langhantel');
    const isMachine = ['macchina', 'leg press', 'cable', 'cavo', 'machine', 'polia', 'polea', 'maschine'].some(kw => exerciseNameLower.includes(kw));
    const isBodyweight = ['flessioni', 'piegamenti', 'trazioni', 'dip', 'push-up', 'pull-up', 'crunch', 'flexiones', 'pompes', 'liegestütz', 'flexões'].some(kw => exerciseNameLower.includes(kw));
    
    let tips;
    if (isIsometric) {
      tips = ["⏱️ Hold for 30-45 seconds per set", "💪 When you start shaking, intensity is right"];
    } else if (isDumbbell) {
      tips = [`🏋️ Use ${weights.dumbbell} dumbbells per side`, "🔥 Last 2-3 reps should be hard"];
    } else if (isBarbell) {
      tips = [`🏋️ Load barbell with ${weights.barbell}`, "📊 RPE 7-8: you should be able to do 2-3 more reps"];
    } else if (isMachine) {
      tips = [`🏋️ Set machine to ${weights.machine}`, "🔥 Last reps should be challenging"];
    } else if (isBodyweight) {
      tips = ["⏱️ Slow down descent to 3 seconds if too easy", "✅ Maintain perfect form"];
    } else {
      tips = ["💪 Choose a load that makes last reps hard", "📊 RPE 7-8"];
    }
    
    intensityTipsRef.current = tips;
    return tips;
  }, [exercise.name, exercise.intensity_tips, userStrengthLevel]);
  
  // NO REAL-TIME TRANSLATION - il piano viene generato già nella lingua corretta
  const displayExercise = exercise;
  
  const intensityTips = displayExercise.intensity_tips || getIntensityTipsStable();
  
  // Il nome esercizio è già nella lingua corretta (generato dall'AI nella lingua giusta)
  // O usa name_translations se presente
  const exerciseName = exercise.name_translations?.[language] || exercise.name;
  
  const toggleSet = (setNumber) => {
    const newCompleted = completedSets.includes(setNumber)
      ? completedSets.filter(s => s !== setNumber)
      : [...completedSets, setNumber];
    onSetToggle(newCompleted);
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700 border-green-300',
    intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    advanced: 'bg-red-100 text-red-700 border-red-300'
  };

  const difficultyLabels = {
    beginner: t('workouts.beginner'),
    intermediate: t('workouts.intermediate'),
    advanced: t('workouts.advanced')
  };

  return (
    <>
      <motion.div
        animate={{
          backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',
          borderColor: isCompleted ? '#16a34a' : '#e5e7eb'
        }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`shadow-md hover:shadow-lg transition-all relative ${
          isCompleted ? 'border-2' : 'border'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-bold text-gray-900 mb-1">
                  {exerciseName}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  <span className="bg-[#26847F] text-white px-2 py-1 rounded font-semibold">
                    {exercise.sets} {t('workouts.sets')} × {exercise.reps}
                  </span>
                  <span className="text-gray-600">• {exercise.rest}</span>
                </div>

                {/* ✅ SET BUTTONS SOLO PER OGGI */}
                {isToday && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: exercise.sets || 0 }, (_, i) => i + 1).map((setNum) => {
                      const isSetCompleted = completedSets.includes(setNum);
                      return (
                        <motion.button
                          key={setNum}
                          onClick={() => toggleSet(setNum)}
                          animate={{
                            scale: isSetCompleted ? [1, 1.1, 1] : 1,
                            backgroundColor: isSetCompleted ? '#26847F' : '#ffffff',
                            borderColor: isSetCompleted ? '#1f6b66' : '#e5e7eb'
                          }}
                          transition={{ duration: 0.3 }}
                          className={`relative px-3 py-2 rounded-lg border-2 shadow-sm transition-all flex items-center gap-1 ${
                            isSetCompleted 
                              ? 'text-white' 
                              : 'text-gray-700 hover:border-[#26847F] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-bold">{t('workouts.set')} {setNum}</span>
                          {isSetCompleted && (
                            <Check className="w-3 h-3" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {!isToday && (
                  <p className="text-xs text-gray-500 italic">{t('workouts.viewingProgram')}</p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-3">
            {(displayExercise.muscle_groups || exercise.muscle_groups)?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {(displayExercise.muscle_groups || exercise.muscle_groups).slice(0, 3).map((mg, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                    {mg}
                  </span>
                ))}
              </div>
            )}
            
            {/* Mostra intensity tips direttamente sulla card - SEMPRE visibili */}
            {intensityTips && intensityTips.length > 0 && (
              <div className="mb-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-bold text-orange-800 mb-2">🎯 {t('workouts.intensityTipsSuggested')}</p>
                <ul className="space-y-1">
                  {intensityTips.slice(0, 2).map((tip, idx) => (
                    <li key={idx} className="text-xs text-orange-700 flex items-start gap-1">
                      <span className="flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {exercise.difficulty && (
                <span className={`text-xs px-2 py-1 rounded border font-semibold ${difficultyColors[exercise.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                  {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                </span>
              )}
              
              <div className="flex items-center gap-1 ml-auto">
                {/* Pulsante Sostituisci */}
                {onReplace && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReplace}
                    className="text-gray-400 hover:text-[#26847F] hover:bg-[#e9f6f5] p-2"
                    title={t('workouts.replace')}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                
                {/* Pulsante Elimina */}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2"
                    title={t('workouts.deleteExercise')}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {(exercise.detailed_description || (exercise.form_tips && exercise.form_tips.length > 0) || (exercise.target_muscles && exercise.target_muscles.length > 0) || intensityTips.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(true)}
                    className="text-[#26847F] hover:text-[#1f6b66] hover:bg-[#e9f6f5]"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t('workouts.details')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>

          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-2 right-2"
            >
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                {t('workouts.done')}
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {showDetails && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-[#26847F]" />
                {exerciseName}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {exercise.sets} {t('workouts.sets')} × {exercise.reps} • {exercise.rest}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Target Muscles - mostra sempre anche se vuoto con fallback */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 {t('workouts.targetMuscles')}</h4>
                <div className="flex flex-wrap gap-2">
                  {((displayExercise.target_muscles || exercise.target_muscles)?.length > 0 
                    ? (displayExercise.target_muscles || exercise.target_muscles)
                    : (displayExercise.muscle_groups || exercise.muscle_groups || [])
                  ).map((muscle, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              {/* Descrizione Dettagliata - mostra sempre con fallback */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  {t('workouts.detailedDescription')}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {displayExercise.detailed_description || exercise.detailed_description || exercise.description || t('workouts.noDescriptionAvailable')}
                </p>
              </div>

              {/* Form Tips - mostra sempre con fallback */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  {t('workouts.formTips')}
                </h4>
                <ul className="space-y-2">
                  {((displayExercise.form_tips || exercise.form_tips)?.length > 0 
                    ? (displayExercise.form_tips || exercise.form_tips)
                    : [t('workouts.defaultFormTip1'), t('workouts.defaultFormTip2'), t('workouts.defaultFormTip3')]
                  ).map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 font-bold flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Intensity Tips - sempre visibile */}
              {intensityTips?.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-orange-600" />
                    {t('workouts.loadIntensity')}
                  </h4>
                  <ul className="space-y-2">
                    {intensityTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowDetails(false)}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {t('common.close')}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}