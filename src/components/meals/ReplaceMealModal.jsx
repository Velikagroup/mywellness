import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ChefHat, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ReplaceMealModal({ isOpen, onClose, meal, user, nutritionData, onMealReplaced }) {
  const [mealName, setMealName] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState('');

  // Debug: log meal info
  React.useEffect(() => {
    if (isOpen && meal) {
      console.log('🍽️ ReplaceMealModal opened for meal:', {
        id: meal.id,
        name: meal.name,
        user_id: meal.user_id,
        current_user_id: user?.id
      });
    }
  }, [isOpen, meal, user]);

  const handleReplace = async () => {
    if (!mealName.trim()) {
      setError('Inserisci il nome del piatto che vuoi mangiare');
      return;
    }

    setIsReplacing(true);
    setError('');

    try {
      const targetCalories = meal.total_calories || 400;
      
      const dietRules = {
        mediterranean: "Grassi sani, cereali integrali, pesce, verdure",
        low_carb: "Proteine alte, grassi sani, carboidrati molto bassi",
        keto: "Grassi molto alti, proteine moderate, carboidrati bassissimi",
        vegetarian: "No carne, no pesce",
        vegan: "100% vegetale"
      };

      const prompt = `Sei un nutrizionista esperto. L'utente vuole sostituire un pasto con: "${mealName}"

CREA UNA VERSIONE NUTRIZIONALMENTE BILANCIATA di questo piatto.

Target: circa ${targetCalories} kcal
Dieta: ${nutritionData?.diet_type || 'mediterranean'}
${dietRules[nutritionData?.diet_type] || ''}

REGOLE CRITICHE:
- Usa NOMI ITALIANI per tutti gli ingredienti
- Per le uova, usa SOLO numeri interi (1, 2, 3), MAI decimali
- Fornisci valori nutrizionali ACCURATI
- Mantieni il piatto il più fedele possibile alla richiesta dell'utente
- Se è un piatto "non sano" (pizza, hamburger, etc.), crea una versione più bilanciata

Restituisci i dati nel formato JSON richiesto.`;

      console.log('🚀 Calling LLM for meal replacement...');
      
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            ingredients: {
              type: "array",
              items: {
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
            },
            instructions: { type: "array", items: { type: "string" } },
            prep_time: { type: "number" },
            difficulty: { type: "string" }
          },
          required: ["name", "ingredients", "instructions"]
        }
      });

      console.log('📦 LLM Result:', llmResult);

      // L'integrazione InvokeLLM restituisce direttamente l'oggetto JSON quando response_json_schema è specificato
      const llmResponse = llmResult;
      
      console.log('📋 Parsed response:', llmResponse);
      
      if (!llmResponse || !llmResponse.name || !llmResponse.ingredients) {
        console.error('❌ Invalid response structure:', llmResponse);
        throw new Error('Risposta AI non valida - riprova');
      }

      // Valida e processa ingredienti
      let validIngredients = llmResponse.ingredients.filter(ing => 
        ing.name && ing.quantity != null && ing.unit && ing.calories != null
      ).map(ing => ({
        ...ing,
        protein: Math.round((ing.protein || 0) * 10) / 10,
        carbs: Math.round((ing.carbs || 0) * 10) / 10,
        fat: Math.round((ing.fat || 0) * 10) / 10
      }));

      // Calcola totali
      let totalCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
      const totalProtein = Math.round(validIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10;
      const totalCarbs = Math.round(validIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10;
      const totalFat = Math.round(validIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10;

      // Bilanciamento calorie se necessario
      const diff = targetCalories - totalCalories;
      if (diff > 5) {
        const oilMl = Math.round(diff / 9);
        const oilCalories = oilMl * 9;
        validIngredients.push({
          name: "olio d'oliva",
          quantity: oilMl,
          unit: "ml",
          calories: oilCalories,
          protein: 0,
          carbs: 0,
          fat: Math.round(oilMl * 10) / 10
        });
        totalCalories += oilCalories;
      } else if (diff < -5) {
        const scaleFactor = targetCalories / totalCalories;
        validIngredients = validIngredients.map(ing => ({
          ...ing,
          quantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
          calories: Math.round(ing.calories * scaleFactor),
          protein: Math.round(ing.protein * scaleFactor * 10) / 10,
          carbs: Math.round(ing.carbs * scaleFactor * 10) / 10,
          fat: Math.round(ing.fat * scaleFactor * 10) / 10
        }));
        totalCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
      }

      console.log('✅ Ingredients validated:', validIngredients.length);

      // Ricalcola totali dopo bilanciamento
      const finalTotalCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
      const finalTotalProtein = Math.round(validIngredients.reduce((sum, ing) => sum + (ing.protein || 0), 0) * 10) / 10;
      const finalTotalCarbs = Math.round(validIngredients.reduce((sum, ing) => sum + (ing.carbs || 0), 0) * 10) / 10;
      const finalTotalFat = Math.round(validIngredients.reduce((sum, ing) => sum + (ing.fat || 0), 0) * 10) / 10;

      console.log('📊 Final totals:', { finalTotalCalories, finalTotalProtein, finalTotalCarbs, finalTotalFat });

      // Genera immagine
      const ingredientsString = validIngredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const imagePrompt = `Professional food photography of "${llmResponse.name}". 
Ingredients: ${ingredientsString}. 
White ceramic plate, natural lighting, 45-degree angle, appetizing presentation.`;

      console.log('🎨 Generating image...');
      const imageResult = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      const imageUrl = imageResult?.url || imageResult?.data?.url || null;
      console.log('🖼️ Image URL:', imageUrl);

      // Aggiorna il pasto
      console.log('💾 Updating meal in database...', {
        meal_id: meal.id,
        meal_user_id: meal.user_id,
        current_user_id: user?.id
      });
      
      const updateData = {
        name: llmResponse.name,
        ingredients: validIngredients,
        instructions: llmResponse.instructions || [],
        total_calories: finalTotalCalories,
        total_protein: finalTotalProtein,
        total_carbs: finalTotalCarbs,
        total_fat: finalTotalFat,
        prep_time: llmResponse.prep_time || 15,
        difficulty: llmResponse.difficulty || 'easy',
        image_url: imageUrl
      };
      
      console.log('📝 Update data:', updateData);
      
      try {
        const result = await base44.entities.MealPlan.update(meal.id, updateData);
        console.log('✅ Meal replaced successfully!', result);
      } catch (updateError) {
        console.error('❌ Update failed:', updateError);
        console.error('Error response:', updateError.response?.data);
        throw new Error(`Aggiornamento fallito: ${updateError.message}`);
      }

      onMealReplaced();
      onClose();
      
    } catch (err) {
      console.error('❌ Error replacing meal:', err);
      console.error('Error details:', err.message, err.stack);
      setError(`Errore: ${err.message || 'Riprova tra qualche secondo'}`);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat className="w-6 h-6 text-[#26847F]" />
            Sostituisci Pasto
          </DialogTitle>
          <DialogDescription>
            Scrivi cosa vuoi mangiare e l'AI creerà una versione bilanciata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-1">Pasto attuale:</p>
            <p className="font-semibold text-gray-800">{meal?.name}</p>
            <p className="text-sm text-gray-600">{meal?.total_calories} kcal</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cosa vuoi mangiare invece?
            </label>
            <Input
              placeholder="Es: Pasta al pomodoro, Insalata di pollo, Salmone..."
              value={mealName}
              onChange={(e) => {
                setMealName(e.target.value);
                setError('');
              }}
              className="w-full"
              disabled={isReplacing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Puoi scrivere il nome del piatto che ti ha dato il nutrizionista o semplicemente cosa hai voglia di mangiare
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isReplacing}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleReplace}
              disabled={isReplacing || !mealName.trim()}
              className="flex-1 bg-[#26847F] hover:bg-[#1f6b66] text-white"
            >
              {isReplacing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sostituisci con AI
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}