import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IntroStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || translations || {};
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const isFromHome = !urlParams.get('from');
  
  const handleSelection = (gender) => {
    onDataChange({ gender });
  };

  return (
    <>
      {/* Progress Bar - Fixed at top */}
      {typeof currentStep === 'number' && totalSteps ? (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-gray-800 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      ) : null}
      
      <div className="space-y-6 max-w-md mx-auto px-4 min-h-[80vh] flex flex-col justify-start pt-8">
        {/* Back Button - solo se viene da home sulla prima domanda */}
        {isFromHome && (
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t?.quizBack || t?.back || 'Indietro'}</span>
          </button>
        )}

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.quizSelectGender || 'Elige tu género'}
          </h2>
          <p className="text-gray-500 text-sm">
            {t.quizContinueSubtitle || 'Esto se usará para calibrar tu plan personalizado.'}
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
          {t.quizMale || 'Hombre'}
        </button>

        <button
          onClick={() => handleSelection('female')}
          className={`w-full p-5 rounded-2xl transition-all font-medium text-base ${
            data.gender === 'female' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {t.quizFemale || 'Mujer'}
        </button>

        <button
          onClick={() => handleSelection('other')}
          className={`w-full p-5 rounded-2xl transition-all font-medium text-base ${
            data.gender === 'other' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {t.quizOther || 'Altro'}
        </button>
      </div>

      <div className="pt-8 mt-auto">
        <button
          onClick={onNext}
          disabled={!data.gender}
          className={`w-full py-4 rounded-full text-base font-medium transition-all ${
            data.gender
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t.quizContinue || 'Continuar'}
        </button>
      </div>
      </div>
    </>
  );
}