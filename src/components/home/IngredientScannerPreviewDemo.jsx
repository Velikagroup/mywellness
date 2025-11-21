import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Scan, Check, Database, Zap } from 'lucide-react';

export default function IngredientScannerPreviewDemo() {
  const [scanStep, setScanStep] = useState(0);

  const scannedProduct = {
    name: 'Petto di Pollo Fileni',
    brand: 'Fileni',
    barcode: '8003410252079',
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
    nutrition: {
      calories: 110,
      protein: 23.1,
      carbs: 0,
      fat: 2.6,
      serving: '100g'
    }
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev < 3 ? prev + 1 : 0));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

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

        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        
        @keyframes pulse-scan {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
        
        .pulse-scan {
          animation: pulse-scan 1.5s ease-in-out infinite;
        }

        .scanner-content-wrapper {
          min-height: 450px;
          max-height: 450px;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <Card className="w-full max-w-md mx-auto water-glass-effect border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center pulse-scan">
                <Scan className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Scanner Ingredienti</h2>
                <p className="text-xs text-gray-600">Scansiona per valori nutrizionali precisi</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg border border-indigo-200">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">Database 500.000+ alimenti</span>
            <Zap className="w-4 h-4 text-amber-500 ml-auto" />
          </div>
        </div>

        {/* Scanner Content - Fixed Height */}
        <div className="scanner-content-wrapper">
          {/* Scanner Area */}
          {scanStep === 0 && (
            <div className="px-6 py-8 flex-1 flex items-center justify-center">
              <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {/* Scan Line Effect */}
                <div className="absolute inset-0">
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scan-line opacity-50"></div>
                </div>
                
                {/* Scanner Corners */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
                
                <div className="text-center z-10">
                  <Scan className="w-16 h-16 text-gray-400 mx-auto mb-3 pulse-scan" />
                  <p className="text-sm font-semibold text-gray-700">Inquadra il barcode</p>
                  <p className="text-xs text-gray-500 mt-1">o l'etichetta nutrizionale</p>
                </div>
              </div>
            </div>
          )}

          {/* Scanning State */}
          {scanStep === 1 && (
            <div className="px-6 py-8 flex-1 flex items-center justify-center">
              <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop"
                  alt="Scanning"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                      <div>
                        <p className="font-bold text-gray-900">Scansione in corso...</p>
                        <p className="text-xs text-gray-600">Riconoscimento prodotto</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {scanStep >= 2 && (
            <div className="px-6 py-6 flex-1 overflow-y-auto">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Prodotto Riconosciuto</p>
                    <p className="text-xs text-green-700">Database match • 99% accuratezza</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-4">
                <img 
                  src={scannedProduct.image}
                  alt={scannedProduct.name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">{scannedProduct.name}</p>
                  <p className="text-sm text-gray-600 mb-1">{scannedProduct.brand}</p>
                  <p className="text-xs text-gray-500 font-mono">EAN: {scannedProduct.barcode}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <p className="text-sm font-bold text-gray-900 mb-3">Valori Nutrizionali Reali</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3 text-center border border-red-100">
                    <p className="text-2xl font-black text-red-600">{scannedProduct.nutrition.calories}</p>
                    <p className="text-xs text-gray-600">kcal</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center border border-blue-100">
                    <p className="text-2xl font-black text-blue-600">{scannedProduct.nutrition.protein}g</p>
                    <p className="text-xs text-gray-600">Proteine</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-3 text-center border border-amber-100">
                    <p className="text-2xl font-black text-amber-600">{scannedProduct.nutrition.carbs}g</p>
                    <p className="text-xs text-gray-600">Carboidrati</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
                    <p className="text-2xl font-black text-green-600">{scannedProduct.nutrition.fat}g</p>
                    <p className="text-xs text-gray-600">Grassi</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">Per {scannedProduct.nutrition.serving}</p>
              </div>

              <button
                disabled
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 rounded-xl opacity-50 cursor-not-allowed"
              >
                Aggiungi al Piano Nutrizionale
              </button>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic text-center">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </Card>
    </>
  );
}