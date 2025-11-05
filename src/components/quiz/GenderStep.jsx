import React from 'react';
import { Card } from "@/components/ui/card";

export default function GenderStep({ data, onDataChange, onNext }) {
  const handleSelection = (gender) => {
    onDataChange({ gender });
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Qual è il tuo sesso?</h2>
        <p className="text-gray-600 text-lg">Ci aiuta a calcolare il tuo fabbisogno metabolico con precisione</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <button
          onClick={() => handleSelection('male')}
          className={`p-8 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
            data.gender === 'male' 
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md' 
              : 'border-gray-200 hover:border-[var(--brand-primary)]'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨</span>
            </div>
            <h3 className="font-bold text-lg text-gray-900">Uomo</h3>
          </div>
        </button>

        <button
          onClick={() => handleSelection('female')}
          className={`p-8 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
            data.gender === 'female' 
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md' 
              : 'border-gray-200 hover:border-[var(--brand-primary)]'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👩</span>
            </div>
            <h3 className="font-bold text-lg text-gray-900">Donna</h3>
          </div>
        </button>
      </div>
    </div>
  );
}