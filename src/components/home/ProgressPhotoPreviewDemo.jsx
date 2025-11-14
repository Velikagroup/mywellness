import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, TrendingUp, CheckCircle2, X, Sparkles } from 'lucide-react';

export default function ProgressPhotoPreviewDemo() {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analysisData = {
    targetZone: 'Addome',
    comparison: 'improved',
    daysSince: 21,
    visibleChanges: [
      'Riduzione spessore strato adiposo (-15%)',
      'Miglioramento definizione muscolare',
      'Pelle più tonica e compatta',
      'Riduzione ritenzione idrica visibile'
    ],
    scientificAnalysis: {
      muscleDefinition: 6.8,
      fatLayerThickness: 'Medio-sottile',
      skinTexture: 'Migliorata',
      vascularityLevel: 'Aumentata'
    },
    recommendations: {
      diet: [
        'Aumenta proteine a 140g/giorno (+10g)',
        'Riduci carboidrati serali di 30g',
        'Aggiungi 2L acqua/giorno per drenaggio'
      ],
      workout: [
        'Intensifica HIIT a 3x/settimana',
        'Aggiungi plank 3x60sec ogni allenamento',
        'Aumenta recupero a 48h tra sessioni addominali'
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analisi Completata</h2>
                  <p className="text-sm text-gray-600 mt-1">Zona Target: {analysisData.targetZone} • {analysisData.daysSince} giorni</p>
                </div>
                <div className="px-4 py-2 bg-green-100 rounded-full">
                  <span className="text-sm font-bold text-green-700">✓ Migliorato</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Scientific Analysis */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Analisi Scientifica
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Definizione Muscolare</p>
                    <p className="text-lg font-black text-blue-600">{analysisData.scientificAnalysis.muscleDefinition}/10</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Strato Adiposo</p>
                    <p className="text-sm font-bold text-gray-900">{analysisData.scientificAnalysis.fatLayerThickness}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Texture Pelle</p>
                    <p className="text-sm font-bold text-gray-900">{analysisData.scientificAnalysis.skinTexture}</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Vascolarizzazione</p>
                    <p className="text-sm font-bold text-gray-900">{analysisData.scientificAnalysis.vascularityLevel}</p>
                  </div>
                </div>
              </div>

              {/* Visible Changes */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Cambiamenti Visibili
                </h3>
                <div className="space-y-2">
                  {analysisData.visibleChanges.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800">{change}</p>
                    </div>
                  ))}
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
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    🍽️ Piano Nutrizionale
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.diet.map((rec, idx) => (
                      <div key={idx} className="bg-white/80 rounded-lg p-2 text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workout Recommendations */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    💪 Piano di Allenamento
                  </h4>
                  <div className="space-y-2">
                    {analysisData.recommendations.workout.map((rec, idx) => (
                      <div key={idx} className="bg-white/80 rounded-lg p-2 text-xs text-gray-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  disabled
                  className="flex-1 bg-gradient-to-r from-teal-500 to-green-500 text-white font-bold py-3 rounded-xl opacity-60 cursor-not-allowed"
                >
                  ✓ Applica Modifiche ai Piani
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
        )}

        {/* DEMO Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg z-20">
          DEMO
        </div>
      </Card>
    </>
  );
}