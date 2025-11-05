import React from 'react';
import { Card } from "@/components/ui/card";

const MEAL_OPTIONS = [
  { id: 'breakfast', label: 'Colazione', icon: '🌅', description: 'Salto la colazione (digiuno mattutino)' },
  { id: 'lunch', label: 'Pranzo', icon: '☀️', description: 'Salto il pranzo (digiuno centrale)' },
  { id: 'dinner', label: 'Cena', icon: '🌙', description: 'Salto la cena (digiuno serale)' }
];

const STRUCTURE_OPTIONS = [
  { 
    id: '2_meals', 
    label: '2 Pasti Principali', 
    icon: '🍽️🍽️',
    description: 'Solo 2 pasti abbondanti al giorno',
    example: 'Es: Pranzo + Cena (16:8)'
  },
  { 
    id: '3_meals', 
    label: '3 Pasti Principali', 
    icon: '🍽️🍽️🍽️',
    description: '3 pasti moderati nella finestra alimentare',
    example: 'Es: Colazione + Pranzo + Cena'
  },
  { 
    id: '3_meals_snacks', 
    label: '3 Pasti + Spuntini', 
    icon: '🍽️🥗🍽️🥗🍽️',
    description: 'Pasti principali + 2 spuntini',
    example: 'Es: Colazione, Snack, Pranzo, Snack, Cena'
  }
];

export default function IntermittentFastingConfigStep({ data, onDataChange, nextStep }) {
  const [skipMeal, setSkipMeal] = React.useState(data.if_skip_meal || null);
  const [structure, setStructure] = React.useState(data.if_meal_structure || null);

  const handleSkipMealSelect = (meal) => {
    setSkipMeal(meal);
    onDataChange({ if_skip_meal: meal });
  };

  const handleStructureSelect = (struct) => {
    setStructure(struct);
    onDataChange({ if_meal_structure: struct });
    // Auto-advance dopo aver selezionato entrambe le opzioni
    if (skipMeal && struct) {
      setTimeout(() => nextStep(), 300);
    }
  };

  return (
    <div className="space-y-8">
      {/* Skip Meal Selection */}
      <div>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏰</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quale pasto vuoi saltare?</h2>
          <p className="text-gray-600">Scegli il pasto da eliminare nella tua finestra di digiuno</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {MEAL_OPTIONS.map((meal) => (
            <Card
              key={meal.id}
              className={`p-4 cursor-pointer border-2 transition-all hover:shadow-md ${
                skipMeal === meal.id
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
              onClick={() => handleSkipMealSelect(meal.id)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{meal.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{meal.label}</h3>
                <p className="text-xs text-gray-600">{meal.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Meal Structure Selection - Only show if skip meal is selected */}
      {skipMeal && (
        <div className="border-t pt-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quanti pasti al giorno preferisci?</h3>
            <p className="text-gray-600">Scegli la struttura dei tuoi pasti</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {STRUCTURE_OPTIONS.map((opt) => (
              <Card
                key={opt.id}
                className={`p-5 cursor-pointer border-2 transition-all hover:shadow-md ${
                  structure === opt.id
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
                onClick={() => handleStructureSelect(opt.id)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">{opt.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{opt.label}</h4>
                  <p className="text-xs text-gray-600 mb-2">{opt.description}</p>
                  <p className="text-xs text-gray-500 italic">{opt.example}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!skipMeal && (
        <p className="text-center text-sm text-gray-500 mt-4">
          ⬆️ Seleziona prima quale pasto saltare
        </p>
      )}
    </div>
  );
}