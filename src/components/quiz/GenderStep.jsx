import React from 'react';
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function GenderStep({ data, onDataChange, onNext, t, currentStep, totalSteps, onPrev }) {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const isFromHome = !urlParams.get('from');

  const handleSelection = (gender) => {
    onDataChange({ gender });
  };

  return (
    <div className="space-y-8 max-w-md mx-auto px-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-800 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Back Button - solo dalla seconda domanda in avanti, OPPURE sulla prima se viene da home */}
      {(currentStep > 0 || isFromHome) && (
        <button
          onClick={currentStep > 0 ? onPrev : () => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t?.('common.back') || 'Indietro'}</span>
        </button>
      )}

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