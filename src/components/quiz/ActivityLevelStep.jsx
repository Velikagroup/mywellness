import React from 'react';

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Sedentario',
    description: 'Lavoro da scrivania, poco o nessun esercizio',
    icon: '🪑'
  },
  {
    id: 'lightly_active',
    label: 'Leggermente Attivo',
    description: 'Esercizio leggero 1-3 giorni/settimana',
    icon: '🚶'
  },
  {
    id: 'moderately_active',
    label: 'Moderatamente Attivo',
    description: 'Esercizio moderato 3-5 giorni/settimana',
    icon: '🏃'
  },
  {
    id: 'very_active',
    label: 'Molto Attivo',
    description: 'Esercizio intenso 6-7 giorni/settimana',
    icon: '💪'
  },
  {
    id: 'professional_athlete',
    label: 'Atleta Professionista',
    description: 'Esercizio molto intenso, allenamento 2 volte/giorno',
    icon: '🏆'
  }
];

export default function ActivityLevelStep({ data, onDataChange, nextStep }) {
  const handleSelection = (level) => {
    onDataChange({ activity_level: level });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏃</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual è il tuo livello di attività quotidiana?</h2>
        <p className="text-gray-600">Questo ci aiuta a calcolare il tuo fabbisogno calorico giornaliero</p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => handleSelection(level.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md text-left ${
              data.activity_level === level.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{level.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{level.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}