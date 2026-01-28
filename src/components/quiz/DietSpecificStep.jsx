import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function DietSpecificStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};

  const DIETS = [
    { id: 'low_carb', icon: '🥗', label: 'Low Carb' },
    { id: 'soft_low_carb', icon: '🥙', label: 'Soft Low Carb' },
    { id: 'ketogenic', icon: '🥑', label: t.dietKeto || 'Ketogenic' },
    { id: 'carnivore', icon: '🥩', label: t.dietCarnivore || 'Carnivore' },
    { id: 'vegetarian', icon: '🥦', label: t.dietVegetarian || 'Vegetarian' },
    { id: 'vegan', icon: '🌱', label: t.dietVegan || 'Vegan' },
    { id: 'paleo', icon: '🍖', label: t.dietPaleo || 'Paleo' },
    { id: 'mediterranean', icon: '🫒', label: t.dietMediterranean || 'Mediterranean' }
  ];
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
        title={t.dietSpecificQuestion || "Do you follow a specific diet?"}
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

      <Button
        onClick={handleNext}
        disabled={!selectedDiet}
        className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
      >
        {t.quizContinue || 'Continuar'}
      </Button>
    </div>
  );
}