import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, AlertCircle, Sparkles, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Componente DEMO per Homepage - Analisi Foto AI
 * Mostra un esempio di analisi completata con confronto pianificato vs effettivo
 */
export default function PhotoAnalyzerPreviewDemo() {
  const { t } = useLanguage();
  // Dati demo del pasto pianificato
  const plannedMeal = {
    name: "Bistecca con Verdure",
    calories: 520,
    protein: 45,
    carbs: 28,
    fat: 22
  };

  // Dati demo del pasto effettivo analizzato dall'AI
  const actualMeal = {
    calories: 680,
    protein: 52,
    carbs: 35,
    fat: 32
  };

  const delta = {
    calories: actualMeal.calories - plannedMeal.calories,
    protein: actualMeal.protein - plannedMeal.protein,
    carbs: actualMeal.carbs - plannedMeal.carbs,
    fat: actualMeal.fat - plannedMeal.fat
  };

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl overflow-hidden">
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
              Confronto automatico con il piano nutrizionale
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Foto del pasto */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200/50 shadow-lg">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/d0350375b_Meal.jpg"
            alt="Pasto Analizzato"
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Analizzato
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200/50">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--brand-primary)]" />
            Confronto Nutrizionale
          </h4>
          
          <div className="space-y-3">
            {/* Calorie */}
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Calorie</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{plannedMeal.calories} kcal pianificate</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-gray-900">{actualMeal.calories} kcal</span>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  delta.calories > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {delta.calories > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {delta.calories > 0 ? '+' : ''}{delta.calories}
                </div>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Proteine */}
              <div className="bg-white/80 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-gray-500 mb-1">Proteine</p>
                <p className="text-lg font-bold text-red-600">{actualMeal.protein}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.protein}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.protein > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.protein > 0 ? '+' : ''}{delta.protein}g
                </div>
              </div>

              {/* Carboidrati */}
              <div className="bg-white/80 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-500 mb-1">Carboidrati</p>
                <p className="text-lg font-bold text-blue-600">{actualMeal.carbs}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.carbs}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.carbs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.carbs > 0 ? '+' : ''}{delta.carbs}g
                </div>
              </div>

              {/* Grassi */}
              <div className="bg-white/80 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-gray-500 mb-1">Grassi</p>
                <p className="text-lg font-bold text-yellow-600">{actualMeal.fat}g</p>
                <p className="text-xs text-gray-400 mt-1">vs {plannedMeal.fat}g</p>
                <div className={`mt-1 text-xs font-semibold ${delta.fat > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {delta.fat > 0 ? '+' : ''}{delta.fat}g
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Box */}
        {delta.calories > 50 && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900 text-sm mb-1">
                  Hai superato il target di +{delta.calories} kcal
                </p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  L'AI può ribilanciare automaticamente i pasti rimanenti di oggi per compensare
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rebalance Button */}
        <Button
          disabled
          className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 text-white font-bold text-base py-5 rounded-xl shadow-lg cursor-not-allowed opacity-80"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Riequilibra Pasti Rimanenti
        </Button>

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