import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Sparkles, Zap, Info } from "lucide-react";

/**
 * Componente DEMO per Homepage - Analisi Foto AI
 * Replica la UI iniziale di PhotoMealAnalyzer ma in versione statica
 */
export default function PhotoAnalyzerPreviewDemo() {
  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
      <style>{`
        .liquid-glass-upload {
          backdrop-filter: blur(12px) saturate(180%);
          background: linear-gradient(135deg, 
            rgba(38, 132, 127, 0.08) 0%,
            rgba(20, 184, 166, 0.05) 50%,
            rgba(38, 132, 127, 0.08) 100%
          );
          border: 2px dashed rgba(38, 132, 127, 0.3);
          box-shadow: 
            0 4px 16px 0 rgba(38, 132, 127, 0.08),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.6);
        }
      `}</style>

      <CardHeader className="border-b border-gray-200/50 pb-4 bg-gradient-to-br from-white via-[var(--brand-primary-light)]/10 to-white">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 bg-clip-text text-transparent font-bold">
              Analisi Scientifica Pasto AI
            </span>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Analisi dimensionale e calcolo preciso ingrediente per ingrediente
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Upload Section */}
        <div className="liquid-glass-upload rounded-2xl p-6 sm:p-8 text-center transition-all">
          <Camera className="w-12 h-12 text-[var(--brand-primary)] mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">📸 Carica foto del tuo pasto</p>
          <p className="text-sm text-gray-500 mb-6">
            L'AI farà analisi dimensionale per calcolare peso e nutrienti con precisione scientifica
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button 
              disabled
              className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 text-white shadow-lg cursor-not-allowed opacity-80"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scatta Foto
            </Button>
            
            <Button 
              disabled
              variant="outline" 
              className="border-2 border-[var(--brand-primary)]/30 cursor-not-allowed opacity-80"
            >
              <Upload className="w-4 h-4 mr-2" />
              Carica da Galleria
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-blue-900 text-sm mb-1">Analisi Dimensionale</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Misura lunghezza, larghezza e spessore di ogni alimento usando il piatto come riferimento
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-purple-900 text-sm mb-1">Stima Peso Scientifica</p>
                <p className="text-xs text-purple-700 leading-relaxed">
                  Calcola il peso usando densità verificate (carne: ~1.0 g/cm³, verdure: ~0.6 g/cm³)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-sm mb-1">Ingredienti Nascosti</p>
                <p className="text-xs text-green-700 leading-relaxed">
                  Descrivi gli ingredienti non visibili (olio, condimenti) per un calcolo completo
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm mb-1">Ribilanciamento Auto</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Se superi le calorie, i pasti successivi vengono ribilanciati automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Process */}
        <div className="bg-gradient-to-r from-[var(--brand-primary-light)] to-teal-50 p-4 rounded-xl border-2 border-[var(--brand-primary)]/30">
          <p className="text-sm font-bold text-[var(--brand-primary-dark-text)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Processo Scientifico AI:
          </p>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>Calibrazione riferimento piatto (24-30cm)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>Misurazione dimensioni ogni ingrediente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>Calcolo peso tramite densità (USDA/CREA)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
              <span>Analisi nutrizionale completa (kcal, P, C, G)</span>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-400 italic">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}