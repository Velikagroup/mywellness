import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Trash2, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MealHistoryDetailModal({ mealLog, onClose, onReload }) {
  const [ingredients, setIngredients] = useState([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    grams: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
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

  const handleAddIngredient = async () => {
    if (!newIngredient.name || !newIngredient.calories) {
      alert('Inserisci nome e calorie');
      return;
    }

    const ingredient = {
      id: Date.now(),
      name: newIngredient.name,
      grams: parseFloat(newIngredient.grams) || 0,
      calories: parseFloat(newIngredient.calories) || 0,
      protein: parseFloat(newIngredient.protein) || 0,
      carbs: parseFloat(newIngredient.carbs) || 0,
      fat: parseFloat(newIngredient.fat) || 0
    };

    const updatedIngredients = [...ingredients, ingredient];
    setIngredients(updatedIngredients);

    // Calcola nuovi totali
    const newTotals = {
      calories: updatedIngredients.reduce((sum, ing) => sum + ing.calories, mealLog.actual_calories || 0),
      protein: updatedIngredients.reduce((sum, ing) => sum + ing.protein, mealLog.actual_protein || 0),
      carbs: updatedIngredients.reduce((sum, ing) => sum + ing.carbs, mealLog.actual_carbs || 0),
      fat: updatedIngredients.reduce((sum, ing) => sum + ing.fat, mealLog.actual_fat || 0)
    };
    setTotals(newTotals);

    setNewIngredient({
      name: '',
      grams: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    });
    setShowAddIngredient(false);
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 text-left">
                {mealLog.meal_type === 'breakfast' ? '🥐' : 
                 mealLog.meal_type === 'snack1' ? '🥜' :
                 mealLog.meal_type === 'lunch' ? '🍽️' :
                 mealLog.meal_type === 'snack2' ? '🍌' :
                 '🍴'} Dettagli Pasto
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(mealLog.created_date).toLocaleString('it-IT')}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Foto */}
          {mealLog.photo_url && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={mealLog.photo_url}
                alt="Pasto"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Macronutrienti Totali */}
          <div className="bg-gradient-to-br from-[#e9f6f5] to-teal-50 p-6 rounded-xl border-2 border-[#26847F]/30">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Totali Nutrizionali</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Calorie</p>
                <p className="text-2xl font-bold text-[#26847F]">{Math.round(totals.calories)}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Proteine</p>
                <p className="text-2xl font-bold text-red-600">{totals.protein.toFixed(1)}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Carboidrati</p>
                <p className="text-2xl font-bold text-amber-600">{totals.carbs.toFixed(1)}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Grassi</p>
                <p className="text-2xl font-bold text-blue-600">{totals.fat.toFixed(1)}</p>
                <p className="text-xs text-gray-500">g</p>
              </div>
            </div>
          </div>

          {/* Ingredienti */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                📋 Ingredienti
              </h3>
              <Button
                onClick={() => setShowAddIngredient(true)}
                size="sm"
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3">
              {ingredients.length > 0 ? (
                ingredients.map((ing) => (
                  <div key={ing.id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{ing.name}</p>
                        {ing.grams && (
                          <p className="text-sm text-gray-600">{ing.grams}g</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="text-red-600 font-semibold">{ing.protein.toFixed(1)}g</span> proteine
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="text-amber-600 font-semibold">{ing.carbs.toFixed(1)}g</span> carb
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="text-blue-600 font-semibold">{ing.fat.toFixed(1)}g</span> grassi
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="text-orange-600 font-semibold">{ing.calories.toFixed(0)}</span> kcal
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Nessun ingrediente aggiunto</p>
              )}
            </div>
          </div>

          {/* Form Aggiungi Ingrediente */}
          {showAddIngredient && (
            <div className="bg-[#f0fffe] border-2 border-[#26847F]/30 p-4 rounded-lg space-y-4">
              <h4 className="font-bold text-gray-900">Nuovo Ingrediente</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Nome</Label>
                  <Input
                    type="text"
                    placeholder="Es: Pollo grigliato"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Grammi</Label>
                  <Input
                    type="number"
                    placeholder="Es: 150"
                    value={newIngredient.grams}
                    onChange={(e) => setNewIngredient({ ...newIngredient, grams: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Calorie</Label>
                  <Input
                    type="number"
                    placeholder="Es: 200"
                    value={newIngredient.calories}
                    onChange={(e) => setNewIngredient({ ...newIngredient, calories: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Proteine (g)</Label>
                  <Input
                    type="number"
                    placeholder="Es: 30"
                    value={newIngredient.protein}
                    onChange={(e) => setNewIngredient({ ...newIngredient, protein: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Carboidrati (g)</Label>
                  <Input
                    type="number"
                    placeholder="Es: 10"
                    value={newIngredient.carbs}
                    onChange={(e) => setNewIngredient({ ...newIngredient, carbs: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Grassi (g)</Label>
                  <Input
                    type="number"
                    placeholder="Es: 5"
                    value={newIngredient.fat}
                    onChange={(e) => setNewIngredient({ ...newIngredient, fat: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddIngredient}
                  className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
                >
                  Aggiungi Ingrediente
                </Button>
                <Button
                  onClick={() => setShowAddIngredient(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
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