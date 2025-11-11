
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { MealPlan } from "@/entities/MealPlan";
import { ShoppingList } from "@/entities/ShoppingList";
import { InvokeLLM, GenerateImage } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MealDetailModal from "../components/meals/MealDetailModal";
import ShoppingListModal from "../components/meals/ShoppingListModal";
import AIFeedbackBox from '../components/meals/AIFeedbackBox';
import UpgradeModal from '../components/meals/UpgradeModal';

const dietTypeLabels = {
  carnivore: 'Carnivora',
  low_carb: 'Low Carb',
  soft_low_carb: 'Soft Low Carb',
  paleo: 'Paleo',
  keto: 'Chetogenica',
  vegetarian: 'Vegetariana',
  vegan: 'Vegana',
  mediterranean: 'Mediterranea'
};

const dietTypes = [
  { id: 'mediterranean', label: 'Mediterranea' },
  { id: 'low_carb', label: 'Low Carb' },
  { id: 'soft_low_carb', label: 'Soft Low Carb' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'keto', label: 'Chetogenica' },
  { id: 'carnivore', label: 'Carnivora' },
  { id: 'vegetarian', label: 'Vegetariana' },
  { id: 'vegan', label: 'Vegana' }
];

const getStartOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

const categorizeIngredient = (ingredientName) => {
  const name = ingredientName.toLowerCase();
  
  if (name.match(/(pollo|tacchino|manzo|maiale|vitello|agnello|salsiccia|salame|prosciutto|bresaola|speck)/)) return 'carne_pesce';
  if (name.match(/(salmone|tonno|merluzzo|orata|branzino|gamberi|calamari|polpo|acciughe|sgombro)/)) return 'carne_pesce';
  if (name.match(/(latte|yogurt|formaggio|mozzarella|parmigiano|ricotta|burro|panna|uova|scamorza|gorgonzola)/)) return 'latticini_uova';
  if (name.match(/(mela|banana|arancia|pera|kiwi|fragola|pesca|albicocca|uva|melone|anguria|limone|pompelmo)/)) return 'frutta_verdura';
  if (name.match(/(insalata|lattuga|pomodor|cetriolo|carota|zucchina|peperone|melanzana|broccoli|cavolfiore|spinaci|rucola|sedano|cipolla|aglio|patata)/)) return 'frutta_verdura';
  if (name.match(/(riso|pasta|pane|farro|orzo|quinoa|couscous|avena|cereali|farina|crackers)/)) return 'cereali_pasta';
  if (name.match(/(fagioli|lenticchie|ceci|piselli|mandorle|noci|nocciole|pistacchi|anacardi)/)) return 'legumi_frutta_secca';
  if (name.match(/(olio|aceto|sale|pepe|zucchero|miele|spezie|basilica|origano|rosmarino|salvia|timo|curry|paprika)/)) return 'condimenti_spezie';
  if (name.match(/(acqua|tè|caffè|succo|bevanda)/)) return 'bevande';
  
  return 'altro';
};

