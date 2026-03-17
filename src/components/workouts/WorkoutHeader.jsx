import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, AlertCircle, Upload } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import ImportWorkoutPlanModal from './ImportWorkoutPlanModal';

export default function WorkoutHeader({
  trainingData,
  workoutPlans,
  totalExercisesInWeeklyPlan,
  remainingGenerations,
  generationLimitReached,
  onGenerateClick,
  onUpgradeClick,
  user,
  onWorkoutImported
}) {
  const { t, language } = useLanguage();

  const importPlanLabels = {
    it: 'Importa Piano',
    en: 'Import Plan',
    es: 'Importar Plan',
    pt: 'Importar Plano',
    de: 'Plan Importieren',
    fr: 'Importer Plan'
  };
  const [showImportModal, setShowImportModal] = useState(false);

  const formatFitnessGoal = (goal) => {
    const goalLabels = {
      'forza_massimale': 'Forza Massimale',
      'ipertrofia': 'Ipertrofia',
      'dimagrimento': 'Dimagrimento',
      'resistenza': 'Resistenza',
      'esplosivita': 'Esplosività',
      'mobilita': 'Mobilità',
      'tonificazione': 'Tonificazione',
      'cardio': 'Cardio',
      'riabilitazione': 'Riabilitazione'
    };
    return goalLabels[goal] || goal;
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('workouts.title')}</h1>
          <p className="text-gray-600">
            {workoutPlans.length > 0 
              ? `${t('workouts.exerciseCount', { count: totalExercisesInWeeklyPlan })} • ${t('common.goal')}: ${formatFitnessGoal(trainingData.fitness_goal)}`
              : `${t('workouts.noPlanGenerated')} • ${t('common.goal')}: ${trainingData.fitness_goal ? formatFitnessGoal(trainingData.fitness_goal) : t('common.notSet')}`
            }
          </p>
          {remainingGenerations !== null && remainingGenerations !== -1 && remainingGenerations !== 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <BrainCircuit className="w-4 h-4 text-[#26847F]" />
                <span className={`font-semibold ${remainingGenerations === 0 ? 'text-red-600' : 'text-[#26847F]'}`}>
                  {t('workouts.generationsRemaining', { count: remainingGenerations })}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button 
            onClick={() => setShowImportModal(true)}
            variant="outline"
            className="border-[#26847F] text-[#26847F] hover:bg-[#e9f6f5] flex items-center gap-2 px-4 py-6 text-base font-semibold rounded-xl"
          >
            <Upload className="w-5 h-5" /> 
            {importPlanLabels[language] || 'Importa Piano'}
          </Button>
          <Button 
            onClick={onGenerateClick}
            className="bg-[#26847F] hover:bg-[#1f6b66] text-white flex items-center gap-2 shadow-[0_4px_20px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_25px_rgba(38,132,127,0.4)] transition-all px-6 py-6 text-base font-semibold rounded-xl flex-1 lg:flex-none relative"
            disabled={!trainingData.subscription_plan}
          >
            <BrainCircuit className="w-5 h-5" /> 
            {t('workouts.generateWithAI')}
            {generationLimitReached && remainingGenerations === 0 && (
              <AlertCircle className="w-4 h-4 ml-1 animate-pulse" />
            )}
          </Button>
        </div>
      </div>

      {showImportModal && (
        <ImportWorkoutPlanModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          user={user}
          onWorkoutImported={() => {
            setShowImportModal(false);
            onWorkoutImported?.();
          }}
        />
      )}
    </>
  );
}