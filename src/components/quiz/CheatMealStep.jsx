import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Pizza, IceCream, Cake, Cookie, ArrowRight, Info } from 'lucide-react';

const CHEAT_MEAL_OPTIONS = [
  { 
    count: 0, 
    label: 'Nessun Cheat Meal', 
    subtitle: 'Piano rigido al 100%',
    icon: '🚫',
    recommended: false,
    description: 'Massima velocità, ma richiede disciplina ferrea'
  },
  { 
    count: 1, 
    label: '1 Cheat Meal', 
    subtitle: 'Equilibrio perfetto',
    icon: '🍕',
    recommended: true,
    description: 'Ideale per sostenibilità a lungo termine'
  },
  { 
    count: 2, 
    label: '2 Cheat Meal', 
    subtitle: 'Massima flessibilità',
    icon: '🍰',
    recommended: false,
    description: 'Ottimo se punti a obiettivi graduali'
  }
];

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lunedì' },
  { id: 'tuesday', label: 'Martedì' },
  { id: 'wednesday', label: 'Mercoledì' },
  { id: 'thursday', label: 'Giovedì' },
  { id: 'friday', label: 'Venerdì' },
  { id: 'saturday', label: 'Sabato' },
  { id: 'sunday', label: 'Domenica' }
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Colazione', icon: '☕' },
  { id: 'lunch', label: 'Pranzo', icon: '🍽️' },
  { id: 'dinner', label: 'Cena', icon: '🌙' },
  { id: 'snack1', label: 'Spuntino 1', icon: '🍎' },
  { id: 'snack2', label: 'Spuntino 2', icon: '🥤' }
];

export default function CheatMealStep({ data, onDataChange, nextStep }) {
  const [cheatCount, setCheatCount] = useState(data.cheat_meal_count ?? 1);
  const [selectedSlots, setSelectedSlots] = useState(data.cheat_meal_slots || []);

  useEffect(() => {
    onDataChange({ 
      cheat_meal_count: cheatCount,
      cheat_meal_slots: selectedSlots
    });
  }, [cheatCount, selectedSlots, onDataChange]);

  const handleSelectCount = (count) => {
    setCheatCount(count);
    // Reset slots when changing count
    if (count === 0) {
      setSelectedSlots([]);
    } else if (selectedSlots.length > count) {
      setSelectedSlots(selectedSlots.slice(0, count));
    }
  };

  const handleToggleSlot = (day, mealType) => {
    const slotKey = `${day}_${mealType}`;
    const exists = selectedSlots.some(s => s === slotKey);
    
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
    } else {
      if (selectedSlots.length < cheatCount) {
        setSelectedSlots([...selectedSlots, slotKey]);
      }
    }
  };

  const isSlotSelected = (day, mealType) => {
    return selectedSlots.some(s => s === `${day}_${mealType}`);
  };

  const canProceed = cheatCount === 0 || selectedSlots.length === cheatCount;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Pizza className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cheat Meal Settimanali</h2>
        <p className="text-gray-600">Pianifica i tuoi pasti liberi per rendere il percorso sostenibile</p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-semibold mb-1">Cos'è un Cheat Meal?</p>
            <p className="text-xs text-blue-800">
              Un pasto dove puoi sgarrare controllato: pizza, hamburger, sushi, dolce... L'AI terrà conto di questo nel calcolo calorico settimanale per mantenerti in linea con gli obiettivi.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Quanti cheat meal vuoi?</h3>
        <div className="grid gap-3">
          {CHEAT_MEAL_OPTIONS.map((option) => (
            <motion.button
              key={option.count}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectCount(option.count)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                cheatCount === option.count
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {option.recommended && (
                <div className="absolute -top-2 right-4 bg-[var(--brand-primary)] text-white text-xs px-3 py-1 rounded-full font-bold">
                  ⭐ Consigliato
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="text-4xl">{option.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {cheatCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Quando vuoi i tuoi cheat meal?
            </h3>
            <span className="text-sm text-gray-600">
              {selectedSlots.length}/{cheatCount} selezionati
            </span>
          </div>

          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-800">
              💡 Tip: Molti scelgono weekend (sabato cena, domenica pranzo) o giorni sociali
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50/50">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.id} className="bg-white rounded-lg p-3 border">
                <p className="font-semibold text-gray-800 mb-2 text-sm">{day.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => handleToggleSlot(day.id, meal.id)}
                      disabled={selectedSlots.length >= cheatCount && !isSlotSelected(day.id, meal.id)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        isSlotSelected(day.id, meal.id)
                          ? 'bg-orange-500 text-white border-2 border-orange-600'
                          : selectedSlots.length >= cheatCount
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="text-base mb-1">{meal.icon}</div>
                      {meal.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!canProceed && cheatCount > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Seleziona esattamente {cheatCount} {cheatCount === 1 ? 'pasto' : 'pasti'} per continuare
          </p>
        </div>
      )}

      <Button
        onClick={nextStep}
        disabled={!canProceed}
        className="w-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white py-6 text-base font-semibold rounded-xl disabled:opacity-50"
      >
        Continua
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}