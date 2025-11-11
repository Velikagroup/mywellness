import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw, Loader2, Activity } from "lucide-react";
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

const getDietRules = (dietType) => {
  const rules = {
    mediterranean: {
      allowed: "frutta, verdura, legumi, cereali integrali (pasta, riso, pane integrale), pesce (salmone, tonno, branzino), olio d'oliva, noci, semi, pollame, latticini (yogurt, formaggi), uova",
      forbidden: "carne rossa in eccesso, cibi ultra-processati, zuccheri raffinati",
      focus: "Grassi sani (monoinsaturi), cereali integrali, pesce, verdure fresche"
    },
    low_carb: {
      allowed: "carne (manzo, pollo, maiale), pesce, uova, formaggi, verdure a basso contenuto di carboidrati (broccoli, spinaci, zucchine, cavolfiore), avocado, noci, oli vegetali, burro",
      forbidden: "pane, pasta, riso, patate, zuccheri, dolci, legumi, frutta ad alto contenuto di zuccheri",
      focus: "Proteine alte, grassi sani, carboidrati molto bassi (<100g/giorno)"
    },
    soft_low_carb: {
      allowed: "carne, pesce, uova, formaggi, verdure, avocado, noci, oli, piccole quantità di cereali integrali (avena, quinoa), frutta a basso indice glicemico (bacche, mele)",
      forbidden: "pane bianco, pasta raffinata, riso bianco, patate, zuccheri raffinati, dolci industriali",
      focus: "Riduzione carboidrati ma con più flessibilità rispetto alla Low Carb"
    },
    paleo: {
      allowed: "carne magra (manzo, pollo, tacchino), pesce, frutti di mare, uova, verdura, frutta, noci, semi, oli sani (oliva, cocco, avocado), miele grezzo",
      forbidden: "cereali (pane, pasta, riso), legumi (fagioli, lenticchie, ceci), latticini, zuccheri raffinati, oli vegetali processati, cibi industriali",
      focus: "Solo alimenti disponibili nell'era paleolitica - niente cereali, legumi, latticini"
    },
    keto: {
      allowed: "carne grassa (manzo, maiale, agnello), pesce grasso (salmone, sgombro), uova, formaggi grassi, burro, oli (oliva, cocco, MCT), avocado, noci, semi, verdure a foglia verde (spinaci, lattuga, rucola)",
      forbidden: "cereali, pane, pasta, riso, patate, legumi, frutta (tranne piccole quantità di bacche), zuccheri, dolci",
      focus: "Grassi molto alti (70-75%), proteine moderate (20-25%), carboidrati bassissimi (<20-50g/giorno) per indurre chetosi"
    },
    carnivore: {
      allowed: "SOLO prodotti animali: carne rossa (manzo, vitello, agnello, maiale), frattaglie (fegato, cuore, reni), pesce, frutti di mare, uova, burro, ghee, strutto, sego, sale",
      forbidden: "ASSOLUTAMENTE VIETATI: verdure, frutta, cereali, legumi, noci, semi, oli vegetali, latticini (eccetto burro/ghee), zuccheri, condimenti vegetali, spezie (tranne sale)",
      focus: "100% prodotti animali - ZERO vegetali. Solo carne, pesce, uova, grassi animali, sale e acqua"
    },
    vegetarian: {
      allowed: "frutta, verdura, cereali integrali, legumi (fagioli, lenticchie, ceci), latticini (latte, yogurt, formaggi), uova, tofu, tempeh, noci, semi, oli vegetali",
      forbidden: "carne (manzo, pollo, maiale), pesce, frutti di mare",
      focus: "Proteine da latticini, uova e legumi. Include tutti i vegetali"
    },
    vegan: {
      allowed: "frutta, verdura, cereali integrali, legumi, tofu, tempeh, seitan, latte vegetale (soia, mandorla, avena), noci, semi, oli vegetali, nutritional yeast",
      forbidden: "TUTTI i prodotti animali: carne, pesce, latticini, uova, miele, gelatina",
      focus: "100% vegetale - proteine da legumi, tofu, tempeh, seitan"
    }
  };

  return rules[dietType] || rules.mediterranean;
};

