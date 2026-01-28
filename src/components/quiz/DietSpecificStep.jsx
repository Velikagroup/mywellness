import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

const DIETS = [
  { id: 'low_carb', icon: '🥗', label: 'Low Carb' },
  { id: 'soft_low_carb', icon: '🥙', label: 'Soft Low Carb' },
  { id: 'ketogenic', icon: '🥑', label: 'Chetogenica' },
  { id: 'carnivore', icon: '🥩', label: 'Carnivore' },
  { id: 'vegetarian', icon: '🥦', label: 'Vegetariana' },
  { id: 'vegan', icon: '🌱', label: 'Vegana' },
  { id: 'paleo', icon: '🍖', label: 'Paleo' },
  { id: 'mediterranean', icon: '🫒', label: 'Mediterranea' }
];

export default function DietSpecificStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [selectedDiet, setSelectedDiet] = useState(data.diet_type || null);

  useEffect(() => {
    if (data.diet_type) {
      setSelectedDiet(data.diet_type);
    }
  }, []);

  const handleSelection = (id) => {
    setSelectedDiet(id);
  };

  const handleNext = () => {
    onDataChange({ diet_type: selectedDiet });
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
        title={t.quizDietSpecificTitle || "¿Sigues alguna dieta específica?"}
        subtitle={t.quizDietSpecificSubtitle || ""}
      />

      <div className="flex-1 flex flex-col gap-3 mt-8">
        {DIETS.map((diet) => (
          <button
            key={diet.id}
            onClick={() => handleSelection(diet.id)}
            className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 text-left ${
              selectedDiet === diet.id
                ? 'border-[var(--brand-primary)] bg-gray-900 text-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl flex-shrink-0">{diet.icon}</span>
            <span className="font-medium text-sm md:text-base">{diet.label}</span>
          </button>
        ))}
      </div>

      <div className="fixed bottom-[200px] left-0 right-0 p-5">
        <div className="max-w-[416px] mx-auto px-4 md:px-0">
          <Button
            onClick={handleNext}
            disabled={!selectedDiet}
            className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold rounded-full h-14"
          >
            {t.quizContinue || 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}