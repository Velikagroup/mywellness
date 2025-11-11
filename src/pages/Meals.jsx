import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw, Loader2 } from "lucide-react";
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
  if (name.match(/(pollo|tacchino|manzo|maiale|vitello|agnello|salsiccia|salame|prosciutto|bresaola|speck|salmone|tonno|merluzzo|orata|branzino|gamberi|calamari|polpo|acciughe|sgombro)/)) return 'carne_pesce';
  if (name.match(/(latte|yogurt|formaggio|mozzarella|parmigiano|ricotta|burro|panna|uova|scamorza|gorgonzola)/)) return 'latticini_uova';
  if (name.match(/(mela|banana|arancia|pera|kiwi|fragola|pesca|albicocca|uva|melone|anguria|limone|pompelmo|insalata|lattuga|pomodor|cetriolo|carota|zucchina|peperone|melanzana|broccoli|cavolfiore|spinaci|rucola|sedano|cipolla|aglio|patata)/)) return 'frutta_verdura';
  if (name.match(/(riso|pasta|pane|farro|orzo|quinoa|couscous|avena|cereali|farina|crackers)/)) return 'cereali_pasta';
  if (name.match(/(fagioli|lenticchie|ceci|piselli|mandorle|noci|nocciole|pistacchi|anacardi)/)) return 'legumi_frutta_secca';
  if (name.match(/(olio|aceto|sale|pepe|zucchero|miele|spezie|basilica|origano|rosmarino|salvia|timo|curry|paprika)/)) return 'condimenti_spezie';
  if (name.match(/(acqua|tè|caffè|succo|bevanda)/)) return 'bevande';
  return 'altro';
};

