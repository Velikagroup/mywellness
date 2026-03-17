import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, BarChart2, Sprout, Image as ImageIcon, AlertTriangle, Replace, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '../i18n/LanguageContext';
import IngredientReplaceModal from './IngredientReplaceModal';

const MacroCircle = ({ label, value, unit, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-full border-4 ${color} flex items-center justify-center`}>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-gray-600">{label} ({unit})</p>
  </div>
);

export default function MealDetailModal({ meal, onClose, onMealUpdate }) {
  const { t } = useLanguage();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(() => ({
    ...meal,
    ingredients: meal.ingredients.map(ing => ({ ...ing, is_active: true }))
  }));
  const [replacingIngredient, setReplacingIngredient] = useState(null); // ingredient object to show modal
  const [isSavingReplace, setIsSavingReplace] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const generateAndSetImage = useCallback(async (mealToUpdate, replacementInfo = null) => {
    if (mealToUpdate.image_url && !replacementInfo && !isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const ingredientsString = mealToUpdate.ingredients
        .map(({ is_active, ...rest }) => rest)
        .map(i => `${i.quantity}${i.unit || ''} ${i.name}`).join(', ');
      let prompt = `Photorealistic professional food photography of "${mealToUpdate.name}" with: ${ingredientsString}. 45-degree angle, shallow depth of field, clean modern plate, natural lighting.`;
      if (replacementInfo) {
        prompt += ` The ingredient "${replacementInfo.oldIngredientName}" has been replaced with "${replacementInfo.newIngredientName}". Make it clearly visible.`;
      }
      const imageResponse = await base44.integrations.Core.GenerateImage({ prompt });
      const finalUpdatedMeal = { ...mealToUpdate, image_url: imageResponse.url };
      await base44.entities.MealPlan.update(finalUpdatedMeal.id, { image_url: imageResponse.url });
      setCurrentMeal(prev => ({ ...prev, image_url: imageResponse.url }));
      onMealUpdate(finalUpdatedMeal);
    } catch (error) {
      console.error("Error generating image:", error);
      setCurrentMeal(prev => ({ ...prev, image_url: null }));
      onMealUpdate({ ...mealToUpdate, image_url: null });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [onMealUpdate, isGeneratingImage]);

  useEffect(() => {
    setCurrentMeal({
      ...meal,
      ingredients: meal.ingredients.map(ing => ({ ...ing, is_active: true }))
    });
    if (!meal.image_url) generateAndSetImage(meal);
  }, [meal]);

  const handleToggleIngredient = (ingredientToToggle) => {
    const newIngredients = currentMeal.ingredients.map(ing =>
      ing.name === ingredientToToggle.name ? { ...ing, is_active: !ing.is_active } : ing
    );
    const active = newIngredients.filter(ing => ing.is_active);
    setCurrentMeal({
      ...currentMeal,
      ingredients: newIngredients,
      total_calories: Math.round(active.reduce((s, i) => s + i.calories, 0)),
      total_protein: Math.round(active.reduce((s, i) => s + i.protein, 0)),
      total_carbs: Math.round(active.reduce((s, i) => s + i.carbs, 0)),
      total_fat: Math.round(active.reduce((s, i) => s + i.fat, 0)),
    });
  };

  // Called from IngredientReplaceModal on confirm
  const handleReplaceConfirm = async (newIngredient, applyAll, oldIngredientName) => {
    setIsSavingReplace(true);
    setReplacingIngredient(null);
    try {
      // 1. Update this meal
      const newIngredients = currentMeal.ingredients.map(ing =>
        ing.name === oldIngredientName ? { ...newIngredient, is_active: true } : ing
      );
      const active = newIngredients.filter(i => i.is_active);
      const totals = {
        total_calories: Math.round(active.reduce((s, i) => s + i.calories, 0)),
        total_protein: Math.round(active.reduce((s, i) => s + i.protein, 0) * 10) / 10,
        total_carbs: Math.round(active.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
        total_fat: Math.round(active.reduce((s, i) => s + i.fat, 0) * 10) / 10,
      };
      const ingredientsForDB = newIngredients.map(({ is_active, ...rest }) => rest);
      await base44.entities.MealPlan.update(currentMeal.id, { ingredients: ingredientsForDB, ...totals, image_url: null });
      const updatedMeal = { ...currentMeal, ingredients: newIngredients, ...totals, image_url: null };
      setCurrentMeal(updatedMeal);
      onMealUpdate({ ...updatedMeal, ingredients: ingredientsForDB });

      // 2. If applyAll, update all other meals in the plan that contain the same ingredient
      if (applyAll) {
        const allMeals = await base44.entities.MealPlan.filter({ user_id: user?.id });
        const otherMeals = allMeals.filter(m => m.id !== currentMeal.id);
        for (const m of otherMeals) {
          const hasOld = (m.ingredients || []).some(i => i.name === oldIngredientName);
          if (!hasOld) continue;
          const updated = (m.ingredients || []).map(i =>
            i.name === oldIngredientName ? { ...newIngredient } : i
          );
          const t_cal = Math.round(updated.reduce((s, i) => s + (i.calories || 0), 0));
          const t_prot = Math.round(updated.reduce((s, i) => s + (i.protein || 0), 0) * 10) / 10;
          const t_carbs = Math.round(updated.reduce((s, i) => s + (i.carbs || 0), 0) * 10) / 10;
          const t_fat = Math.round(updated.reduce((s, i) => s + (i.fat || 0), 0) * 10) / 10;
          await base44.entities.MealPlan.update(m.id, { ingredients: updated, total_calories: t_cal, total_protein: t_prot, total_carbs: t_carbs, total_fat: t_fat });
        }
      }

      // 3. Regenerate image in background
      generateAndSetImage(updatedMeal, { oldIngredientName, newIngredientName: newIngredient.name });
    } catch (error) {
      console.error("Failed to replace ingredient:", error);
    } finally {
      setIsSavingReplace(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">{currentMeal.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                {(isGeneratingImage || !currentMeal.image_url) ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <ImageIcon className="w-10 h-10 animate-pulse" />
                    <p className="text-sm font-medium">{t('meals.generatingImage')}</p>
                  </div>
                ) : (
                  <img src={currentMeal.image_url} alt={currentMeal.name} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#26847F]" /> {t('meals.nutritionalSummary')}
                </h3>
                <div className="flex justify-around items-center text-center">
                  <div className="flex flex-col items-center">
                    <p className="text-3xl font-bold text-[#26847F]">{currentMeal.total_calories}</p>
                    <p className="text-sm font-medium text-gray-600">{t('common.kcal')}</p>
                  </div>
                  <MacroCircle label={t('meals.protein')} value={currentMeal.total_protein} unit="g" color="border-red-400" />
                  <MacroCircle label={t('meals.carbs')} value={currentMeal.total_carbs} unit="g" color="border-blue-400" />
                  <MacroCircle label={t('meals.fat')} value={currentMeal.total_fat} unit="g" color="border-yellow-400" />
                </div>
              </div>

              <div className="flex items-center justify-around text-sm text-gray-600 bg-gray-50 rounded-lg border p-3">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {t('meals.prep')}: {currentMeal.prep_time} min</div>
                <div className="flex items-center gap-2 capitalize"><ChefHat className="w-4 h-4" /> {t('meals.difficulty')}: {t(`meals.${currentMeal.difficulty}`)}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600" /> {t('meals.ingredients')}
                </h3>
                <div className="space-y-2">
                  {currentMeal.ingredients.map((ing, index) => (
                    <div key={index} className={`flex items-center justify-between bg-white p-2 rounded-md border text-sm transition-colors ${!ing.is_active ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                      <div className={`flex-grow ${!ing.is_active ? 'line-through text-gray-400' : ''}`}>
                        <span className="font-medium text-gray-800">{ing.name}</span>
                        <span className="text-gray-500 ml-2">{ing.quantity}{ing.unit}</span>
                      </div>
                      <div className={`text-xs text-right mr-3 ${!ing.is_active ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                        {ing.calories} kcal
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                          onClick={() => setReplacingIngredient(ing)}
                          disabled={isSavingReplace || isGeneratingImage}
                          title={t('meals.replaceIngredient')}
                        >
                          {isSavingReplace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 ${ing.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                          onClick={() => handleToggleIngredient(ing)}
                          disabled={isSavingReplace || isGeneratingImage}
                        >
                          {ing.is_active ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('meals.preparation')}</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {currentMeal.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {replacingIngredient && (
        <IngredientReplaceModal
          ingredient={replacingIngredient}
          meal={currentMeal}
          userId={user?.id}
          onClose={() => setReplacingIngredient(null)}
          onConfirm={handleReplaceConfirm}
        />
      )}
    </>
  );
}