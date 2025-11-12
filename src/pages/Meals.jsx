import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw, Loader2, Activity, AlertCircle } from "lucide-react";
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
import { getGenerationLimit } from '@/components/utils/subscriptionPlans';

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
    if (status === 'completed') return <CheckCircle className="inline w-4 h-4 mr-2 text-green-500" />;
    if (status === 'in-progress') return <Loader2 className="inline w-4 h-4 mr-2 text-[var(--brand-primary)] animate-spin" />;
    return <CheckCircle className="inline w-4 h-4 mr-2 text-gray-300" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-8 md:pt-4">
      <style>{`
        @keyframes energyPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)); }
        }
        @keyframes containerGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(38, 132, 127, 0.3), 0 0 40px rgba(38, 132, 127, 0.2), inset 0 0 15px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 30px rgba(38, 132, 127, 0.5), 0 0 60px rgba(38, 132, 127, 0.3), inset 0 0 25px rgba(34, 197, 94, 0.2); }
        }
        .animated-nutrition-container { 
          animation: containerGlow 2s ease-in-out infinite; 
          background: linear-gradient(135deg, #26847F 0%, #14b8a6 50%, #22c55e 100%); 
        }
        .animated-energy-icon { animation: energyPulse 1.5s ease-in-out infinite; }
      `}</style>
      
      <div className="max-w-xl w-full">
        <Card className="bg-white/60 backdrop-blur-md border-gray-200/40 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden animated-nutrition-container flex items-center justify-center">
              <Activity className="w-8 h-8 text-white animated-energy-icon" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 text-center">
              Creazione Protocollo Nutrizionale AI
            </CardTitle>
            <p className="text-sm text-gray-600 text-center mt-2">
              L'AI sta elaborando migliaia di dati per creare un piano alimentare scientifico e su misura per te.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <Progress value={generationProgress} className="w-full h-2.5 [&>div]:bg-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--brand-primary)] font-semibold text-center min-h-[20px]">
                {generationStatus}
              </p>
            </div>
            
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60">
              <h4 className="font-semibold text-gray-800 text-sm mb-3">Analisi in corso:</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(10))}
                  <span className="text-gray-700">Profilo metabolico (BMR: {nutritionData?.bmr} kcal)</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(25))}
                  <span className="text-gray-700">Target calorico ({nutritionData?.daily_calories} kcal/giorno)</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(50))}
                  <span className="text-gray-700">Bilanciamento calorico automatico</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(60))}
                  <span className="text-gray-700">Piano nutrizionale generato</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(70))}
                  <span className="text-gray-700">Validazione database ingredienti</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(85))}
                  <span className="text-gray-700">Generazione immagini pasti</span>
                </li>
                <li className="flex items-center">
                  {renderStepIcon(getStepStatus(95))}
                  <span className="text-gray-700">Costruzione e salvataggio piano</span>
                </li>
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
  const [remainingGenerations, setRemainingGenerations] = useState(null);
  const [generationLimitReached, setGenerationLimitReached] = useState(false);

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

  // Calcola generazioni rimanenti
  useEffect(() => {
    const checkRemainingGenerations = async () => {
      if (!user?.id) return;
      
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const limit = getGenerationLimit(user.subscription_plan, 'meal');
      
      if (limit === -1) {
        setRemainingGenerations(-1); // Illimitato
        setGenerationLimitReached(false);
        return;
      }
      
      try {
        const generations = await base44.entities.PlanGeneration.filter({
          user_id: user.id,
          plan_type: 'meal',
          generation_month: currentMonth
        });
        
        const used = generations.length;
        const remaining = Math.max(0, limit - used);
        setRemainingGenerations(remaining);
        setGenerationLimitReached(remaining === 0);
      } catch (error) {
        console.error('Error checking generations:', error);
      }
    };
    
    checkRemainingGenerations();
  }, [user]);

  const loadMealPlans = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: ['mealPlans', user.id] });
    }
  }, [queryClient, user?.id]);

  const handleShowGenerator = useCallback((currentUser) => {
    if (generationLimitReached && remainingGenerations === 0) {
      setShowUpgradeModal(true);
      return;
    }
    
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
  }, [generationLimitReached, remainingGenerations]);
  
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
        console.log(`⚠️ Pasto con calorie invalide. Usando target: ${targetCalories} kcal`);
      }

      console.log(`🎯 Target rigenerazione: ${targetCalories} kcal`);

      const dietRules = getDietRules(nutritionData.diet_type || 'mediterranean');

      const singleMealPrompt = `You are an expert AI nutritionist. Create ONE meal in ITALIAN. 
Target: ${targetCalories} kcal. 
Diet: ${nutritionData.diet_type}. 
Allowed: ${dietRules.allowed}. 
Use verified nutritional data. All names and units in Italian.`;

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
        ing.name && ing.quantity != null && ing.unit && ing.calories != null
      );

      if (validIngredients.length === 0) {
        throw new Error('Nessun ingrediente valido generato');
      }

      validIngredients = validIngredients.map(ing => ({
        ...ing,
        protein: Math.round(ing.protein * 10) / 10,
        carbs: Math.round(ing.carbs * 10) / 10,
        fat: Math.round(ing.fat * 10) / 10
      }));

      try {
        await base44.functions.invoke('validateAndSaveIngredient', {
          ingredients: validIngredients
        });
      } catch (dbError) {
        console.warn('⚠️ Errore database (non critico):', dbError);
      }

      let currentCalories = Math.round(validIngredients.reduce((sum, ing) => sum + ing.calories, 0));
      const calorieDifference = targetCalories - currentCalories;
      
      if (calorieDifference !== 0) {
        if (calorieDifference > 5) { // Add olive oil if significantly under target
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
        } else if (calorieDifference < -5) { // Scale down ingredients if significantly over target
          const scaleFactor = targetCalories / currentCalories;
          
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

      const total_protein = Math.round(validIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10;
      const total_carbs = Math.round(validIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10;
      const total_fat = Math.round(validIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10;
      
      const ingredientsString = validIngredients.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ');
      const imagePrompt = `Professional food photography of ${llmResponse.name}. Ingredients: ${ingredientsString}. 45-degree angle, modern plate.`;
      
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
      
      alert(`✅ Pasto rigenerato: "${llmResponse.name}" (${currentCalories} kcal)`);
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
    
    // Controlla limite generazioni
    if (generationLimitReached && remainingGenerations === 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    console.log('🚀 Inizio generazione piano nutrizionale OTTIMIZZATO...');
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
      // ✅ SEMPRE genera tutti e 7 i giorni (anche per utenti trial)
      const daysToGenerate = allDays;

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

      const dietRules = getDietRules(generationPrefs.diet_type);

      updateProgress(15, "Rimozione piani precedenti...");
      for (const plan of mealPlans) {
        await deleteMealMutation.mutateAsync(plan.id);
      }

      await base44.auth.updateMe({
        diet_type: generationPrefs.diet_type,
        intermittent_fasting: generationPrefs.intermittent_fasting,
        if_skip_meal: generationPrefs.if_skip_meal,
        if_meal_structure: generationPrefs.if_meal_structure,
      });

      const allGeneratedMeals = [];
      const totalMealsToGenerate = daysToGenerate.length * mealStructure.length;
      let generatedMealCount = 0;

      // Identifico i cheat meal dall'utente
      const cheatMealSlots = user.cheat_meal_slots || [];
      const isCheatMeal = (day, mealType) => {
        return cheatMealSlots.includes(`${day}_${mealType}`);
      };

      // ✅ STEP 1: Generazione pasti SENZA immagini (VELOCE)
      for (let dayIndex = 0; dayIndex < daysToGenerate.length; dayIndex++) {
        const day = daysToGenerate[dayIndex];
        
        for (let mealIndex = 0; mealIndex < mealStructure.length; mealIndex++) {
          const mealType = mealStructure[mealIndex];
          const targetCals = mealCalorieDistribution[mealType];
          const isCheat = isCheatMeal(day, mealType);
          
          generatedMealCount++;
          const progress = 20 + Math.round((generatedMealCount / totalMealsToGenerate) * 70);
          updateProgress(progress, `${day} - ${getMealTypeLabel(mealType)} ${isCheat ? '🍕 CHEAT' : ''} (${generatedMealCount}/${totalMealsToGenerate})`);

          let mealPrompt;
          
          if (isCheat) {
            // 🍕 CHEAT MEAL - Pasto libero ma con controllo calorico
            mealPrompt = `You are creating a CHEAT MEAL in ITALIAN for a fitness person.

🍕 CHEAT MEAL RULES:
- This is a FREE meal - the user can enjoy their favorite indulgent foods
- Examples: Pizza, Hamburger con patatine, Sushi, Pasta carbonara, Lasagne, Tiramisù, Gelato, etc.
- Make it DELICIOUS and SATISFYING
- BUT keep it around ${Math.round(targetCals * 1.3)} kcal (30% more than normal for satisfaction)
- Include realistic portions and ingredients
- All names in ITALIAN

User preferences: ${nutritionData.favorite_foods?.join(', ') || 'pizza, hamburger, dolci'}

Create ONE indulgent meal with:
1. Name (make it appetizing!)
2. Ingredients with quantities
3. Simple instructions
4. Precise nutritional values

This should feel like a REWARD meal but still tracked for weekly balance.`;
          } else {
            // Pasto normale
            mealPrompt = `Create ONE meal in ITALIAN. Target: ${targetCals} kcal. Diet: ${generationPrefs.diet_type}. Allowed: ${dietRules.allowed}. Use verified data.`;
          }

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
                    },
                    required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat"]
                  }
                },
                instructions: { type: "array", items: { type: "string" } },
                prep_time: { type: "number" },
                difficulty: { type: "string" },
                is_cheat_meal: { type: "boolean" }
              },
              required: ["name", "ingredients", "instructions"]
            }
          });

          if (!llmResponse || !llmResponse.ingredients) {
            console.error(`❌ Pasto invalido per ${day} ${mealType}`);
            continue;
          }

          let roundedIngredients = llmResponse.ingredients.map(ing => ({
            ...ing,
            protein: Math.round((ing.protein || 0) * 10) / 10,
            carbs: Math.round((ing.carbs || 0) * 10) / 10,
            fat: Math.round((ing.fat || 0) * 10) / 10
          }));

          let calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
          const diff = targetCals - calculatedCalories;

          if (diff > 5) {
            const oilMl = Math.round(diff / 9);
            roundedIngredients.push({
              name: "olio d'oliva",
              quantity: oilMl,
              unit: "ml",
              calories: oilMl * 9,
              protein: 0.0,
              carbs: 0.0,
              fat: Math.round(oilMl * 10) / 10
            });
            calculatedCalories += oilMl * 9;
          } else if (diff < -5) {
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

          allGeneratedMeals.push({
            user_id: user.id,
            day_of_week: day,
            meal_type: mealType,
            name: isCheat ? `🍕 ${llmResponse.name}` : llmResponse.name,
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
          
          console.log(`✅ ${day} ${mealType}: ${calculatedCalories} kcal`);
        }
      }

      updateProgress(90, "Salvataggio ingredienti nel database...");
      
      try {
        const allIngredients = [];
        allGeneratedMeals.forEach(meal => {
          meal.ingredients.forEach(ing => allIngredients.push(ing));
        });
        
        await base44.functions.invoke('validateAndSaveIngredient', {
          ingredients: allIngredients
        });
        
        console.log(`🗃️ Database ingredienti aggiornato`);
      } catch (dbError) {
        console.warn('⚠️ Database error:', dbError);
      }

      updateProgress(95, "Salvataggio pasti...");
      const createdMealIds = [];
      
      for (let i = 0; i < allGeneratedMeals.length; i++) {
        const meal = allGeneratedMeals[i];
        const createdMeal = await createMealMutation.mutateAsync(meal);
        createdMealIds.push({ id: createdMeal.id, meal });
      }

      updateProgress(100, "Completato!");
      
      // Registra la generazione
      const currentMonth = new Date().toISOString().slice(0, 7);
      await base44.entities.PlanGeneration.create({
        user_id: user.id,
        plan_type: 'meal',
        generation_month: currentMonth,
        subscription_plan: user.subscription_plan
      });
      
      setTimeout(async () => {
        setIsGenerating(false);
        setShowGenerator(false);
        await loadMealPlans();
        setAddedDays([]);
        
        // Aggiorna contatore generazioni
        const limit = getGenerationLimit(user.subscription_plan, 'meal');
        if (limit !== -1) {
          const generations = await base44.entities.PlanGeneration.filter({
            user_id: user.id,
            plan_type: 'meal',
            generation_month: currentMonth
          });
          const remaining = Math.max(0, limit - generations.length);
          setRemainingGenerations(remaining);
          setGenerationLimitReached(remaining === 0);
        }
        
        alert(`✅ Piano nutrizionale generato con successo!`);
        
        console.log('🎨 Inizio generazione immagini in background...');
        
        (async () => {
          for (let i = 0; i < createdMealIds.length; i++) {
            const { id, meal } = createdMealIds[i];
            
            try {
              const ingredientsString = meal.ingredients.map(ing => `${ing.quantity}${ing.unit} ${ing.name}`).join(', ');
              const imagePrompt = `Professional food photography of ${meal.name}. Ingredients: ${ingredientsString}. Modern plate.`;
              const imageResponse = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
              
              await updateMealMutation.mutateAsync({
                id: id,
                data: { image_url: imageResponse.url }
              });
              
              console.log(`🖼️ Immagine ${i + 1}/${createdMealIds.length} generata: ${meal.name}`);
            } catch (error) {
              console.error(`❌ Errore immagine per ${meal.name}:`, error);
            }
          }
          
          console.log('✅ Tutte le immagini generate!');
          await loadMealPlans();
        })();
        
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
  const availableDays = days; // Now always all 7 days for selection
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
              {remainingGenerations !== null && remainingGenerations !== -1 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <BrainCircuit className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span className={`font-semibold ${remainingGenerations === 0 ? 'text-red-600' : 'text-[var(--brand-primary)]'}`}>
                      {remainingGenerations} generazioni rimaste questo mese
                    </span>
                  </div>
                </div>
              )}
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
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white flex items-center gap-1 md:gap-2 shadow-lg hover:shadow-xl transition-all px-3 md:px-6 py-3 md:py-6 text-sm md:text-base font-semibold rounded-xl flex-1 lg:flex-initial relative"
                disabled={generationLimitReached && remainingGenerations === 0}
              >
                <BrainCircuit className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Rigenera Piano con AI</span>
                <span className="sm:hidden">Rigenera</span>
                {generationLimitReached && remainingGenerations === 0 && (
                  <AlertCircle className="w-4 h-4 ml-1 animate-pulse" />
                )}
              </Button>
            </div>
          </div>

          {/* Alert quando finiscono le generazioni */}
          {generationLimitReached && remainingGenerations === 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-xl rounded-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-700" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                      🚫 Limite Generazioni Raggiunto
                    </h3>
                    <p className="text-amber-800 mb-1">
                      Hai utilizzato tutte le <strong>{getGenerationLimit(user?.subscription_plan, 'meal')} generazioni</strong> disponibili questo mese con il piano <strong className="capitalize">{user?.subscription_plan || 'Base'}</strong>.
                    </p>
                    <p className="text-sm text-amber-700">
                      💡 Fai l'upgrade per ottenere più generazioni o generazioni illimitate!
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-500 hover:from-[var(--brand-primary-hover)] hover:to-teal-600 text-white px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      ⬆️ Upgrade Piano
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
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
                  {/* Removed the trial user specific locked days, as per instruction to always generate all 7 days */}
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