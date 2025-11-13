import React from 'react';

const EXPERIENCE_LEVELS = [
  { id: 'never', label: 'Mai', description: 'Non mi alleno o quasi mai' },
  { id: 'occasionally', label: 'Occasionalmente', description: 'Mi alleno a volte, non regolarmente' },
  { id: 'regularly_1_2', label: '1-2 volte/settimana', description: 'Mi alleno 1-2 volte a settimana' },
  { id: 'regularly_3_plus', label: '3+ volte/settimana', description: 'Mi alleno 3 o più volte a settimana' }
];

export default function FitnessExperienceStep({ data, onDataChange, nextStep }) {
  const handleSelection = (experience) => {
    onDataChange({ fitness_experience: experience });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <span className="text-2xl">💪</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quanto spesso ti alleni attualmente?</h2>
        <p className="text-gray-600">Ci aiuta a progettare il livello di intensità giusto per te</p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelection(level.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md text-left ${
              data.fitness_experience === level.id
                ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                : 'border-gray-200 hover:border-[#26847F]'
            }`}
          >
            <h3 className="font-semibold text-gray-900">{level.label}</h3>
            <p className="text-sm text-gray-600 mt-1">{level.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}