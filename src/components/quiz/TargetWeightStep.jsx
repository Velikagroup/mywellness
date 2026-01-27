import React, { useState, useEffect } from 'react';
import QuizHeader from './QuizHeader';
import QuizQuestionHeader from './QuizQuestionHeader';
import { Button } from "@/components/ui/button";

export default function TargetWeightStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev, onNext }) {
  const t = translations?.quiz || {};
  const [isMetric, setIsMetric] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState(data.target_weight || 75);

  const MIN_WEIGHT = isMetric ? 40 : 88;
  const MAX_WEIGHT = isMetric ? 150 : 330;

  const handleSliderChange = (e) => {
    const newWeight = parseInt(e.target.value);
    setSelectedWeight(newWeight);
    onDataChange({ target_weight: newWeight });
  };

  const handleUnitToggle = () => {
    setIsMetric(!isMetric);
  };

  const handleNext = () => {
    onDataChange({ target_weight: selectedWeight });
    if (onNext) onNext();
  };

  const sliderPercentage = ((selectedWeight - MIN_WEIGHT) / (MAX_WEIGHT - MIN_WEIGHT)) * 100;

  return (
    <div className="space-y-6 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pt-20">
      <QuizHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <QuizQuestionHeader
        title={t.quizTargetWeightTitle || "¿Cuál es tu peso deseado?"}
        subtitle={t.quizTargetWeightSubtitle || ""}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 space-y-8">
        {/* Unit Toggle */}
        <div className="flex items-center gap-3">
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

        {/* Goal Label */}
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">{t.quizWeightGoal || 'Perder peso'}</p>
          <p className="text-4xl font-bold text-gray-900">{selectedWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</p>
        </div>

        {/* Ruler Slider */}
        <div className="w-full max-w-[320px] relative py-8">
          <input
            type="range"
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            value={selectedWeight}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-400"
            style={{
              background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${sliderPercentage}%, #d1d5db ${sliderPercentage}%, #d1d5db 100%)`
            }}
          />
          
          {/* Ruler marks */}
          <div className="absolute top-12 left-0 right-0 h-16 flex items-start justify-between px-0">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`bg-gray-400 ${i % 5 === 0 ? 'h-4 w-1' : 'h-2 w-0.5'}`} />
              </div>
            ))}
          </div>

          {/* Highlighted ruler section */}
          <div 
            className="absolute top-12 h-16 bg-gray-300 bg-opacity-40 pointer-events-none"
            style={{
              left: `${sliderPercentage - 15}%`,
              width: '30%',
              borderRadius: '4px'
            }}
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