import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, TrendingUp, CheckCircle2, X, Sparkles, ArrowRight, Utensils, Dumbbell } from 'lucide-react';

export default function ProgressPhotoPreviewDemo() {
  const analysisData = {
    targetZone: 'Addome',
    comparison: 'improved',
    daysSince: 28,
    detailedAnalysis: {
      muscleDefinition: {
        score: 6.8,
        previous: 4.5,
        description: 'Miglioramento visibile della tonicità addominale. La zona centrale mostra maggiore compattezza muscolare. Gli obliqui esterni presentano una definizione moderata, specialmente nella zona laterale.'
      },
      fatLayer: {
        thickness: 'Medio-ridotto',
        previous: 'Medio-alto',
        percentage: '-22%',
        description: 'Riduzione significativa dello strato adiposo sottocutaneo addominale. La zona periombelicale mostra un miglioramento marcato. Circonferenza vita ridotta di circa 6-7cm. Plicometria stimata: 16mm (era 21mm).'
      },
      skinQuality: {
        elasticity: 'Buona',
        tone: 'Migliorato +20%',
        description: 'La pelle mantiene buona elasticità nonostante la riduzione volumetrica. Texture più liscia e uniforme. Assenza di cedimenti cutanei significativi. Idratazione cutanea ottimale nella zona target.'
      },
      vascularity: {
        level: 'Leggera-Visibile',
        description: 'Vene superficiali leggermente più evidenti nella zona addominale inferiore, segno di riduzione del tessuto adiposo sovrastante e miglioramento della circolazione periferica.'
      },
      posturalAlignment: {
        status: 'Notevolmente migliorato',
        description: 'Marcata riduzione della lordosi lombare. Bacino più neutro e allineato verticalmente. Core più attivo e stabile. Miglior controllo del pavimento pelvico visibile dalla postura generale.'
      },
      asymmetries: {
        detected: 'Minime fisiologiche',
        description: 'Nessuna asimmetria significativa rilevata. Simmetria bilaterale nella distribuzione del tessuto adiposo e muscolare. Distribuzione omogenea del dimagrimento tra lato destro e sinistro.'
      }
    },
    recommendations: {
      diet: [
        'Mantieni deficit calorico attuale di 350kcal - stai ottenendo risultati ottimali',
        'Aumenta proteine a 1.6-1.8g/kg per preservare massa magra durante il dimagrimento',
        'Introduci 2 ricariche carboidrati/settimana (200g) per mantenere metabolismo attivo',
        'Integra Omega-3 (2-3g/die) per ridurre infiammazione e migliorare composizione corporea',
        'Mantieni idratazione elevata: 35-40ml/kg peso corporeo',
        'Considera ciclizzazione calorica: -20% giorni riposo, +10% giorni allenamento'
      ],
      workout: [
        'Aumenta frequenza allenamento core a 4-5 sessioni settimanali',
        'Introduci esercizi composti: deadlift, squat per massimizzare consumo calorico',
        'Aggiungi 3 sessioni HIIT/settimana da 20-25 minuti per accelerare lipolisi addominale',
        'Intensifica lavoro obliqui: side plank, russian twist, woodchop con resistenze',
        'Implementa esercizi anti-rotazionali per stabilità core (Pallof press)',
        'Mantieni 2 sessioni mobilità/settimana per allineamento posturale ottimale',
        'Progressive overload: aumenta intensità del 5-10% ogni 2 settimane'
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

      <Card className="w-full max-w-6xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
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
                
                <div className="space-y-3">
                  {/* Muscle Definition */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">Definizione Muscolare</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.muscleDefinition.previous} →</span>
                        <span className="text-base font-black text-blue-600">{analysisData.detailedAnalysis.muscleDefinition.score}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.muscleDefinition.description}</p>
                  </div>

                  {/* Fat Layer */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">Strato Adiposo</h4>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {analysisData.detailedAnalysis.fatLayer.percentage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{analysisData.detailedAnalysis.fatLayer.previous} → {analysisData.detailedAnalysis.fatLayer.thickness}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.fatLayer.description}</p>
                  </div>

                  {/* Skin Quality */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">Qualità Pelle</h4>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        {analysisData.detailedAnalysis.skinQuality.tone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Elasticità: {analysisData.detailedAnalysis.skinQuality.elasticity}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.skinQuality.description}</p>
                  </div>

                  {/* Vascularity */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Vascolarizzazione</h4>
                    <p className="text-xs text-gray-600 mb-1">{analysisData.detailedAnalysis.vascularity.level}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.vascularity.description}</p>
                  </div>

                  {/* Postural Alignment */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Allineamento Posturale</h4>
                    <p className="text-xs text-gray-600 mb-1">Status: {analysisData.detailedAnalysis.posturalAlignment.status}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.posturalAlignment.description}</p>
                  </div>

                  {/* Asymmetries */}
                  <div className="bg-white/90 rounded-lg p-3 border border-blue-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Simmetria</h4>
                    <p className="text-xs text-gray-600 mb-1">Rilevate: {analysisData.detailedAnalysis.asymmetries.detected}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.asymmetries.description}</p>
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
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    🍽️ Modifiche Piano Nutrizionale
                  </h4>
                  <div className="space-y-2">
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
                    💪 Modifiche Piano di Allenamento
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.workout.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-2 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Separated */}
              <div className="space-y-3">
                {/* Diet Button */}
                <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-3 border border-teal-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-teal-600" />
                    Applica Modifiche Nutrizionali?
                  </p>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    L'AI aggiornerà il tuo piano alimentare con le nuove raccomandazioni.
                  </p>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-bold py-2 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Applica Piano Nutrizionale
                  </button>
                </div>

                {/* Workout Button */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-purple-600" />
                    Applica Modifiche Allenamento?
                  </p>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    L'AI aggiornerà il tuo piano di allenamento con le nuove raccomandazioni.
                  </p>
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-2 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Applica Piano Allenamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEMO Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg z-20">
          DEMO
        </div>
      </Card>
    </>
  );
}