// New component for the generation loading screen
const GenerateMealPlan = ({ generationProgress, generationStatus, nutritionData }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-0">
      <style>{`
        @keyframes progressAnimation {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .progress-bar-animated {
          animation: progressAnimation 5s ease-in-out forwards;
        }
      `}</style>
      
      <div className="max-w-2xl mx-auto">
        <Card className="max-w-2xl w-full bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl text-center">
          <CardHeader>
            <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/videos/ai-generating-loop.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Creazione Protocollo Nutrizionale AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <p className="text-gray-600">
              L'AI sta elaborando migliaia di dati per creare un piano alimentare scientifico e su misura per te.
            </p>
            <Progress value={generationProgress} className="w-full [&>div]:bg-[var(--brand-primary)]" />
            <p className="text-sm text-[var(--brand-primary)] font-semibold h-5">
              {generationStatus}
            </p>
            <div className="text-xs text-gray-500 list-inside text-left mx-auto max-w-md bg-gray-50/70 p-4 rounded-lg border border-gray-200/60">
              <h4 className="font-semibold text-gray-700 mb-2">Analisi in corso:</h4>
              <ul className="space-y-1">
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 10 ? 'text-green-500' : 'text-gray-300'}`} />Profilo metabolico (BMR: {nutritionData?.bmr} kcal)</li>
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 25 ? 'text-green-500' : 'text-gray-300'}`} />Target calorico ({nutritionData?.daily_calories} kcal/giorno)</li>
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 50 ? 'text-green-500' : 'text-gray-300'}`} />Bilanciamento calorico automatico</li>
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 60 ? 'text-green-500' : 'text-gray-300'}`} />Piano nutrizionale generato</li>
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 70 ? 'text-green-500' : 'text-gray-300'}`} />Generazione immagini pasti</li>
                <li><CheckCircle className={`inline w-3 h-3 mr-2 ${generationProgress >= 95 ? 'text-green-500' : 'text-gray-300'}`} />Costruzione e salvataggio piano</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function MealsPage() {
  const [user, setUser] = useState(null);
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [generationPrefs, setGenerationPrefs] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [addedDays, setAddedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nutritionData, setNutritionData] = useState(null);
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(5); // NEW STATE

  const navigate = useNavigate();

  const loadMealPlans = useCallback(async (userId) => {
    try {
      const plans = await MealPlan.filter({ user_id: userId });
      setMealPlans(plans);
      return plans;
    } catch (error) {
      if (error?.response?.status === 401 || (error.message && error.message.includes('401'))) {
        console.warn("Authentication error (401), redirecting to Home.");
        navigate(createPageUrl('Home'));
      } else {
        console.error("Error loading meal plans:", error);
      }
      return [];
    }
  }, [navigate]);

  const handleShowGenerator = useCallback((currentUser) => {
    if (currentUser) {
      setGenerationPrefs({
        diet_type: currentUser.diet_type,
        intermittent_fasting: currentUser.intermittent_fasting,
        if_skip_meal: currentUser.if_skip_meal || null,
        if_meal_structure: currentUser.if_meal_structure || null,
      });
      // Imposta il numero di pasti predefinito basato sulle preferenze utente
      if (currentUser.intermittent_fasting && currentUser.if_meal_structure) {
        if (currentUser.if_meal_structure === '2_meals') {
          setMealsPerDay(2);
        } else if (currentUser.if_meal_structure === '3_meals') {
          setMealsPerDay(3);
        } else if (currentUser.if_meal_structure === '3_meals_snacks') {
          setMealsPerDay(5); // 3 meals + 2 snacks
        } else {
          setMealsPerDay(5); // Default if if_meal_structure is not recognized, but IF is active
        }
      } else {
        setMealsPerDay(5); // Default for non-intermittent fasting
      }
    }
    setShowGenerator(true);
  }, []);
  
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      let currentUser = null;
      try {
        currentUser = await User.me();
        setUser(currentUser);

        if (!currentUser) {
          console.warn("User not found, redirecting to Home.");
          navigate(createPageUrl('Home'));
          return;
        }

        setNutritionData({
            bmr: currentUser.bmr,
            daily_calories: currentUser.daily_calories,
            diet_type: currentUser.diet_type,
            intermittent_fasting: currentUser.intermittent_fasting,
            if_skip_meal: currentUser.if_skip_meal,
            if_meal_structure: currentUser.if_meal_structure,
            allergies: currentUser.allergies,
            favorite_foods: currentUser.favorite_foods,
            weight_loss_speed: currentUser.weight_loss_speed,
            workout_days: currentUser.workout_days,
            age: currentUser.age,
            gender: currentUser.gender,
            current_weight: currentUser.current_weight,
            height: currentUser.height,
            target_weight: currentUser.target_weight,
            activity_level: currentUser.activity_level,
        });

        const plans = await loadMealPlans(currentUser.id);
        
        const startOfWeek = getStartOfWeek();
        const existingLists = await ShoppingList.filter({ user_id: currentUser.id, week_start_date: startOfWeek });
        if (existingLists.length > 0) {
          const currentList = existingLists[0];
          const daysInList = new Set();
          currentList.items.forEach(item => {
            item.days.forEach(day => daysInList.add(day));
          });
          setAddedDays(Array.from(daysInList));
        }

        if (plans.length === 0) {
            const generatorShown = sessionStorage.getItem('mealGeneratorShown');
            if (!generatorShown) {
                handleShowGenerator(currentUser);
                sessionStorage.setItem('mealGeneratorShown', 'true');
            }
        }
      } catch (error) {
        if (error?.response?.status === 401 || (error.message && error.message.includes('401'))) {
          console.warn("Authentication error (401), redirecting to Home.");
          navigate(createPageUrl('Home'));
        } else {
          console.error("Error initializing Meals page:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [navigate, loadMealPlans, handleShowGenerator]);
  
  const handlePrefsChange = (key, value) => {
    const newPrefs = { ...generationPrefs, [key]: value };
    
    if (key === 'intermittent_fasting' && value === false) {
      newPrefs.if_skip_meal = null;
      newPrefs.if_meal_structure = null;
    }
    
    setGenerationPrefs(newPrefs);
  };

  const handleMealUpdate = (updatedMeal) => {
    const updatedPlans = mealPlans.map(p => p.id === updatedMeal.id ? updatedMeal : p);
    setMealPlans(updatedPlans);
    setSelectedMeal(updatedMeal);
  };

  const addDayToShoppingList = async (dayKey) => {
    if (!user) return;
    
    try {
      const dayMeals = mealPlans.filter(m => m.day_of_week === dayKey);
      if (dayMeals.length === 0) {
        alert('Nessun pasto per questo giorno da aggiungere alla lista.');
        return;
      }

      const startOfWeek = getStartOfWeek();
      
      let existingLists = await ShoppingList.filter({ 
        user_id: user.id, 
        week_start_date: startOfWeek 
      });
      
      let currentList = existingLists.length > 0 ? existingLists[0] : null;
      
      const ingredientsMap = new Map();
      
      dayMeals.forEach(meal => {
        meal.ingredients?.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key);
            existing.quantity += ing.quantity;
            if (!existing.days.includes(dayKey)) {
              existing.days.push(dayKey);
            }
          } else {
            ingredientsMap.set(key, {
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              category: categorizeIngredient(ing.name),
              checked: false,
              days: [dayKey]
            });
          }
        });
      });

      const newItemsToAdd = Array.from(ingredientsMap.values());

      if (currentList) {
        const existingItemsMap = new Map();
        currentList.items.forEach(item => {
          existingItemsMap.set(item.name.toLowerCase(), { ...item });
        });

        newItemsToAdd.forEach(newItem => {
          const key = newItem.name.toLowerCase();
          if (existingItemsMap.has(key)) {
            const existing = existingItemsMap.get(key);
            existing.quantity += newItem.quantity;
            existing.days = Array.from(new Set([...existing.days, ...newItem.days]));
          } else {
            existingItemsMap.set(key, newItem);
          }
        });

        await ShoppingList.update(currentList.id, {
          items: Array.from(existingItemsMap.values()),
          last_updated: new Date().toISOString()
        });
      } else {
        await ShoppingList.create({
          user_id: user.id,
          week_start_date: startOfWeek,
          items: newItemsToAdd,
          last_updated: new Date().toISOString()
        });
      }

      setAddedDays(prev => Array.from(new Set([...prev, dayKey])));
      alert(`✅ Ingredienti di ${getDayLabel(dayKey)} aggiunti alla lista della spesa!`);
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      alert("Errore nell'aggiunta degli ingredienti alla lista della spesa. Riprova.");
    }
  };

  const regenerateSingleMeal = async (mealToRegenerate) => {
    if (!user || !nutritionData) return;
    
    setRegeneratingMealId(mealToRegenerate.id);
    
    try {
      let mealStructure = [];
      
      if (nutritionData.intermittent_fasting && nutritionData.if_skip_meal && nutritionData.if_meal_structure) {
        const skipMeal = nutritionData.if_skip_meal;
        const structure = nutritionData.if_meal_structure;
        
        if (structure === '2_meals') {
          mealStructure = ['breakfast', 'lunch', 'dinner'].filter(m => m !== skipMeal);
        } else if (structure === '3_meals') {
          mealStructure = ['breakfast', 'lunch', 'dinner'];
        } else if (structure === '3_meals_snacks') {
          mealStructure = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
        }
      } else {
        mealStructure = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
      }
      
      if (mealStructure.length === 0) {
        mealStructure = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2'];
      }

      const dailyCalories = nutritionData.daily_calories;
      let mealCalorieDistribution = {};

      if (mealStructure.length === 5) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.08);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.07);
      } else if (mealStructure.length === 3) {
        mealCalorieDistribution[mealStructure[0]] = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution[mealStructure[1]] = Math.round(dailyCalories * 0.40);
        mealCalorieDistribution[mealStructure[2]] = Math.round(dailyCalories * 0.30);
      } else if (mealStructure.length === 2) {
        mealCalorieDistribution[mealStructure[0]] = Math.round(dailyCalories * 0.45);
        mealCalorieDistribution[mealStructure[1]] = Math.round(dailyCalories * 0.55);
      } else if (mealStructure.length === 4) {
        mealCalorieDistribution[mealStructure[0]] = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution[mealStructure[1]] = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution[mealStructure[2]] = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution[mealStructure[3]] = Math.round(dailyCalories * 0.15);
      }
      
      const currentTotal = Object.values(mealCalorieDistribution).reduce((sum, c) => sum + c, 0);
      const difference = dailyCalories - currentTotal;
      
      if (difference !== 0 && Object.keys(mealCalorieDistribution).length > 0) {
        const largestMealType = Object.keys(mealCalorieDistribution).reduce((a, b) => 
          (mealCalorieDistribution[a] > mealCalorieDistribution[b] ? a : b)
        );
        mealCalorieDistribution[largestMealType] += difference;
      }

      const targetCalories = mealCalorieDistribution[mealToRegenerate.meal_type] || Math.round(dailyCalories / mealStructure.length);

      const dayLabels = {
        monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì', thursday: 'Giovedì',
        friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica'
      };

      const mealTypeLabels = {
        breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena',
        snack1: 'Spuntino', snack2: 'Spuntino Serale', snack3: 'Snack 3', snack4: 'Snack 4'
      };

      const singleMealPrompt = `You are an expert AI nutritionist. Create ONE single meal in ITALIAN language.

