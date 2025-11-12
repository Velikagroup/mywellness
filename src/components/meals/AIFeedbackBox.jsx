
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, CheckCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const getDietRules = (dietType) => {
  const rules = {
    mediterranean: {
      allowed: "frutta, verdura, legumi, cereali integrali (pasta, riso, pane integrale), pesce (salmone, tonno, branzino), olio d'oliva, noci, semi, pollame, latticini (yogurt, formaggi), uova",
      forbidden: "carne rossa in eccesso, cibi ultra-processati, zuccheri raffinati"
    },
    low_carb: {
      allowed: "carne (manzo, pollo, maiale), pesce, uova, formaggi, verdure a basso contenuto di carboidrati (broccoli, spinaci, zucchine, cavolfiore), avocado, noci, oli vegetali, burro",
      forbidden: "pane, pasta, riso, patate, zuccheri, dolci, legumi, frutta ad alto contenuto di zuccheri"
    },
    soft_low_carb: {
      allowed: "carne, pesce, uova, formaggi, verdure, avocado, noci, oli, piccole quantità di cereali integrali (avena, quinoa), frutta a basso indice glicemico (bacche, mele)",
      forbidden: "pane bianco, pasta raffinata, riso bianco, patate, zuccheri raffinati, dolci industriali"
    },
    paleo: {
      allowed: "carne magra (manzo, pollo, tacchino), pesce, frutti di mare, uova, verdura, frutta, noci, semi, oli sani (oliva, cocco, avocado), miele grezzo",
      forbidden: "cereali (pane, pasta, riso), legumi (fagioli, lenticchie, ceci), latticini, zuccheri raffinati, oli vegetali processati, cibi industriali"
    },
    keto: {
      allowed: "carne grassa (manzo, maiale, agnello), pesce grasso (salmone, sgombro), uova, formaggi grassi, burro, oli (oliva, cocco, MCT), avocado, noci, semi, verdure a foglia verde (spinaci, lattuga, rucola)",
      forbidden: "cereali, pane, pasta, riso, patate, legumi, frutta (tranne piccole quantità di bacche), zuccheri, dolci"
    },
    carnivore: {
      allowed: "SOLO prodotti animali: carne rossa (manzo, vitello, agnello, maiale), frattaglie (fegato, cuore, reni), pesce, frutti di mare, uova, burro, ghee, strutto, sego, sale",
      forbidden: "ASSOLUTAMENTE VIETATI: verdure, frutta, cereali, legumi, noci, semi, oli vegetali, latticini (eccetto burro/ghee), zuccheri, condimenti vegetali, spezie (tranne sale)"
    },
    vegetarian: {
      allowed: "frutta, verdura, cereali integrali, legumi (fagioli, lenticchie, ceci), latticini (latte, yogurt, formaggi), uova, tofu, tempeh, noci, semi, oli vegetali",
      forbidden: "carne (manzo, pollo, maiale), pesce, frutti di mare"
    },
    vegan: {
      allowed: "frutta, verdura, cereali integrali, legumi, tofu, tempeh, seitan, latte vegetale (soia, mandorla, avena), noci, semi, oli vegetali, nutritional yeast",
      forbidden: "TUTTI i prodotti animali: carne, pesce, latticini, uova, miele, gelatina"
    }
  };
  return rules[dietType] || rules.mediterranean;
};

