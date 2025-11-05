import React from 'react';
import { Target, TrendingDown, Zap, Shield } from 'lucide-react';

const GOALS = [
  { id: 'tone', label: 'Tonificare', icon: <Target/> },
  { id: 'lose_weight', label: 'Perdere Peso', icon: <TrendingDown/> },
  { id: 'gain_muscle', label: 'Aumentare Massa', icon: <Zap/> },
  { id: 'mobility', label: 'Mobilità', icon: <Shield/> }
];

export default function FitnessGoalStep({ data, onDataChange, nextStep }) {
  const handleSelection = (goal) => {
    onDataChange({ fitness_goal: goal });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual è il tuo obiettivo fitness principale?</h2>
        <p className="text-gray-600">Scegli cosa vuoi ottenere</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => handleSelection(goal.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.fitness_goal === goal.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                : 'border-gray-200 hover:border-[var(--brand-primary)]'
            }`}
          >
            <div className="w-10 h-10 text-[var(--brand-primary)] mx-auto mb-3 flex items-center justify-center">
              {React.cloneElement(goal.icon, { className: 'w-8 h-8' })}
            </div>
            <p className="font-semibold text-gray-900">{goal.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}