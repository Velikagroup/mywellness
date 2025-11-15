import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, TrendingUp, CheckCircle2, X, Sparkles, ArrowRight, Utensils, Dumbbell, Save } from 'lucide-react';

export default function ProgressPhotoPreviewDemo() {
  const analysisData = {
    targetZone: 'Addome',
    comparison: 'improved',
    daysSince: 28,
    detailedAnalysis: {
      muscleDefinition: {
        score: 6.8,
        previous: 4.5
      },
      fatLayer: {
        thickness: 'Medio-ridotto',
        previous: 'Medio-alto',
        percentage: '-22%',
        description: 'Circonferenza vita ridotta di 6-7cm. Plicometria: 16mm (era 21mm).'
      },
      skinQuality: {
        elasticity: 'Buona',
        tone: 'Migliorato +20%'
      },
      posturalAlignment: {
        status: 'Notevolmente migliorato',
        description: 'Riduzione lordosi lombare. Core più stabile e attivo.'
      }
    },
    recommendations: {
      diet: [
        'Mantieni deficit calorico 350kcal - risultati ottimali',
        'Aumenta proteine a 1.6-1.8g/kg per preservare massa magra',
        'Integra Omega-3 (2-3g/die) per ridurre infiammazione'
      ],
      workout: [
        'Aumenta frequenza core a 4-5 sessioni/settimana',
        'Aggiungi 3 sessioni HIIT/settimana da 20-25 minuti',
        'Intensifica lavoro obliqui: side plank, russian twist'
      ]
    }
  };

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>

      <Card className="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        <div className="slide-up">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Analisi Completata</h2>
                <p className="text-sm text-gray-600 mt-1">Zona Target: {analysisData.targetZone} • {analysisData.daysSince} giorni</p>
              </div>
              <div className="px-4 py-2 bg-green-100 rounded-full">
                <span className="text-sm font-bold text-green-700">✓ Progressi Eccellenti</span>
              </div>
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/8eb701ee9_ModelPre.png"
                  alt="Before"
                  className="w-full h-56 object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  Prima - {analysisData.daysSince} giorni fa
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/3fb8677cc_ModelPost.png"
                  alt="After"
                  className="w-full h-56 object-cover rounded-xl"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  Dopo - Oggi
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* LEFT COLUMN - Scientific Analysis */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Analisi Scientifica Dettagliata
                </h3>
                
                <div className="space-y-2.5">
                  {/* Muscle Definition */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900">Definizione Muscolare</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.muscleDefinition.previous} →</span>
                        <span className="text-base font-black text-blue-600">{analysisData.detailedAnalysis.muscleDefinition.score}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Fat Layer */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">Strato Adiposo</h4>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {analysisData.detailedAnalysis.fatLayer.percentage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{analysisData.detailedAnalysis.fatLayer.previous} → {analysisData.detailedAnalysis.fatLayer.thickness}</p>
                    <p className="text-xs text-gray-700 mt-1">{analysisData.detailedAnalysis.fatLayer.description}</p>
                  </div>

                  {/* Skin Quality */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900">Qualità Pelle</h4>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        {analysisData.detailedAnalysis.skinQuality.tone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Elasticità: {analysisData.detailedAnalysis.skinQuality.elasticity}</p>
                  </div>

                  {/* Postural Alignment */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">Postura</h4>
                      <span className="text-xs text-green-600 font-semibold">{analysisData.detailedAnalysis.posturalAlignment.status}</span>
                    </div>
                    <p className="text-xs text-gray-700">{analysisData.detailedAnalysis.posturalAlignment.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Recommendations */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Raccomandazioni Personal Trainer AI
                </h3>

                {/* Diet Recommendations */}
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    🍽️ Modifiche Nutrizionali
                  </h4>
                  <div className="space-y-1.5">
                    {analysisData.recommendations.diet.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-2 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workout Recommendations */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    💪 Modifiche Allenamento
                  </h4>
                  <div className="space-y-1.5">
                    {analysisData.recommendations.workout.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-2 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Reordered */}
              <div className="space-y-2">
                {/* Diet Button - FIRST */}
                <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-3 border border-teal-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-teal-600" />
                    Applica Modifiche Nutrizionali?
                  </p>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-bold py-2 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Applica Piano Nutrizionale
                  </button>
                </div>

                {/* Workout Button - SECOND */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-purple-600" />
                    Applica Modifiche Allenamento?
                  </p>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Applica Piano Allenamento
                  </button>
                </div>

                {/* Save Analysis Button - LAST */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Save className="w-4 h-4 text-blue-600" />
                    Salva Analisi nella Cronologia
                  </p>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-2 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    Salva Analisi
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-600 text-center">
              Anteprima interfaccia • Funzionalità disponibili dopo il signup
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}