import React, { useMemo } from 'react';
import QuizHeader from './QuizHeader';
import { Button } from "@/components/ui/button";

export default function WeightDifferenceStep({ data, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};

  const weightDifference = useMemo(() => {
    const current = data.current_weight || 0;
    const target = data.target_weight || 0;
    return target - current;
  }, [data.current_weight, data.target_weight]);

  const isLosing = weightDifference < 0;
  const absDifference = Math.abs(Math.round(weightDifference));

  const getMessage = () => {
    const verb = isLosing ? (t.losingWeight || 'Losing') : (t.gainingWeight || 'Gaining');
    
    if (absDifference <= 3) {
      return {
        title: `${verb} ${absDifference} kg ${t.isRealisticGoalNotDifficult || 'is a realistic goal. Not difficult at all!'}`,
        subtitle: t.usersSayChangeEvident || '90% of users say the change is evident after using MyWellness and that it\'s not easy to regain the weight.'
      };
    } else if (absDifference <= 8) {
      return {
        title: `${verb} ${absDifference} kg ${t.isRealisticGoalTotallyAchievable || 'is a realistic goal. Totally achievable!'}`,
        subtitle: t.usersSayChangeEvident || '90% of users say the change is evident after using MyWellness and that it\'s not easy to regain the weight.'
      };
    } else if (absDifference <= 15) {
      return {
        title: `${verb} ${absDifference} kg ${t.isChallengingButPossible || 'is a challenging but achievable goal.'}`,
        subtitle: t.requiresConsistency || 'Requires consistency, but with MyWellness\'s personalized plan you\'ll make it. 85% of users achieve their goal.'
      };
    } else {
      return {
        title: `${verb} ${absDifference} kg ${t.isAmbitiousGoal || 'is an ambitious goal.'}`,
        subtitle: t.willBeJourney || 'It will be a journey, but with dedication and your personalized plan, you\'ll reach it. Many users have done it before you.'
      };
    }
  };

  const message = getMessage();

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 space-y-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {message.title.split(absDifference)[0]}
            <span className="text-[#26847F]">{absDifference} kg</span>
            {message.title.split(absDifference)[1]}
          </h2>

          <p className="text-gray-600 text-base leading-relaxed">
            {message.subtitle}
          </p>
        </div>
      </div>

      <div>
        <Button
          onClick={onNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}