
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, BarChart2, Sprout, Image as ImageIcon, AlertTriangle, Replace, Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { GenerateImage, InvokeLLM } from '@/integrations/Core';
import { MealPlan } from '@/entities/MealPlan';
import { User } from '@/entities/User';
import { hasFeatureAccess } from '@/components/utils/subscriptionPlans';

const MacroCircle = ({ label, value, unit, color }) => (
  <div className="flex flex-col items-center">
    <div className={`w-16 h-16 rounded-full border-4 ${color} flex items-center justify-center`}>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
    <p className="mt-2 text-sm font-medium text-gray-600">{label} ({unit})</p>
  </div>
);

export default function MealDetailModal({ meal, onClose, onMealUpdate }) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  // Initialize currentMeal with all ingredients marked as active
  const [currentMeal, setCurrentMeal] = useState(() => ({
    ...meal,
    ingredients: meal.ingredients.map(ing => ({ ...ing, is_active: true }))
  }));
  const [replacingIngredient, setReplacingIngredient] = useState(null);
  const [userPlan, setUserPlan] = useState(null);

  const generateAndSetImage = useCallback(async (mealToUpdate, replacementInfo = null) => {
    // Only proceed if there's no image URL or if generation is explicitly triggered
    // (e.g., by replacementInfo or if mealToUpdate.image_url is null)
    // and we're not already generating an image.
    if (mealToUpdate.image_url && !replacementInfo && !isGeneratingImage) {
        // If image already exists and no specific replacement info forcing regeneration, return.
        return;
    }

    setIsGeneratingImage(true);
    try {
      // Ensure we use only active ingredients for the prompt, or all ingredients if they are meant to be included.
      // For image generation, we generally want all *intended* ingredients, so strip is_active.
      const ingredientsForPrompt = mealToUpdate.ingredients.map(({ is_active, ...rest }) => rest);
      const ingredientsString = ingredientsForPrompt.map(i => `${i.quantity}${i.unit || ''} ${i.name}`).join(', ');
      
      let prompt = `Photorealistic professional food photography of a meal called "${mealToUpdate.name}". The dish should contain visually distinct ingredients: ${ingredientsString}. The photo should be taken from a 45-degree angle, with a shallow depth of field, on a clean, modern plate. Bright, natural lighting.`;

      if (replacementInfo) {
        prompt += ` The ingredient "${replacementInfo.oldIngredientName}" has just been replaced with "${replacementInfo.newIngredientName}". Make sure the new ingredient, ${replacementInfo.newIngredientName}, is clearly visible and looks delicious.`
      }

      const { url } = await GenerateImage({ prompt });
      
      const finalUpdatedMeal = { ...mealToUpdate, image_url: url };
      // Update the DB with the new image URL. `is_active` is client-side only.
      await MealPlan.update(finalUpdatedMeal.id, { image_url: url });

      // Update the currentMeal state and notify parent.
      setCurrentMeal(prevMeal => ({...prevMeal, image_url: url})); 
      onMealUpdate(finalUpdatedMeal);
    } catch (error) {
      console.error("Error generating image:", error);
      // Even if image generation fails, update currentMeal to reflect that it was attempted
      setCurrentMeal(prevMeal => ({ ...prevMeal, image_url: null })); // Ensure image_url is null if generation failed
      onMealUpdate(prevMeal => ({ ...prevMeal, image_url: null }));
    } finally {
      setIsGeneratingImage(false);
    }
  }, [onMealUpdate, isGeneratingImage]);

  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        const user = await User.me();
        setUserPlan(user.subscription_plan);
      } catch (error) {
        console.error("Error loading user plan:", error);
        // Optionally set a default or 'free' plan if user cannot be loaded
        setUserPlan('free'); 
      }
    };
    loadUserPlan();

    // When the meal prop changes, reset currentMeal state and ensure all ingredients are active.
    setCurrentMeal({
      ...meal,
      ingredients: meal.ingredients.map(ing => ({ ...ing, is_active: true }))
    });
    // Automatically generate image on first load if it's missing or has been invalidated
    if (!meal.image_url) {
      generateAndSetImage(meal);
    }
  }, [meal, generateAndSetImage]);

  const handleToggleIngredient = (ingredientToToggle) => {
    const newIngredients = currentMeal.ingredients.map(ing =>
      ing.name === ingredientToToggle.name ? { ...ing, is_active: !ing.is_active } : ing
    );

    const activeIngredients = newIngredients.filter(ing => ing.is_active);

    // Recalculate totals based on active ingredients for UI display
    const newTotalCalories = activeIngredients.reduce((sum, i) => sum + i.calories, 0);
    const newTotalProtein = activeIngredients.reduce((sum, i) => sum + i.protein, 0);
    const newTotalCarbs = activeIngredients.reduce((sum, i) => sum + i.carbs, 0);
    const newTotalFat = activeIngredients.reduce((sum, i) => sum + i.fat, 0);

    setCurrentMeal({
      ...currentMeal,
      ingredients: newIngredients, // Keep all ingredients, just update their active status
      total_calories: Math.round(newTotalCalories),
      total_protein: Math.round(newTotalProtein),
      total_carbs: Math.round(newTotalCarbs),
      total_fat: Math.round(newTotalFat),
    });
    // Note: Toggling ingredients is a client-side feature and does not update the database.
  };

  const handleReplaceIngredient = async (ingredientToReplace) => {
    if (!hasFeatureAccess(userPlan, 'ingredient_substitution')) {
      alert('🔄 Sostituzione ingredienti AI è disponibile solo con il piano Premium. Effettua l\'upgrade!');
      return;
    }

    setReplacingIngredient(ingredientToReplace.name);
    try {
        const replacementPrompt = `Given a meal and an ingredient to replace, suggest a single, nutritionally similar substitute.
        
        CRITICAL: Generate ALL content in ITALIAN language. Ingredient names MUST be in Italian.
        
        Original Meal: ${currentMeal.name}
        Original Ingredients: ${JSON.stringify(currentMeal.ingredients.map(({is_active, ...rest}) => rest))}
        Ingredient to Replace: ${JSON.stringify(ingredientToReplace)}
        
        Task: Find a single ingredient substitute with an Italian name (e.g., "petto di tacchino" instead of "turkey breast", "riso integrale" instead of "brown rice", "spinaci" instead of "spinach"). Provide its name in Italian, a suitable quantity, unit (in Italian like "g", "ml", "cucchiaio"), and its nutritional info (calories, protein, carbs, fat).
        The new ingredient should be a common food item and fit the context of the meal.
        Return ONLY the JSON object for the new ingredient with Italian name and unit.
        
        EXAMPLE:
        {
          "name": "petto di tacchino",
          "quantity": 150,
          "unit": "g",
          "calories": 135,
          "protein": 30,
          "carbs": 0,
          "fat": 1.5
        }`;

        const newIngredientFromLLM = await InvokeLLM({
            prompt: replacementPrompt,
            response_json_schema: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    unit: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" }
                },
                required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat"]
            }
        });
        
        // Create the new ingredients array for the UI state, with 'is_active' flags
        const newIngredientsWithActiveStatus = currentMeal.ingredients.map(ing =>
            ing.name === ingredientToReplace.name
                ? { ...newIngredientFromLLM, is_active: true } // New ingredient is active by default
                : ing
        );
        
        // Calculate totals based on currently active ingredients in the NEW UI state for immediate UI update
        const activeIngredientsForCalculation = newIngredientsWithActiveStatus.filter(ing => ing.is_active);

        const newTotalCalories = activeIngredientsForCalculation.reduce((sum, i) => sum + i.calories, 0);
        const newTotalProtein = activeIngredientsForCalculation.reduce((sum, i) => sum + i.protein, 0);
        const newTotalCarbs = activeIngredientsForCalculation.reduce((sum, i) => sum + i.carbs, 0);
        const newTotalFat = activeIngredientsForCalculation.reduce((sum, i) => sum + i.fat, 0);

        const updatedMealDataForUI = { // This object has 'is_active' flags for UI
          ...currentMeal,
          ingredients: newIngredientsWithActiveStatus,
          image_url: null, // Invalidate image to trigger regeneration
          total_calories: Math.round(newTotalCalories),
          total_protein: Math.round(newTotalProtein),
          total_carbs: Math.round(newTotalCarbs),
          total_fat: Math.round(newTotalFat),
        };
        
        // Optimistically update UI
        setCurrentMeal(updatedMealDataForUI);
        
        // Prepare ingredients for DB (strip 'is_active' property)
        const ingredientsForDB = newIngredientsWithActiveStatus.map(({ is_active, ...rest }) => rest);

        // Recalculate totals for DB based on *all* ingredients (the full list after replacement, ignoring `is_active`)
        const totalCaloriesForDB = ingredientsForDB.reduce((sum, i) => sum + i.calories, 0);
        const totalProteinForDB = ingredientsForDB.reduce((sum, i) => sum + i.protein, 0);
        const totalCarbsForDB = ingredientsForDB.reduce((sum, i) => sum + i.carbs, 0);
        const totalFatForDB = ingredientsForDB.reduce((sum, i) => sum + i.fat, 0);

        const mealDataForDBUpdate = {
            ingredients: ingredientsForDB,
            total_calories: Math.round(totalCaloriesForDB),
            total_protein: Math.round(totalProteinForDB),
            total_carbs: Math.round(totalCarbsForDB),
            total_fat: Math.round(totalFatForDB),
            image_url: null // Also invalidate in DB
        };

        const updatedMealFromDB = await MealPlan.update(currentMeal.id, mealDataForDBUpdate);
        
        // Re-hydrate the meal from DB for UI, adding `is_active` property to all ingredients.
        // For simplicity, when data comes from DB, all ingredients are considered active initially in the UI.
        const finalMealForUI = {
            ...updatedMealFromDB,
            ingredients: updatedMealFromDB.ingredients.map(ing => ({ ...ing, is_active: true }))
        };

        onMealUpdate(finalMealForUI); // Notify parent with the updated meal object (including is_active for local consistency)
        setCurrentMeal(finalMealForUI); // Sync currentMeal with DB state and re-add is_active

        // Call image generation with extra context
        await generateAndSetImage(finalMealForUI, {
          oldIngredientName: ingredientToReplace.name,
          newIngredientName: newIngredientFromLLM.name
        });

    } catch (error) {
        console.error("Failed to replace ingredient:", error);
        // Revert to original state of the meal prop, with all ingredients active.
        setCurrentMeal({
          ...meal,
          ingredients: meal.ingredients.map(ing => ({ ...ing, is_active: true }))
        });
    } finally {
        setReplacingIngredient(null);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">{currentMeal.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2">
          {/* Left Column: Image and Macros */}
          <div className="space-y-6">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
              {(isGeneratingImage || !currentMeal.image_url) ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <ImageIcon className="w-10 h-10 animate-pulse" />
                  <p className="text-sm font-medium">L'AI sta creando l'immagine...</p>
                </div>
              ) : currentMeal.image_url ? (
                <img src={currentMeal.image_url} alt={currentMeal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <AlertTriangle className="w-10 h-10 text-amber-500"/>
                  <p className="text-sm font-medium">Impossibile generare l'immagine.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[var(--brand-primary)]" /> Riepilogo Nutrizionale</h3>
                 <div className="flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-3xl font-bold text-[var(--brand-primary)]">{currentMeal.total_calories}</p>
                        <p className="text-sm font-medium text-gray-600">Kcal</p>
                    </div>
                    <MacroCircle label="Proteine" value={currentMeal.total_protein} unit="g" color="border-red-400" />
                    <MacroCircle label="Carboidrati" value={currentMeal.total_carbs} unit="g" color="border-blue-400" />
                    <MacroCircle label="Grassi" value={currentMeal.total_fat} unit="g" color="border-yellow-400" />
                </div>
            </div>
            
             <div className="flex items-center justify-around text-sm text-gray-600 bg-gray-50 rounded-lg border p-3">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Prep: {currentMeal.prep_time} min</div>
              <div className="flex items-center gap-2 capitalize"><ChefHat className="w-4 h-4" /> Difficoltà: {currentMeal.difficulty}</div>
            </div>

          </div>

          {/* Right Column: Ingredients and Instructions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2"><Sprout className="w-5 h-5 text-green-600"/> Ingredienti</h3>
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
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-6 h-6 ${hasFeatureAccess(userPlan, 'ingredient_substitution') ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed'}`}
                        onClick={() => handleReplaceIngredient(ing)} 
                        disabled={!!replacingIngredient || isGeneratingImage || !hasFeatureAccess(userPlan, 'ingredient_substitution')}
                        title={!hasFeatureAccess(userPlan, 'ingredient_substitution') ? 'Premium Feature' : 'Sostituisci ingrediente'}
                      >
                        {replacingIngredient === ing.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-6 h-6 ${ing.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                        onClick={() => handleToggleIngredient(ing)} 
                        disabled={!!replacingIngredient || isGeneratingImage} // Disable if any ingredient is replacing or image is generating
                      >
                        {ing.is_active ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Preparazione</h3>
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
  );
}
