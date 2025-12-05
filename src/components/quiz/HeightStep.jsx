import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Ruler } from "lucide-react";

export default function HeightStep({ data, onDataChange, translations }) {
  const t = translations?.quiz || {};
  const [unit, setUnit] = useState('cm');
  const [displayValue, setDisplayValue] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');

  useEffect(() => {
    if (data.height && unit === 'cm') {
      setDisplayValue(data.height.toString());
    } else if (data.height && unit === 'ft') {
      const totalInches = data.height / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft.toString());
      setInches(inch.toString());
    }
  }, [data.height, unit]);

  const handleCmChange = (e) => {
    let value = e.target.value;
    
    // Se l'utente inserisce formato tipo 1,78 o 1.78 invece di 178
    if (value.includes(',') || value.includes('.')) {
      const numValue = parseFloat(value.replace(',', '.'));
      if (!isNaN(numValue) && numValue < 10) {
        // Probabilmente ha scritto 1.78 invece di 178
        value = Math.round(numValue * 100).toString();
      } else {
        // Rimuovi semplicemente virgola/punto
        value = value.replace(/[,\.]/g, '');
      }
    }
    
    setDisplayValue(value);
    onDataChange({ height: parseInt(value) || '' });
  };

  const handleFeetChange = (e) => {
    const value = e.target.value;
    setFeet(value);
    const totalCm = (parseInt(value || 0) * 12 + parseInt(inches || 0)) * 2.54;
    onDataChange({ height: Math.round(totalCm) || '' });
  };

  const handleInchesChange = (e) => {
    const value = e.target.value;
    setInches(value);
    const totalCm = (parseInt(feet || 0) * 12 + parseInt(value || 0)) * 2.54;
    onDataChange({ height: Math.round(totalCm) || '' });
  };

  const toggleUnit = () => {
    setUnit(unit === 'cm' ? 'ft' : 'cm');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Ruler className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.quizHeightTitle || "Qual è la tua altezza?"}</h2>
        <p className="text-gray-600">{t.quizHeightSubtitle || "Necessaria per calcolare il tuo BMI e il fabbisogno calorico"}</p>
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
              onClick={() => setUnit('ft')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                unit === 'ft' 
                  ? 'bg-white text-[var(--brand-primary)] shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.unitFtIn || "Piedi/Pollici"}
            </button>
          </div>
        </div>

        {unit === 'cm' ? (
          <div className="relative">
            <Input
              type="number"
              placeholder="175"
              value={displayValue}
              onChange={handleCmChange}
              className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)] pr-12 shadow-sm"
              min="120"
              max="230"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              cm
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="5"
                value={feet}
                onChange={handleFeetChange}
                className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)] pr-10 shadow-sm"
                min="3"
                max="8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                ft
              </span>
            </div>
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="9"
                value={inches}
                onChange={handleInchesChange}
                className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)] pr-10 shadow-sm"
                min="0"
                max="11"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                in
              </span>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2 text-center">
          {unit === 'cm' ? (t.quizHeightHintCm || 'Inserisci l\'altezza in centimetri') : (t.quizHeightHintFt || 'Inserisci piedi e pollici')}
        </p>
      </div>
    </div>
  );
}