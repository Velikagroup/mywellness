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
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <button
            onClick={onGenerateClick}
            disabled={!trainingData.subscription_plan}
            className="relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm text-white w-full overflow-hidden transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #26847F 0%, #1a9e97 100%)', boxShadow: '0 4px 15px rgba(38,132,127,0.4)' }}
          >
            <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity rounded-2xl" />
            <BrainCircuit className="w-4 h-4 flex-shrink-0" />
            <span>{t('workouts.generateWithAI')}</span>
            {generationLimitReached && remainingGenerations === 0 && (
              <AlertCircle className="w-4 h-4 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm w-full overflow-hidden transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', border: '1.5px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}
          >
            <span className="absolute inset-0 bg-blue-500 opacity-0 hover:opacity-5 transition-opacity rounded-2xl" />
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span>{importPlanLabels[language] || 'Importa Piano'}</span>
          </button>
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