import React from 'react';

const JOINT_AREAS = [
  'Spalle', 'Ginocchia', 'Schiena Bassa', 'Schiena Alta', 'Collo', 
  'Polsi', 'Caviglie', 'Anche', 'Gomiti'
];

export default function JointPainStep({ data, onDataChange }) {
  const currentPain = data.joint_pain || [];

  const togglePain = (area) => {
    const newPain = currentPain.includes(area)
      ? currentPain.filter(p => p !== area)
      : [...currentPain, area];
    onDataChange({ joint_pain: newPain });
  };

  const handleNone = () => {
    onDataChange({ joint_pain: [] });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🦴</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hai dolori articolari o limitazioni?</h2>
        <p className="text-gray-600">Modificheremo gli esercizi per rispettare queste aree</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {JOINT_AREAS.map((area) => (
            <button
              key={area}
              onClick={() => togglePain(area)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm text-sm ${
                currentPain.includes(area)
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                  : 'border-gray-200 text-gray-700 hover:border-[var(--brand-primary)]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleNone}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              currentPain.length === 0
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary-dark-text)]'
                : 'border-gray-200 text-gray-700 hover:border-[var(--brand-primary)]'
            }`}
          >
            Nessun dolore o limitazione articolare
          </button>
        </div>

        {currentPain.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-700 font-medium">Aree con dolore/limitazioni:</p>
            <p className="text-yellow-600 text-sm">{currentPain.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}