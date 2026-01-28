import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import QuizHeader from './QuizHeader';

export default function TrustStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0 min-h-[80vh] flex flex-col justify-start pb-28">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12">
        {/* Animated Hand Icon */}
        <div className={`relative w-64 h-64 transition-all duration-1000 ${showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          {/* Outer gradient circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200 opacity-40 animate-pulse"></div>
          
          {/* Middle circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 opacity-60"></div>
          
          {/* Inner white circle */}
          <div className="absolute inset-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            {/* Hand emoji/icon with dots */}
            <div className="relative">
              <div className="text-7xl">🤚</div>
              {/* Decorative dots around */}
              <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
              <div className="absolute -top-1 left-6 w-1 h-1 bg-gray-800 rounded-full"></div>
              <div className="absolute top-2 -left-4 w-1 h-1 bg-gray-800 rounded-full"></div>
              <div className="absolute -bottom-1 left-8 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
              <div className="absolute top-1 left-12 w-1 h-1 bg-gray-800 rounded-full"></div>
              <div className="absolute -top-3 left-10 w-1 h-1 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 px-4">
          {t.quizTrustTitle || 'Gracias por confiar en nosotros'}
        </h1>

        {/* Subtitle */}
        <p className="text-base text-gray-500 px-4">
          {t.quizTrustSubtitle || 'Ahora personalicemos MyWellness para ti...'}
        </p>

        {/* Privacy Box */}
        <div className="bg-gray-50 rounded-2xl p-6 space-y-3 mx-4">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-3 shadow-sm">
              <Lock className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {t.quizTrustPrivacyTitle || 'Tu privacidad y seguridad nos importan.'}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t.quizTrustPrivacyText || 'Prometemos mantener siempre tu información personal privada y segura.'}
          </p>
        </div>
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-gray-900 hover:bg-gray-950 text-white text-base font-semibold quiz-button-fixed"
      >
        {t.quizContinue || 'Continuar'}
      </Button>
    </div>
  );
}