export default function AIFeedbackBox({ user, onPlanRegenerated }) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await base44.entities.AIFeedback.create({
        user_id: user.id,
        feedback_type: 'meal_plan',
        message: feedback.trim(),
        status: 'pending'
      });
      
      const existingMeals = await base44.entities.MealPlan.filter({ user_id: user.id });
      for (const meal of existingMeals) {
        await base44.entities.MealPlan.delete(meal.id);
      }

      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const allMealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
      
      let mealStructure = [...allMealTypes];
      if (user.intermittent_fasting && user.if_skip_meal) {
        mealStructure = allMealTypes.filter(m => m !== user.if_skip_meal);
      }
      
      const dailyCalories = user.daily_calories;
      const dietRules = getDietRules(user.diet_type || 'mediterranean');
      
      const mealCalorieDistribution = {};
      const mealsPerDay = mealStructure.length;
      
      if (mealsPerDay === 5) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.25);
      } else if (mealsPerDay === 4) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.35);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.30);
      } else if (mealsPerDay === 3) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.35);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.35);
      } else {
        const caloriesPerMeal = Math.round(dailyCalories / mealsPerDay);
        mealStructure.forEach(mealType => {
          mealCalorieDistribution[mealType] = caloriesPerMeal;
        });
      }
      
      const currentTotal = Object.values(mealCalorieDistribution).reduce((sum, c) => sum + c, 0);
      const difference = dailyCalories - currentTotal;
      
      if (difference !== 0) {
        const largestMealType = Object.keys(mealCalorieDistribution).reduce((a, b) => 
          (mealCalorieDistribution[a] > mealCalorieDistribution[b] ? a : b)
        );
        mealCalorieDistribution[largestMealType] += difference;
      }

      console.log('🎯 Target calorico:', dailyCalories, 'kcal');
      console.log('📊 Distribuzione:', mealCalorieDistribution);

      const createdMealIds = [];

      // STEP 1: Genera e salva pasti SENZA immagini
      for (const day of daysOfWeek) {
        for (const mealType of mealStructure) {
          const targetCals = mealCalorieDistribution[mealType];
          
          const mealPrompt = `You are an expert nutritionist. Create ONE meal in ITALIAN.

USER FEEDBACK: "${feedback.trim()}"
INCORPORATE THIS FEEDBACK into the meal.

Target: ${targetCals} kcal (EXACT - use olio d'oliva to balance if needed)
Diet: ${user.diet_type}
Allowed: ${dietRules.allowed}
Forbidden: ${dietRules.forbidden}

Return Italian meal with verified nutritional data.`;

          const llmResponse = await base44.integrations.Core.InvokeLLM({
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
                prep_time: { type: "number" },
                difficulty: { type: "string" }
              }
            }
          });

          let roundedIngredients = llmResponse.ingredients.map(ing => ({
            ...ing,
            protein: Math.round((ing.protein || 0) * 10) / 10,
            carbs: Math.round((ing.carbs || 0) * 10) / 10,
            fat: Math.round((ing.fat || 0) * 10) / 10
          }));

          let calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
          
          const diff = targetCals - calculatedCalories;
          
          if (diff !== 0) {
            if (diff > 0) {
              const oilMl = Math.round(diff / 9);
              const oilCalories = oilMl * 9;
              
              roundedIngredients.push({
                name: "olio d'oliva extra vergine",
                quantity: oilMl,
                unit: "ml",
                calories: oilCalories,
                protein: 0.0,
                carbs: 0.0,
                fat: Math.round(oilMl * 10) / 10
              });
              
              calculatedCalories += oilCalories;
            } else {
              const scaleFactor = targetCals / calculatedCalories;
              
              roundedIngredients = roundedIngredients.map(ing => ({
                ...ing,
                quantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
                calories: Math.round(ing.calories * scaleFactor),
                protein: Math.round(ing.protein * scaleFactor * 10) / 10,
                carbs: Math.round(ing.carbs * scaleFactor * 10) / 10,
                fat: Math.round(ing.fat * scaleFactor * 10) / 10
              }));
              
              calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
            }
          }

          const createdMeal = await base44.entities.MealPlan.create({
            user_id: user.id,
            day_of_week: day,
            meal_type: mealType,
            name: llmResponse.name,
            ingredients: roundedIngredients,
            instructions: llmResponse.instructions || [],
            total_calories: calculatedCalories,
            total_protein: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10,
            total_carbs: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10,
            total_fat: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10,
            prep_time: llmResponse.prep_time || 15,
            difficulty: llmResponse.difficulty || 'easy',
            image_url: null
          });
          
          createdMealIds.push({ id: createdMeal.id, name: llmResponse.name, ingredients: roundedIngredients });
          
          console.log(`✅ ${day} ${mealType}: ${calculatedCalories} kcal (target: ${targetCals})`);
        }
      }
      
      setIsSubmitting(false);
      setFeedback('');
      setShowSuccess(true);
      
      if (onPlanRegenerated) {
        await onPlanRegenerated();
      }
      
      setTimeout(() => setShowSuccess(false), 4000);
      
      // ✅ STEP 2: Rigenera TUTTE le immagini in background
      console.log('🎨 Rigenerazione TUTTE le immagini in background...');
      
      (async () => {
        for (let i = 0; i < createdMealIds.length; i++) {
          const { id, name, ingredients } = createdMealIds[i];
          
          try {
            const ingredientsString = ingredients.map(ing => `${ing.quantity}${ing.unit} ${ing.name}`).join(', ');
            const imagePrompt = `Professional food photography of ${name}. Ingredients: ${ingredientsString}. Modern plate, 45-degree angle, natural lighting.`;
            const imageResponse = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
            
            await base44.entities.MealPlan.update(id, { image_url: imageResponse.url });
            
            console.log(`🖼️ Immagine ${i + 1}/${createdMealIds.length}: ${name}`);
          } catch (error) {
            console.error(`❌ Errore immagine:`, error);
          }
        }
        
        console.log('✅ Tutte le immagini rigenerate!');
        if (onPlanRegenerated) {
          await onPlanRegenerated();
        }
      })();
      
    } catch (error) {
      console.error("Error submitting feedback and regenerating plan:", error);
      alert("Errore nell'invio del feedback. Riprova.");
      setIsSubmitting(false);
    }
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
            <p className="text-xs text-gray-600 font-normal mt-0.5">
              {isSubmitting ? 'Rigenerazione in corso - Qualche minuto di attesa...' : 'Il piano verrà rigenerato secondo le tue preferenze'}
            </p>
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
              <p className="text-sm text-gray-600 mt-1">Le immagini verranno rigenerate in background</p>
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
              {isSubmitting && (
                <p className="text-xs text-purple-600 text-center font-semibold animate-pulse">
                  ⏱️ Ci vorranno alcuni minuti per completare la rigenerazione
                </p>
              )}
              {!isSubmitting && (
                <p className="text-xs text-gray-500 text-center">
                  ⚡ Il piano settimanale verrà completamente rigenerato secondo il tuo feedback
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