MEAL REQUIREMENTS:
- Day: ${dayLabels[mealToRegenerate.day_of_week]}
- Meal Type: ${mealTypeLabels[mealToRegenerate.meal_type]}
- Target Calories: ${targetCalories} kcal (±20 kcal acceptable)
- Diet Type: ${nutritionData.diet_type}

🔴 CRITICAL RULES:
1. Generate ONLY ONE meal.
2. ALL content MUST be in ITALIAN (meal name, ingredients names, instructions).
3. The meal MUST have EXACTLY ${targetCalories} kcal (±20 kcal).
4. Create a DIFFERENT meal from: "${mealToRegenerate.name}". It must be distinct in name and primary ingredients.
5. Use realistic ingredient portions to meet calorie and macro goals. Do not add random filler ingredients.

USER PROFILE:
- Daily Calories: ${dailyCalories} kcal
- BMR: ${nutritionData.bmr} kcal
- Diet: ${nutritionData.diet_type}
${nutritionData.intermittent_fasting ? `- Intermittent Fasting: Yes (Skipping: ${nutritionData.if_skip_meal}, Structure: ${nutritionData.if_meal_structure})` : '- Intermittent Fasting: No'}
${nutritionData.allergies && nutritionData.allergies.length > 0 ? `- Allergies: ${nutritionData.allergies.join(', ')}` : ''}
${nutritionData.favorite_foods && nutritionData.favorite_foods.length > 0 ? `- Favorite Foods: ${nutritionData.favorite_foods.join(', ')}` : ''}

Generate ONE creative, delicious meal in Italian that hits ${targetCalories} kcal.

