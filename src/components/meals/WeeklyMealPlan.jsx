import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Utensils, Lock } from "lucide-react";
import UpgradeModal from "./UpgradeModal";

export default function WeeklyMealPlan({ mealPlans, onMealSelect, onPhotoAnalyze, userPlan }) {
  const [selectedDay, setSelectedDay] = useState('monday');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const daysOfWeek = [
    { key: 'monday', label: 'Lunedì', short: 'Lun' },
    { key: 'tuesday', label: 'Martedì', short: 'Mar' },
    { key: 'wednesday', label: 'Mercoledì', short: 'Mer' },
    { key: 'thursday', label: 'Giovedì', short: 'Gio' },
    { key: 'friday', label: 'Venerdì', short: 'Ven' },
    { key: 'saturday', label: 'Sabato', short: 'Sab' },
    { key: 'sunday', label: 'Domenica', short: 'Dom' }
  ];

  const isLockedDay = (dayKey) => {
    if (!userPlan || userPlan === 'base') {
      return !['monday', 'tuesday', 'wednesday'].includes(dayKey);
    }
    return false;
  };

  const handleDayClick = (dayKey) => {
    const isLocked = isLockedDay(dayKey);
    if (isLocked) {
      setShowUpgradeModal(true);
    } else {
      setSelectedDay(dayKey);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Day Selector */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-200/50 shadow-lg">
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => {
              const isLocked = isLockedDay(day.key);
              const isSelected = selectedDay === day.key;
              
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => handleDayClick(day.key)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer hover:scale-105 ${
                    isSelected && !isLocked
                      ? 'bg-gradient-to-br from-[var(--brand-primary)] to-teal-600 text-white shadow-lg scale-105'
                      : isLocked
                      ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {isLocked && (
                    <Lock className="w-4 h-4 absolute top-1 right-1 text-gray-400" />
                  )}
                  <span className="text-xs font-semibold mb-1">
                    {day.short}
                  </span>
                  <span className="text-[10px] opacity-75">
                    {day.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display meals for the currently selected day only */}
        {(() => {
          const day = daysOfWeek.find(d => d.key === selectedDay);
          if (!day) return null;

          const mealsForSelectedDay = mealPlans?.[selectedDay] || [];
          const dayMeals = mealsForSelectedDay.sort((a, b) => {
            const order = { breakfast: 1, snack1: 2, lunch: 3, snack2: 4, dinner: 5 };
            return (order[a.meal_type] || 999) - (order[b.meal_type] || 999);
          });

          const getMealTypeLabel = (type) => {
            const labels = {
              breakfast: 'Colazione',
              lunch: 'Pranzo',
              dinner: 'Cena',
              snack1: 'Spuntino',
              snack2: 'Snack Serale'
            };
            return labels[type] || type;
          };
          
          return (
            <Card key={day.key} className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[var(--brand-primary-light)] to-blue-50 border-b border-gray-200/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
                    <CardTitle className="text-xl font-bold text-gray-900">{day.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {dayMeals.length > 0 ? (
                  <div className="space-y-4">
                    {dayMeals.map((meal) => (
                      <div 
                        key={meal.id} 
                        className="w-full bg-gray-50/80 rounded-lg p-4 border border-gray-200/60 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <button 
                            onClick={() => onMealSelect(meal)} 
                            className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden flex-shrink-0"
                          >
                            {meal.image_url ? (
                              <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover"/>
                            ) : (
                              <Utensils className="w-8 h-8 text-gray-400 animate-pulse"/>
                            )}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <button onClick={() => onMealSelect(meal)} className="w-full">
                              <p className="font-bold text-lg text-gray-800 mb-1 text-left">
                                {getMealTypeLabel(meal.meal_type)}
                              </p>
                              <p className="text-sm text-gray-600 truncate text-left">{meal.name}</p>
                            </button>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-2xl text-gray-800">{meal.total_calories}</p>
                              <p className="text-xs text-gray-500">kcal</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Nessun pasto pianificato</p>
                    <p className="text-sm text-gray-500 mt-1">Genera un piano per questo giorno</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {showUpgradeModal && (
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={userPlan || 'base'}
        />
      )}
    </>
  );
}