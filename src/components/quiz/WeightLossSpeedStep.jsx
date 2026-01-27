import React from 'react';
import QuizHeader from './QuizHeader';

export default function WeightLossSpeedStep({ data, onDataChange, onNext, translations, currentStep, totalSteps, onPrev }) {
  const t = translations?.quiz || {};

  const SPEED_OPTIONS = [
    { 
      id: 'very_fast', 
      label: t.speedVeryFast || 'Molto Veloce', 
      description: t.speedVeryFastDesc || 'Deficit calorico del 25-30%',
      icon: '🚀',
      subtitle: t.speedVeryFastSubtitle || 'Approccio aggressivo'
    },
    { 
      id: 'moderate', 
      label: t.speedModerate || 'Moderato', 
      description: t.speedModerateDesc || 'Deficit calorico del 20%',
      icon: '⚡',
      subtitle: t.speedModerateSubtitle || 'Approccio bilanciato'
    },
    { 
      id: 'slow', 
      label: t.speedSlow || 'Lento e Costante', 
      description: t.speedSlowDesc || 'Deficit calorico del 10-15%',
      icon: '🐢',
      subtitle: t.speedSlowSubtitle || 'Approccio sostenibile'
    }
  ];

  const handleSelection = (speed) => {
    onDataChange({ weight_loss_speed: speed });
    setTimeout(() => onNext(), 300);
  };

  return (
    <div className="space-y-6 pt-20 w-full max-w-[416px] mx-auto px-4 md:px-0">
      <QuizHeader 
        currentStep={currentStep} 
        totalSteps={totalSteps}
        showBackButton={true}
        onBackClick={onPrev}
      />
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏱️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.quizWeightLossSpeedTitle || "Qual è il tuo ritmo preferito?"}</h2>
        <p className="text-gray-600">{t.quizWeightLossSpeedSubtitle || "Scegli con quale velocità vuoi raggiungere il tuo obiettivo"}</p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed.id}
            onClick={() => handleSelection(speed.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-left ${
              data.weight_loss_speed === speed.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{speed.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">{speed.label}</h3>
                <p className="text-sm text-gray-600 mb-1">{speed.subtitle}</p>
                <p className="text-sm text-gray-500">{speed.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}