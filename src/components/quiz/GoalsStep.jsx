import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function GoalsStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};

  const GOALS = [
    { id: 'eat_healthy', icon: '🍎', label: t.goalEatHealthier || 'Eat and live healthier' },
    { id: 'increase_energy', icon: '☀️', label: t.goalIncreaseEnergy || 'Increase my energy and mood' },
    { id: 'stay_motivated', icon: '💪', label: t.goalStayMotivated || 'Stay motivated and consistent' },
    { id: 'feel_better', icon: '🧘', label: t.goalFeelBetterBody || 'Feel better about my body' }
  ];
  const [selectedGoals, setSelectedGoals] = useState(data.life_goals || []);

  const handleSelection = (id) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onDataChange({ life_goals: selectedGoals });
    if (onNext) onNext();
  };

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pb-28">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      <QuizQuestionHeader
        title={t.goalsWhatAchieve || "What would you like to achieve?"}
        subtitle={t.quizGoalsSubtitle || ""}
      />

      <div className="flex-1 flex flex-col gap-3 mt-8">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => handleSelection(goal.id)}
            className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
              selectedGoals.includes(goal.id)
                ? 'border-[var(--brand-primary)] bg-gray-900 text-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl flex-shrink-0">{goal.icon}</span>
            <span className="font-medium text-sm md:text-base">{goal.label}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={selectedGoals.length === 0}
        className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
      >
        {t.quizContinue || 'Continuar'}
      </Button>
    </div>
  );
}