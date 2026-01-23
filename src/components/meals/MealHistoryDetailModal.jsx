import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import IngredientSelector from './IngredientSelector';
import IngredientQuantityModal from './IngredientQuantityModal';

export default function MealHistoryDetailModal({ mealLog, onClose, onReload }) {
  const [ingredients, setIngredients] = useState([]);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [totals, setTotals] = useState({
    calories: mealLog.actual_calories || 0,
    protein: mealLog.actual_protein || 0,
    carbs: mealLog.actual_carbs || 0,
    fat: mealLog.actual_fat || 0
  });

  React.useEffect(() => {
    // Carica ingredienti dal detected_items se disponibili
    if (mealLog.detected_items && Array.isArray(mealLog.detected_items)) {
      const items = mealLog.detected_items.map((item, idx) => ({
        id: idx,
        name: typeof item === 'string' ? item : item.name || '',
        grams: parseFloat(item.grams) || 0,
        calories: parseFloat(item.calories) || 0,
        protein: parseFloat(item.protein) || 0,
        carbs: parseFloat(item.carbs) || 0,
        fat: parseFloat(item.fat) || 0
      }));
      setIngredients(items);
    }
  }, [mealLog]);

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient);
    setShowIngredientSelector(false);
  };

  const handleAddIngredientQuantity = (ingredientData) => {
    const updatedIngredients = [...ingredients, ingredientData];
    setIngredients(updatedIngredients);

    // Calcola nuovi totali
    const newTotals = {
      calories: updatedIngredients.reduce((sum, ing) => sum + ing.calories, mealLog.actual_calories || 0),
      protein: updatedIngredients.reduce((sum, ing) => sum + ing.protein, mealLog.actual_protein || 0),
      carbs: updatedIngredients.reduce((sum, ing) => sum + ing.carbs, mealLog.actual_carbs || 0),
      fat: updatedIngredients.reduce((sum, ing) => sum + ing.fat, mealLog.actual_fat || 0)
    };
    setTotals(newTotals);

    setSelectedIngredient(null);
  };

  const handleRemoveIngredient = (id) => {
    const updatedIngredients = ingredients.filter(ing => ing.id !== id);
    setIngredients(updatedIngredients);

    // Ricalcola totali
    const newTotals = {
      calories: updatedIngredients.reduce((sum, ing) => sum + ing.calories, mealLog.actual_calories || 0),
      protein: updatedIngredients.reduce((sum, ing) => sum + ing.protein, mealLog.actual_protein || 0),
      carbs: updatedIngredients.reduce((sum, ing) => sum + ing.carbs, mealLog.actual_carbs || 0),
      fat: updatedIngredients.reduce((sum, ing) => sum + ing.fat, mealLog.actual_fat || 0)
    };
    setTotals(newTotals);
  };

  return (
    <Dialog open={!!mealLog} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {mealLog.meal_type === 'breakfast' ? '🥐' : 
               mealLog.meal_type === 'snack1' ? '🥜' :
               mealLog.meal_type === 'lunch' ? '🍽️' :
               mealLog.meal_type === 'snack2' ? '🍌' :
               '🍴'} {new Date(mealLog.created_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Foto */}
          {mealLog.photo_url && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={mealLog.photo_url}
                alt="Pasto"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Informazioni Nutrizionali */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-gray-600">Calorías</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-4">{Math.round(totals.calories)}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Proteína</p>
                <p className="text-lg font-bold text-red-600">{totals.protein.toFixed(1)}g</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Carboidrati</p>
                <p className="text-lg font-bold text-amber-600">{totals.carbs.toFixed(1)}g</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Grassi</p>
                <p className="text-lg font-bold text-blue-600">{totals.fat.toFixed(1)}g</p>
              </div>
            </div>
          </div>

          {/* Ingredienti */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">Ingredienti ({ingredients.length})</h3>

            <div className="space-y-3">
              {ingredients.length > 0 ? (
                ingredients.map((ing) => (
                  <div key={ing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ing.name}</p>
                      <p className="text-xs text-gray-500">
                        {ing.grams}g · {ing.calories.toFixed(0)} cal
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Nessun ingrediente aggiunto</p>
              )}
            </div>

            <Button
              onClick={() => setShowIngredientSelector(true)}
              className="w-full mt-4 h-12 bg-black hover:bg-gray-900 text-white font-semibold rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi ingrediente
            </Button>
          </div>

          {/* Ingredient Selector Modal */}
          <IngredientSelector
            isOpen={showIngredientSelector}
            onClose={() => setShowIngredientSelector(false)}
            onSelectIngredient={handleSelectIngredient}
          />

          {/* Ingredient Quantity Modal */}
          <IngredientQuantityModal
            isOpen={!!selectedIngredient}
            ingredient={selectedIngredient}
            onClose={() => setSelectedIngredient(null)}
            onConfirm={handleAddIngredientQuantity}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
          >
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}