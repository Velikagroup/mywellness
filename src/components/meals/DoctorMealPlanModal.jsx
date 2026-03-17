import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Plus, Trash2, ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';

const DAYS = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Colazione' },
  { key: 'snack1', label: 'Spuntino mattina' },
  { key: 'lunch', label: 'Pranzo' },
  { key: 'snack2', label: 'Merenda' },
  { key: 'dinner', label: 'Cena' },
  { key: 'snack3', label: 'Spuntino sera' },
];

const UNITS = ['g', 'ml', 'pz', 'cucchiai', 'cucchiaini', 'tazze', 'fette', 'porzioni'];

const emptyIngredient = () => ({ name: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fat: '' });

const emptyMeal = (meal_type = 'breakfast') => ({
  meal_type,
  name: '',
  ingredients: [emptyIngredient()],
  instructions: [],
});

const emptyDay = () =>
  MEAL_TYPES.slice(0, 3).map(mt => emptyMeal(mt.key)); // default: colazione, pranzo, cena

export default function DoctorMealPlanModal({ isOpen, onClose, user, existingMealPlans, onPlanSaved }) {
  // plan = { monday: [meal, meal, ...], tuesday: [...], ... }
  const [plan, setPlan] = useState(() => {
    const initial = {};
    DAYS.forEach(d => { initial[d.key] = emptyDay(); });
    return initial;
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const currentDay = DAYS[currentDayIndex];
  const dayMeals = plan[currentDay.key] || [];

  // ── helpers ──────────────────────────────────────────────────────────────

  const updateMeal = (mealIndex, field, value) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = { ...meals[mealIndex], [field]: value };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const addMeal = () => {
    const usedTypes = dayMeals.map(m => m.meal_type);
    const nextType = MEAL_TYPES.find(mt => !usedTypes.includes(mt.key))?.key || 'snack3';
    setPlan(prev => ({
      ...prev,
      [currentDay.key]: [...prev[currentDay.key], emptyMeal(nextType)],
    }));
  };

  const removeMeal = (mealIndex) => {
    setPlan(prev => ({
      ...prev,
      [currentDay.key]: prev[currentDay.key].filter((_, i) => i !== mealIndex),
    }));
  };

  const addIngredient = (mealIndex) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = {
        ...meals[mealIndex],
        ingredients: [...meals[mealIndex].ingredients, emptyIngredient()],
      };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const removeIngredient = (mealIndex, ingIndex) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      meals[mealIndex] = {
        ...meals[mealIndex],
        ingredients: meals[mealIndex].ingredients.filter((_, i) => i !== ingIndex),
      };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  const updateIngredient = (mealIndex, ingIndex, field, value) => {
    setPlan(prev => {
      const meals = [...prev[currentDay.key]];
      const ings = [...meals[mealIndex].ingredients];
      ings[ingIndex] = { ...ings[ingIndex], [field]: value };
      meals[mealIndex] = { ...meals[mealIndex], ingredients: ings };
      return { ...prev, [currentDay.key]: meals };
    });
  };

  // Copy current day meals to all other days
  const copyToAllDays = () => {
    const template = plan[currentDay.key];
    const updated = {};
    DAYS.forEach(d => {
      updated[d.key] = template.map(meal => ({
        ...meal,
        ingredients: meal.ingredients.map(i => ({ ...i })),
      }));
    });
    setPlan(updated);
    alert('✅ Piano copiato su tutti i giorni!');
  };

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      // Delete existing plans
      for (const existing of existingMealPlans) {
        await base44.entities.MealPlan.delete(existing.id);
      }

      // Create new plans from doctor input
      for (const day of DAYS) {
        const meals = plan[day.key] || [];
        for (const meal of meals) {
          if (!meal.name.trim()) continue; // skip empty meals

          const validIngredients = meal.ingredients
            .filter(ing => ing.name.trim() && ing.quantity)
            .map(ing => ({
              name: ing.name.trim(),
              quantity: parseFloat(ing.quantity) || 0,
              unit: ing.unit || 'g',
              calories: parseFloat(ing.calories) || 0,
              protein: parseFloat(ing.protein) || 0,
              carbs: parseFloat(ing.carbs) || 0,
              fat: parseFloat(ing.fat) || 0,
            }));

          const total_calories = validIngredients.reduce((s, i) => s + i.calories, 0);
          const total_protein = validIngredients.reduce((s, i) => s + i.protein, 0);
          const total_carbs = validIngredients.reduce((s, i) => s + i.carbs, 0);
          const total_fat = validIngredients.reduce((s, i) => s + i.fat, 0);

          await base44.entities.MealPlan.create({
            user_id: user.id,
            day_of_week: day.key,
            meal_type: meal.meal_type,
            name: meal.name.trim(),
            ingredients: validIngredients,
            instructions: meal.instructions || [],
            total_calories: Math.round(total_calories),
            total_protein: Math.round(total_protein * 10) / 10,
            total_carbs: Math.round(total_carbs * 10) / 10,
            total_fat: Math.round(total_fat * 10) / 10,
            prep_time: 0,
            difficulty: 'easy',
          });
        }
      }

      onPlanSaved();
      onClose();
    } catch (err) {
      setError(`Errore durante il salvataggio: ${err.message}`);
    } finally {
      setIsSaving(false);
      setShowConfirm(false);
    }
  };

  const getMealTypeLabel = (key) => MEAL_TYPES.find(m => m.key === key)?.label || key;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">Piano del Medico</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">Inserisci il piano alimentare prescritto dal tuo medico/nutrizionista</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Day tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {DAYS.map((day, idx) => {
              const hasMeals = plan[day.key]?.some(m => m.name.trim());
              return (
                <button
                  key={day.key}
                  onClick={() => setCurrentDayIndex(idx)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    idx === currentDayIndex
                      ? 'bg-[#26847F] text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label.substring(0, 3)}
                  {hasMeals && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Day navigation hint */}
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">{currentDay.label}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-blue-600 border-blue-200"
                onClick={copyToAllDays}
              >
                Copia su tutti i giorni
              </Button>
            </div>
          </div>

          {/* Meals for the day */}
          <div className="space-y-4">
            {dayMeals.map((meal, mealIndex) => (
              <div key={mealIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                {/* Meal header */}
                <div className="flex items-center gap-2">
                  <Select
                    value={meal.meal_type}
                    onValueChange={val => updateMeal(mealIndex, 'meal_type', val)}
                  >
                    <SelectTrigger className="w-44 h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(mt => (
                        <SelectItem key={mt.key} value={mt.key} className="text-xs">
                          {mt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Nome del piatto (es. Pasta al pomodoro)"
                    value={meal.name}
                    onChange={e => updateMeal(mealIndex, 'name', e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  <button
                    onClick={() => removeMeal(mealIndex)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Ingredients */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Ingredienti</Label>
                  {meal.ingredients.map((ing, ingIndex) => (
                    <div key={ingIndex} className="flex items-center gap-1.5 flex-wrap">
                      <Input
                        placeholder="Ingrediente"
                        value={ing.name}
                        onChange={e => updateIngredient(mealIndex, ingIndex, 'name', e.target.value)}
                        className="h-8 text-xs flex-1 min-w-[120px]"
                      />
                      <Input
                        placeholder="Qtà"
                        type="number"
                        value={ing.quantity}
                        onChange={e => updateIngredient(mealIndex, ingIndex, 'quantity', e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                      <Select
                        value={ing.unit}
                        onValueChange={val => updateIngredient(mealIndex, ingIndex, 'unit', val)}
                      >
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => (
                            <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Optional macros */}
                      <Input
                        placeholder="kcal"
                        type="number"
                        value={ing.calories}
                        onChange={e => updateIngredient(mealIndex, ingIndex, 'calories', e.target.value)}
                        className="h-8 text-xs w-16"
                      />
                      <button
                        onClick={() => removeIngredient(mealIndex, ingIndex)}
                        className="w-7 h-7 flex items-center justify-center rounded text-red-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addIngredient(mealIndex)}
                    className="flex items-center gap-1 text-xs text-[#26847F] font-semibold hover:text-[#1f6b66] mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi ingrediente
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addMeal}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#26847F] hover:text-[#26847F] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Aggiungi pasto
            </button>
          </div>

          {/* Day nav */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
              disabled={currentDayIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDayIndex(Math.min(DAYS.length - 1, currentDayIndex + 1))}
              disabled={currentDayIndex === DAYS.length - 1}
            >
              Successivo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Confirm / Save */}
          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              className="w-full bg-[#26847F] hover:bg-[#1f6b66] text-white py-5 font-semibold rounded-xl"
            >
              <Stethoscope className="w-5 h-5 mr-2" />
              Salva Piano Completo
            </Button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ Questo sostituirà il piano alimentare attuale per tutta la settimana. Confermi?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSaving ? 'Salvataggio...' : 'Sì, salva'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}