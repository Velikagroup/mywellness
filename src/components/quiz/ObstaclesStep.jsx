import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

const OBSTACLES = [
  { id: 'consistency', icon: '📊', label: 'Falta de consistencia' },
  { id: 'eating_habits', icon: '🍔', label: 'Hábitos alimentarios poco saludables' },
  { id: 'support', icon: '🤝', label: 'Falta de apoyo' },
  { id: 'busy', icon: '📅', label: 'Horario ocupado' },
  { id: 'motivation', icon: '🍎', label: 'Falta de inspiración para las comidas' }
];

export default function ObstaclesStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [selectedObstacles, setSelectedObstacles] = useState(data.main_obstacles || []);

  const handleSelection = (id) => {
    setSelectedObstacles(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    onDataChange({ main_obstacles: selectedObstacles });
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
        title={t.quizObstaclesTitle || "¿Qué te impide alcanzar tus objetivos?"}
        subtitle={t.quizObstaclesSubtitle || ""}
      />

      <div className="flex-1 flex flex-col gap-3 mt-8">
        {OBSTACLES.map((obstacle) => (
          <button
            key={obstacle.id}
            onClick={() => handleSelection(obstacle.id)}
            className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
              selectedObstacles.includes(obstacle.id)
                ? 'border-[var(--brand-primary)] bg-gray-900 text-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl flex-shrink-0">{obstacle.icon}</span>
            <span className="font-medium text-sm md:text-base">{obstacle.label}</span>
          </button>
        ))}
      </div>

      <div className="fixed bottom-[200px] left-0 right-0 p-5">
        <div className="max-w-[416px] mx-auto px-4 md:px-0">
          <Button
            onClick={handleNext}
            disabled={selectedObstacles.length === 0}
            className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold rounded-full h-14"
          >
            {t.quizContinue || 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}