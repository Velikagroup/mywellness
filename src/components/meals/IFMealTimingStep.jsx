import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IFMealTimingStep({ onDataChange, onNext }) {
  const [selected, setSelected] = useState(null);

  const options = [
    { 
      id: 'breakfast', 
      label: 'Salto la Colazione', 
      icon: '🌅',
      window: '12:00 - 20:00',
      desc: 'Mangio da mezzogiorno alle 20:00'
    },
    { 
      id: 'dinner', 
      label: 'Salto la Cena', 
      icon: '🌙',
      window: '08:00 - 16:00',
      desc: 'Mangio dalle 8:00 alle 16:00'
    }
  ];

  const handleSelect = (id) => {
    setSelected(id);
    onDataChange({ if_skip_meal: id });
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
          ⏰ Finestra Alimentare
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          Quale pasto preferisci saltare per il digiuno di 16 ore?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 text-center">
            💡 Scegli in base al tuo stile di vita e quando preferisci mangiare
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="text-5xl mb-3">{option.icon}</div>
              <div className="font-bold text-lg text-gray-900 mb-2">{option.label}</div>
              <div className="text-sm font-semibold text-[#26847F] mb-2">
                Finestra: {option.window}
              </div>
              <div className="text-xs text-gray-600">{option.desc}</div>
            </button>
          ))}
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