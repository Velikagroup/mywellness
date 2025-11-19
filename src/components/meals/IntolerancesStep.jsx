import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight } from 'lucide-react';

const COMMON_INTOLERANCES = [
  { id: 'lactose', label: 'Lattosio', description: 'Latte e derivati' },
  { id: 'gluten', label: 'Glutine', description: 'Frumento, orzo, segale' },
  { id: 'nuts', label: 'Frutta secca', description: 'Noci, mandorle, nocciole' },
  { id: 'eggs', label: 'Uova', description: 'Uova e prodotti con uova' },
  { id: 'soy', label: 'Soia', description: 'Soia e derivati' },
  { id: 'fish', label: 'Pesce', description: 'Pesce e frutti di mare' },
  { id: 'peanuts', label: 'Arachidi', description: 'Arachidi e derivati' },
  { id: 'sesame', label: 'Sesamo', description: 'Semi di sesamo' },
  { id: 'sulfites', label: 'Solfiti', description: 'Vino, frutta secca' },
  { id: 'histamine', label: 'Istamina', description: 'Formaggi stagionati, salumi' },
  { id: 'fructose', label: 'Fruttosio', description: 'Frutta, miele, sciroppi' },
  { id: 'sorbitol', label: 'Sorbitolo', description: 'Dolcificanti, alcune frutta' }
];

export default function IntolerancesStep({ data, onDataChange, nextStep }) {
  const [selectedIntolerances, setSelectedIntolerances] = useState(
    data?.intolerances || []
  );

  const toggleIntolerance = (intolerance) => {
    setSelectedIntolerances(prev => {
      if (prev.includes(intolerance)) {
        return prev.filter(i => i !== intolerance);
      }
      return [...prev, intolerance];
    });
  };

  const handleNext = () => {
    onDataChange({ intolerances: selectedIntolerances });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <AlertCircle className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Intolleranze Alimentari
        </h3>
        <p className="text-gray-600">
          Seleziona tutte le intolleranze che hai (se nessuna, vai avanti)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
        {COMMON_INTOLERANCES.map((intolerance) => (
          <button
            key={intolerance.id}
            onClick={() => toggleIntolerance(intolerance.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedIntolerances.includes(intolerance.id)
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] shadow-md'
                : 'border-gray-200 hover:border-[var(--brand-primary)]/50 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{intolerance.label}</p>
                <p className="text-sm text-gray-500 mt-1">{intolerance.description}</p>
              </div>
              {selectedIntolerances.includes(intolerance.id) && (
                <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)] flex items-center justify-center flex-shrink-0 ml-2">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedIntolerances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            ⚠️ Intolleranze selezionate:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedIntolerances.map(id => {
              const intolerance = COMMON_INTOLERANCES.find(i => i.id === id);
              return (
                <span key={id} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
                  {intolerance?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white py-6 text-base font-semibold rounded-xl"
        >
          Continua
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500 mt-4">
        💡 I pasti generati eviteranno completamente questi ingredienti
      </p>
    </div>
  );
}