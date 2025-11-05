import React from 'react';
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

export default function AgeStep({ data, onDataChange }) {
  const handleChange = (e) => {
    onDataChange({ age: parseInt(e.target.value) || '' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quanti anni hai?</h2>
        <p className="text-gray-600">L'età influenza il tuo metabolismo e il fabbisogno nutrizionale</p>
      </div>

      <div className="max-w-md mx-auto">
        <Input
          type="number"
          placeholder="Inserisci la tua età"
          value={data.age || ''}
          onChange={handleChange}
          className="text-center text-2xl h-16 border-2 border-gray-200 focus:border-[var(--brand-primary)]"
          min="18"
          max="100"
        />
        <p className="text-sm text-gray-500 mt-2 text-center">Devi avere almeno 18 anni</p>
      </div>
    </div>
  );
}