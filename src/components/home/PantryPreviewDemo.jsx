import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Camera, Plus, Check, Apple, Milk, Egg, Fish } from "lucide-react";
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Componente DEMO per Homepage - Dispensa Intelligente
 * Mostra la funzionalità di catalogazione degli ingredienti in casa con AI
 */
export default function PantryPreviewDemo() {
  const { t } = useLanguage();
  const [view, setView] = useState('catalog'); // 'catalog' | 'scanning'

  const pantryItems = [
    {
      name: 'Petto di Pollo',
      quantity: '500g',
      icon: '🍗',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      category: 'Proteine'
    },
    {
      name: 'Riso Basmati',
      quantity: '1kg',
      icon: '🍚',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      category: 'Carboidrati'
    },
    {
      name: 'Broccoli',
      quantity: '300g',
      icon: '🥦',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      category: 'Verdure'
    },
    {
      name: 'Olio EVO',
      quantity: '750ml',
      icon: '🫒',
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
      category: 'Grassi'
    },
    {
      name: 'Uova',
      quantity: '6 pz',
      icon: '🥚',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      category: 'Proteine'
    },
    {
      name: 'Latte Scremato',
      quantity: '1L',
      icon: '🥛',
      calories: 34,
      protein: 3.4,
      carbs: 5,
      fat: 0.1,
      category: 'Latticini'
    }
  ];

  return (
    <>
      <style>{`
        .water-glass-effect {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(249, 250, 251, 0.75) 0%,
            rgba(243, 244, 246, 0.65) 50%,
            rgba(249, 250, 241, 0.75) 100%
          );
          box-shadow: 
            0 8px 32px 0 rgba(31, 38, 135, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05);
        }

        @keyframes scanning {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(10px); opacity: 1; }
        }

        .scanning-line {
          animation: scanning 2s ease-in-out infinite;
        }
      `}</style>

      <Card className="water-glass-effect border border-gray-200/40 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50 pb-4">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Dispensa Intelligente
          </CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            Cataloga gli alimenti in casa con AI • Piani personalizzati su misura
          </p>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {view === 'catalog' && (
            <>
              {/* Header con statistiche */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-center border border-blue-200/50">
                  <p className="text-2xl font-black text-blue-700">{pantryItems.length}</p>
                  <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Alimenti</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-200/50">
                  <p className="text-2xl font-black text-green-700">4</p>
                  <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">Categorie</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center border border-purple-200/50">
                  <p className="text-2xl font-black text-purple-700">98%</p>
                  <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wide">Precisione</p>
                </div>
              </div>

              {/* Lista ingredienti */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pantryItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200/50 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.quantity} • {item.category}</p>
                        </div>
                      </div>
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <div className="flex-1 bg-gray-50 rounded px-2 py-1">
                        <span className="text-gray-500">Kcal:</span>
                        <span className="ml-1 font-bold text-gray-900">{item.calories}</span>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded px-2 py-1">
                        <span className="text-blue-600">P:</span>
                        <span className="ml-1 font-bold text-blue-700">{item.protein}g</span>
                      </div>
                      <div className="flex-1 bg-amber-50 rounded px-2 py-1">
                        <span className="text-amber-600">C:</span>
                        <span className="ml-1 font-bold text-amber-700">{item.carbs}g</span>
                      </div>
                      <div className="flex-1 bg-orange-50 rounded px-2 py-1">
                        <span className="text-orange-600">G:</span>
                        <span className="ml-1 font-bold text-orange-700">{item.fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200/50">
                <button
                  onClick={() => setView('scanning')}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Camera className="w-4 h-4" />
                  Scansiona Alimento
                </button>
                <button
                  className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Plus className="w-4 h-4" />
                  Rigenera Piano
                </button>
              </div>
            </>
          )}

          {view === 'scanning' && (
            <div className="text-center py-8">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-indigo-400" />
                </div>
                <div className="absolute inset-0 scanning-line border-t-2 border-indigo-600"></div>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Scansione in corso...</p>
              <p className="text-xs text-gray-500">Analisi AI dei valori nutrizionali</p>
              <button
                onClick={() => setView('catalog')}
                className="mt-6 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                ← Torna al catalogo
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200/50">
            <div className="flex gap-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 mb-1">
                  💡 Piano Nutrizionale Ottimizzato
                </p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  L'AI genera pasti utilizzando prioritariamente gli ingredienti che hai in casa, 
                  riducendo sprechi e costi della spesa settimanale.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="px-5 pb-4">
          <div className="bg-gray-50/50 rounded-lg px-3 py-2 border border-gray-200/30">
            <p className="text-[10px] text-gray-400 text-center italic">
              Anteprima interfaccia • Funzionalità disponibili dopo il signup
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}