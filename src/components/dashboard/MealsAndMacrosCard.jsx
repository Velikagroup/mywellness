import React from 'react';
import { Beef, Wheat, Droplet, Camera, CheckCircle2, ImageIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';
import CameraCapture from './CameraCapture';

export default function MealsAndMacrosCard({ 
  todayMacros, 
  sortedMeals, 
  mealLogs, 
  savingMealId,
  onMealSelect, 
  onPhotoAnalyze,
  onCheckMeal,
  userPlan,
  getMealLog,
  getMealTypeLabel,
  t 
}) {
  const [showCamera, setShowCamera] = React.useState(false);
  const [currentMealForPhoto, setCurrentMealForPhoto] = React.useState(null);

  const handleCameraClick = (meal) => {
    setCurrentMealForPhoto(meal);
    setShowCamera(true);
  };

  const handlePhotoCapture = (file) => {
    if (file && currentMealForPhoto) {
      onPhotoAnalyze(currentMealForPhoto, file);
      setShowCamera(false);
      setCurrentMealForPhoto(null);
    }
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => {
            setShowCamera(false);
            setCurrentMealForPhoto(null);
          }}
          t={t}
        />
      )}
      <div className="flex flex-col bg-white/65 rounded-xl p-5 border border-gray-200/30 backdrop-blur-md shadow-xl">
      
      {/* Macronutrienti giornalieri */}
      <div className="flex justify-center gap-6 mb-4">
        {/* Proteine */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#ef4444"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (todayMacros.consumed.protein / Math.max(todayMacros.planned.protein, 1)))}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Beef className="w-4 h-4 text-red-600 mb-0.5" />
              <p className="text-xs font-bold text-red-700">{todayMacros.consumed.protein}g</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">Proteine</p>
        </div>

        {/* Carboidrati */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#f59e0b"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (todayMacros.consumed.carbs / Math.max(todayMacros.planned.carbs, 1)))}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Wheat className="w-4 h-4 text-amber-600 mb-0.5" />
              <p className="text-xs font-bold text-amber-700">{todayMacros.consumed.carbs}g</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">Carboidrati</p>
        </div>

        {/* Grassi */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#8b5cf6"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - (todayMacros.consumed.fat / Math.max(todayMacros.planned.fat, 1)))}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Droplet className="w-4 h-4 text-violet-600 mb-0.5" />
              <p className="text-xs font-bold text-violet-700">{todayMacros.consumed.fat}g</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">Grassi</p>
        </div>
      </div>

      {/* Pasti del giorno */}
      {sortedMeals.length > 0 && (
        <div className="space-y-3">
          {sortedMeals.map((meal) => {
            const mealLog = getMealLog(meal.id);
            const isLogged = !!mealLog;
            const displayCalories = isLogged ? mealLog.actual_calories : meal.total_calories;

            return (
              <div key={meal.id} className="w-full bg-gray-50/80 rounded-lg p-3 border border-gray-200/60 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => onMealSelect && onMealSelect(meal)} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden relative flex-shrink-0">
                      {meal.image_url ? (
                        <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse" />
                      )}
                      {isLogged && (
                        <div className="absolute top-0 right-0 bg-green-500 rounded-bl-lg p-0.5">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-800">{getMealTypeLabel(meal.meal_type)}</p>
                      <p className="text-sm text-gray-600 truncate">{meal.name}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className={`font-bold ${isLogged ? 'text-green-600' : 'text-gray-800'}`}>
                        {displayCalories}
                      </p>
                      <p className="text-xs text-gray-500">kcal</p>
                    </div>
                    {!isLogged && (
                      <>
                        <Checkbox
                          checked={false}
                          onCheckedChange={(checked) => onCheckMeal(meal, checked)}
                          disabled={savingMealId === meal.id}
                          className="w-5 h-5 border-2 border-[#26847F] data-[state=checked]:bg-[#26847F]"
                          title={t('nutrition.markAsConsumed')}
                        />
                        {hasFeatureAccess(userPlan, 'meal_photo_analysis') && onPhotoAnalyze && (
                          <Button
                            onClick={() => handleCameraClick(meal)}
                            variant="ghost"
                            size="icon"
                            className="text-[#26847F] hover:bg-[#e9f6f5] flex-shrink-0"
                            title={t('nutrition.analyzeWithPhoto')}
                          >
                            <Camera className="w-5 h-5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}