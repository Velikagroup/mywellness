import React from 'react';

const SPEED_OPTIONS = [
  { 
    id: 'very_fast', 
    label: 'Molto Veloce', 
    description: 'Deficit calorico del 25-30%',
    icon: '🚀',
    subtitle: 'Approccio aggressivo'
  },
  { 
    id: 'moderate', 
    label: 'Moderato', 
    description: 'Deficit calorico del 20%',
    icon: '⚡',
    subtitle: 'Approccio bilanciato'
  },
  { 
    id: 'slow', 
    label: 'Lento e Costante', 
    description: 'Deficit calorico del 10-15%',
    icon: '🐢',
    subtitle: 'Approccio sostenibile'
  }
];

export default function WeightLossSpeedStep({ data, onDataChange, onNext, translations }) {
  const t = translations?.quiz || {};
  const handleSelection = (speed) => {
    onDataChange({ weight_loss_speed: speed });
    setTimeout(() => onNext(), 300);
  };

  return (
    <div className="space-y-6">
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