const getStartOfWeek = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

const startOfWeek = getStartOfWeek();

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
      <style>{`
        @keyframes energyPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)); }
        }
        @keyframes containerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.3), 0 0 40px rgba(38, 132, 127, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 30px rgba(38, 132, 127, 0.5), 0 0 60px rgba(38, 132, 127, 0.3), inset 0 0 25px rgba(34, 197, 94, 0.2); }
        }
        .animated-nutrition-container { animation: containerGlow 2s ease-in-out infinite; background: linear-gradient(135deg, #26847F 0%, #14b8a6 50%, #22c55e 100%); }
        .animated-energy-icon { animation: energyPulse 1.5s ease-in-out infinite; }
      `}</style>
      <div className="max-w-2xl mx-auto">
        <Card className="max-w-2xl w-full bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl text-center">
          <CardHeader>
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden animated-nutrition-container flex items-center justify-center">
              <Activity className="w-10 h-10 text-white animated-energy-icon" strokeWidth={2.5} />
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
                <li>{renderStepIcon(getStepStatus(70))}Validazione database ingredienti</li>
                <li>{renderStepIcon(getStepStatus(85))}Generazione immagini pasti</li>
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

  const { data: mealPlans = [], isLoading: isLoadingMealPlans } = useQuery({
    queryKey: ['mealPlans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.MealPlan.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  const { data: shoppingLists = [], isLoading: isLoadingShoppingLists } = useQuery({
    queryKey: ['shoppingLists', user?.id, startOfWeek],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.ShoppingList.filter({ user_id: user.id, week_start_date: startOfWeek });
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

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
      let targetCalories = Math.round(mealToRegenerate.total_calories || 0);
      
      if (targetCalories <= 0) {
        const dailyTarget = nutritionData.daily_calories || 1586;
        const mealTypeCalories = {
          'breakfast': Math.round(dailyTarget * 0.20),
          'snack1': Math.round(dailyTarget * 0.08),
          'lunch': Math.round(dailyTarget * 0.30),
          'snack2': Math.round(dailyTarget * 0.08),
          'dinner': Math.round(dailyTarget * 0.25),
          'snack3': Math.round(dailyTarget * 0.05),
          'snack4': Math.round(dailyTarget * 0.04)
        };
        
        targetCalories = mealTypeCalories[mealToRegenerate.meal_type] || Math.round(dailyTarget * 0.15);
        console.log(`⚠️ Pasto con calorie invalide (${mealToRegenerate.total_calories}). Usando target calcolato: ${targetCalories} kcal per ${mealToRegenerate.meal_type}`);
      }

      console.log(`🎯 Target ESATTO per rigenerazione: ${targetCalories} kcal`);

      const dietRules = getDietRules(nutritionData.diet_type || 'mediterranean');

      const singleMealPrompt = `You are an expert AI nutritionist with access to comprehensive nutritional databases. Create ONE single meal in ITALIAN language.

🔴 ULTRA CRITICAL REQUIREMENT 🔴
Target Calories: EXACTLY ${targetCalories} kcal
Tolerance: MAXIMUM ±5 kcal (ideally 0 kcal error)

🔥 CRITICAL DIET TYPE: ${(nutritionData.diet_type || 'mediterranean').toUpperCase()}

📋 STRICT DIET RULES FOR ${(nutritionData.diet_type || 'mediterranean').toUpperCase()}:

✅ ALLOWED INGREDIENTS:
${dietRules.allowed}

❌ ABSOLUTELY FORBIDDEN INGREDIENTS:
${dietRules.forbidden}

🎯 DIET FOCUS:
${dietRules.focus}

⚠️ YOU MUST RESPECT THESE RULES 100% - NO EXCEPTIONS!

User Profile:
- Gender: ${nutritionData.gender}, Age: ${nutritionData.age} anni, Weight: ${nutritionData.current_weight}kg
${nutritionData.allergies?.length > 0 ? `- Allergies: ${nutritionData.allergies.join(', ')}` : ''}
${nutritionData.favorite_foods?.length > 0 ? `- Favorite Foods: ${nutritionData.favorite_foods.join(', ')}` : ''}

Meal Type: ${mealToRegenerate.meal_type}

🚨 ABSOLUTE MANDATORY NUTRITIONAL ACCURACY RULES:

1. CONSULT VERIFIED DATABASES:
   - Use USDA FoodData Central
   - Use CREA-Alimenti (Italian food database)
   - Cross-reference multiple sources for accuracy

2. REALISTIC NUTRITIONAL VALUES (verified from USDA/CREA):
   - Uovo medio intero (60g): calories=86, protein=7.5g, carbs=0.3g, fat=6.0g
   - Manzo magro (100g): calories=121, protein=20.5g, carbs=0.0g, fat=4.0g
   - Petto di pollo (100g): calories=110, protein=23.0g, carbs=0.0g, fat=1.2g
   - Salmone fresco (100g): calories=208, protein=20.0g, carbs=0.0g, fat=13.4g
   - Olio d'oliva (10ml): calories=90, protein=0.0g, carbs=0.0g, fat=10.0g
   - Burro (10g): calories=75, protein=0.1g, carbs=0.1g, fat=8.3g
   - Spinaci freschi (100g): calories=23, protein=2.9g, carbs=3.6g, fat=0.4g
   - Riso basmati cotto (100g): calories=121, protein=2.7g, carbs=25.2g, fat=0.4g

3. PRECISION REQUIREMENTS:
   - ALL macronutrients MUST be rounded to EXACTLY 1 decimal place
   - NEVER use 0 for macros unless scientifically verified (meat=0 carbs, salt=0 macros)
   - Small amounts matter: eggs have ~0.3-0.4g carbs per egg, butter has trace protein/carbs
   - Verify: sum of (protein×4 + carbs×4 + fat×9) ≈ total calories (±10% tolerance)

4. CALCULATION ACCURACY:
   - Calculate PRECISELY to hit ${targetCalories} kcal (±5 kcal MAX)
   - Verify: sum of ingredient calories MUST equal ${targetCalories} kcal
   - If too low: add healthy fats (butter, olive oil, nuts allowed in diet)
   - If too high: reduce portions proportionally

Task:
Generate ONE meal in Italian hitting EXACTLY ${targetCalories} kcal.
Must be DIFFERENT from: "${mealToRegenerate.name}"
Use ONLY ingredients from the ALLOWED list.
Use VERIFIED nutritional data from USDA/CREA databases.
Calculate ALL macros with scientific PRECISION (1 decimal place).

All content MUST be in Italian.`;

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

      let validIngredients = llmResponse.ingredients.filter(ing => 
        ing.name && 
        ing.quantity != null && 
        ing.unit && 
        ing.calories != null && 
        ing.protein != null && 
        ing.carbs != null && 
        ing.fat != null
      );

      if (validIngredients.length === 0) {
        throw new Error('Nessun ingrediente valido generato dall\'AI');
      }

      // Round all macros to 1 decimal place
      validIngredients = validIngredients.map(ing => ({
        ...ing,
        protein: Math.round(ing.protein * 10) / 10,
        carbs: Math.round(ing.carbs * 10) / 10,
        fat: Math.round(ing.fat * 10) / 10
      }));

      // 🆕 SALVA INGREDIENTI NEL DATABASE (in background, non blocca il flusso)
      try {
        await base44.functions.invoke('validateAndSaveIngredient', {
          ingredients: validIngredients
        });
        console.log('🗃️ Ingredienti salvati nel database');
      } catch (dbError) {
        console.warn('⚠️ Errore salvataggio database ingredienti (non critico):', dbError);
      }

      let currentCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
      const calorieDifference = targetCalories - currentCalories;
      
      console.log(`🔍 Calorie AI: ${currentCalories} kcal, Target: ${targetCalories} kcal, Diff: ${calorieDifference} kcal`);

      if (calorieDifference !== 0) {
        console.log(`⚙️ Aggiustamento automatico di ${calorieDifference} kcal...`);
        
        if (calorieDifference > 0) {
          const oilMl = Math.round(calorieDifference / 9);
          const oilCalories = oilMl * 9;
          
          validIngredients.push({
            name: "olio d'oliva extra vergine",
            quantity: oilMl,
            unit: "ml",
            calories: oilCalories,
            protein: 0.0,
            carbs: 0.0,
            fat: Math.round(oilMl * 10) / 10
          });
          
          currentCalories += oilCalories;
          console.log(`✅ Aggiunti ${oilMl}ml di olio (+${oilCalories} kcal)`);
        } else {
          const scaleFactor = targetCalories / currentCalories;
          console.log(`📉 Scala ingredienti del ${(scaleFactor * 100).toFixed(1)}%`);
          
          validIngredients = validIngredients.map(ing => ({
            ...ing,
            quantity: Math.round(ing.quantity * scaleFactor * 100) / 100,
            calories: Math.round(ing.calories * scaleFactor),
            protein: Math.round(ing.protein * scaleFactor * 10) / 10,
            carbs: Math.round(ing.carbs * scaleFactor * 10) / 10,
            fat: Math.round(ing.fat * scaleFactor * 10) / 10
          }));
          
          currentCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
        }
      }

      const remainingDiff = targetCalories - currentCalories;
      if (remainingDiff !== 0) {
        console.log(`🔧 Aggiustamento finale: ${remainingDiff} kcal`);
        
        let ingredientToAdjust = validIngredients.find(ing => 
            ing.name.toLowerCase().includes("olio d'oliva") || 
            ing.name.toLowerCase().includes("burro") || 
            ing.name.toLowerCase().includes("avocado")
        );
        
        if (!ingredientToAdjust && validIngredients.length > 0) {
            ingredientToAdjust = validIngredients.reduce((max, ing) => (ing.calories > max.calories ? ing : max), validIngredients[0]);
        }

        if (ingredientToAdjust) {
            ingredientToAdjust.calories += remainingDiff;
            currentCalories += remainingDiff;
            if (ingredientToAdjust.name.toLowerCase().includes("olio d'oliva")) {
                ingredientToAdjust.fat = Math.round((ingredientToAdjust.fat + (remainingDiff / 9)) * 10) / 10;
            }
        }
      }

      const total_protein = Math.round(validIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10;
      const total_carbs = Math.round(validIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10;
      const total_fat = Math.round(validIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10;
      
      console.log(`✅ Calorie finali: ${currentCalories} kcal (Target: ${targetCalories} kcal, Errore: ${currentCalories - targetCalories} kcal)`);
      console.log(`📊 Macros: Proteine=${total_protein}g, Carbs=${total_carbs}g, Grassi=${total_fat}g`);
      
      const ingredientsString = validIngredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const imagePrompt = `Professional food photography of "${llmResponse.name}". Ingredients: ${ingredientsString}. 45-degree angle, modern plate, natural lighting.`;
      
      const imageResponse = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });

      await updateMealMutation.mutateAsync({
        id: mealToRegenerate.id,
        data: {
          name: llmResponse.name,
          ingredients: validIngredients,
          instructions: llmResponse.instructions,
          total_calories: currentCalories,
          total_protein: total_protein,
          total_carbs: total_carbs,
          total_fat: total_fat,
          prep_time: llmResponse.prep_time || 15,
          difficulty: llmResponse.difficulty || 'easy',
          image_url: imageResponse.url
        }
      });
      
      alert(`✅ Pasto rigenerato: "${llmResponse.name}" (${currentCalories} kcal - Errore: ${currentCalories - targetCalories} kcal)`);
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
      
      const mealCalorieDistribution = {};
      
      if (mealsPerDay === 5) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.25);
      } else if (mealsPerDay === 6) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.20);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack3 = Math.round(dailyCalories * 0.10);
      } else if (mealsPerDay === 7) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.20);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.08);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack2 = Math.round(dailyCalories * 0.08);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack3 = Math.round(dailyCalories * 0.07);
        mealCalorieDistribution.snack4 = Math.round(dailyCalories * 0.07);
      } else {
        const caloriesPerMeal = Math.round(dailyCalories / mealsPerDay);
        mealStructure.forEach((mealType) => {
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

      console.log('📊 Config:', { mealsPerDay, dailyCalories, daysToGenerate: daysToGenerate.length });
      console.log('🎯 Distribuzione calorie:', mealCalorieDistribution);
      console.log('✅ Totale distribuzione:', Object.values(mealCalorieDistribution).reduce((a,b) => a+b, 0), 'kcal');

      const dietRules = getDietRules(generationPrefs.diet_type);

      const mealPlanPrompt = `You are an expert AI nutritionist with access to comprehensive nutritional databases. Create ${daysToGenerate.length * mealsPerDay} meals in ITALIAN.

🔴 CRITICAL CALORIE REQUIREMENT 🔴
DAILY CALORIE TARGET: ${dailyCalories} kcal
NUMBER OF MEALS PER DAY: ${mealsPerDay}

EXACT CALORIE DISTRIBUTION PER MEAL (MUST FOLLOW EXACTLY):
${Object.entries(mealCalorieDistribution).map(([type, cals]) => `- ${type}: ${cals} kcal`).join('\n')}

TOTAL DAILY: ${Object.values(mealCalorieDistribution).reduce((a,b) => a+b, 0)} kcal

🚨 ABSOLUTE MANDATORY NUTRITIONAL ACCURACY RULES:

1. CONSULT VERIFIED DATABASES FOR ALL INGREDIENTS:
   - USDA FoodData Central (primary source)
   - CREA-Alimenti (Italian food database)
   - Cross-reference multiple sources to ensure accuracy

2. REALISTIC NUTRITIONAL VALUES (verified from databases):
   - Uovo medio intero (60g): calories=86, protein=7.5g, carbs=0.3g, fat=6.0g
   - Uovo grande (70g): calories=100, protein=8.8g, carbs=0.4g, fat=7.0g
   - Manzo magro (100g): calories=121, protein=20.5g, carbs=0.0g, fat=4.0g
   - Petto di pollo (100g): calories=110, protein=23.0g, carbs=0.0g, fat=1.2g
   - Salmone fresco (100g): calories=208, protein=20.0g, carbs=0.0g, fat=13.4g
   - Olio d'oliva (10ml): calories=90, protein=0.0g, carbs=0.0g, fat=10.0g
   - Burro (10g): calories=75, protein=0.1g, carbs=0.1g, fat=8.3g
   - Spinaci freschi (100g): calories=23, protein=2.9g, carbs=3.6g, fat=0.4g

3. PRECISION REQUIREMENTS:
   - ALL macronutrients MUST be rounded to EXACTLY 1 decimal place
   - NEVER use 0 for macros unless scientifically accurate from verified databases
   - Small amounts matter: eggs have ~0.3-0.4g carbs, butter has trace protein/carbs
   - Verify: sum of (protein×4 + carbs×4 + fat×9) ≈ total calories (±10% tolerance)

4. Each meal MUST hit its EXACT calorie target (±10 kcal max tolerance)
5. If a meal is low in calories, ADD MORE FOOD (bigger portions, healthy fats)
6. DO NOT create tiny meals - every meal must be satisfying

🔥 CRITICAL DIET TYPE: ${generationPrefs.diet_type.toUpperCase()}

📋 STRICT DIET RULES FOR ${generationPrefs.diet_type.toUpperCase()}:

✅ ALLOWED INGREDIENTS:
${dietRules.allowed}

❌ ABSOLUTELY FORBIDDEN INGREDIENTS:
${dietRules.forbidden}

🎯 DIET FOCUS:
${dietRules.focus}

⚠️ YOU MUST RESPECT THESE RULES 100% - NO EXCEPTIONS!
If you include ANY forbidden ingredient, the meal plan will be REJECTED.

User Profile:
- Gender: ${nutritionData.gender}, Age: ${nutritionData.age}, Weight: ${nutritionData.current_weight}kg
- Activity: ${nutritionData.activity_level}
${nutritionData.allergies?.length > 0 ? `- Allergies: ${nutritionData.allergies.join(', ')}` : ''}
${nutritionData.favorite_foods?.length > 0 ? `- Favorite Foods: ${nutritionData.favorite_foods.join(', ')}` : ''}

Days to generate: ${daysToGenerate.join(', ')}
Meal types per day: ${mealStructure.join(', ')}

TASK: Generate ${daysToGenerate.length * mealsPerDay} meals total.
CRITICAL: Each meal MUST match its target calories from the distribution above.
CRITICAL: Each meal MUST ONLY use ingredients from the ALLOWED list above.
CRITICAL: Use VERIFIED nutritional data from USDA/CREA databases.
CRITICAL: Calculate ALL macros with scientific PRECISION (1 decimal place).

Return Italian names, ingredients with precise verified quantities/calories, and instructions.`;

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
                required: ["day_of_week", "meal_type", "name", "ingredients", "instructions", "total_calories"]
              }
            }
          },
          required: ["meal_plans"]
        }
      });

      updateProgress(50, "Piano creato! Validazione...");
      console.log('✅ Ricevuti', llmResponse.meal_plans?.length, 'pasti dall\'AI');

      if (!llmResponse.meal_plans || llmResponse.meal_plans.length === 0) {
        throw new Error('AI non ha generato pasti validi');
      }

      const validatedMealPlans = [];
      
      for (const day of daysToGenerate) {
        const dayMeals = llmResponse.meal_plans.filter(m => m.day_of_week === day);
        
        const recalculatedDayMeals = dayMeals.map(meal => {
          // Round all macros to 1 decimal place
          const roundedIngredients = meal.ingredients.map(ing => ({
            ...ing,
            protein: Math.round((ing.protein || 0) * 10) / 10,
            carbs: Math.round((ing.carbs || 0) * 10) / 10,
            fat: Math.round((ing.fat || 0) * 10) / 10
          }));

          const calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
          return {
            ...meal,
            ingredients: roundedIngredients,
            total_calories: calculatedCalories,
            total_protein: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10,
            total_carbs: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10,
            total_fat: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10,
          };
        });
        
        let currentDayCalories = recalculatedDayMeals.reduce((sum, m) => sum + m.total_calories, 0);
        let calorieDifference = dailyCalories - currentDayCalories;
        
        console.log(`📅 ${day}: AI=${currentDayCalories}, Target=${dailyCalories}, Diff=${calorieDifference}`);
        
        if (calorieDifference !== 0) {
          console.log(`⚙️ ${day}: Aggiustamento preciso di ${calorieDifference} kcal`);
          
          const adjustedDayMeals = recalculatedDayMeals.map(meal => {
            const mealProportion = currentDayCalories > 0 ? meal.total_calories / currentDayCalories : (1 / recalculatedDayMeals.length);
            const mealAdjustment = Math.round(calorieDifference * mealProportion);
            
            if (mealAdjustment > 0) {
              const oilMl = Math.round(mealAdjustment / 9);
              meal.ingredients.push({
                name: "olio d'oliva extra vergine",
                quantity: oilMl,
                unit: "ml",
                calories: oilMl * 9,
                protein: 0.0,
                carbs: 0.0,
                fat: Math.round(oilMl * 10) / 10
              });
              meal.total_calories += oilMl * 9;
              meal.total_fat = Math.round((meal.total_fat + oilMl) * 10) / 10;
            } else if (mealAdjustment < 0) {
              const scaleFactor = (meal.total_calories + mealAdjustment) / meal.total_calories;
              meal.ingredients = meal.ingredients.map(ing => ({
                ...ing,
                quantity: Math.round(ing.quantity * scaleFactor * 10) / 10,
                calories: Math.round(ing.calories * scaleFactor),
                protein: Math.round(ing.protein * scaleFactor * 10) / 10,
                carbs: Math.round(ing.carbs * scaleFactor * 10) / 10,
                fat: Math.round(ing.fat * scaleFactor * 10) / 10
              }));
              meal.total_calories = Math.round(meal.ingredients.reduce((sum, ing) => sum + ing.calories, 0));
              meal.total_protein = Math.round(meal.ingredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10;
              meal.total_carbs = Math.round(meal.ingredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10;
              meal.total_fat = Math.round(meal.ingredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10;
            }
            
            return meal;
          });
          
          const finalDayCalories = adjustedDayMeals.reduce((sum, m) => sum + m.total_calories, 0);
          const remainingDiff = dailyCalories - finalDayCalories;
          
          if (remainingDiff !== 0) {
            console.log(`🔧 ${day}: Aggiustamento finale di ${remainingDiff} kcal sul pasto più grande`);
            const largestMeal = adjustedDayMeals.reduce((max, meal) => 
              meal.total_calories > max.total_calories ? meal : max
            );
            largestMeal.total_calories += remainingDiff;
            
            if (largestMeal.ingredients.length > 0) {
              const oilIngredient = largestMeal.ingredients.find(ing => ing.name.includes('olio'));
              if (oilIngredient && remainingDiff > 0) {
                const extraOil = Math.ceil(remainingDiff / 9);
                oilIngredient.quantity += extraOil;
                oilIngredient.calories += extraOil * 9;
                oilIngredient.fat = Math.round((oilIngredient.fat + extraOil) * 10) / 10;
                largestMeal.total_fat = Math.round((largestMeal.total_fat + extraOil) * 10) / 10;
              }
            }
          }
          
          validatedMealPlans.push(...adjustedDayMeals);
          const finalCalories = adjustedDayMeals.reduce((sum, m) => sum + m.total_calories, 0);
          console.log(`✅ ${day}: Calorie finali = ${finalCalories} kcal (Target: ${dailyCalories})`);
        } else {
          validatedMealPlans.push(...recalculatedDayMeals);
          console.log(`✅ ${day}: Già bilanciato perfettamente`);
        }
      }

      updateProgress(65, "Rimozione piani precedenti...");
      for (const plan of mealPlans) {
        await deleteMealMutation.mutateAsync(plan.id);
      }
      
      // 🆕 SALVA INGREDIENTI NEL DATABASE (in background)
      updateProgress(70, "Validazione database ingredienti...");
      try {
        const allIngredients = [];
        validatedMealPlans.forEach(meal => {
          meal.ingredients.forEach(ing => allIngredients.push(ing));
        });
        
        const dbResponse = await base44.functions.invoke('validateAndSaveIngredient', {
          ingredients: allIngredients
        });
        
        console.log(`🗃️ Database aggiornato: +${dbResponse.data?.new_ingredients_added || 0} nuovi ingredienti`);
      } catch (dbError) {
        console.warn('⚠️ Errore salvataggio database (non critico):', dbError);
      }
      
      updateProgress(75, "Generazione immagini AI...");

      await base44.auth.updateMe({
        diet_type: generationPrefs.diet_type,
        intermittent_fasting: generationPrefs.intermittent_fasting,
        if_skip_meal: generationPrefs.if_skip_meal,
        if_meal_structure: generationPrefs.if_meal_structure,
      });

      const totalMeals = validatedMealPlans.length;
      const batchSize = 5;

      for (let i = 0; i < totalMeals; i += batchSize) {
        const batch = validatedMealPlans.slice(i, i + batchSize);
        const batchProgress = 75 + Math.round((i / totalMeals) * 20);
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
      breakfast: 'Colazione',
      snack1: 'Spuntino Mattina',
      lunch: 'Pranzo',
      snack2: 'Snack Pomeridiano',
      dinner: 'Cena',
      snack3: 'Spuntino Serale',
      snack4: 'Spuntino Notturno'
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
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
                            <p className="text-2xl font-bold text-red-600">{Math.round(dailyTotals.protein * 10) / 10}</p>
                            <p className="text-xs text-gray-500">g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">Carboidrati</p>
                            <p className="text-2xl font-bold text-blue-600">{Math.round(dailyTotals.carbs * 10) / 10}</p>
                            <p className="text-xs text-gray-500">g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">Grassi</p>
                            <p className="text-2xl font-bold text-yellow-600">{Math.round(dailyTotals.fat * 10) / 10}</p>
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