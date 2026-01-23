import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame } from 'lucide-react';

export default function IngredientQuantityModal({ isOpen, ingredient, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [macros, setMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    if (ingredient) {
      setSelectedUnit(ingredient.default_unit || 'g');
      setQuantity('');
      calculateMacros('');
    }
  }, [ingredient, isOpen]);

  const calculateMacros = (value) => {
    if (!value || !ingredient) {
      setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      return;
    }

    const qty = parseFloat(value);
    if (isNaN(qty)) {
      setMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      return;
    }

    // Calcola basato su 100g per default
    const caloriesPer100 = ingredient.calories_per_100g || ingredient.calories_per_unit || 0;
    const proteinPer100 = ingredient.protein_per_100g || 0;
    const carbsPer100 = ingredient.carbs_per_100g || 0;
    const fatPer100 = ingredient.fat_per_100g || 0;

    setMacros({
      calories: Math.round((caloriesPer100 * qty) / 100),
      protein: parseFloat(((proteinPer100 * qty) / 100).toFixed(1)),
      carbs: parseFloat(((carbsPer100 * qty) / 100).toFixed(1)),
      fat: parseFloat(((fatPer100 * qty) / 100).toFixed(1))
    });
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
    calculateMacros(value);
  };

  const handleConfirm = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Inserisci una quantità valida');
      return;
    }

    onConfirm({
      id: Date.now(),
      name: ingredient.name,
      grams: parseFloat(quantity),
      unit: selectedUnit,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      original_ingredient_id: ingredient.id
    });
  };

  if (!ingredient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              {ingredient.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-6">
          {/* Unità e Quantità */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Medida</p>
            <div className="flex gap-2">
              {Array.from(new Set(['g', 'ml', ingredient.default_unit].filter(Boolean))).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(unit)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                    selectedUnit === unit
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Número de raciones */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Número de raciones
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="100"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                step="0.5"
                min="0"
                className="flex-1 h-12 text-lg"
                autoFocus
              />
              <span className="text-lg font-medium text-gray-700">{selectedUnit}</span>
              <button className="text-gray-400 hover:text-gray-600 p-2">
                ✏️
              </button>
            </div>
          </div>

          {/* Informazioni Nutrizionali */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-gray-600">Calorías</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-4">{macros.calories}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Proteína</p>
                <p className="text-lg font-bold text-red-600">{macros.protein}g</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Carboidrati</p>
                <p className="text-lg font-bold text-amber-600">{macros.carbs}g</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Grassi</p>
                <p className="text-lg font-bold text-blue-600">{macros.fat}g</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <Button
            onClick={handleConfirm}
            className="w-full h-12 bg-black hover:bg-gray-900 text-white font-semibold rounded-full"
          >
            Añadir ingrediente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}