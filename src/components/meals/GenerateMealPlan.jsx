import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvokeLLM } from "@/integrations/Core";
import { MealPlan } from "@/entities/MealPlan";
import { Sparkles, Loader2 } from "lucide-react";

// BLACKLIST TOTALE per carnivora
const FORBIDDEN_WORDS = [
  'pasta', 'spaghetti', 'penne', 'fusilli', 'tagliatelle', 'linguine', 'rigatoni', 'tortiglioni',
  'riso', 'risotto', 'pane', 'panino', 'bruschetta', 'pizza', 'focaccia', 'toast',
  'patate', 'patata', 'patatine', 'verdura', 'insalata', 'pomodoro', 'cipolla',
  'aglio', 'peperone', 'zucchine', 'melanzane', 'carota', 'sedano', 'broccoli',
  'spinaci', 'lattuga', 'rucola', 'fagioli', 'lenticchie', 'ceci', 'piselli',
  'mela', 'banana', 'arancia', 'frutta', 'olio di oliva', 'olive', 'avocado'
];

const quickCheckCarnivore = (mealsResponse) => {
  const jsonText = JSON.stringify(mealsResponse).toLowerCase();
  
  for (const forbidden of FORBIDDEN_WORDS) {
    if (jsonText.includes(forbidden)) {
      return { 
        valid: false, 
        forbidden: forbidden,
        message: `RILEVATA PAROLA VIETATA: "${forbidden}"` 
      };
    }
  }
  
  return { valid: true };
};

const deepValidateCarnivore = (meals) => {
  const errors = [];
  
  for (const meal of meals) {
    if (meal.total_carbs > 5) {
      errors.push(`${meal.meal_type}: troppi carbs (${meal.total_carbs}g)`);
    }
    
    const mealName = meal.name.toLowerCase();
    for (const forbidden of FORBIDDEN_WORDS) {
      if (mealName.includes(forbidden)) {
        errors.push(`${meal.meal_type}: nome vietato "${meal.name}"`);
      }
    }
    
    for (const ing of meal.ingredients) {
      const ingName = ing.name.toLowerCase();
      for (const forbidden of FORBIDDEN_WORDS) {
        if (ingName.includes(forbidden)) {
          errors.push(`${meal.meal_type}: ingrediente vietato "${ing.name}"`);
        }
      }
    }
  }
  
  return errors;
};

