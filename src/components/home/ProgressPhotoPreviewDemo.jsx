import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, TrendingUp, CheckCircle2, X, Sparkles, ArrowRight } from 'lucide-react';

export default function ProgressPhotoPreviewDemo() {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analysisData = {
    targetZone: 'Addome',
    comparison: 'improved',
    daysSince: 21,
    detailedAnalysis: {
      muscleDefinition: {
        score: 7.2,
        previous: 5.8,
        description: 'La linea alba è ora visibile con illuminazione naturale. I muscoli retti addominali mostrano una separazione chiara nella parte superiore. Obliqui esterni più definiti, specialmente durante contrazione.'
      },
      fatLayer: {
        thickness: 'Medio-sottile',
        previous: 'Medio-spesso',
        percentage: '-18%',
        description: 'Lo strato adiposo sottocutaneo è diminuito significativamente. Misurazione plicometrica stimata: 12mm (era 15mm). Riduzione particolarmente evidente nella zona periombelicale e nei fianchi.'
      },
      skinQuality: {
        elasticity: 'Eccellente',
        tone: 'Migliorato +25%',
        description: 'La pelle mostra maggiore compattezza ed elasticità. Texture più uniforme, riduzione microsolchi. Idratazione cutanea ottimale, assenza di smagliature o segni di cedimento.'
      },
      vascularity: {
        level: 'Moderata-Aumentata',
        description: 'Vene superficiali più visibili nella zona addominale bassa e sui fianchi. Indica riduzione tessuto adiposo sovrastante e miglior circolazione locale.'
      },
      posturalAlignment: {
        status: 'Migliorato',
        description: 'Riduzione della lordosi lombare. Core più stabile, migliore attivazione del pavimento pelvico. Bacino più allineato verticalmente.'
      },
      asymmetries: {
        detected: 'Minime',
        description: 'Leggera prevalenza muscolare obliqui destri (comune). Nessuna asimmetria patologica. Simmetria generale migliorata del 15% rispetto a prima.'
      }
    },
    recommendations: {
      diet: [
        'Aumenta proteine a 1.8g/kg peso corporeo (attualmente 1.5g/kg)',
        'Mantieni deficit calorico attuale di 300kcal - ottimale per composizione',
        'Aggiungi 15g BCAA pre-workout per preservare massa magra',
        'Integra Omega-3 (2g/die) per riduzione infiammazione',
        'Ciclo carboidrati: 150g giorni allenamento, 80g giorni riposo'
      ],
      workout: [
        'Intensifica lavoro core: 4x settimana invece di 3x',
        'Aggiungi esercizi anti-rotazionali (Pallof press, Bird dog)',
        'Incrementa HIIT: 3 sessioni settimanali 20min',
        'Plank progressivo: 3x90sec con varianti instabili',
        'Focus eccentrico su addominali: 4 sec discesa controllata',
        'Aggiungi 2 sessioni mobilità anca per allineamento pelvico'
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

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); }
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <Card className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
        {!showAnalysis ? (
          /* Upload State */
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-purple-900">Analisi AI Avanzata</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Carica Foto Progressi</h2>
              <p className="text-gray-600">Analisi scientifica della tua evoluzione fisica</p>
            </div>

            {/* Before/After Upload Areas */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Before Photo */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Foto Precedente</label>
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&q=80"
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    21 giorni fa
                  </div>
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 block">Foto Attuale</label>
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop&q=80"
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    Oggi
                  </div>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={() => setShowAnalysis(true)}
              disabled
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl pulse-glow opacity-90 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Analizza Progressi con AI
            </button>
          </div>
        ) : (
          /* Analysis Results */
          <div className="slide-up">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analisi Completata</h2>
                  <p className="text-sm text-gray-600 mt-1">Zona Target: {analysisData.targetZone} • {analysisData.daysSince} giorni</p>
                </div>
                <div className="px-4 py-2 bg-green-100 rounded-full">
                  <span className="text-sm font-bold text-green-700">✓ Migliorato</span>
                </div>
              </div>
              
              {/* Before/After Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&q=80"
                    alt="Before"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    Prima
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop&q=80"
                    alt="After"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    Dopo
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[650px] overflow-y-auto">
              {/* Detailed Scientific Analysis */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Analisi Scientifica Dettagliata
                </h3>
                
                <div className="space-y-4">
                  {/* Muscle Definition */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900">Definizione Muscolare</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{analysisData.detailedAnalysis.muscleDefinition.previous} →</span>
                        <span className="text-lg font-black text-blue-600">{analysisData.detailedAnalysis.muscleDefinition.score}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.muscleDefinition.description}</p>
                  </div>

                  {/* Fat Layer */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900">Strato Adiposo Sottocutaneo</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          {analysisData.detailedAnalysis.fatLayer.percentage}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{analysisData.detailedAnalysis.fatLayer.previous} → {analysisData.detailedAnalysis.fatLayer.thickness}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.fatLayer.description}</p>
                  </div>

                  {/* Skin Quality */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900">Qualità della Pelle</h4>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        {analysisData.detailedAnalysis.skinQuality.tone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Elasticità: {analysisData.detailedAnalysis.skinQuality.elasticity}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.skinQuality.description}</p>
                  </div>

                  {/* Vascularity */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Vascolarizzazione</h4>
                    <p className="text-xs text-gray-600 mb-1">{analysisData.detailedAnalysis.vascularity.level}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.vascularity.description}</p>
                  </div>

                  {/* Postural Alignment */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Allineamento Posturale</h4>
                    <p className="text-xs text-gray-600 mb-1">Status: {analysisData.detailedAnalysis.posturalAlignment.status}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.posturalAlignment.description}</p>
                  </div>

                  {/* Asymmetries */}
                  <div className="bg-white/90 rounded-lg p-4 border border-blue-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Simmetria e Asimmetrie</h4>
                    <p className="text-xs text-gray-600 mb-1">Rilevate: {analysisData.detailedAnalysis.asymmetries.detected}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{analysisData.detailedAnalysis.asymmetries.description}</p>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Raccomandazioni Personal Trainer AI
                </h3>

                {/* Diet Recommendations */}
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    🍽️ Modifiche Piano Nutrizionale
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.diet.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workout Recommendations */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    💪 Modifiche Piano di Allenamento
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.workout.map((rec, idx) => (
                      <div key={idx} className="bg-white/90 rounded-lg p-3 text-xs text-gray-700 flex items-start gap-2 border border-amber-100">
                        <span className="text-amber-500 font-bold mt-0.5">{idx + 1}.</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-4 border border-teal-200">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  Applica le Modifiche Proposte?
                </p>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  L'AI aggiornerà automaticamente i tuoi piani nutrizionali e di allenamento per ottimizzare i risultati in base all'analisi dei progressi.
                </p>
                <div className="flex gap-3">
                  <button
                    disabled
                    className="flex-1 bg-gradient-to-r from-teal-500 to-green-500 text-white font-bold py-3 rounded-xl opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Applica Modifiche ai Piani
                  </button>
                  <button
                    disabled
                    className="px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl opacity-60 cursor-not-allowed"
                  >
                    Ignora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEMO Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg z-20">
          DEMO
        </div>
      </Card>
    </>
  );
}