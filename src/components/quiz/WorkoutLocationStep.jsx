import React from 'react';

const LOCATIONS = [
  { id: 'gym', label: 'Palestra', icon: '🏋️', description: 'Accesso completo ad attrezzature' },
  { id: 'home', label: 'Casa', icon: '🏠', description: 'Attrezzatura limitata' },
  { id: 'outdoors', label: 'All\'aperto', icon: '🌳', description: 'Parchi, piste da corsa' }
];

export default function WorkoutLocationStep({ data, onDataChange, nextStep }) {
  const handleSelection = (location) => {
    onDataChange({ workout_location: location });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📍</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dove preferisci allenarti?</h2>
        <p className="text-gray-600">Scegli il tuo ambiente preferito per l'esercizio</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {LOCATIONS.map((location) => (
          <button
            key={location.id}
            onClick={() => handleSelection(location.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.workout_location === location.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                : 'border-gray-200 hover:border-[var(--brand-primary)]'
            }`}
          >
            <div className="text-4xl mb-4">{location.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{location.label}</h3>
            <p className="text-sm text-gray-600">{location.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}