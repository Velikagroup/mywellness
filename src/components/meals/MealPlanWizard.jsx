import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import DietTypeStep from './DietTypeStep';
import IntermittentFastingStep from './IntermittentFastingStep';
import MealsPerDayStep from './MealsPerDayStep';
import IFMealTimingStep from './IFMealTimingStep';
import IFMealsCountStep from './IFMealsCountStep';
import CookingTimeStep from './CookingTimeStep';
import IntolerancesStep from './IntolerancesStep';
import { useLanguage } from '../i18n/LanguageContext';

export default function MealPlanWizard({ user, onComplete, onCancel }) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    diet_type: user?.diet_type || 'mediterranean',
    intolerances: [],
    intermittent_fasting: false,
    meals_per_day: 5,
    if_skip_meal: null,
    if_meals_count: 2,
    cooking_time_preference: 'moderate'
  });

  const handleDataChange = (data) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    // Calcola meals_per_day in base alla configurazione
    let finalMealsPerDay = wizardData.meals_per_day;
    
    if (wizardData.intermittent_fasting && wizardData.if_meals_count) {
      finalMealsPerDay = wizardData.if_meals_count;
    }

    const finalData = {
      ...wizardData,
      meals_per_day: finalMealsPerDay,
      if_meal_structure: wizardData.intermittent_fasting ? 
        (wizardData.if_meals_count === 2 ? '2_meals' : 
         wizardData.if_meals_count === 3 ? '3_meals' : 
         '3_meals_snacks') : null
    };

    onComplete(finalData);
  };

  // Determina gli step in base alle scelte
  const getSteps = () => {
    const steps = [
      { component: DietTypeStep, title: 'Dieta' },
      { component: IntolerancesStep, title: 'Intolleranze' },
      { component: IntermittentFastingStep, title: 'Digiuno' }
    ];

    if (wizardData.intermittent_fasting) {
      steps.push(
        { component: IFMealTimingStep, title: 'Orario' },
        { component: IFMealsCountStep, title: 'Pasti IF' }
      );
    } else {
      steps.push(
        { component: MealsPerDayStep, title: 'Pasti' }
      );
    }

    steps.push({ component: CookingTimeStep, title: 'Tempo' });

    return steps;
  };

  const steps = getSteps();
  const CurrentStepComponent = steps[currentStep]?.component;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={currentStep === 0 ? onCancel : handleBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {currentStep === 0 ? 'Annulla' : 'Indietro'}
        </Button>
        <div className="flex items-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep ? 'w-8 bg-[#26847F]' :
                index < currentStep ? 'w-2 bg-[#26847F]' :
                'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-gray-600 font-semibold">
          {currentStep + 1}/{steps.length}
        </div>
      </div>

      {/* Current step */}
      <CurrentStepComponent
        data={wizardData}
        onDataChange={handleDataChange}
        onNext={isLastStep ? handleComplete : handleNext}
        nextStep={isLastStep ? handleComplete : handleNext}
        dailyCalories={user?.daily_calories || 2000}
        dietType={wizardData.diet_type}
        skipMeal={wizardData.if_skip_meal}
        currentDietType={wizardData.diet_type}
      />
    </div>
  );
}