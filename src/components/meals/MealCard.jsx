import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Flame, RefreshCw, Loader2 } from "lucide-react";

export default function MealCard({ meal, onClick, showRegenerateButton = false, onRegenerate = null, isRegenerating = false }) {
  const getMealTypeLabel = (type) => {
    const labels = {
      breakfast: '🌅 Colazione',
      lunch: '🍽️ Pranzo',
      dinner: '🌙 Cena',
      snack1: '🍎 Spuntino',
      snack2: '🥤 Snack Serale'
    };
    return labels[type] || type;
  };

  const handleRegenerateClick = (e) => {
    e.stopPropagation();
    if (onRegenerate && typeof onRegenerate === 'function') {
      onRegenerate(meal);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200/50 bg-white/80 backdrop-blur-sm group">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {meal.image_url ? (
          <img 
            src={meal.image_url} 
            alt={meal.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ChefHat className="w-16 h-16 text-gray-400 animate-pulse" />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 shadow-md">
            {getMealTypeLabel(meal.meal_type)}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 px-3 py-1 bg-[#26847F] text-white rounded-full shadow-lg">
            <Flame className="w-4 h-4" />
            <span className="font-bold text-sm">{meal.total_calories}</span>
            <span className="text-xs">kcal</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/95 rounded-full shadow-md text-xs">
            <span className="font-semibold text-red-600">{Math.round(meal.total_protein || 0)}P</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-blue-600">{Math.round(meal.total_carbs || 0)}C</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-yellow-600">{Math.round(meal.total_fat || 0)}G</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="cursor-pointer" onClick={onClick}>
          <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-left group-hover:text-[#26847F] transition-colors">
            {meal.name}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{meal.prep_time} min</span>
            </div>
            <div className="flex items-center gap-1 capitalize">
              <ChefHat className="w-4 h-4" />
              <span>{meal.difficulty === 'easy' ? 'Facile' : meal.difficulty === 'medium' ? 'Media' : 'Difficile'}</span>
            </div>
          </div>
        </div>

        {showRegenerateButton && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={handleRegenerateClick}
              disabled={isRegenerating}
              variant="outline"
              size="sm"
              className="w-full border-[#26847F] text-[#26847F] hover:bg-[#e9f6f5] transition-all"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rigenerazione...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rigenera Pasto
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}