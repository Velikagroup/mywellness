import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Clock, Flame, Zap, Wheat, Droplet, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import IngredientSelector from './IngredientSelector';
import IngredientQuantityModal from './IngredientQuantityModal';

const ITEMS_PER_PAGE = 5;

export default function RecentMealsHistory({ userId, onMealSelect }) {
  const [mealLogs, setMealLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [mealIngredients, setMealIngredients] = useState({});
  const [showIngredientSelector, setShowIngredientSelector] = useState(null);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  useEffect(() => {
    loadMealLogs();
  }, [userId]);

  const loadMealLogs = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const logs = await base44.entities.MealLog.filter({
        user_id: userId
      }, '-created_date', 50);
      
      setMealLogs(logs);
    } catch (error) {
      console.error('Error loading meal logs:', error);
    }
    setIsLoading(false);
  };

  const getMealName = (log) => {
    if (log.detected_items && Array.isArray(log.detected_items) && log.detected_items.length > 0) {
      return log.detected_items.map(item => typeof item === 'string' ? item : item.name).join(', ');
    }
    return 'Pasto';
  };

  const initializeIngredients = (mealId, log) => {
    if (!mealIngredients[mealId]) {
      const items = (log.detected_items && Array.isArray(log.detected_items)) 
        ? log.detected_items.map((item, idx) => ({
            id: idx,
            name: typeof item === 'string' ? item : item.name || '',
            grams: parseFloat(item.grams) || 0,
            calories: parseFloat(item.calories) || 0,
            protein: parseFloat(item.protein) || 0,
            carbs: parseFloat(item.carbs) || 0,
            fat: parseFloat(item.fat) || 0
          }))
        : [];
      setMealIngredients(prev => ({
        ...prev,
        [mealId]: {
          ingredients: items,
          totals: {
            calories: log.actual_calories || 0,
            protein: log.actual_protein || 0,
            carbs: log.actual_carbs || 0,
            fat: log.actual_fat || 0
          }
        }
      }));
    }
  };

  const handleRemoveIngredient = (mealId, ingredientId) => {
    setMealIngredients(prev => {
      const meal = prev[mealId];
      const updatedIngredients = meal.ingredients.filter(ing => ing.id !== ingredientId);
      const newTotals = {
        calories: updatedIngredients.reduce((sum, ing) => sum + ing.calories, 0),
        protein: updatedIngredients.reduce((sum, ing) => sum + ing.protein, 0),
        carbs: updatedIngredients.reduce((sum, ing) => sum + ing.carbs, 0),
        fat: updatedIngredients.reduce((sum, ing) => sum + ing.fat, 0)
      };
      return {
        ...prev,
        [mealId]: { ingredients: updatedIngredients, totals: newTotals }
      };
    });
  };

  const handleAddIngredientQuantity = (mealId, ingredientData) => {
    setMealIngredients(prev => {
      const meal = prev[mealId];
      const updatedIngredients = [...meal.ingredients, ingredientData];
      const newTotals = {
        calories: updatedIngredients.reduce((sum, ing) => sum + ing.calories, 0),
        protein: updatedIngredients.reduce((sum, ing) => sum + ing.protein, 0),
        carbs: updatedIngredients.reduce((sum, ing) => sum + ing.carbs, 0),
        fat: updatedIngredients.reduce((sum, ing) => sum + ing.fat, 0)
      };
      return {
        ...prev,
        [mealId]: { ingredients: updatedIngredients, totals: newTotals }
      };
    });
    setSelectedIngredient(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26847F]"></div>
      </div>
    );
  }

  if (mealLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nessun pasto scannerizzato ancora</p>
      </div>
    );
  }

  const displayedMeals = mealLogs.slice(0, displayedCount);
  const hasMore = displayedCount < mealLogs.length;

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {displayedMeals.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              {/* Header cliccabile */}
              <button
                onClick={() => {
                  if (expandedMealId !== log.id) {
                    initializeIngredients(log.id, log);
                  }
                  setExpandedMealId(expandedMealId === log.id ? null : log.id);
                }}
                className="w-full p-4 flex gap-4 cursor-pointer hover:bg-gray-50 text-left"
              >
                {/* Foto */}
                {log.photo_url && (
                  <img
                    src={log.photo_url}
                    alt={log.meal_type}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Dettagli */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-3">
                     <p className="text-gray-900 line-clamp-2">
                       {getMealName(log)}
                     </p>
                     <span className="text-xs text-gray-500 flex-shrink-0">
                       {format(new Date(log.created_date), 'HH:mm')}
                     </span>
                   </div>

                   <div className="flex items-center gap-1 mb-3">
                     <Flame className="w-5 h-5 text-orange-500" />
                     <span className="font-bold text-gray-900 text-2xl">
                       {log.actual_calories}
                     </span>
                     <span className="text-xs text-gray-500">kcal</span>
                   </div>

                   {/* Macronutrienti */}
                   <div className="flex gap-4 text-xs">
                     <div className="flex items-center gap-1">
                       <Zap className="w-4 h-4 text-red-600" />
                       <span className="text-red-600 font-semibold">{log.actual_protein || 0}g</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Wheat className="w-4 h-4 text-amber-600" />
                       <span className="text-amber-600 font-semibold">{log.actual_carbs || 0}g</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Droplet className="w-4 h-4 text-blue-600" />
                       <span className="text-blue-600 font-semibold">{log.actual_fat || 0}g</span>
                     </div>
                   </div>
                </div>
              </button>

              {/* Contenuto accordion */}
              <AnimatePresence>
                {expandedMealId === log.id && mealIngredients[log.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6 space-y-6">
                      {/* Foto grande */}
                      {log.photo_url && (
                        <div className="rounded-xl overflow-hidden">
                          <img
                            src={log.photo_url}
                            alt="Pasto"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      {/* Informazioni Nutrizionali */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <p className="text-sm text-gray-600">Calorie</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-4">{Math.round(mealIngredients[log.id].totals.calories)}</p>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Proteina</p>
                            <p className="text-lg font-bold text-red-600">{mealIngredients[log.id].totals.protein.toFixed(1)}g</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Carboidrati</p>
                            <p className="text-lg font-bold text-amber-600">{mealIngredients[log.id].totals.carbs.toFixed(1)}g</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Grassi</p>
                            <p className="text-lg font-bold text-blue-600">{mealIngredients[log.id].totals.fat.toFixed(1)}g</p>
                          </div>
                        </div>
                      </div>

                      {/* Ingredienti */}
                      <div>
                        <h3 className="font-bold text-gray-900 mb-3 text-sm">Ingredienti ({mealIngredients[log.id].ingredients.length})</h3>

                        <div className="space-y-3">
                          {mealIngredients[log.id].ingredients.length > 0 ? (
                            mealIngredients[log.id].ingredients.map((ing) => (
                              <div key={ing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{ing.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {ing.grams}g · {ing.calories.toFixed(0)} cal
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveIngredient(log.id, ing.id)}
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
                          onClick={() => setShowIngredientSelector(log.id)}
                          className="w-full mt-4 h-12 bg-black hover:bg-gray-900 text-white font-semibold rounded-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Aggiungi ingrediente
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ingredient Selector */}
              {showIngredientSelector === log.id && (
                <IngredientSelector
                  isOpen={true}
                  onClose={() => setShowIngredientSelector(null)}
                  onSelectIngredient={(ing) => {
                    setSelectedIngredient({ mealId: log.id, ingredient: ing });
                    setShowIngredientSelector(null);
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => setDisplayedCount(prev => prev + ITEMS_PER_PAGE)}
            className="bg-black hover:bg-gray-900 text-white rounded-full px-6 py-3 font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Carica altri 5
          </Button>
        </div>
      )}

      {selectedMeal && (
        <MealHistoryDetailModal
          mealLog={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onReload={loadMealLogs}
        />
      )}
    </>
  );
}