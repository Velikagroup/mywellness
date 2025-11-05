import React from 'react';
import { Card } from "@/components/ui/card";

export default function IntermittentFastingStep({ data, onDataChange, nextStep }) {
  const handleSelection = (choice) => {
    onDataChange({ intermittent_fasting: choice });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏰</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sei interessato al Digiuno Intermittente?</h2>
        <p className="text-gray-600 mb-4">Il digiuno intermittente alterna periodi di alimentazione e digiuno</p>
        <div className="bg-gray-50 rounded-lg p-4 max-w-lg mx-auto">
          <p className="text-sm text-gray-700">
            Metodi popolari includono il 16:8 (16 ore di digiuno, 8 ore di alimentazione) che può aiutare nella gestione del peso e della salute metabolica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        <Card 
          className={`p-6 cursor-pointer border-2 transition-all hover:shadow-md ${
            data.intermittent_fasting === true
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' 
              : 'border-gray-200 hover:border-teal-300'
          }`}
          onClick={() => handleSelection(true)}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--brand-primary-light)] rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-semibold text-gray-900">Sì, mi interessa</h3>
            <p className="text-sm text-gray-600 mt-2">Includilo nel mio piano</p>
          </div>
        </Card>

        <Card 
          className={`p-6 cursor-pointer border-2 transition-all hover:shadow-md ${
            data.intermittent_fasting === false
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]' 
              : 'border-gray-200 hover:border-teal-300'
          }`}
          onClick={() => handleSelection(false)}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="font-semibold text-gray-900">No, pasti regolari</h3>
            <p className="text-sm text-gray-600 mt-2">Orari tradizionali</p>
          </div>
        </Card>
      </div>
    </div>
  );
}