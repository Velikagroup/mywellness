import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntermittentFastingStep({ onDataChange, onNext }) {
  const handleChoice = (choice) => {
    onDataChange({ intermittent_fasting: choice });
    setTimeout(() => onNext(), 300);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 text-center">
          🕐 Digiuno Intermittente
        </CardTitle>
        <p className="text-gray-600 text-center mt-2">
          Vuoi seguire il protocollo del digiuno intermittente?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-semibold mb-2">
            📚 Cos'è il Digiuno Intermittente (16/8)?
          </p>
          <p className="text-sm text-blue-800">
            • <strong>16 ore</strong> di digiuno (non mangi nulla, solo acqua/tè/caffè senza zucchero)<br/>
            • <strong>8 ore</strong> di finestra alimentare (mangi tutti i tuoi pasti)<br/>
            • Esempio: mangi dalle 12:00 alle 20:00, digiuni dalle 20:00 alle 12:00
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleChoice(false)}
            className="p-6 rounded-xl border-2 border-gray-200 hover:border-[#26847F] hover:bg-[#E0F2F1] transition-all text-center group"
          >
            <div className="text-4xl mb-3">🍽️</div>
            <div className="font-bold text-lg text-gray-900 mb-2">No, grazie</div>
            <div className="text-sm text-gray-600">
              Preferisco pasti distribuiti normalmente nella giornata
            </div>
          </button>

          <button
            onClick={() => handleChoice(true)}
            className="p-6 rounded-xl border-2 border-[#26847F] bg-[#E0F2F1] hover:bg-[#26847F] hover:text-white transition-all text-center group"
          >
            <div className="text-4xl mb-3">⏱️</div>
            <div className="font-bold text-lg text-gray-900 group-hover:text-white mb-2">Sì, voglio provare</div>
            <div className="text-sm text-gray-600 group-hover:text-white">
              Seguirò il protocollo 16/8 con finestra alimentare ristretta
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}