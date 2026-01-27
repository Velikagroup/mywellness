import React from 'react';
import QuizHeader from './QuizHeader';

export default function WelcomeStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};

  return (
    <div className="space-y-6">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={false}
      />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          {t.quizWelcomeTitle || "My Wellness crea\nrisultados a largo plazo"}
        </h1>
      </div>

      {/* Chart Section */}
      <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto w-full">
        <svg viewBox="0 0 400 280" className="w-full h-auto">
          {/* Grid lines */}
          <line x1="50" y1="180" x2="380" y2="180" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="50" y1="100" x2="380" y2="100" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
          
          {/* Axes */}
          <line x1="50" y1="30" x2="50" y2="200" stroke="#1f2937" strokeWidth="2" />
          <line x1="50" y1="200" x2="380" y2="200" stroke="#1f2937" strokeWidth="2" />
          
          {/* Y-axis label */}
          <text x="30" y="55" fontSize="12" fill="#6b7280" fontWeight="500">
            {t.quizWeightLabel || "Tu peso"}
          </text>
          
          {/* My Wellness curve (black, descending) */}
          <path
            d="M 70 60 Q 150 50 250 150 T 370 190"
            stroke="#1f2937"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Traditional diet curve (red, ascending) */}
          <path
            d="M 70 190 Q 150 170 250 140 T 370 60"
            stroke="#ef4444"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Start point circle */}
          <circle cx="70" cy="60" r="6" fill="#1f2937" />
          
          {/* End point circle */}
          <circle cx="370" cy="190" r="6" fill="#1f2937" />
          
          {/* Legend - My Wellness badge */}
          <g>
            <rect x="55" y="220" width="120" height="28" rx="6" fill="#1f2937" />
            <text x="65" y="240" fontSize="12" fill="white" fontWeight="600">
              My Wellness
            </text>
            <circle cx="180" cy="234" r="5" fill="#1f2937" />
          </g>
          
          {/* Legend - Weight label */}
          <text x="185" y="240" fontSize="11" fill="#6b7280" fontWeight="500">
            {t.quizWeightTag || "Peso"}
          </text>
          
          {/* Legend - Traditional diet label */}
          <text x="260" y="240" fontSize="11" fill="#9ca3af" fontWeight="500">
            {t.quizTraditionalDiet || "Dieta tradizionale"}
          </text>
          
          {/* X-axis labels */}
          <text x="70" y="225" fontSize="11" fill="#9ca3af" fontWeight="500" textAnchor="middle">
            {t.quizMonth1 || "Mes 1"}
          </text>
          <text x="370" y="225" fontSize="11" fill="#9ca3af" fontWeight="500" textAnchor="middle">
            {t.quizMonth6 || "Mes 6"}
          </text>
        </svg>
      </div>

      {/* Description */}
      <div className="max-w-md mx-auto px-4">
        <p className="text-center text-gray-600 text-sm">
          {t.quizWelcomeDesc || "Nuestro sistema te ayuda a lograr resultados sostenibles a largo plazo"}
        </p>
      </div>

      <div className="pt-8 mt-auto max-w-md mx-auto w-full px-4">
        <button
          onClick={onNext}
          className="w-full py-4 rounded-full text-base font-medium transition-all bg-black text-white hover:bg-gray-800"
        >
          {t.quizContinue || "Continuar"}
        </button>
      </div>
    </div>
  );
}