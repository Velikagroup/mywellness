import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CookingTimeStep({ onDataChange, onNext, dietType }) {
  const [selected, setSelected] = useState('moderate');

  const options = [
    { id: 'quick', label: 'Veloce', emoji: '⚡', desc: '10-20 minuti', detail: 'Ricette semplici e veloci' },
    { id: 'moderate', label: 'Moderato', emoji: '☕', desc: '20-30 minuti', detail: 'Equilibrio tra tempo e qualità' },
    { id: 'relaxed', label: 'Tranquillo', emoji: '👨‍🍳', desc: '30+ minuti', detail: 'Posso dedicare più tempo' }
  ];

  const handleSelect = (id) => {
    setSelected(id);
    onDataChange({ cooking_time_preference: id });
  };

  const handleContinue = () => {
    if (selected) {
      onNext();
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 text-center">
          ⏱️ Tempo in Cucina
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          Quanto tempo puoi dedicare alla preparazione dei pasti?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`p-6 rounded-xl border-2 transition-all text-center ${
                selected === option.id
                  ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
                  : 'border-gray-200 hover:border-[#26847F]/50 hover:bg-gray-50'
              }`}
            >
              <div className="text-4xl mb-3">{option.emoji}</div>
              <div className="font-bold text-lg text-gray-900 mb-1">{option.label}</div>
              <div className="text-sm font-semibold text-[#26847F] mb-2">{option.desc}</div>
              <div className="text-xs text-gray-600">{option.detail}</div>
            </button>
          ))}
        </div>

        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-900 text-center">
            💡 L'AI adatterà le ricette al tempo che hai a disposizione
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleContinue}
            disabled={!selected}
            className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-8 py-6 text-lg font-semibold rounded-xl"
          >
            Continua
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}