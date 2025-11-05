
import React from 'react';

const TARGET_ZONES = [
  { id: 'arms', label: 'Braccia', icon: '💪', description: 'Tonificare bicipiti e tricipiti' },
  { id: 'chest', label: 'Petto', icon: '🦸', description: 'Sviluppare pettorali' },
  { id: 'shoulders', label: 'Spalle', icon: '🏋️', description: 'Rafforzare deltoidi' },
  { id: 'back', label: 'Schiena', icon: '🧍', description: 'Migliorare postura e dorsali' },
  { id: 'belly', label: 'Addome', icon: '🤰', description: 'Ridurre grasso addominale' },
  { id: 'waist', label: 'Fianchi/Vita', icon: '⏳', description: 'Definire punto vita' },
  { id: 'glutes', label: 'Glutei', icon: '🍑', description: 'Sviluppare e modellare glutei' },
  { id: 'thighs', label: 'Cosce', icon: '🦵', description: 'Tonificare quadricipiti e femorali' },
  { id: 'calves', label: 'Polpacci', icon: '🏃', description: 'Rafforzare parte bassa gambe' },
  { id: 'face_neck', label: 'Viso e Collo', icon: '😊', description: 'Definire lineamenti' },
  { id: 'full_body', label: 'Corpo Intero', icon: '🎯', description: 'Miglioramento generale' }
];

export default function TargetZoneStep({ data, onDataChange, onNext }) {
  const handleSelection = (zone) => {
    onDataChange({ target_zone: zone });
    setTimeout(() => onNext(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Su quale zona vuoi concentrarti maggiormente?</h2>
        <p className="text-gray-600">Scegli la tua area principale di miglioramento</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {TARGET_ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleSelection(zone.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md text-center ${
              data.target_zone === zone.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-lg'
                : 'border-gray-200 hover:border-teal-300'
            }`}
          >
            <div className="text-3xl mb-2">{zone.icon}</div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{zone.label}</p>
            <p className="text-xs text-gray-600">{zone.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
