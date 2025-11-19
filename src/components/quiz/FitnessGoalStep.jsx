import React from 'react';
import { Target, TrendingDown, Zap, Shield, Trophy } from 'lucide-react';

const GOALS = [
  { id: 'tone', label: 'Tonificare', icon: <Target/> },
  { id: 'lose_weight', label: 'Perdere Peso', icon: <TrendingDown/> },
  { id: 'gain_muscle', label: 'Aumentare Massa', icon: <Zap/> },
  { id: 'performance', label: 'Prestazionale', icon: <Trophy/> },
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
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual è il tuo obiettivo fitness principale?</h2>
        <p className="text-gray-600">Scegli cosa vuoi ottenere</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            onClick={() => handleSelection(goal.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.fitness_goal === goal.id
                ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                : 'border-gray-200 hover:border-[#26847F]'
            }`}
          >
            <div className={`w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-lg ${
              data.fitness_goal === goal.id 
                ? 'bg-[#26847F] shadow-[0_4px_12px_rgba(38,132,127,0.3)]' 
                : 'bg-gray-100'
            }`}>
              {React.cloneElement(goal.icon, { 
                className: `w-6 h-6 ${data.fitness_goal === goal.id ? 'text-white' : 'text-gray-400'}` 
              })}
            </div>
            <p className="font-semibold text-gray-900">{goal.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}