export default function GenerateMealPlan({ user, onComplete }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDay, setCurrentDay] = useState('');
  const [attemptInfo, setAttemptInfo] = useState('');

  const generateWeeklyMealPlan = async () => {
    if (!user || !user.daily_calories) {
      alert("Completa prima il quiz!");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // 🔄 Fetch dati utente aggiornati
      const { User } = await import('@/entities/User');
      const currentUser = await User.get(user.id);
      const dailyCalories = currentUser.daily_calorie_target;

      if (!dailyCalories) {
        alert("Errore: target calorico non trovato!");
        setIsGenerating(false);
        return;
      }

      console.log(`🎯 Target giornaliero: ${dailyCalories} kcal`);
      
      const existingMeals = await MealPlan.filter({ user_id: user.id });
      await Promise.all(existingMeals.map(meal => MealPlan.delete(meal.id)));

      // Trial users: solo 3 giorni (lun/mar/mer)
      // Full users: 7 giorni completi
      const isTrialUser = user.subscription_status === 'trial';
      const days = isTrialUser 
        ? ['monday', 'tuesday', 'wednesday']
        : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      if (isTrialUser) {
        alert('🎁 Trial: genero piani per Lunedì, Martedì e Mercoledì. Upgrade per la settimana completa!');
      }

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const dayLabel = {
          monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì', 
          thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica'
        }[day];

        setCurrentDay(dayLabel);

        let attempts = 0;
        let validMeals = null;
        const MAX_ATTEMPTS = (currentUser.diet_type || user.diet_type) === 'carnivore' ? 10 : 8;

        while (attempts < MAX_ATTEMPTS && !validMeals) {
          attempts++;
          setAttemptInfo(`Tentativo ${attempts}/${MAX_ATTEMPTS}`);
          
          const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
          const principalMeals = ['breakfast', 'lunch', 'dinner'];
          const secondaryMeals = ['snack1', 'snack2', 'snack3', 'snack4'];

          // Conta pasti principali e secondari presenti
          const numPrincipal = mealTypes.filter(m => principalMeals.includes(m)).length;
          const numSecondary = mealTypes.filter(m => secondaryMeals.includes(m)).length;

          // Distribuisci 75% ai principali, 25% ai secondari
          const principalTotal = Math.round(dailyCalories * 0.75);
          const secondaryTotal = dailyCalories - principalTotal;

          const principalCal = numPrincipal > 0 ? Math.round(principalTotal / numPrincipal) : 0;
          const secondaryCal = numSecondary > 0 ? Math.round(secondaryTotal / numSecondary) : 0;

          const initialTargets = {};
          mealTypes.forEach(mealType => {
            if (principalMeals.includes(mealType)) {
              initialTargets[mealType] = principalCal;
            } else {
              initialTargets[mealType] = secondaryCal;
            }
          });

          console.log(`📊 Distribuzione iniziale (${dayLabel}):`, initialTargets);

          const carnivorePrompt = `Crea 5 ricette carnivore per ${dayLabel}.

          INGREDIENTI PERMESSI: carne, pesce, uova, burro, sale
          VIETATO: pasta, riso, pane, verdure, frutta

          Per ogni pasto specifica:
          - Nome ricetta
          - Ingredienti base (senza quantità)
          - Proporzioni relative (es: 70% carne, 30% burro)
          - Istruzioni preparazione

          Esempio:
          {
          "name": "Bistecca con Burro",
          "ingredients": [
          {"name": "manzo", "proportion": 0.70},
          {"name": "burro", "proportion": 0.30}
          ]
          }`;

          const normalPrompt = `Crea 5 ricette per ${dayLabel}.
          Dieta: ${currentUser.diet_type || user.diet_type}

          Per ogni pasto specifica:
          - Nome ricetta
          - Ingredienti base (senza quantità)
          - Proporzioni relative (es: 40% avena, 30% noci)
          - Istruzioni preparazione

          Esempio:
          {
          "name": "Porridge con Frutta Secca",
          "ingredients": [
          {"name": "avena", "proportion": 0.40},
          {"name": "latte", "proportion": 0.20},
          {"name": "miele", "proportion": 0.10},
          {"name": "noci", "proportion": 0.30}
          ]
          }`;

          try {
            const response = await InvokeLLM({
              prompt: (currentUser.diet_type || user.diet_type) === 'carnivore' ? carnivorePrompt : normalPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    minItems: 5,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        meal_type: { type: "string", enum: ["breakfast", "snack1", "lunch", "snack2", "dinner"] },
                        name: { type: "string" },
                        ingredients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              proportion: { type: "number" }
                            },
                            required: ["name", "proportion"]
                          }
                        },
                        instructions: { type: "array", items: { type: "string" } },
                        prep_time: { type: "number" },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                      },
                      required: ["meal_type", "name", "ingredients"]
                    }
                  }
                }
              }
            });

            if (!response.meals || response.meals.length !== 5) {
              console.warn(`⚠️ Solo ${response.meals?.length || 0} pasti`);
              continue;
            }

            console.log(`📊 Calcolo quantità per ${dayLabel}...`);

            // Database nutrizionale (per 100g)
            const nutritionDB = {
              // Carnivora
              manzo: { cal: 200, protein: 26, fat: 10, carbs: 0 },
              maiale: { cal: 250, protein: 25, fat: 17, carbs: 0 },
              pollo: { cal: 165, protein: 31, fat: 3.6, carbs: 0 },
              tacchino: { cal: 135, protein: 30, fat: 1, carbs: 0 },
              salmone: { cal: 200, protein: 20, fat: 13, carbs: 0 },
              tonno: { cal: 130, protein: 29, fat: 1, carbs: 0 },
              merluzzo: { cal: 82, protein: 18, fat: 0.7, carbs: 0 },
              uova: { cal: 140, protein: 12, fat: 10, carbs: 1, unit: 'uova' },
              burro: { cal: 750, protein: 0.9, fat: 83, carbs: 0.1 },
              strutto: { cal: 900, protein: 0, fat: 100, carbs: 0 },
              prosciutto: { cal: 145, protein: 22, fat: 6, carbs: 0 },
              // Standard
              pasta: { cal: 360, protein: 13, fat: 1.5, carbs: 75 },
              riso: { cal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
              pane: { cal: 270, protein: 9, fat: 3, carbs: 49 },
              avena: { cal: 380, protein: 13, fat: 7, carbs: 67 },
              olio: { cal: 900, protein: 0, fat: 100, carbs: 0 },
              'olio di oliva': { cal: 900, protein: 0, fat: 100, carbs: 0 },
              latte: { cal: 64, protein: 3.2, fat: 3.6, carbs: 5, unit: 'ml' },
              'latte intero': { cal: 64, protein: 3.2, fat: 3.6, carbs: 5, unit: 'ml' },
              yogurt: { cal: 60, protein: 3.5, fat: 3.3, carbs: 4 },
              'yogurt greco': { cal: 100, protein: 10, fat: 5, carbs: 4 },
              miele: { cal: 304, protein: 0.3, fat: 0, carbs: 82 },
              noci: { cal: 654, protein: 15, fat: 65, carbs: 14 },
              mandorle: { cal: 579, protein: 21, fat: 50, carbs: 22 },
              patate: { cal: 85, protein: 2, fat: 0.1, carbs: 20 },
              verdure: { cal: 30, protein: 2, fat: 0.3, carbs: 6 },
              pomodori: { cal: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
              mela: { cal: 52, protein: 0.3, fat: 0.2, carbs: 14 },
              banana: { cal: 89, protein: 1.1, fat: 0.3, carbs: 23 }
            };

            // STEP 1: Calcola quantità base (SENZA arrotondare)
            for (const meal of response.meals) {
              const targetCal = initialTargets[meal.meal_type];

              meal.ingredients = meal.ingredients.map(ing => {
                const ingName = ing.name.toLowerCase().trim();
                const nutritionData = nutritionDB[ingName] || { cal: 100, protein: 5, fat: 3, carbs: 15 };

                const ingCalories = targetCal * ing.proportion;

                let quantity;
                if (nutritionData.unit === 'uova') {
                  quantity = (ingCalories / nutritionData.cal) * 2;
                } else {
                  quantity = ingCalories / (nutritionData.cal / 100);
                }

                return {
                  name: ing.name,
                  quantity: quantity, // DECIMALE
                  unit: nutritionData.unit || 'g',
                  nutritionData: nutritionData
                };
              });
            }

            // STEP 2: Calcola calorie totali base (con decimali)
            let totalCalories = 0;
            for (const meal of response.meals) {
              for (const ing of meal.ingredients) {
                const cal = ing.nutritionData.unit === 'uova' 
                  ? (ing.quantity / 2) * ing.nutritionData.cal
                  : (ing.quantity / 100) * ing.nutritionData.cal;
                totalCalories += cal;
              }
            }

            console.log(`📊 Base: ${totalCalories.toFixed(1)} kcal`);

            // STEP 3: Scala TUTTO (ancora decimali)
            const scaleFactor = dailyCalories / totalCalories;
            console.log(`🔧 Scala x${scaleFactor.toFixed(4)}`);

            for (const meal of response.meals) {
              meal.ingredients = meal.ingredients.map(ing => {
                const scaledQty = ing.quantity * scaleFactor;

                return {
                  name: ing.name,
                  quantity: scaledQty, // ANCORA DECIMALE
                  unit: ing.unit,
                  nutritionData: ing.nutritionData
                };
              });
            }

            // STEP 4: Arrotonda e calcola calorie
            for (const meal of response.meals) {
              meal.ingredients = meal.ingredients.map(ing => {
                const roundedQty = ing.nutritionData.unit === 'uova' 
                  ? Math.max(1, Math.round(ing.quantity))
                  : Math.max(1, Math.round(ing.quantity));

                const cal = ing.nutritionData.unit === 'uova' 
                  ? (roundedQty / 2) * ing.nutritionData.cal
                  : (roundedQty / 100) * ing.nutritionData.cal;

                const protein = ing.nutritionData.unit === 'uova'
                  ? (roundedQty / 2) * ing.nutritionData.protein
                  : (roundedQty / 100) * ing.nutritionData.protein;

                const fat = ing.nutritionData.unit === 'uova'
                  ? (roundedQty / 2) * ing.nutritionData.fat
                  : (roundedQty / 100) * ing.nutritionData.fat;

                const carbs = ing.nutritionData.unit === 'uova'
                  ? (roundedQty / 2) * ing.nutritionData.carbs
                  : (roundedQty / 100) * ing.nutritionData.carbs;

                return {
                  name: ing.name,
                  quantity: roundedQty,
                  unit: ing.unit,
                  calories: cal,
                  protein: protein,
                  carbs: carbs,
                  fat: fat,
                  nutritionData: ing.nutritionData
                };
              });
            }

            // STEP 5: LOOP ITERATIVO per compensare il gap
            let iteration = 0;
            const MAX_ITERATIONS = 50;
            
            while (iteration < MAX_ITERATIONS) {
              // Calcola totale corrente
              let currentTotal = 0;
              for (const meal of response.meals) {
                for (const ing of meal.ingredients) {
                  currentTotal += ing.calories;
                }
              }

              const gap = dailyCalories - currentTotal;
              
              if (iteration === 0) {
                console.log(`📊 Dopo arrotondamento: ${currentTotal.toFixed(0)} kcal (gap: ${gap.toFixed(0)})`);
              }

              // Se gap ≤ 10, OK!
              if (Math.abs(gap) <= 10) {
                console.log(`✅ Gap risolto in ${iteration} iterazioni: ${currentTotal} kcal`);
                break;
              }

              // Per ogni pasto, trova l'ingrediente più grande
              for (const meal of response.meals) {
                meal.ingredients.sort((a, b) => b.calories - a.calories);
                const biggestIng = meal.ingredients[0];
                
                if (!biggestIng || biggestIng.quantity <= 1) continue;

                // Calcola proporzione di questo pasto sul totale
                const mealTotal = meal.ingredients.reduce((s, i) => s + i.calories, 0);
                const mealProportion = mealTotal / currentTotal;
                
                // Calcola quanto aggiungere/togliere in base alla proporzione
                const addCalories = gap * mealProportion;
                
                if (Math.abs(addCalories) < 1) continue;

                // Calcola quante calorie per grammo/unità
                const calPerUnit = biggestIng.nutritionData.unit === 'uova'
                  ? biggestIng.nutritionData.cal / 2
                  : biggestIng.nutritionData.cal / 100;

                // Aggiungi/togli in base al gap necessario
                const addQuantity = Math.round(addCalories / calPerUnit);
                
                if (biggestIng.quantity + addQuantity < 1) continue;

                biggestIng.quantity += addQuantity;

                // Ricalcola tutto per questo ingrediente
                biggestIng.calories = biggestIng.nutritionData.unit === 'uova'
                  ? (biggestIng.quantity / 2) * biggestIng.nutritionData.cal
                  : (biggestIng.quantity / 100) * biggestIng.nutritionData.cal;

                biggestIng.protein = biggestIng.nutritionData.unit === 'uova'
                  ? (biggestIng.quantity / 2) * biggestIng.nutritionData.protein
                  : (biggestIng.quantity / 100) * biggestIng.nutritionData.protein;

                biggestIng.fat = biggestIng.nutritionData.unit === 'uova'
                  ? (biggestIng.quantity / 2) * biggestIng.nutritionData.fat
                  : (biggestIng.quantity / 100) * biggestIng.nutritionData.fat;

                biggestIng.carbs = biggestIng.nutritionData.unit === 'uova'
                  ? (biggestIng.quantity / 2) * biggestIng.nutritionData.carbs
                  : (biggestIng.quantity / 100) * biggestIng.nutritionData.carbs;
              }

              iteration++;
            }

            if (iteration >= MAX_ITERATIONS) {
              console.error(`❌ MAX ITERATIONS raggiunto`);
            }

            // STEP 7: Calcola totali finali
            for (const meal of response.meals) {
              meal.total_calories = Math.round(meal.ingredients.reduce((s, i) => s + i.calories, 0));
              meal.total_protein = Math.round(meal.ingredients.reduce((s, i) => s + i.protein, 0) * 10) / 10;
              meal.total_carbs = Math.round(meal.ingredients.reduce((s, i) => s + i.carbs, 0) * 10) / 10;
              meal.total_fat = Math.round(meal.ingredients.reduce((s, i) => s + i.fat, 0) * 10) / 10;

              // Arrotonda valori ingredienti per salvataggio
              meal.ingredients = meal.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                calories: Math.round(ing.calories),
                protein: Math.round(ing.protein * 10) / 10,
                carbs: Math.round(ing.carbs * 10) / 10,
                fat: Math.round(ing.fat * 10) / 10
              }));
            }

            const finalTotal = response.meals.reduce((s, m) => s + m.total_calories, 0);
            const deviation = Math.abs(finalTotal - dailyCalories);

            console.log(`✅ FINALE: ${finalTotal} kcal (target: ${dailyCalories}, scarto: ${deviation})`);

            if (deviation > 10) {
              console.error(`❌ Scarto ${deviation} kcal`);
              continue;
            }

            // CONTROLLO RAPIDO CARNIVORA
            if ((currentUser.diet_type || user.diet_type) === 'carnivore') {
              const quickCheck = quickCheckCarnivore(response);
              if (!quickCheck.valid) {
                console.error(`❌ QUICK CHECK FAILED: ${quickCheck.message}`);
                console.log(`🔄 Ritento (${attempts}/${MAX_ATTEMPTS})...`);
                continue;
              }

              // CONTROLLO PROFONDO
              const errors = deepValidateCarnivore(response.meals);
              if (errors.length > 0) {
                console.error(`❌ DEEP CHECK FAILED:\n${errors.join('\n')}`);
                console.log(`🔄 Ritento (${attempts}/${MAX_ATTEMPTS})...`);
                continue;
              }

              console.log(`✅✅✅ ${dayLabel} VALIDATO!`);
            }

            validMeals = response.meals;
            break;

          } catch (error) {
            console.error(`Errore tentativo ${attempts}:`, error);
            if (attempts >= MAX_ATTEMPTS) {
              console.error(`❌ MAX ATTEMPTS raggiunto per ${dayLabel}`);
              throw new Error(`Errore nella generazione di ${dayLabel}: ${error.message}`);
            }
          }
        }

        if (!validMeals) {
          const errorMsg = `Impossibile generare pasti validi per ${dayLabel} dopo ${MAX_ATTEMPTS} tentativi`;
          console.error(`❌ ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // SALVA
        for (const meal of validMeals) {
          // Arrotonda le uova a numeri interi
          const processedIngredients = meal.ingredients?.map(ing => {
            if (!ing || !ing.name) return ing;
            if (ing.unit && ing.unit.toLowerCase() === 'uova' || 
                ing.name.toLowerCase().includes('uov')) {
              return {
                ...ing,
                quantity: Math.round(ing.quantity)
              };
            }
            return ing;
          });

          await MealPlan.create({
            user_id: user.id,
            day_of_week: day,
            meal_type: meal.meal_type,
            name: meal.name,
            ingredients: processedIngredients,
            instructions: meal.instructions || ["Preparare secondo indicazioni"],
            total_calories: Math.round(meal.total_calories),
            total_protein: Math.round(meal.total_protein),
            total_carbs: Math.round(meal.total_carbs),
            total_fat: Math.round(meal.total_fat),
            prep_time: meal.prep_time || 15,
            difficulty: meal.difficulty || 'easy',
            image_url: null
          });
        }

        setProgress(Math.round(((dayIndex + 1) / days.length) * 100));
        setAttemptInfo('');
      }

      setProgress(100);
      setTimeout(() => onComplete(), 500);

    } catch (error) {
      console.error("Errore:", error);
      alert(`Errore: ${error.message}`);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <>
      {!isGenerating ? (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[var(--brand-primary)]" />
              Genera Piano Nutrizionale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm">
              Genera un piano nutrizionale completo per {user.subscription_status === 'trial' ? '3 giorni (Lunedì, Martedì e Mercoledì)' : '7 giorni'}.
            </p>
            {user.diet_type === 'carnivore' && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-900 font-bold">
                  ⚠️ DIETA CARNIVORA: Solo carne, pesce, uova, burro. 
                  <br/>La validazione è MOLTO RIGOROSA (10 tentativi per giorno).
                </p>
              </div>
            )}
            {user.subscription_status === 'trial' && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-bold">
                  🎁 Sei in modalità Trial: verrà generato un piano solo per Lunedì, Martedì e Mercoledì.
                  <br/>Effettua l'upgrade per sbloccare la settimana completa!
                </p>
              </div>
            )}
            <Button 
              onClick={generateWeeklyMealPlan}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white py-6 text-lg font-semibold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Genera Piano Settimanale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <style jsx>{`
            @keyframes gradient-animation {
              0% {
                background-position: 10% 20%, 85% 10%, 20% 80%, 70% 60%, 50% 50%, 90% 85%;
              }
              25% {
                background-position: 12% 22%, 87% 12%, 22% 82%, 72% 62%, 52% 52%, 92% 87%;
              }
              50% {
                background-position: 8% 18%, 83% 8%, 18% 78%, 68% 58%, 48% 48%, 88% 83%;
              }
              75% {
                background-position: 11% 21%, 86% 11%, 21% 81%, 71% 61%, 51% 51%, 91% 86%;
              }
              100% {
                background-position: 10% 20%, 85% 10%, 20% 80%, 70% 60%, 50% 50%, 90% 85%;
              }
            }
            .animated-gradient-bg {
              background: #f9fafb; /* Base color */
              background-image: radial-gradient(circle at 10% 20%, #d0e4ff 0%, transparent 50%),
                                radial-gradient(circle at 85% 10%, #c2ebe6 0%, transparent 50%),
                                radial-gradient(circle at 20% 80%, #a8e0d7 0%, transparent 50%),
                                radial-gradient(circle at 70% 60%, #f3e8ff 0%, transparent 50%),
                                radial-gradient(circle at 50% 50%, #fce7f3 0%, transparent 60%),
                                radial-gradient(circle at 90% 85%, #faf5ff 0%, transparent 50%);
              background-attachment: fixed;
              background-size: 200% 200%; /* Make gradients larger to allow for movement */
              animation: gradient-animation 20s ease infinite alternate; /* Apply animation */
            }
          `}</style>
          <div className="min-h-screen flex items-start justify-center p-4 pt-8 animated-gradient-bg">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl mx-auto max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[var(--brand-primary)]" />
                  Genera Piano Nutrizionale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
                    <p className="text-lg font-semibold text-gray-800">{progress}%</p>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {currentDay && (
                    <div className="text-center">
                      <p className="text-gray-800 font-semibold">{currentDay}</p>
                      {attemptInfo && (
                        <p className="text-sm text-gray-500">{attemptInfo}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}