RESPONSE JSON SCHEMA:
{
  "name": "Italian meal name",
  "ingredients": [
    {
      "name": "Italian ingredient name",
      "quantity": number,
      "unit": "g" | "ml" | "pz" | "cucchiaino" | "cucchiaio",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "instructions": ["Italian instruction 1", "Italian instruction 2"],
  "prep_time": number,
  "difficulty": "easy" | "medium" | "hard"
}`;

      const response = await InvokeLLM({
        prompt: singleMealPrompt,
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
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
          },
          required: ["name", "ingredients", "instructions", "prep_time", "difficulty"]
        }
      });

      const total_calories = Math.round(response.ingredients.reduce((sum, ing) => sum + ing.calories, 0));
      const total_protein = Math.round(response.ingredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10;
      const total_carbs = Math.round(response.ingredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10;
      const total_fat = Math.round(response.ingredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10;

      const ingredientsString = response.ingredients
        .map(i => `${i.quantity}${i.unit} ${i.name}`)
        .join(', ');
      
      const imagePrompt = `Photorealistic professional food photography of "${response.name}". Main ingredients: ${ingredientsString}. Shot from 45-degree angle, shallow depth of field, clean modern plate, bright natural lighting, appetizing presentation.`;
      
      const { url: imageUrl } = await GenerateImage({ prompt: imagePrompt });

      const updatedMeal = await MealPlan.update(mealToRegenerate.id, {
        name: response.name,
        ingredients: response.ingredients,
        instructions: response.instructions,
        total_calories: total_calories,
        total_protein: total_protein,
        total_carbs: total_carbs,
        total_fat: total_fat,
        prep_time: response.prep_time,
        difficulty: response.difficulty,
        image_url: imageUrl
      });

      setMealPlans(prevMeals => prevMeals.map(m => m.id === updatedMeal.id ? updatedMeal : m));
      
      alert(`✅ Pasto rigenerato con successo! Nuovo pasto: "${response.name}" (${total_calories} kcal)`);
      
    } catch (error) {
      console.error("Error regenerating meal:", error);
      alert(`Errore nella rigenerazione: ${error.message}. Riprova.`);
    } finally {
      setRegeneratingMealId(null);
    }
  };

  const generateMealPlan = async () => {
    if (!user || !generationPrefs || !nutritionData) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Avvio protocollo AI...");

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, "Analisi profilo metabolico...");

      // Costruisci struttura pasti basata su mealsPerDay
      const allMealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
      const mealStructure = allMealTypes.slice(0, mealsPerDay);

      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const isTrialUser = user?.subscription_status === 'trial';
      const daysToGenerate = isTrialUser 
        ? allDays.slice(0, 3)
        : allDays;

      const totalMealsExpected = daysToGenerate.length * mealStructure.length;

      const dailyCalories = nutritionData.daily_calories;
      
      // Distribuzione calorica uniforme basata sul numero di pasti
      const mealCalorieDistribution = {};
      const caloriesPerMealBase = Math.round(dailyCalories / mealsPerDay);
      let remainingCalories = dailyCalories;
      
      mealStructure.forEach((mealType, index) => {
        let caloriesForCurrentMeal = caloriesPerMealBase;
        if (index === mealStructure.length - 1) {
          // Ultimo pasto prende le calorie rimanenti per bilanciare il totale
          caloriesForCurrentMeal = remainingCalories;
        }
        mealCalorieDistribution[mealType] = caloriesForCurrentMeal;
        remainingCalories -= caloriesForCurrentMeal;
      });

      console.log('🎯 Target giornaliero:', dailyCalories, 'kcal');
      console.log('🍽️ Struttura pasti:', mealStructure);
      console.log('📊 Distribuzione calorie:', mealCalorieDistribution);
      console.log('✅ Totale distribuzione:', Object.values(mealCalorieDistribution).reduce((a,b) => a+b, 0), 'kcal');

      const mealPlanPrompt = `You are an expert AI nutritionist. Create a ${daysToGenerate.length}-day meal plan in ITALIAN language.

🔴 CRITICAL CALORIE REQUIREMENT 🔴
DAILY CALORIE TARGET: ${dailyCalories} kcal
NUMBER OF MEALS PER DAY: ${mealsPerDay}

EXACT CALORIE DISTRIBUTION (MUST FOLLOW):
${Object.entries(mealCalorieDistribution).map(([type, cals]) => 
  `- ${type}: ${cals} kcal`
).join('\n')}

TOTAL PER DAY: ${Object.values(mealCalorieDistribution).reduce((a,b) => a+b, 0)} kcal

🚨 MANDATORY RULES:
1. Each meal MUST hit its calorie target (±20 kcal max)
2. Use realistic ingredient portions to reach calorie goals
3. If a meal is low in calories, ADD MORE FOOD (increase portions, add healthy fats like olive oil, nuts, avocado)
4. DO NOT create tiny meals - meals must be satisfying and nutritious

User Profile:
- Daily Target: ${dailyCalories} kcal
- Gender: ${nutritionData.gender}, Age: ${nutritionData.age}, Weight: ${nutritionData.current_weight}kg
- Activity: ${nutritionData.activity_level}
- Diet Type: ${generationPrefs.diet_type}
${generationPrefs.intermittent_fasting ? `- Intermittent Fasting: Yes (Skipping: ${generationPrefs.if_skip_meal}, Structure: ${generationPrefs.if_meal_structure})` : '- Intermittent Fasting: No'}
- Allergies: ${nutritionData.allergies?.join(', ') || 'None'}
- Favorite Foods: ${nutritionData.favorite_foods?.join(', ') || 'None'}

TASK: Generate ${totalMealsExpected} total meals (${mealsPerDay} meals × ${daysToGenerate.length} days).

For EACH meal, calculate ingredients precisely to hit the target calories.

Return a flat array with each meal as a separate object.

RESPONSE JSON SCHEMA:
{
  "meal_plans": [
    {
      "day_of_week": "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
      "meal_type": ${JSON.stringify(mealStructure)},
      "name": "Italian meal name",
      "ingredients": [
        {
          "name": "Italian ingredient name",
          "quantity": number,
          "unit": "g" | "ml" | "pz",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ],
      "instructions": ["Italian instruction 1", "Italian instruction 2"],
      "total_calories": number (MUST match target),
      "total_protein": number,
      "total_carbs": number,
      "total_fat": number,
      "prep_time": number,
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

      updateProgress(20, "Generazione piano nutrizionale con AI...");

      const response = await InvokeLLM({
        prompt: mealPlanPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            meal_plans: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_of_week: { type: "string", enum: allDays },
                  meal_type: { type: "string", enum: mealStructure },
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
                required: ["day_of_week", "meal_type", "name", "ingredients", "instructions", "total_calories", "total_protein", "total_carbs", "total_fat"]
              }
            }
          }
        }
      });

      updateProgress(50, "Piano nutrizionale creato! Validazione dati...");

      if (!response.meal_plans || !Array.isArray(response.meal_plans)) {
        throw new Error("Risposta AI non valida: la proprietà 'meal_plans' è mancante o non è un array.");
      }

      console.log('📊 Pasti ricevuti dall\'AI:', response.meal_plans.length);

      let cleanedMealPlans = response.meal_plans
        .filter(meal => {
          if (!meal || typeof meal !== 'object') return false;
          if (!allDays.includes(meal.day_of_week)) return false;
          if (!mealStructure.includes(meal.meal_type)) return false;
          if (!meal.ingredients || !Array.isArray(meal.ingredients) || meal.ingredients.length === 0) return false;
          if (!meal.instructions || !Array.isArray(meal.instructions) || meal.instructions.length === 0) return false;
          return true;
        })
        .map(meal => ({
          ...meal,
          ingredients: meal.ingredients.filter(ing => 
            ing && ing.name && ing.quantity && ing.unit && 
            (ing.calories || ing.calories === 0) &&
            (ing.protein || ing.protein === 0) &&
            (ing.carbs || ing.carbs === 0) &&
            (ing.fat || ing.fat === 0)
          ),
          instructions: meal.instructions.filter(inst => typeof inst === 'string' && inst.length > 0)
        }));

      console.log('✅ Pasti dopo pulizia:', cleanedMealPlans.length);

      if (cleanedMealPlans.length === 0) {
        throw new Error('L\'AI non ha generato pasti validi. Riprova la generazione.');
      }

      updateProgress(60, "Bilanciamento calorico automatico...");
      
      const adjustedMealPlans = [];
      
      for (const day of daysToGenerate) {
        const dayMeals = cleanedMealPlans.filter(m => m.day_of_week === day);
        const currentDayCalories = dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
        const calorieDifference = dailyCalories - currentDayCalories;
        
        console.log(`📅 ${day}: Calorie attuali=${currentDayCalories}, Target=${dailyCalories}, Differenza=${calorieDifference}`);
        
        if (Math.abs(calorieDifference) <= 50) {
          adjustedMealPlans.push(...dayMeals);
          console.log(`✅ ${day}: Già bilanciato o entro tolleranza`);
        } else {
          console.log(`⚠️ ${day}: Necessita aggiustamento di ${calorieDifference} kcal`);
          
          const adjustedDayMeals = dayMeals.map(meal => {
            const mealCaloriesBeforeAdjustment = (meal.total_calories || 0);
            const mealProportionOfDay = (currentDayCalories > 0) ? mealCaloriesBeforeAdjustment / currentDayCalories : (1 / dayMeals.length);
            const mealAdjustment = Math.round(calorieDifference * mealProportionOfDay);
            
            let adjustedIngredients = meal.ingredients.map(ing => ({ ...ing }));
            
            if (mealAdjustment > 0) {
              let remainingCaloriesToAdjustForMeal = mealAdjustment;

              if (remainingCaloriesToAdjustForMeal >= 45) { // Roughly 5ml of oil
                const oilMl = Math.round(remainingCaloriesToAdjustForMeal / 9);
                adjustedIngredients.push({
                  name: "olio d'oliva extra vergine",
                  quantity: oilMl,
                  unit: "ml",
                  calories: oilMl * 9,
                  protein: 0,
                  carbs: 0,
                  fat: oilMl
                });
                remainingCaloriesToAdjustForMeal -= (oilMl * 9);
              }
              
              if (remainingCaloriesToAdjustForMeal > 0) {
                const mainIngredientIndex = adjustedIngredients.findIndex(ing => ing.quantity > 0 && ing.calories > 0);
                const mainIngredient = mainIngredientIndex !== -1 ? adjustedIngredients[mainIngredientIndex] : null;

                if (mainIngredient) {
                  const caloriesPerUnit = mainIngredient.calories / mainIngredient.quantity;
                  if (caloriesPerUnit > 0) {
                    const extraQuantity = remainingCaloriesToAdjustForMeal / caloriesPerUnit;
                    
                    const originalQuantity = mainIngredient.quantity;

                    mainIngredient.quantity = Math.round((mainIngredient.quantity + extraQuantity) * 10) / 10;
                    mainIngredient.calories += remainingCaloriesToAdjustForMeal;

                    if (originalQuantity > 0) {
                      const macroScaleFactor = (originalQuantity + extraQuantity) / originalQuantity;
                      mainIngredient.protein = Math.round(mainIngredient.protein * macroScaleFactor * 10) / 10;
                      mainIngredient.carbs = Math.round(mainIngredient.carbs * macroScaleFactor * 10) / 10;
                      mainIngredient.fat = Math.round(mainIngredient.fat * macroScaleFactor * 10) / 10;
                    }
                    remainingCaloriesToAdjustForMeal = 0;
                  }
                }
              }

            } else if (mealAdjustment < 0) {
              // Only reduce if meal has calories to reduce from
              if (mealCaloriesBeforeAdjustment > 0) {
                const reductionFactor = (mealCaloriesBeforeAdjustment + mealAdjustment) / mealCaloriesBeforeAdjustment;
                adjustedIngredients = adjustedIngredients.map(ing => ({
                  ...ing,
                  quantity: Math.round(ing.quantity * reductionFactor * 10) / 10,
                  calories: Math.round(ing.calories * reductionFactor),
                  protein: Math.round(ing.protein * reductionFactor * 10) / 10,
                  carbs: Math.round(ing.carbs * reductionFactor * 10) / 10,
                  fat: Math.round(ing.fat * reductionFactor * 10) / 10
                }));
              }
            }
            
            const finalTotalCalories = adjustedIngredients.reduce((sum, i) => sum + i.calories, 0);
            const finalTotalProtein = adjustedIngredients.reduce((sum, i) => sum + i.protein, 0);
            const finalTotalCarbs = adjustedIngredients.reduce((sum, i) => sum + i.carbs, 0);
            const finalTotalFat = adjustedIngredients.reduce((sum, i) => sum + i.fat, 0);
            
            console.log(`  🍽️ ${meal.meal_type}: ${mealCaloriesBeforeAdjustment}kcal -> ${finalTotalCalories}kcal (target: ${mealCaloriesBeforeAdjustment + mealAdjustment}kcal)`);
            
            return {
              ...meal,
              ingredients: adjustedIngredients,
              total_calories: Math.round(finalTotalCalories),
              total_protein: Math.round(finalTotalProtein * 10) / 10,
              total_carbs: Math.round(finalTotalCarbs * 10) / 10,
              total_fat: Math.round(finalTotalFat * 10) / 10
            };
          });
          
          const finalDayCalories = adjustedDayMeals.reduce((sum, m) => sum + m.total_calories, 0);
          console.log(`✅ ${day}: Aggiustato a ${finalDayCalories} kcal`);
          
          adjustedMealPlans.push(...adjustedDayMeals);
        }
      }
      
      cleanedMealPlans = adjustedMealPlans;
      
      const finalCaloriesPerDay = {};
      daysToGenerate.forEach(day => {
        const dayMeals = cleanedMealPlans.filter(m => m.day_of_week === day);
        const dayCalories = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);
        finalCaloriesPerDay[day] = dayCalories;
      });

      console.log('🎯 CALORIE FINALI PER GIORNO:', finalCaloriesPerDay);
      console.log('🎯 TARGET:', dailyCalories, 'kcal');

      const existingPlans = await MealPlan.filter({ user_id: user.id });
      for (const plan of existingPlans) {
        await MealPlan.delete(plan.id);
      }
      
      updateProgress(70, "Inizio generazione immagini AI...");

      await User.updateMyUserData({
        diet_type: generationPrefs.diet_type,
        intermittent_fasting: generationPrefs.intermittent_fasting,
        if_skip_meal: generationPrefs.if_skip_meal,
        if_meal_structure: generationPrefs.if_meal_structure,
      });

      const totalMeals = cleanedMealPlans.length;
      const batchSize = 5;
      const mealsWithImages = [];

      for (let i = 0; i < totalMeals; i += batchSize) {
        const batch = cleanedMealPlans.slice(i, i + batchSize);
        const batchProgress = 70 + Math.round((i / totalMeals) * 25);
        updateProgress(batchProgress, `Generazione immagini: ${i + batch.length}/${totalMeals}...`);
        
        const imagePromises = batch.map(async (meal) => {
          try {
            const ingredientsString = meal.ingredients
              .map(i => `${i.quantity}${i.unit} ${i.name}`)
              .join(', ');
            
            const imagePrompt = `Professional food photography of a meal called "${meal.name}". The dish contains: ${ingredientsString}. Shot from 45-degree angle, clean modern plate, bright natural lighting, shallow depth of field.`;
            
            const { url } = await GenerateImage({ prompt: imagePrompt });
            return { ...meal, image_url: url };
          } catch (error) {
            console.error(`Error generating image for ${meal.name}:`, error);
            return { ...meal, image_url: null };
          }
        });
        
        const batchResults = await Promise.all(imagePromises);
        mealsWithImages.push(...batchResults);
      }

      updateProgress(95, "Salvataggio piano nutrizionale...");

      for (const meal of mealsWithImages) {
        await MealPlan.create({
          user_id: user.id,
          day_of_week: meal.day_of_week,
          meal_type: meal.meal_type,
          name: meal.name,
          ingredients: meal.ingredients,
          instructions: meal.instructions,
          total_calories: meal.total_calories,
          total_protein: meal.total_protein,
          total_carbs: meal.total_carbs,
          total_fat: meal.total_fat,
          prep_time: meal.prep_time,
          difficulty: meal.difficulty,
          image_url: meal.image_url
        });
      }

      updateProgress(100, "Piano generato con successo!");
      
      setTimeout(async () => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStatus("");
        setShowGenerator(false);
        await loadMealPlans(user.id);
        setAddedDays([]);
      }, 1000);

    } catch (error) {
      console.error("Error generating meal plan:", error);
      setGenerationStatus(`Errore: ${error.message}. Riprova.`);
      setTimeout(() => setIsGenerating(false), 5000);
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center animated-gradient-bg">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)]"></div>
                <p className="text-gray-600 font-medium">Inizializzazione protocolli...</p>
            </div>
        </div>
    );
  }
  
  if (isGenerating) {
    return <GenerateMealPlan generationProgress={generationProgress} generationStatus={generationStatus} nutritionData={nutritionData} />;
  }

  const days = [
    { key: 'monday', label: 'Lunedì' },
    { key: 'tuesday', label: 'Martedì' },
    { key: 'wednesday', label: 'Mercoledì' },
    { key: 'thursday', label: 'Giovedì' },
    { key: 'friday', label: 'Venerdì', },
    { key: 'saturday', label: 'Sabato' },
    { key: 'sunday', label: 'Domenica' }
  ];

  const isTrialUser = user?.subscription_status === 'trial';
  const availableDays = isTrialUser 
    ? days.slice(0, 3)
    : days;

  const todaysMeals = mealPlans.filter(plan => plan.day_of_week === selectedDay);
  const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4']; // Expanded for more flexibility
  const getMealTypeLabel = (type) => {
    const labels = { 
      breakfast: 'Colazione', 
      lunch: 'Pranzo', 
      dinner: 'Cena', 
      snack1: 'Spuntino', 
      snack2: 'Spuntino Serale',
      snack3: 'Snack Pomeridiano',
      snack4: 'Spuntino Notturno'
    };
    return labels[type] || type;
  };

  const dailyTotals = todaysMeals.reduce((totals, meal) => ({
    calories: totals.calories + (meal.total_calories || 0),
    protein: totals.protein + (meal.total_protein || 0),
    carbs: totals.carbs + (meal.carbs || 0),
    fat: totals.fat + (meal.total_fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const getDayLabel = (dayKey) => {
    const day = days.find(d => d.key === dayKey);
    return day ? day.label : dayKey;
  };

  return (
    <>
      <div className="min-h-screen pb-20">

        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Protocollo Nutrizionale</h1>
              <p className="text-gray-600">Pianificazione e ottimizzazione dei pasti via AI</p>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
                <Button
                  onClick={() => setShowShoppingList(true)}
                  className="bg-white/40 backdrop-blur-md hover:bg-white/50 border-2 border-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center gap-1 md:gap-2 shadow-lg hover:shadow-xl transition-all px-3 md:px-6 py-2.5 md:py-6 text-sm md:text-base font-semibold rounded-xl flex-1 lg:flex-initial"
                >
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Lista Spesa</span>
                  <span className="sm:hidden">Lista</span>
                </Button>
                <Button
                  onClick={() => handleShowGenerator(user)}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white flex items-center gap-1 md:gap-2 shadow-lg hover:shadow-xl transition-all px-3 md:px-6 py-3 md:py-6 text-sm md:text-base font-semibold rounded-xl flex-1 lg:flex-initial"
                >
                  <BrainCircuit className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Rigenera Piano con AI</span>
                  <span className="sm:hidden">Rigenera</span>
                </Button>
              </div>
          </div>

          {/* AI Feedback Box - mostra SOLO se c'è già un piano */}
          {mealPlans.length > 0 && (
            <AIFeedbackBox 
              user={user} 
              onPlanRegenerated={() => loadMealPlans(user?.id)}
            />
          )}

            {showGenerator && (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                <CardHeader>
                <CardTitle className="text-lg text-gray-900">Genera Protocollo Nutrizionale con AI</CardTitle>
                <p className="text-sm text-gray-500">Conferma o modifica le tue preferenze. L'AI creerà un piano di 7 giorni basato su queste scelte. I piani esistenti verranno sovrascritti.</p>
                </CardHeader>
                <CardContent>
                <div className="space-y-6">
                    {/* Selettore Numero Pasti */}
                    <div className="p-4 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-lg border-2 border-[var(--brand-primary)]/30">
                      <Label className="text-sm font-semibold text-gray-800 mb-3 block">
                        🍽️ Quanti pasti al giorno?
                      </Label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            onClick={() => setMealsPerDay(num)}
                            className={`p-3 rounded-xl border-2 transition-all text-center font-bold ${
                              mealsPerDay === num
                                ? 'border-[var(--brand-primary)] bg-white shadow-lg scale-105'
                                : 'border-gray-200 hover:border-[var(--brand-primary)]/50 hover:bg-white'
                            }`}
                          >
                            <div className="text-2xl">{num}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-3 text-center">
                        💡 Il target calorico giornaliero ({nutritionData?.daily_calories} kcal) verrà distribuito su {mealsPerDay} {mealsPerDay === 1 ? 'pasto' : 'pasti'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/70 rounded-lg border border-gray-200/50">
                    <div>
                        <Label htmlFor="diet-type-select" className="font-semibold text-gray-800">Tipo Dieta</Label>
                        <Select value={generationPrefs?.diet_type || ''} onValueChange={(value) => handlePrefsChange('diet_type', value)}>
                            <SelectTrigger id="diet-type-select">
                                <SelectValue placeholder="Seleziona dieta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {dietTypes.map(diet => (
                                    <SelectItem key={diet.id} value={diet.id}>{diet.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4 rounded-md border p-4 h-full">
                        <Label htmlFor="intermittent-fasting-switch" className="font-semibold text-gray-800">Digiuno Intermittente</Label>
                        <Switch
                            id="intermittent-fasting-switch"
                            checked={generationPrefs?.intermittent_fasting || false}
                            onCheckedChange={(value) => handlePrefsChange('intermittent_fasting', value)}
                            className="data-[state=checked]:bg-[var(--brand-primary)]"
                        />
                    </div>
                    </div>

                    {generationPrefs?.intermittent_fasting && (
                      <div className="space-y-4 p-4 bg-[var(--brand-primary-light)] rounded-lg border border-[var(--brand-primary)]/30">
                        <h4 className="font-semibold text-[var(--brand-primary-dark-text)]">⏰ Configurazione Digiuno Intermittente</h4>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Quale pasto vuoi saltare?</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { id: 'breakfast', label: 'Colazione', icon: '🌅' },
                              { id: 'lunch', label: 'Pranzo', icon: '☀️' },
                              { id: 'dinner', label: 'Cena', icon: '🌙' }
                            ].map(meal => (
                              <button
                                key={meal.id}
                                onClick={() => handlePrefsChange('if_skip_meal', meal.id)}
                                className={`p-3 rounded-lg border-2 transition-all text-center ${
                                  generationPrefs.if_skip_meal === meal.id
                                    ? 'border-[var(--brand-primary)] bg-white shadow-sm'
                                    : 'border-gray-200 hover:border-[var(--brand-primary)]/50'
                                }`}
                              >
                                <div className="text-2xl mb-1">{meal.icon}</div>
                                <div className="text-xs font-medium">{meal.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Struttura pasti giornalieri</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              { id: '2_meals', label: '2 Pasti', icon: '🍽️🍽️', desc: 'Solo 2 pasti principali' },
                              { id: '3_meals', label: '3 Pasti', icon: '🍽️🍽️🍽️', desc: '3 pasti principali' },
                              { id: '3_meals_snacks', label: '3 Pasti + Snack', icon: '🍽️🥗🍽️', desc: 'Pasti + spuntini' }
                            ].map(structure => (
                              <button
                                key={structure.id}
                                onClick={() => handlePrefsChange('if_meal_structure', structure.id)}
                                className={`p-3 rounded-lg border-2 transition-all text-center ${
                                  generationPrefs.if_meal_structure === structure.id
                                    ? 'border-[var(--brand-primary)] bg-white shadow-sm'
                                    : 'border-gray-200 hover:border-[var(--brand-primary)]/50'
                                }`}
                              >
                                <div className="text-xl mb-1">{structure.icon}</div>
                                <div className="text-xs font-semibold">{structure.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{structure.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                    <Button
                        onClick={generateMealPlan}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
                        disabled={generationPrefs?.intermittent_fasting && (!generationPrefs?.if_skip_meal || !generationPrefs?.if_meal_structure)}
                    >
                        Conferma e Genera
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowGenerator(false)}
                    >
                        Annulla
                    </Button>
                    </div>
                    
                    {generationPrefs?.intermittent_fasting && (!generationPrefs?.if_skip_meal || !generationPrefs?.if_meal_structure) && (
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        ⚠️ Completa la configurazione del digiuno intermittente per continuare
                      </p>
                    )}
                </div>
                </CardContent>
            </Card>
            )}

            {mealPlans.length > 0 ? (
            <>
                <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                  <CardHeader className="border-b border-gray-200/30">
                    <CardTitle className="text-lg text-gray-900">Programmazione Settimanale</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200/80">
                      {availableDays.map((day) => {
                        const isSelected = selectedDay === day.key;
                        const isAdded = addedDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            onClick={() => setSelectedDay(day.key)}
                            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 ${
                              isSelected
                                ? 'text-[var(--brand-primary)] border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/50'
                                : 'text-gray-500 border-transparent hover:text-[var(--brand-primary)] hover:border-teal-300'
                            }`}
                          >
                            <span>{day.label.substring(0, 3)}</span>
                            {isAdded && <Check className="w-3 h-3 text-green-600" />}
                          </button>
                        );
                      })}
                      {isTrialUser && (
                        <>
                          <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 text-sm font-medium rounded-t-md text-gray-400 border-b-2 border-transparent hover:text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer">🔒</button>
                          <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 text-sm font-medium rounded-t-md text-gray-400 border-b-2 border-transparent hover:text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer">🔒</button>
                          <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 text-sm font-medium rounded-t-md text-gray-400 border-b-2 border-transparent hover:text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer">🔒</button>
                          <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 text-sm font-medium rounded-t-md text-gray-400 border-b-2 border-transparent hover:text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer">🔒</button>
                        </>
                      )}
                    </div>

                    <div className="min-h-[300px]">
                      {todaysMeals.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                              Protocollo di {getDayLabel(selectedDay)}
                            </h4>
                            <Button
                              onClick={() => addDayToShoppingList(selectedDay)}
                              size="sm"
                              variant="outline"
                              className="border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                              disabled={addedDays.includes(selectedDay)}
                            >
                              {addedDays.includes(selectedDay) ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Aggiunto
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Aggiungi a Lista Spesa
                                </>
                              )}
                            </Button>
                          </div>

                        <div className="bg-gradient-to-r from-[var(--brand-primary-light)] to-blue-50 rounded-xl p-4 border-2 border-[var(--brand-primary)]/30 mb-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-gray-600 font-medium mb-1">Calorie Totali</p>
                                <p className="text-2xl font-bold text-[var(--brand-primary)]">{Math.round(dailyTotals.calories)}</p>
                                <p className="text-xs text-gray-500">kcal</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-600 font-medium mb-1">Proteine</p>
                                <p className="text-2xl font-bold text-red-600">{Math.round(dailyTotals.protein)}</p>
                                <p className="text-xs text-gray-500">g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-600 font-medium mb-1">Carboidrati</p>
                                <p className="text-2xl font-bold text-blue-600">{Math.round(dailyTotals.carbs)}</p>
                                <p className="text-xs text-gray-500">g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-600 font-medium mb-1">Grassi</p>
                                <p className="text-2xl font-bold text-yellow-600">{Math.round(dailyTotals.fat)}</p>
                                <p className="text-xs text-gray-500">g</p>
                            </div>
                            </div>
                            {nutritionData?.daily_calories && (
                            <div className="mt-3 pt-3 border-t border-[var(--brand-primary)]/20">
                                <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Target giornaliero: {nutritionData.daily_calories} kcal</span>
                                <span className={`font-semibold ${
                                    Math.abs(dailyTotals.calories - nutritionData.daily_calories) <= 50 
                                    ? 'text-green-600' 
                                    : 'text-amber-600'
                                }`}>
                                    {dailyTotals.calories > nutritionData.daily_calories ? '+' : ''}
                                    {Math.round(dailyTotals.calories - nutritionData.daily_calories)} kcal
                                </span>
                                </div>
                            </div>
                            )}
                        </div>

                        {mealTypes.map((mealType) => {
                            const meal = todaysMeals.find(m => m.meal_type === mealType);
                            return meal ? (
                            <div key={meal.id} className="relative w-full text-left bg-gray-50/80 rounded-lg p-3 border border-gray-200/60 hover:bg-gray-100 transition-colors group">
                                <button onClick={() => setSelectedMeal(meal)} className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-3 text-left">
                                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden">
                                    {meal.image_url ? (
                                        <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover"/>
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse"/>
                                    )}
                                    </div>
                                    <div className="text-left">
                                    <p className="font-semibold text-gray-800 text-left">{getMealTypeLabel(meal.meal_type)}</p>
                                    <p className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-xs text-left">{meal.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">{meal.total_calories} <span className="text-xs font-normal text-gray-500">kcal</span></p>
                                </div>
                                </button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => regenerateSingleMeal(meal)}
                                  disabled={regeneratingMealId === meal.id}
                                  className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 rounded-full text-gray-500 hover:text-[var(--brand-primary)] hover:bg-gray-200/50"
                                  title="Rigenera questo pasto"
                                >
                                  {regeneratingMealId === meal.id ? (
                                    <RotateCcw className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
                                  ) : (
                                    <RotateCcw className="w-4 h-4" />
                                  )}
                                </Button>
                            </div>
                            ) : null;
                        })}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                        <Utensils className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium text-lg">Nessun dato per {getDayLabel(selectedDay)}</p>
                        <p className="text-sm text-gray-400 mt-1">Genera un piano per popolare i dati.</p>
                        </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
            </>
            ) : (
            showGenerator === false && (
                <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 mb-4">Nessun Protocollo Nutrizionale</CardTitle>
                    <p className="text-gray-600 mb-6">
                    Genera il tuo piano personalizzato per iniziare.
                    </p>
                </CardContent>
                </Card>
            )
            )}
        </div>
      </div>
    {selectedMeal && (
      <MealDetailModal 
        meal={selectedMeal} 
        onClose={() => setSelectedMeal(null)}
        onMealUpdate={handleMealUpdate}
      />
    )}
    {showShoppingList && (
        <ShoppingListModal
          isOpen={showShoppingList}
          user={user}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    {showUpgradeModal && (
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={user?.subscription_plan || 'base'}
      />
    )}
    </>
  );
}
