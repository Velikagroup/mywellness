import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus } from 'lucide-react';
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';

export default function HeightWeightStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [isMetric, setIsMetric] = useState(true);
  const [selectedHeight, setSelectedHeight] = useState(174);
  const [selectedWeight, setSelectedWeight] = useState(81);

  const HEIGHT_VALUES = Array.from({ length: 100 }, (_, i) => 130 + i); // 130-229 cm
  const WEIGHT_VALUES = Array.from({ length: 150 }, (_, i) => 30 + i); // 30-179 kg
  const HEIGHT_VALUES_FT = Array.from({ length: 76 }, (_, i) => {
    const inches = 50 + i;
    const feet = Math.floor(inches / 12);
    const inch = inches % 12;
    return `${feet}'${inch}"`;
  });
  const WEIGHT_VALUES_LB = Array.from({ length: 330 }, (_, i) => 66 + i);

  useEffect(() => {
    if (data.height) {
      setSelectedHeight(data.height);
    }
    if (data.current_weight) {
      setSelectedWeight(data.current_weight);
    }
  }, []);

  const updateHeight = (delta) => {
    const heightValues = isMetric ? HEIGHT_VALUES : HEIGHT_VALUES_FT;
    const currentIndex = heightValues.indexOf(selectedHeight);
    const newIndex = Math.max(0, Math.min(currentIndex + delta, heightValues.length - 1));
    const newHeight = heightValues[newIndex];
    setSelectedHeight(newHeight);
  };

  const updateWeight = (delta) => {
    const weightValues = isMetric ? WEIGHT_VALUES : WEIGHT_VALUES_LB;
    const currentIndex = weightValues.indexOf(selectedWeight);
    const newIndex = Math.max(0, Math.min(currentIndex + delta, weightValues.length - 1));
    const newWeight = weightValues[newIndex];
    setSelectedWeight(newWeight);
  };

  const Stepper = ({ label, value, onIncrement, onDecrement, unit }) => (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
      <button
        onClick={onIncrement}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Plus className="w-5 h-5 text-gray-600" />
      </button>
      <div className="px-6 py-3 bg-gray-50 rounded-full border-2 border-gray-300 min-w-[110px] text-center">
        <span className="text-lg font-semibold text-gray-900">
          {value} <span className="text-sm text-gray-500">{unit}</span>
        </span>
      </div>
      <button
        onClick={onDecrement}
        className="p-2 hover:bg-gray-100 rounded-lg transition"
      >
        <Minus className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );

  const handleUnitToggle = () => {
    setIsMetric(!isMetric);
  };

  const handleNext = () => {
    let heightInCm = selectedHeight;
    let weightInKg = selectedWeight;

    if (!isMetric) {
      // Converta da imperial a metrico
      const parts = selectedHeight.toString().split("'");
      const feet = parseInt(parts[0]);
      const inches = parseInt(parts[1]) || 0;
      heightInCm = Math.round((feet * 12 + inches) * 2.54);
      
      weightInKg = Math.round(selectedWeight / 2.20462);
    }

    onDataChange({
      height: heightInCm,
      current_weight: weightInKg
    });

    if (onNext) onNext();
  };



  const heightValues = isMetric ? HEIGHT_VALUES : HEIGHT_VALUES_FT;
  const weightValues = isMetric ? WEIGHT_VALUES : WEIGHT_VALUES_LB;

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <QuizQuestionHeader
        title={t.quizHeightWeightTitle || "Altura y peso"}
        subtitle={t.quizHeightWeightSubtitle || "Esto se usará para calibrar tu plan personalizado."}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Unit Toggle */}
        <div className="flex items-center gap-3 mb-8 md:-mt-24 md:mb-12">
          <span className={`text-sm font-medium ${!isMetric ? 'text-gray-900' : 'text-gray-500'}`}>
            {t.imperial || 'Imperial'}
          </span>
          <button
            onClick={handleUnitToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
              isMetric ? 'bg-gray-900' : 'bg-gray-900'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isMetric ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isMetric ? 'text-gray-900' : 'text-gray-500'}`}>
            {t.metric || 'Métrico'}
          </span>
        </div>

        {/* Stepper Controls */}
         <div className="flex gap-8 w-full max-w-[416px] justify-center mx-auto mt-12">
           <Stepper
             label={t.height || 'Altura'}
             value={selectedHeight}
             unit={isMetric ? 'cm' : 'ft'}
             onIncrement={() => updateHeight(1)}
             onDecrement={() => updateHeight(-1)}
           />
           <Stepper
             label={t.weight || 'Peso'}
             value={selectedWeight}
             unit={isMetric ? 'kg' : 'lbs'}
             onIncrement={() => updateWeight(1)}
             onDecrement={() => updateWeight(-1)}
           />
         </div>
      </div>

      <div>
        <Button
          onClick={handleNext}
          className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
        >
          {t.quizContinue || 'Continuar'}
        </Button>
      </div>
    </div>
  );
}