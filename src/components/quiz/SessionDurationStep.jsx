import React from 'react';
import { Clock } from 'lucide-react';

const DURATIONS = [
  { id: 'under_20', label: '< 20 min', description: 'Sessione Veloce' },
  { id: '30_min', label: '30 min', description: 'Sessione Standard' },
  { id: '45_min', label: '45 min', description: 'Sessione Estesa' },
  { id: 'over_60', label: '60+ min', description: 'Sessione Lunga' }
];

export default function SessionDurationStep({ data, onDataChange, nextStep }) {
  const handleSelection = (duration) => {
    onDataChange({ session_duration: duration });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quanto può durare ogni sessione?</h2>
        <p className="text-gray-600">Scegli la durata preferita dell'allenamento</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {DURATIONS.map((duration) => (
          <button
            key={duration.id}
            onClick={() => handleSelection(duration.id)}
            className={`p-6 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.session_duration === duration.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                : 'border-gray-200 hover:border-[var(--brand-primary)]'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 mb-2">{duration.label}</div>
            <p className="text-sm text-gray-600">{duration.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}