import React from 'react';

const EQUIPMENT_OPTIONS = [
  'Nessuna', 'Bande Elastiche', 'Manubri', 'Bilanciere', 'Kettlebell',
  'Cyclette', 'Tapis Roulant', 'Sbarra Trazioni', 'Tappetino Yoga', 'Panca'
];

export default function EquipmentStep({ data, onDataChange }) {
  const currentEquipment = data.equipment || [];

  const toggleEquipment = (equipment) => {
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    onDataChange({ equipment: newEquipment });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">A quale attrezzatura hai accesso?</h2>
        <p className="text-gray-600">Seleziona tutta l'attrezzatura disponibile</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {EQUIPMENT_OPTIONS.map((equipment) => (
            <button
              key={equipment}
              onClick={() => toggleEquipment(equipment)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-sm text-sm ${
                currentEquipment.includes(equipment)
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary-dark-text)]'
                  : 'border-gray-200 text-gray-700 hover:border-[var(--brand-primary)]'
              }`}
            >
              {equipment}
            </button>
          ))}
        </div>

        {currentEquipment.length > 0 && (
          <div className="mt-6 p-4 bg-[var(--brand-primary-light)] rounded-lg border border-[var(--brand-primary)]/20">
            <p className="text-[var(--brand-primary-dark-text)] font-medium">Attrezzatura disponibile:</p>
            <p className="text-[var(--brand-primary)] text-sm">{currentEquipment.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}