const GenerateMealPlan = ({ generationProgress, generationStatus, nutritionData }) => {
  const getStepStatus = (stepThreshold) => {
    if (generationProgress >= stepThreshold) return 'completed';
    if (generationProgress >= stepThreshold - 15 && generationProgress < stepThreshold) return 'in-progress';
    return 'pending';
  };

  const renderStepIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="inline w-3 h-3 mr-2 text-green-500" />;
    if (status === 'in-progress') return <Loader2 className="inline w-3 h-3 mr-2 text-[var(--brand-primary)] animate-spin" />;
    return <CheckCircle className="inline w-3 h-3 mr-2 text-gray-300" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-0">
      <div className="max-w-2xl mx-auto">
        <Card className="max-w-2xl w-full bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl text-center">
          <CardHeader>
            <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/videos/ai-generating-loop.mp4" type="video/mp4" />
              </video>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Creazione Protocollo Nutrizionale AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <p className="text-gray-600">L'AI sta elaborando migliaia di dati per creare un piano alimentare scientifico e su misura per te.</p>
            <Progress value={generationProgress} className="w-full [&>div]:bg-[var(--brand-primary)]" />
            <p className="text-sm text-[var(--brand-primary)] font-semibold h-5">{generationStatus}</p>
            <div className="text-xs text-gray-500 list-inside text-left mx-auto max-w-md bg-gray-50/70 p-4 rounded-lg border border-gray-200/60">
              <h4 className="font-semibold text-gray-700 mb-2">Analisi in corso:</h4>
              <ul className="space-y-1">
                <li>{renderStepIcon(getStepStatus(10))}Profilo metabolico (BMR: {nutritionData?.bmr} kcal)</li>
                <li>{renderStepIcon(getStepStatus(25))}Target calorico ({nutritionData?.daily_calories} kcal/giorno)</li>
                <li>{renderStepIcon(getStepStatus(50))}Bilanciamento calorico automatico</li>
                <li>{renderStepIcon(getStepStatus(60))}Piano nutrizionale generato</li>
                <li>{renderStepIcon(getStepStatus(70))}Generazione immagini pasti</li>
                <li>{renderStepIcon(getStepStatus(95))}Costruzione e salvataggio piano</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function MealsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [selectedDay, setSelectedDay] = useState('monday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [generationPrefs, setGenerationPrefs] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [addedDays, setAddedDays] = useState([]);
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(5);

  // ✅ Query utente con SDK corretto
  const { data: user, isLoading: isLoadingUser, isError: isUserError, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const nutritionData = user ? {
    bmr: user.bmr,
    daily_calories: user.daily_calories,
    diet_type: user.diet_type,
    intermittent_fasting: user.intermittent_fasting,
    if_skip_meal: user.if_skip_meal,
    if_meal_structure: user.if_meal_structure,
    allergies: user.allergies,
    favorite_foods: user.favorite_foods,
    weight_loss_speed: user.weight_loss_speed,
    workout_days: user.workout_days,
    age: user.age,
    gender: user.gender,
    current_weight: user.current_weight,
    height: user.height,
    target_weight: user.target_weight,
    activity_level: user.activity_level,
  } : null;

  // ✅ Query pasti con SDK corretto
  const { data: mealPlans = [], isLoading: isLoadingMealPlans } = useQuery({
    queryKey: ['mealPlans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.MealPlan.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const startOfWeek = getStartOfWeek();
  const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery({
    queryKey: ['shoppingLists', user?.id, startOfWeek],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.ShoppingList.filter({ user_id: user.id, week_start_date: startOfWeek });
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  // ✅ Mutations con SDK corretto
  const updateShoppingListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShoppingList.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists'] }),
  });

  const createShoppingListMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingList.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingLists'] }),
  });

  const updateMealMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MealPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mealPlans'] }),
  });

  const createMealMutation = useMutation({
    mutationFn: (data) => base44.entities.MealPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mealPlans'] }),
  });

  const deleteMealMutation = useMutation({
    mutationFn: (id) => base44.entities.MealPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mealPlans'] }),
  });

  const loadMealPlans = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: ['mealPlans', user.id] });
    }
  }, [queryClient, user?.id]);

  const handleShowGenerator = useCallback((currentUser) => {
    if (currentUser) {
      setGenerationPrefs({
        diet_type: currentUser.diet_type || 'mediterranean',
        intermittent_fasting: currentUser.intermittent_fasting || false,
        if_skip_meal: currentUser.if_skip_meal || null,
        if_meal_structure: currentUser.if_meal_structure || null,
      });
      
      if (currentUser.intermittent_fasting && currentUser.if_meal_structure) {
        if (currentUser.if_meal_structure === '2_meals') setMealsPerDay(2);
        else if (currentUser.if_meal_structure === '3_meals') setMealsPerDay(3);
        else if (currentUser.if_meal_structure === '3_meals_snacks') setMealsPerDay(5);
        else setMealsPerDay(5);
      } else {
        setMealsPerDay(5);
      }
    }
    setShowGenerator(true);
  }, []);
  
  useEffect(() => {
    if (isUserError && userError?.response?.status === 401) {
      navigate(createPageUrl('Home'));
      return;
    }

    if (user && !isLoadingMealPlans && mealPlans.length === 0) {
      const generatorShown = sessionStorage.getItem('mealGeneratorShown');
      if (!generatorShown) {
        handleShowGenerator(user);
        sessionStorage.setItem('mealGeneratorShown', 'true');
      }
    }
  }, [user, isUserError, userError, mealPlans, isLoadingMealPlans, navigate, handleShowGenerator]);

  useEffect(() => {
    if (user && !isLoadingShoppingLists && shoppingLists.length > 0) {
      const currentList = shoppingLists[0];
      const daysInList = new Set();
      currentList.items?.forEach(item => {
        item.days?.forEach(day => daysInList.add(day));
      });
      setAddedDays(Array.from(daysInList));
    } else {
      setAddedDays([]);
    }
  }, [user, shoppingLists, isLoadingShoppingLists]);
  
  const handlePrefsChange = (key, value) => {
    const newPrefs = { ...generationPrefs, [key]: value };
    if (key === 'intermittent_fasting' && value === false) {
      newPrefs.if_skip_meal = null;
      newPrefs.if_meal_structure = null;
    }
    setGenerationPrefs(newPrefs);
  };

  const handleMealUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    setSelectedMeal(null);
  };

  const addDayToShoppingList = async (dayKey) => {
    if (!user) return;
    
    try {
      const dayMeals = mealPlans.filter(m => m.day_of_week === dayKey);
      if (dayMeals.length === 0) {
        alert('Nessun pasto per questo giorno da aggiungere alla lista.');
        return;
      }

      let currentList = shoppingLists.length > 0 ? shoppingLists[0] : null;
      const ingredientsMap = new Map();
      
      dayMeals.forEach(meal => {
        meal.ingredients?.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key);
            existing.quantity += ing.quantity;
            if (!existing.days.includes(dayKey)) existing.days.push(dayKey);
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

        await updateShoppingListMutation.mutateAsync({
          id: currentList.id,
          data: {
            items: Array.from(existingItemsMap.values()),
            last_updated: new Date().toISOString()
          }
        });
      } else {
        await createShoppingListMutation.mutateAsync({
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
      alert("Errore nell'aggiunta degli ingredienti. Riprova.");
    }
  };

  const regenerateSingleMeal = async (mealToRegenerate) => {
    if (!user || !nutritionData) return;
    setRegeneratingMealId(mealToRegenerate.id);
    
    try {
      const dailyCalories = nutritionData.daily_calories;
      const targetCalories = Math.round(dailyCalories / mealsPerDay);

      const singleMealPrompt = `You are an expert AI nutritionist. Create ONE single meal in ITALIAN language.

Target Calories: ${targetCalories} kcal (±20 kcal acceptable)
Diet Type: ${nutritionData.diet_type}
User: ${nutritionData.gender}, ${nutritionData.age} anni, ${nutritionData.current_weight}kg

Generate ONE creative meal in Italian that hits ${targetCalories} kcal. Different from: "${mealToRegenerate.name}"`;

      const llmResponse = await base44.integrations.Core.InvokeLLM({
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
                }
              }
            },
            instructions: { type: "array", items: { type: "string" } },
            prep_time: { type: "number" },
            difficulty: { type: "string" }
          }
        }
      });

      const total_calories = Math.round(llmResponse.ingredients.reduce((sum, ing) => sum + ing.calories, 0));
      const ingredientsString = llmResponse.ingredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const imagePrompt = `Professional food photography of "${llmResponse.name}". Ingredients: ${ingredientsString}. 45-degree angle, modern plate, natural lighting.`;
      
      const imageResponse = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });

      await updateMealMutation.mutateAsync({
        id: mealToRegenerate.id,
        data: {
          name: llmResponse.name,
          ingredients: llmResponse.ingredients,
          instructions: llmResponse.instructions,
          total_calories: total_calories,
          total_protein: Math.round(llmResponse.ingredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10,
          total_carbs: Math.round(llmResponse.ingredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10,
          total_fat: Math.round(llmResponse.ingredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10,
          prep_time: llmResponse.prep_time,
          difficulty: llmResponse.difficulty,
          image_url: imageResponse.url
        }
      });
      
      alert(`✅ Pasto rigenerato: "${llmResponse.name}" (${total_calories} kcal)`);
    } catch (error) {
      console.error("Error regenerating meal:", error);
      alert(`Errore: ${error.message}`);
    } finally {
      setRegeneratingMealId(null);
    }
  };

  const generateMealPlan = async () => {
    if (!user || !generationPrefs || !nutritionData?.daily_calories) {
      alert('Errore: dati utente mancanti. Ricarica la pagina.');
      return;
    }
    
    console.log('🚀 Inizio generazione piano nutrizionale...');
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Avvio protocollo AI...");

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, "Analisi profilo metabolico...");

      const allMealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
      const mealStructure = allMealTypes.slice(0, mealsPerDay);
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const isTrialUser = user?.subscription_status === 'trial';
      const daysToGenerate = isTrialUser ? allDays.slice(0, 3) : allDays;

      const dailyCalories = nutritionData.daily_calories;
      const caloriesPerMeal = Math.round(dailyCalories / mealsPerDay);

      console.log('📊 Config:', { mealsPerDay, dailyCalories, daysToGenerate: daysToGenerate.length });

      const mealPlanPrompt = `You are an expert AI nutritionist. Create ${daysToGenerate.length * mealsPerDay} meals in ITALIAN.

DAILY TARGET: ${dailyCalories} kcal
MEALS PER DAY: ${mealsPerDay}
CALORIES PER MEAL: ~${caloriesPerMeal} kcal

Days: ${daysToGenerate.join(', ')}
Meal types: ${mealStructure.join(', ')}

User: ${nutritionData.gender}, ${nutritionData.age} anni, ${nutritionData.current_weight}kg
Diet: ${generationPrefs.diet_type}
${nutritionData.allergies?.length > 0 ? `Allergies: ${nutritionData.allergies.join(', ')}` : ''}

Generate ${daysToGenerate.length * mealsPerDay} meals total. Each meal ~${caloriesPerMeal} kcal.
Italian names, ingredients, instructions.`;

      updateProgress(20, "Generazione pasti con AI...");

      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: mealPlanPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            meal_plans: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_of_week: { type: "string" },
                  meal_type: { type: "string" },
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
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      updateProgress(50, "Piano creato! Validazione...");
      console.log('✅ Ricevuti', llmResponse.meal_plans?.length, 'pasti');

      if (!llmResponse.meal_plans || llmResponse.meal_plans.length === 0) {
        throw new Error('AI non ha generato pasti validi');
      }

      // ✅ Cancella piani esistenti
      updateProgress(65, "Rimozione piani precedenti...");
      for (const plan of mealPlans) {
        await deleteMealMutation.mutateAsync(plan.id);
      }
      
      updateProgress(70, "Generazione immagini AI...");

      // ✅ Salva preferenze utente
      await base44.auth.updateMe({
        diet_type: generationPrefs.diet_type,
        intermittent_fasting: generationPrefs.intermittent_fasting,
        if_skip_meal: generationPrefs.if_skip_meal,
        if_meal_structure: generationPrefs.if_meal_structure,
      });

      const totalMeals = llmResponse.meal_plans.length;
      const batchSize = 5;

      for (let i = 0; i < totalMeals; i += batchSize) {
        const batch = llmResponse.meal_plans.slice(i, i + batchSize);
        const batchProgress = 70 + Math.round((i / totalMeals) * 25);
        updateProgress(batchProgress, `Generazione immagini: ${i + batch.length}/${totalMeals}...`);
        
        const mealsWithImages = await Promise.all(batch.map(async (meal) => {
          try {
            const ingredientsString = meal.ingredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ');
            const imagePrompt = `Professional food photography of "${meal.name}". Ingredients: ${ingredientsString}. 45-degree angle, modern plate, natural lighting.`;
            const imageResponse = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
            return { ...meal, image_url: imageResponse.url };
          } catch (error) {
            console.error(`Image error for ${meal.name}:`, error);
            return { ...meal, image_url: null };
          }
        }));

        // ✅ Salva batch di pasti
        updateProgress(batchProgress + 3, `Salvataggio pasti ${i + batch.length}/${totalMeals}...`);
        for (const meal of mealsWithImages) {
          await createMealMutation.mutateAsync({
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
      }

      updateProgress(100, "Piano generato con successo!");
      console.log('✅ Generazione completata!');
      
      setTimeout(async () => {
        setIsGenerating(false);
        setShowGenerator(false);
        await loadMealPlans();
        setAddedDays([]);
      }, 1000);

    } catch (error) {
      console.error("💥 Errore generazione:", error);
      setGenerationStatus(`Errore: ${error.message}. Riprova.`);
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
        setGenerationStatus('');
      }, 5000);
    }
  };

  const isPageLoading = isLoadingUser || isLoadingMealPlans || isLoadingShoppingLists;

  if (isPageLoading) {
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
    { key: 'friday', label: 'Venerdì' },
    { key: 'saturday', label: 'Sabato' },
    { key: 'sunday', label: 'Domenica' }
  ];

  const isTrialUser = user?.subscription_status === 'trial';
  const availableDays = isTrialUser ? days.slice(0, 3) : days;
  const todaysMeals = mealPlans.filter(plan => plan.day_of_week === selectedDay);
  
  const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
  const getMealTypeLabel = (type) => {
    const labels = { 
      breakfast: 'Colazione', lunch: 'Pranzo', dinner: 'Cena',
      snack1: 'Spuntino', snack2: 'Spuntino Serale',
      snack3: 'Snack Pomeridiano', snack4: 'Spuntino Notturno'
    };
    return labels[type] || type;
  };

  const dailyTotals = todaysMeals.reduce((totals, meal) => ({
    calories: totals.calories + (meal.total_calories || 0),
    protein: totals.protein + (meal.total_protein || 0),
    carbs: totals.carbs + (meal.total_carbs || 0),
    fat: totals.fat + (meal.total_fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const getDayLabel = (dayKey) => days.find(d => d.key === dayKey)?.label || dayKey;

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

          {mealPlans.length > 0 && (
            <AIFeedbackBox user={user} onPlanRegenerated={loadMealPlans} />
          )}

          {showGenerator && (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Genera Protocollo Nutrizionale con AI</CardTitle>
                <p className="text-sm text-gray-500">Conferma o modifica le tue preferenze. L'AI creerà un piano completo.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-br from-[var(--brand-primary-light)] to-blue-50 rounded-lg border-2 border-[var(--brand-primary)]/30">
                    <Label className="text-sm font-semibold text-gray-800 mb-3 block">🍽️ Quanti pasti al giorno?</Label>
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
                      💡 Target giornaliero: <strong>{nutritionData?.daily_calories} kcal</strong> su {mealsPerDay} {mealsPerDay === 1 ? 'pasto' : 'pasti'}
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
                    <Button variant="outline" onClick={() => setShowGenerator(false)}>Annulla</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {mealPlans.length > 0 ? (
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
                  {isTrialUser && Array(4).fill(0).map((_, i) => (
                    <button key={`locked-${i}`} onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 text-sm font-medium rounded-t-md text-gray-400 border-b-2 border-transparent hover:text-[var(--brand-primary)] hover:scale-105 transition-all cursor-pointer">🔒</button>
                  ))}
                </div>

                <div className="min-h-[300px]">
                  {todaysMeals.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-lg">Protocollo di {getDayLabel(selectedDay)}</h4>
                        <Button
                          onClick={() => addDayToShoppingList(selectedDay)}
                          size="sm"
                          variant="outline"
                          className="border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                          disabled={addedDays.includes(selectedDay)}
                        >
                          {addedDays.includes(selectedDay) ? (
                            <><Check className="w-4 h-4 mr-1" />Aggiunto</>
                          ) : (
                            <><Plus className="w-4 h-4 mr-1" />Aggiungi a Lista Spesa</>
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
                              <span className={`font-semibold ${Math.abs(dailyTotals.calories - nutritionData.daily_calories) <= 50 ? 'text-green-600' : 'text-amber-600'}`}>
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
                                  <p className="font-semibold text-gray-800">{getMealTypeLabel(meal.meal_type)}</p>
                                  <p className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-xs">{meal.name}</p>
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
          ) : (
            !showGenerator && (
              <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Database className="w-8 h-8 text-gray-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 mb-4">Nessun Protocollo Nutrizionale</CardTitle>
                  <p className="text-gray-600 mb-6">Genera il tuo piano personalizzato per iniziare.</p>
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
        <ShoppingListModal isOpen={showShoppingList} user={user} onClose={() => setShowShoppingList(false)} />
      )}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={user?.subscription_plan || 'base'} />
      )}
    </>
  );
}