import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";

export default function PerformanceOrientedStep({ data, onDataChange, nextStep }) {
  const [selected, setSelected] = useState(data?.is_performance_oriented ?? null);

  const handleSelect = (value) => {
    setSelected(value);
    onDataChange({ is_performance_oriented: value });
    setTimeout(() => nextStep(), 300);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🎯 Tipo di Obiettivo</h3>
        <p className="text-gray-600">Il tuo obiettivo è orientato alla prestazione sportiva?</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => handleSelect(true)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === true
              ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
              : 'border-gray-200 hover:border-[#26847F]/50 bg-white hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              selected === true ? 'bg-[#26847F]' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${selected === true ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">Sì, prestazionale</h4>
              <p className="text-sm text-gray-600">
                Voglio migliorare in uno sport specifico, competere, o seguire una metodologia di allenamento precisa (es: CrossFit, Powerlifting, Bodybuilding)
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleSelect(false)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === false
              ? 'border-[#26847F] bg-[#E0F2F1] shadow-lg'
              : 'border-gray-200 hover:border-[#26847F]/50 bg-white hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              selected === false ? 'bg-[#26847F]' : 'bg-gray-100'
            }`}>
              <Target className={`w-6 h-6 ${selected === false ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">No, benessere generale</h4>
              <p className="text-sm text-gray-600">
                Voglio stare in forma, sentirmi bene, dimagrire o tonificare senza seguire metodologie sportive specifiche
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-6">
        <p className="text-sm text-blue-900 text-center">
          💡 Questa scelta determinerà il tipo di allenamento che l'AI creerà per te
        </p>
      </div>
    </div>
  );
}