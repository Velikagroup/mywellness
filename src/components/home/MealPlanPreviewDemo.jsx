import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, ArrowRight, Camera, CheckCircle2, ImageIcon } from "lucide-react";

/**
 * Componente DEMO per Homepage - Piani Nutrizionali
 * Replica esattamente l'UI di NutritionOverview ma con dati placeholder fissi
 * OTTIMIZZATO PER MOBILE
 */
export default function MealPlanPreviewDemo() {
  // Dati placeholder fissi
  const demoMeals = [
    {
      id: '1',
      meal_type: 'breakfast',
      name: 'Porridge Proteico con Frutti di Bosco',
      total_calories: 420,
      image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop'
    },
    {
      id: '2',
      meal_type: 'lunch',
      name: 'Salmone alla Griglia con Quinoa',
      total_calories: 580,
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      meal_type: 'dinner',
      name: 'Pollo con Patate Dolci',
      total_calories: 520,
      image_url: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop'
    }
  ];

  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: 'Colazione',
      lunch: 'Pranzo',
      dinner: 'Cena',
      snack1: 'Spuntino',
      snack2: 'Spuntino Serale'
    };
    return labels[type] || type;
  };

  const dailyTotals = {
    calories: 1520,
    protein: 125.5,
    carbs: 145.2,
    fat: 42.8
  };

  return (
    <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl w-full">
      <CardHeader className="pb-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <Utensils className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm md:text-lg font-bold text-gray-900 truncate">Protocollo Nutrizionale</CardTitle>
              <p className="text-xs text-gray-500 truncate">
                Panoramica di oggi
              </p>
            </div>
          </div>
          <Button 
            disabled 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 cursor-not-allowed opacity-70 flex-shrink-0 w-8 h-8"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Daily Totals - Responsive */}
        <div className="bg-gradient-to-r from-[var(--brand-primary-light)] to-blue-50 rounded-xl p-2.5 border-2 border-[var(--brand-primary)]/30">
          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center">
              <p className="text-[10px] text-gray-600 font-medium mb-0.5 truncate">Kcal</p>
              <p className="text-base md:text-lg font-bold text-[var(--brand-primary)] truncate">{dailyTotals.calories}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-600 font-medium mb-0.5 truncate">Prot.</p>
              <p className="text-base md:text-lg font-bold text-red-600 truncate">{dailyTotals.protein}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-600 font-medium mb-0.5 truncate">Carb.</p>
              <p className="text-base md:text-lg font-bold text-blue-600 truncate">{dailyTotals.carbs}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-600 font-medium mb-0.5 truncate">Grassi</p>
              <p className="text-base md:text-lg font-bold text-yellow-600 truncate">{dailyTotals.fat}g</p>
            </div>
          </div>
        </div>

        {/* Meals List */}
        <div className="space-y-3">
          {demoMeals.map((meal) => (
            <div 
              key={meal.id} 
              className="w-full bg-gray-50/80 rounded-lg p-2.5 border border-gray-200/60 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <button 
                  disabled
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-not-allowed"
                >
                  <div className="w-12 h-10 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden relative flex-shrink-0">
                    {meal.image_url ? (
                      <img 
                        src={meal.image_url} 
                        alt={meal.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-400 animate-pulse"/>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-semibold text-gray-800 text-xs truncate">{getMealTypeLabel(meal.meal_type)}</p>
                    <p className="text-[11px] text-gray-600 truncate">{meal.name}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-xs">
                      {meal.total_calories}
                    </p>
                    <p className="text-[10px] text-gray-500">kcal</p>
                  </div>
                  <button 
                    disabled
                    className="text-xs text-[var(--brand-primary)] flex items-center gap-1 flex-shrink-0 cursor-not-allowed opacity-80 hover:opacity-100 transition-opacity p-1"
                    title="Analizza pasto con foto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-gray-400 italic">
            Anteprima interfaccia • Funzionalità disponibili dopo il signup
          </p>
        </div>
      </CardContent>
    </Card>
  );
}