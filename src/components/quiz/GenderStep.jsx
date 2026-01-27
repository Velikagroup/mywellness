import React from 'react';
import { Card } from "@/components/ui/card";

export default function GenderStep({ data, onDataChange, onNext, t }) {
  const handleSelection = (gender) => {
    onDataChange({ gender });
  };

  return (
    <div className="space-y-8 max-w-md mx-auto px-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t?.('quiz.quizSelectGender') || 'Seleziona il tuo sesso:'}
        </h2>
        <p className="text-gray-500 text-sm">
          {t?.('quiz.quizContinueSubtitle') || 'Questo verrà utilizzato per calibrare il tuo piano personalizzato.'}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleSelection('male')}
          className={`w-full p-5 rounded-2xl transition-all font-medium text-base ${
            data.gender === 'male' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {t?.('quiz.quizMale') || 'Uomo'}
        </button>

        <button
          onClick={() => handleSelection('female')}
          className={`w-full p-5 rounded-2xl transition-all font-medium text-base ${
            data.gender === 'female' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {t?.('quiz.quizFemale') || 'Donna'}
        </button>

        <button
          onClick={() => handleSelection('other')}
          className={`w-full p-5 rounded-2xl transition-all font-medium text-base ${
            data.gender === 'other' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {t?.('quiz.quizOther') || 'Altro'}
        </button>
      </div>

      <div className="pt-8">
        <button
          onClick={onNext}
          disabled={!data.gender}
          className={`w-full py-4 rounded-full text-base font-medium transition-all ${
            data.gender
              ? 'bg-gray-800 text-white hover:bg-gray-900'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t?.('quiz.quizContinue') || 'Continua'}
        </button>
      </div>
    </div>
  );
}