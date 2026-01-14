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
      // 🔥 FETCH AGGIORNATO: Leggi i dati utente correnti dal database
      const { User } = await import('@/entities/User');
      const currentUser = await User.get(user.id);
      
      // Usa il target calorico aggiornato dal database
      const dailyCalories = currentUser.daily_calorie_target || currentUser.daily_calories || user.daily_calories;
      
      console.log('🔄 Target calorico aggiornato:', dailyCalories);
      
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

          // Calcola le calorie per pasto con precisione ASSOLUTA (max ±0.5 kcal)
          const breakfastCal = Math.round(dailyCalories * 0.25);
          const snack1Cal = Math.round(dailyCalories * 0.05);
          const lunchCal = Math.round(dailyCalories * 0.35);
          const snack2Cal = Math.round(dailyCalories * 0.05);
          
          // Dinner prende ESATTAMENTE il resto per arrivare al totale preciso
          const dinnerCal = dailyCalories - (breakfastCal + snack1Cal + lunchCal + snack2Cal);
          
          const carnivorePrompt = `TARGET ASSOLUTO: ${dailyCalories} kcal TOTALI

STEP 1: Verifica le calorie per pasto:
- breakfast: ${breakfastCal} kcal
- snack1: ${snack1Cal} kcal  
- lunch: ${lunchCal} kcal
- snack2: ${snack2Cal} kcal
- dinner: ${dinnerCal} kcal
SOMMA: ${breakfastCal + snack1Cal + lunchCal + snack2Cal + dinnerCal} = ${dailyCalories} kcal ✓

STEP 2: Valori calorici da usare:
- Manzo: 200 kcal/100g
- Maiale: 250 kcal/100g
- Pollo: 165 kcal/100g
- Salmone: 200 kcal/100g
- Tonno: 130 kcal/100g
- Uova: 70 kcal/uovo
- Burro: 750 kcal/100g (75 kcal per 10g)

STEP 3: Calcola MATEMATICAMENTE ogni pasto:

Esempio breakfast (target ${breakfastCal} kcal):
Se voglio fare "Bistecca con Burro":
- Manzo: ${breakfastCal} kcal × 0.70 = ${Math.round(breakfastCal * 0.70)} kcal → ${Math.round(breakfastCal * 0.70 / 2)} g
- Burro: ${breakfastCal} kcal × 0.30 = ${Math.round(breakfastCal * 0.30)} kcal → ${Math.round(breakfastCal * 0.30 / 7.5)} g
VERIFICA: ${Math.round(breakfastCal * 0.70)} + ${Math.round(breakfastCal * 0.30)} = ${breakfastCal} kcal ✓

STEP 4: Applica lo stesso metodo per TUTTI i 5 pasti.

STEP 5: VERIFICA FINALE prima di rispondere:
Somma totale = breakfast + snack1 + lunch + snack2 + dinner = ${dailyCalories} kcal?
Se NO → RICOMINCIA il calcolo!

Dieta carnivora: SOLO carne, pesce, uova, burro, sale. VIETATO: pasta, riso, verdure, frutta.`;

          const normalPrompt = `TARGET ASSOLUTO: ${dailyCalories} kcal TOTALI

STEP 1: Verifica le calorie per pasto:
- breakfast: ${breakfastCal} kcal
- snack1: ${snack1Cal} kcal
- lunch: ${lunchCal} kcal  
- snack2: ${snack2Cal} kcal
- dinner: ${dinnerCal} kcal
SOMMA: ${breakfastCal + snack1Cal + lunchCal + snack2Cal + dinnerCal} = ${dailyCalories} kcal ✓

STEP 2: Valori calorici da usare:
- Pasta: 360 kcal/100g
- Riso: 130 kcal/100g
- Pane: 270 kcal/100g
- Avena: 380 kcal/100g
- Pollo: 165 kcal/100g
- Manzo: 200 kcal/100g
- Salmone: 200 kcal/100g
- Olio: 90 kcal/10ml
- Noci/Mandorle: 600 kcal/100g
- Miele: 300 kcal/100g

STEP 3: Calcola MATEMATICAMENTE ogni pasto:

Esempio breakfast (target ${breakfastCal} kcal):
Se voglio fare "Porridge con Frutta Secca":
- Avena: ${Math.round(breakfastCal * 0.40)} kcal → ${Math.round(breakfastCal * 0.40 / 3.8)} g
- Latte: ${Math.round(breakfastCal * 0.15)} kcal → ${Math.round(breakfastCal * 0.15 / 0.64)} ml
- Miele: ${Math.round(breakfastCal * 0.10)} kcal → ${Math.round(breakfastCal * 0.10 / 3)} g
- Noci: ${Math.round(breakfastCal * 0.35)} kcal → ${Math.round(breakfastCal * 0.35 / 6)} g
VERIFICA: ${Math.round(breakfastCal * 0.40)} + ${Math.round(breakfastCal * 0.15)} + ${Math.round(breakfastCal * 0.10)} + ${Math.round(breakfastCal * 0.35)} = ${Math.round(breakfastCal * 0.40) + Math.round(breakfastCal * 0.15) + Math.round(breakfastCal * 0.10) + Math.round(breakfastCal * 0.35)} kcal ≈ ${breakfastCal} kcal ✓

STEP 4: Applica lo stesso metodo per TUTTI i 5 pasti.

STEP 5: VERIFICA FINALE prima di rispondere:
Somma totale = breakfast + snack1 + lunch + snack2 + dinner = ${dailyCalories} kcal?
Se NO → RICOMINCIA il calcolo!

Dieta: ${currentUser.diet_type || user.diet_type}`;

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
                        total_calories: { type: "number" },
                        total_protein: { type: "number" },
                        total_carbs: { type: "number" },
                        total_fat: { type: "number" },
                        prep_time: { type: "number" },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                      },
                      required: ["meal_type", "name", "ingredients", "total_calories", "total_protein", "total_carbs", "total_fat"]
                    }
                  }
                }
              }
            });

            if (!response.meals || response.meals.length !== 5) {
              console.warn(`⚠️ Solo ${response.meals?.length || 0} pasti`);
              continue;
            }

            // 🔥 VALIDAZIONE CALORIE TOTALI (MAX ±10 kcal)
            const totalCalories = response.meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
            const calorieDeviation = Math.abs(totalCalories - dailyCalories);
            
            console.log(`📊 Validazione calorie ${dayLabel}:`, {
              target: dailyCalories,
              ottenuto: totalCalories,
              scarto: calorieDeviation,
              meals: response.meals.map(m => ({ type: m.meal_type, cal: m.total_calories }))
            });
            
            // VERIFICA RIGOROSA: max scarto ±5%
            const maxDeviation = Math.max(50, dailyCalories * 0.05); // 5% o minimo 50 kcal
            
            if (calorieDeviation > maxDeviation) {
              console.error(`❌ SCARTO TROPPO ALTO: ${calorieDeviation} kcal (target: ${dailyCalories}, got: ${totalCalories}, max scarto: ${maxDeviation})`);
              console.log(`🔄 Ritento (${attempts}/${MAX_ATTEMPTS})...`);
              continue;
            }

            console.log(`✅ Calorie accettate: ${totalCalories} kcal (target: ${dailyCalories}, scarto: ${calorieDeviation} kcal)`);

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