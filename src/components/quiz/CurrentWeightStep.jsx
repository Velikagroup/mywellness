import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Scale } from "lucide-react";
import QuizHeader from './QuizHeader';

export default function CurrentWeightStep({ data, onDataChange, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [unit, setUnit] = useState('kg');
  const [displayValue, setDisplayValue] = useState('');
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Non aggiornare se l'utente sta digitando
    if (isTypingRef.current) return;
    
    if (data.current_weight) {
      if (unit === 'kg') {
        setDisplayValue(data.current_weight.toString());
      } else {
        setDisplayValue((data.current_weight * 2.20462).toFixed(1));
      }
    } else {
      setDisplayValue('');
    }
  }, [unit]);

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Sostituisci virgola con punto per gestire input europeo
    value = value.replace(',', '.');
    
    isTypingRef.current = true;
    setDisplayValue(value);
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || value === '') {
      onDataChange({ current_weight: '' });
      return;
    }
    
    if (unit === 'kg') {
      onDataChange({ current_weight: numValue });
    } else {
      const kg = numValue / 2.20462;
      onDataChange({ current_weight: parseFloat(kg.toFixed(1)) });
    }
  };

  const handleBlur = () => {
    isTypingRef.current = false;
  };

  const handleUnitChange = (newUnit) => {
    isTypingRef.current = false;
    
    if (data.current_weight) {
      if (newUnit === 'kg') {
        setDisplayValue(data.current_weight.toString());
      } else {
        setDisplayValue((data.current_weight * 2.20462).toFixed(1));
      }
    }
    setUnit(newUnit);
  };

  return (
    <div className="space-y-6">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.quizCurrentWeightTitle || "Qual è il tuo peso attuale?"}</h2>
        <p className="text-gray-600">{t.quizCurrentWeightSubtitle || "Questo è il tuo punto di partenza nel percorso di benessere"}</p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Unit Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
            <button
              onClick={() => handleUnitChange('kg')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                unit === 'kg' 
                  ? 'bg-white text-[var(--brand-primary)] shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.unitKg || "Chilogrammi"}
            </button>
            <button
              onClick={() => handleUnitChange('lbs')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                unit === 'lbs' 
                  ? 'bg-white text-[var(--brand-primary)] shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.unitLbs || "Libbre"}
            </button>
          </div>
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder={unit === 'kg' ? "70.5" : "155.0"}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)] pr-12 shadow-sm"
            inputMode="decimal"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {unit}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {unit === 'kg' ? (t.quizWeightHintKg || 'Inserisci il peso in chilogrammi') : (t.quizWeightHintLbs || 'Inserisci il peso in libbre')}
        </p>
      </div>
    </div>
  );
}