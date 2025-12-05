import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Circle } from "lucide-react";

export default function NeckCircumferenceStep({ data, onDataChange, translations }) {
  const t = translations?.quiz || {};
  const [unit, setUnit] = useState('cm');
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (data.neck_circumference) {
      if (unit === 'cm') {
        setDisplayValue(data.neck_circumference.toString());
      } else {
        setDisplayValue((data.neck_circumference / 2.54).toFixed(1));
      }
    }
  }, [data.neck_circumference, unit]);

  const handleChange = (e) => {
    const value = e.target.value;
    setDisplayValue(value);
    
    if (unit === 'cm') {
      onDataChange({ neck_circumference: parseFloat(value) || '' });
    } else {
      const cm = parseFloat(value) * 2.54;
      onDataChange({ neck_circumference: parseFloat(cm.toFixed(1)) || '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Circle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.quizNeckTitle || "Circonferenza del Collo"}</h2>
        <p className="text-gray-600">{t.quizNeckSubtitle || "Misura alla base del collo, nel punto più stretto"}</p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Unit Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-full p-1 shadow-inner">
            <button
              onClick={() => setUnit('cm')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                unit === 'cm' 
                  ? 'bg-white text-[var(--brand-primary)] shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.unitCm || "Centimetri"}
            </button>
            <button
              onClick={() => setUnit('in')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                unit === 'in' 
                  ? 'bg-white text-[var(--brand-primary)] shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.unitIn || "Pollici"}
            </button>
          </div>
        </div>

        <div className="relative">
          <Input
            type="number"
            step="0.5"
            placeholder={unit === 'cm' ? "35.0" : "13.8"}
            value={displayValue}
            onChange={handleChange}
            className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)] pr-12 shadow-sm"
            min={unit === 'cm' ? "25" : "10"}
            max={unit === 'cm' ? "60" : "24"}
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {unit}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">{t.quizBodyFatRequired || "Necessaria per calcolare la massa grassa"}</p>
      </div>
    </div>
  );
}