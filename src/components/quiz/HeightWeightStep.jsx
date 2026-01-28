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

  const heightRef = useRef(null);
  const weightRef = useRef(null);

  // Genera range di altezze e pesi
  const HEIGHT_VALUES = Array.from({ length: 100 }, (_, i) => 130 + i); // 130-229 cm
  const WEIGHT_VALUES = Array.from({ length: 150 }, (_, i) => 30 + i); // 30-179 kg
  const HEIGHT_VALUES_FT = Array.from({ length: 76 }, (_, i) => {
    const inches = 50 + i;
    const feet = Math.floor(inches / 12);
    const inch = inches % 12;
    return `${feet}'${inch}"`;
  }); // 4'2" - 10'1"
  const WEIGHT_VALUES_LB = Array.from({ length: 330 }, (_, i) => 66 + i); // 66-395 lbs

  useEffect(() => {
    if (data.height) {
      setSelectedHeight(data.height);
    }
    if (data.current_weight) {
      setSelectedWeight(data.current_weight);
    }
  }, []);

  // Setup iniziale dello scroll per posizionare i valori al centro
  useEffect(() => {
    setTimeout(() => {
      const itemHeight = 40;
      const topPadding = 160;
      const containerHeight = 320;

      if (heightRef.current) {
        const heightValues = isMetric ? HEIGHT_VALUES : HEIGHT_VALUES_FT;
        const heightIndex = heightValues.indexOf(selectedHeight);
        if (heightIndex !== -1) {
          const scroll = topPadding + heightIndex * itemHeight - containerHeight / 2;
          heightRef.current.scrollTop = scroll;
        }
      }
      if (weightRef.current) {
        const weightValues = isMetric ? WEIGHT_VALUES : WEIGHT_VALUES_LB;
        const weightIndex = weightValues.indexOf(selectedWeight);
        if (weightIndex !== -1) {
          const scroll = topPadding + weightIndex * itemHeight - containerHeight / 2;
          weightRef.current.scrollTop = scroll;
        }
      }
    }, 0);
  }, [isMetric]);

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
    // Resetta lo scroll dei ref quando cambi unità
    setTimeout(() => {
      if (heightRef.current && weightRef.current) {
        const itemHeight = 40;
        const topPadding = 160;
        const containerHeight = 320;
        
        const heightValues = !isMetric ? HEIGHT_VALUES : HEIGHT_VALUES_FT;
        const heightIndex = heightValues.indexOf(selectedHeight);
        if (heightIndex !== -1) {
          heightRef.current.scrollTop = topPadding + heightIndex * itemHeight - containerHeight / 2;
        }
        
        const weightValues = !isMetric ? WEIGHT_VALUES : WEIGHT_VALUES_LB;
        const weightIndex = weightValues.indexOf(selectedWeight);
        if (weightIndex !== -1) {
          weightRef.current.scrollTop = topPadding + weightIndex * itemHeight - containerHeight / 2;
        }
      }
    }, 0);
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

  const PickerColumn = ({ items, selectedValue, onScroll, ref, unit, label }) => {
    const selectedIndex = items.indexOf(selectedValue);
    return (
      <div className="flex-1 flex flex-col items-center relative h-80 -mt-12 md:-mt-32">
        <h3 className="text-center font-semibold text-gray-900 absolute left-0 right-0 pointer-events-none" style={{ top: '110px', zIndex: 10 }}>
          {label}
        </h3>
        <div
          ref={ref}
          onScroll={onScroll}
          className="w-full h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="h-40 md:h-24" />
          {items.map((item, idx) => (
            <div
              key={idx}
              className="h-10 flex items-center justify-center flex-shrink-0 px-2 snap-center gap-1.5"
            >
              <span className={`text-center transition-all font-semibold ${
                idx === selectedIndex
                  ? 'text-gray-900 text-base'
                  : 'text-gray-400 text-sm'
              }`}>
                {item}
              </span>
              <span className={`transition-all font-medium ${
                idx === selectedIndex ? 'text-gray-900 text-sm' : 'text-gray-400 text-xs'
              }`}>
                {unit}
              </span>
            </div>
          ))}
          <div className="h-40 md:h-32" />
        </div>

        {/* Overlay bianco sopra */}
        <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '140px' }} />

        {/* Gradiente fade in basso */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '140px', background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />

        {/* Pillolina highlight */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-10 border-2 border-gray-300 rounded-2xl pointer-events-none" />
      </div>
    );
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