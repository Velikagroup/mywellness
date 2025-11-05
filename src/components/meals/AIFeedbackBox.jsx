import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { InvokeLLM, GenerateImage } from "@/integrations/Core";
import { MealPlan } from "@/entities/MealPlan";

export default function AIFeedbackBox({ user, onPlanRegenerated }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Salva il feedback
      await base44.entities.AIFeedback.create({
        user_id: user.id,
        feedback_type: 'meal_plan',
        message: feedback.trim(),
        status: 'pending'
      });
      
      // 2. Elimina tutti i pasti esistenti
      const existingMeals = await MealPlan.filter({ user_id: user.id });
      for (const meal of existingMeals) {
        await MealPlan.delete(meal.id);
      }

      // 3. Rigenera tutto il piano settimanale con il feedback
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];

      const basePrompt = `You are an expert nutritionist creating a weekly meal plan in ITALIAN.

CRITICAL: Generate ALL content in ITALIAN language. Meal names, ingredient names, and instructions MUST be in Italian.

USER FEEDBACK TO INCORPORATE:
"${feedback.trim()}"

IMPORTANT: This feedback was provided by the user to improve the meal plan. INCORPORATE this feedback directly into the new plan. If they say they want more fish, add more fish. If they say reduce carbs, reduce carbs. If they complain about a specific dish, don't include it.

User Profile:
- Daily Calories: ${user.daily_calories} kcal
- Diet Type: ${user.diet_type || 'balanced'}
- Allergies: ${user.allergies?.join(', ') || 'none'}
- Favorite Foods: ${user.favorite_foods?.join(', ') || 'varied'}
- Intermittent Fasting: ${user.intermittent_fasting ? `Yes, skipping ${user.if_skip_meal}` : 'No'}

Create a complete weekly meal plan (7 days x 5 meals per day) that:
1. ADDRESSES THE USER FEEDBACK DIRECTLY
2. Meets the daily calorie target
3. Provides variety across the week
4. Uses Italian names and ingredients
5. Includes realistic, cookable recipes`;

      for (const day of daysOfWeek) {
        for (const mealType of mealTypes) {
          // Skip pasto se IF attivo
          if (user.intermittent_fasting && user.if_skip_meal === mealType) {
            continue;
          }

          const mealPrompt = `${basePrompt}

Generate ONLY the ${mealType} for ${day}.
Return a JSON object with Italian names, ingredients, and instructions.`;

          const mealData = await InvokeLLM({
            prompt: mealPrompt,
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
                    }
                  }
                },
                instructions: { type: "array", items: { type: "string" } },
                total_calories: { type: "number" },
                total_protein: { type: "number" },
                total_carbs: { type: "number" },
                total_fat: { type: "number" },
                prep_time: { type: "number" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
              }
            }
          });

          // Crea il pasto nel database
          const createdMeal = await MealPlan.create({
            user_id: user.id,
            day_of_week: day,
            meal_type: mealType,
            ...mealData
          });

          // Genera immagine in background (non bloccare)
          GenerateImage({
            prompt: `Photorealistic professional food photography of ${mealData.name}. The dish should contain: ${mealData.ingredients.map(i => i.name).join(', ')}. 45-degree angle, shallow depth of field, clean modern plate, bright natural lighting.`
          }).then(({ url }) => {
            MealPlan.update(createdMeal.id, { image_url: url });
          }).catch(err => console.error('Image generation failed:', err));
        }
      }
      
      setFeedback('');
      setShowSuccess(true);
      
      // Notifica parent per ricaricare
      if (onPlanRegenerated) {
        onPlanRegenerated();
      }
      
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error("Error submitting feedback and regenerating plan:", error);
      alert("Errore nell'invio del feedback. Riprova.");
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
              Migliora l'AI
            </span>
            <p className="text-xs text-gray-600 font-normal mt-0.5">Il piano verrà rigenerato istantaneamente</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-6"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-green-700 font-semibold">Piano rigenerato con successo!</p>
              <p className="text-sm text-gray-600 mt-1">Il tuo feedback è stato applicato</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Textarea
                placeholder="Es: 'Voglio più piatti con pesce', 'Riduci i carboidrati a pranzo', 'Non mettermi più lenticchie'..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-24 border-2 border-purple-200 focus:border-purple-400 bg-white/80 resize-none"
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rigenerazione in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Rigenera Piano con Feedback
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                ⚡ Il piano settimanale verrà completamente rigenerato secondo il tuo feedback
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}