import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pizza, Cake, IceCream, Check, AlertCircle, Info } from 'lucide-react';

const DAYS = [
  { id: 'monday', label: 'Lunedì', short: 'Lun' },
  { id: 'tuesday', label: 'Martedì', short: 'Mar' },
  { id: 'wednesday', label: 'Mercoledì', short: 'Mer' },
  { id: 'thursday', label: 'Giovedì', short: 'Gio' },
  { id: 'friday', label: 'Venerdì', short: 'Ven' },
  { id: 'saturday', label: 'Sabato', short: 'Sab' },
  { id: 'sunday', label: 'Domenica', short: 'Dom' }
];

const MEAL_TYPES = [
  { id: 'lunch', label: 'Pranzo', icon: '🍝' },
  { id: 'dinner', label: 'Cena', icon: '🍖' }
];

export default function CheatMealStep({ weightLossSpeed, onComplete, onSkip }) {
  const [selectedCheatMeals, setSelectedCheatMeals] = useState([]);
  
  // Determina quanti cheat meal sono consigliati
  const getRecommendedCheatMeals = () => {
    if (weightLossSpeed === 'very_fast') return 1;
    if (weightLossSpeed === 'moderate') return 1;
    if (weightLossSpeed === 'slow') return 2;
    return 1; // Default
  };

  const recommendedCount = getRecommendedCheatMeals();
  const maxCheatMeals = weightLossSpeed === 'slow' ? 2 : 1;

  const toggleCheatMeal = (day, mealType) => {
    const cheatMealKey = `${day}_${mealType}`;
    
    if (selectedCheatMeals.includes(cheatMealKey)) {
      setSelectedCheatMeals(selectedCheatMeals.filter(cm => cm !== cheatMealKey));
    } else {
      if (selectedCheatMeals.length < maxCheatMeals) {
        setSelectedCheatMeals([...selectedCheatMeals, cheatMealKey]);
      }
    }
  };

  const isSelected = (day, mealType) => {
    return selectedCheatMeals.includes(`${day}_${mealType}`);
  };

  const handleContinue = () => {
    const cheatMealConfig = selectedCheatMeals.map(cm => {
      const [day, mealType] = cm.split('_');
      return { day, meal_type: mealType };
    });
    
    onComplete(cheatMealConfig);
  };

  const getSpeedLabel = () => {
    if (weightLossSpeed === 'very_fast') return 'Molto Veloce';
    if (weightLossSpeed === 'moderate') return 'Moderata';
    if (weightLossSpeed === 'slow') return 'Graduale';
    return 'Personalizzata';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Pizza className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pianifica i tuoi Cheat Meal
        </h2>
        <p className="text-gray-600">
          Equilibrio è la chiave! Scegli quando goderti i tuoi pasti preferiti.
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-blue-900 font-semibold">
                Basato sul tuo ritmo: <span className="underline">{getSpeedLabel()}</span>
              </p>
              <p className="text-sm text-blue-800">
                {weightLossSpeed === 'very_fast' ? (
                  <>✅ <strong>1 cheat meal</strong> consigliato per mantenere deficit calorico elevato</>
                ) : weightLossSpeed === 'moderate' ? (
                  <>✅ <strong>1 cheat meal</strong> consigliato per un buon equilibrio</>
                ) : (
                  <>✅ <strong>Fino a 2 cheat meal</strong> per un approccio sostenibile</>
                )}
              </p>
              <p className="text-xs text-blue-700">
                💡 I cheat meal sono calcolati nel tuo piano, non rovinano i progressi!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selezione Giorni e Pasti */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Scegli quando (max {maxCheatMeals})
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Selezionati:</span>
            <span className="font-bold text-[var(--brand-primary)]">
              {selectedCheatMeals.length}/{maxCheatMeals}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS.map((day) => (
            <Card key={day.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="min-w-[80px]">
                    <p className="font-semibold text-gray-900">{day.label}</p>
                  </div>
                  
                  <div className="flex gap-2 flex-1">
                    {MEAL_TYPES.map((meal) => {
                      const selected = isSelected(day.id, meal.id);
                      const disabled = !selected && selectedCheatMeals.length >= maxCheatMeals;
                      
                      return (
                        <button
                          key={meal.id}
                          onClick={() => toggleCheatMeal(day.id, meal.id)}
                          disabled={disabled}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                            selected
                              ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-orange-500 text-white shadow-lg'
                              : disabled
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700'
                          }`}
                        >
                          <span className="text-xl">{meal.icon}</span>
                          <span className="font-medium text-sm">{meal.label}</span>
                          {selected && <Check className="w-4 h-4" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Warning se non ha selezionato il numero consigliato */}
      {selectedCheatMeals.length > 0 && selectedCheatMeals.length < recommendedCount && (
        <Card className="bg-amber-50 border-2 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 font-semibold mb-1">
                  Hai selezionato meno cheat meal del consigliato
                </p>
                <p className="text-xs text-amber-800">
                  Un approccio sostenibile include {recommendedCount} cheat meal. Puoi aggiungerne {recommendedCount - selectedCheatMeals.length} in più!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-14 text-base"
        >
          Nessun Cheat Meal
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedCheatMeals.length === 0}
          className="flex-1 h-14 text-base bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 disabled:opacity-50"
        >
          {selectedCheatMeals.length === 0 ? 'Seleziona almeno 1' : `Continua con ${selectedCheatMeals.length}`}
        </Button>
      </div>
    </div>
  );
}