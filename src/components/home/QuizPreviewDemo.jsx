import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";

/**
 * Componente DEMO per Homepage - Quiz
 * Mostra un esempio di domanda del quiz con opzioni
 */
export default function QuizPreviewDemo() {
  const [selected, setSelected] = React.useState('moderato');

  const options = [
    { id: 'lento', label: 'Lento e Sostenibile', subtitle: '0.25-0.5kg/settimana', emoji: '🐢' },
    { id: 'moderato', label: 'Moderato', subtitle: '0.5-0.75kg/settimana', emoji: '⚡' },
    { id: 'veloce', label: 'Veloce', subtitle: '0.75-1kg/settimana', emoji: '🚀' }
  ];

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="pb-6 pt-8 text-center border-b border-gray-100">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent">
              8
            </span>
            <span className="text-gray-400 font-medium">/</span>
            <span className="text-xl font-bold text-gray-600">12</span>
          </div>
          <span className="text-sm text-gray-500 font-medium ml-2">domande completate</span>
        </div>
        
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner max-w-md mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 rounded-full transition-all duration-500 ease-out shadow-md"
            style={{ width: '67%' }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/30 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="text-[var(--brand-primary-dark-text)] font-semibold">Personalizzazione AI</span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            Qual è il tuo ritmo ideale di dimagrimento?
          </h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            L'AI calibrerà il tuo piano nutrizionale in base alla velocità che preferisci
          </p>
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              disabled
              className={`w-full p-4 rounded-2xl border-2 transition-all cursor-not-allowed opacity-80 ${
                selected === option.id
                  ? 'border-[var(--brand-primary)] bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 shadow-lg'
                  : 'border-gray-200 bg-white/70 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected === option.id 
                    ? 'bg-[var(--brand-primary)] text-white shadow-md' 
                    : 'bg-gray-100'
                }`}>
                  {selected === option.id ? <CheckCircle className="w-6 h-6" /> : option.emoji}
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold text-base mb-1 ${
                    selected === option.id ? 'text-[var(--brand-primary-dark-text)]' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-sm text-gray-600">{option.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400 italic">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}