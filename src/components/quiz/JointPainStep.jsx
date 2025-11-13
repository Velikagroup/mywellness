import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

const JOINT_PAIN_OPTIONS = [
  { id: 'ginocchia', label: '🦵 Ginocchia', description: 'Dolore o fastidio alle ginocchia' },
  { id: 'schiena', label: '🧍 Schiena (Lombare)', description: 'Dolore lombare o schiena bassa' },
  { id: 'spalle', label: '💪 Spalle', description: 'Dolore o limitazioni alle spalle' },
  { id: 'gomiti', label: '💪 Gomiti', description: 'Dolore ai gomiti' },
  { id: 'polsi', label: '🤲 Polsi', description: 'Dolore o debolezza ai polsi' },
  { id: 'anche', label: '🦴 Anche', description: 'Dolore o rigidità alle anche' },
  { id: 'caviglie', label: '🦶 Caviglie', description: 'Dolore o instabilità alle caviglie' },
  { id: 'nessuno', label: '✅ Nessun Dolore', description: 'Non ho dolori articolari' }
];

export default function JointPainStep({ data, onDataChange, nextStep }) {
  const [selectedPains, setSelectedPains] = useState(data.joint_pain || []);

  const handleToggle = (painId) => {
    let newSelection;
    
    if (painId === 'nessuno') {
      newSelection = selectedPains.includes('nessuno') ? [] : ['nessuno'];
    } else {
      newSelection = selectedPains.includes(painId)
        ? selectedPains.filter(id => id !== painId)
        : [...selectedPains.filter(id => id !== 'nessuno'), painId];
    }
    
    setSelectedPains(newSelection);
    onDataChange({ joint_pain: newSelection.filter(id => id !== 'nessuno') });
  };

  const handleContinue = () => {
    if (nextStep) {
      nextStep();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#26847F] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(38,132,127,0.3)]">
          <span className="text-2xl">🩺</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hai dolori o limitazioni articolari?</h2>
        <p className="text-gray-600">L'AI eviterà esercizi che sollecitano queste zone</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {JOINT_PAIN_OPTIONS.map((option) => {
          const isSelected = selectedPains.includes(option.id);
          
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-[#26847F] bg-[#e9f6f5] shadow-[0_4px_16px_rgba(38,132,127,0.2)]'
                  : 'border-gray-200 hover:border-[#26847F]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {isSelected ? (
                    <CheckCircle className="w-6 h-6 text-[#26847F]" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button 
          onClick={handleContinue}
          className="bg-[#26847F] hover:bg-[#1f6b66] text-white px-8 shadow-[0_4px_16px_rgba(38,132,127,0.3)] hover:shadow-[0_6px_20px_rgba(38,132,127,0.4)]"
        >
          Continua
        </Button>
      </div>
    </div>
  );
}