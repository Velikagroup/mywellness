import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { categorizeIngredient } from '@/utils/categorizeIngredient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw, Loader2, Activity, AlertCircle, Package, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasFeatureAccess, PLANS, UpgradePrompt, getGenerationLimit } from '@/components/utils/subscriptionPlans';
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MealDetailModal from "../components/meals/MealDetailModal";
import ShoppingListModal from "../components/meals/ShoppingListModal";
import AIFeedbackBox from '../components/meals/AIFeedbackBox';
import UpgradeModal from '../components/meals/UpgradeModal';
import CheatMealStep from '../components/meals/CheatMealStep';
import PantryModal from '../components/meals/PantryModal';
import MealPlanWizard from '../components/meals/MealPlanWizard';
import ReplaceMealModal from '../components/meals/ReplaceMealModal';
import MealPlanGenerating from '../components/meals/MealPlanGenerating';
import DoctorMealPlanModal from '../components/meals/DoctorMealPlanModal';
import { useLanguage } from '../components/i18n/LanguageContext';
import PullToRefresh from '../components/mobile/PullToRefresh';

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
  const utcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcDay = new Date(utcDate).getUTCDay();
  const diff = utcDay === 0 ? -6 : 1 - utcDay;
  const monday = new Date(utcDate);
  monday.setUTCDate(monday.getUTCDate() + diff);
  return monday.toISOString().split('T')[0];
};

const startOfWeek = getStartOfWeek();



export default function MealsPage() {
  const { t, language } = useLanguage();
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
  const [showPantry, setShowPantry] = useState(false);
  const [addedDays, setAddedDays] = useState([]);
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(5);
  const [remainingGenerations, setRemainingGenerations] = useState(null);
  const [generationLimitReached, setGenerationLimitReached] = useState(false);
  const [showCheatMealStep, setShowCheatMealStep] = useState(false);
  const [cheatMealConfig, setCheatMealConfig] = useState([]);
  const [replaceMealTarget, setReplaceMealTarget] = useState(null);
  const [showDoctorPlanModal, setShowDoctorPlanModal] = useState(false);
  const [showShoppingChoice, setShowShoppingChoice] = useState(false);

  const { data: user, isLoading: isLoadingUser, isError: isUserError, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      
      // ✅ CRITICAL: Verifica se l'utente ha una subscription attiva o in trial
      if (!currentUser.subscription_status || 
          (currentUser.subscription_status !== 'active' && currentUser.subscription_status !== 'trial')) {
        console.warn('⚠️ User has no active subscription, redirecting to TrialSetup');
        navigate(createPageUrl('TrialSetup'), { replace: true });
        throw new Error('No active subscription');
      }
      
      return currentUser;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const nutritionData = user ? {
    bmr: user.bmr,
    daily_calories: user.daily_calorie_target || user.daily_calories,
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
      console.log('🔍 Fetching meal plans for user_id:', user.id);
      // ✅ USA FILTER invece di LIST per matchare l'RLS rule
      const plans = await base44.entities.MealPlan.filter({ user_id: user.id });
      console.log('📦 Meal plans fetched:', plans.length);
      return plans;
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

  // Funzione per calcolare generazioni rimanenti (definita fuori dall'useEffect per poterla richiamare)
  const checkRemainingGenerations = useCallback(async () => {
    if (!user?.id) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const limit = getGenerationLimit(user.subscription_plan, 'meal');

    console.log(`📊 Checking generations for user ${user.id}, plan: ${user.subscription_plan}, limit: ${limit}`);

    if (limit === -1) {
      setRemainingGenerations(-1); // Illimitato
      setGenerationLimitReached(false);
      return;
    }

    try {
      // ✅ FIX: Usa .list() e filtra localmente per evitare problemi RLS
      const [allGenerations, allCredits] = await Promise.all([
        base44.entities.PlanGeneration.list(),
        base44.entities.PlanGenerationCredit.list()
      ]);
      console.log(`📊 All generations fetched:`, allGenerations.length);
      console.log(`📊 All credits fetched:`, allCredits.length);

      const generations = allGenerations.filter(g => {
        const matches = g.user_id === user.id && 
                       g.plan_type === 'meal' && 
                       g.generation_month === currentMonth;
        if (matches) console.log(`📊 Match found:`, g);
        return matches;
      });

      // ✅ FIX: Filtra crediti localmente per l'utente corrente
      const extraCredits = allCredits.filter(c => 
        c.user_id === user.id && 
        c.plan_type === 'meal'
      );

      // Calcola crediti extra disponibili
      const extraCreditsAvailable = extraCredits
        .filter(c => !c.expiration_month || c.expiration_month >= currentMonth)
        .reduce((sum, c) => sum + c.credits_amount, 0);

      const used = generations.length;
      const totalLimit = limit + extraCreditsAvailable;
      const remaining = Math.max(0, totalLimit - used);
      console.log(`📊 Generazioni meal usate: ${used}/${limit}, extra: ${extraCreditsAvailable}, rimanenti: ${remaining}`);
      setRemainingGenerations(remaining);
      setGenerationLimitReached(remaining === 0);
    } catch (error) {
      console.error('Error checking generations:', error);
    }
  }, [user]);

  // Calcola generazioni rimanenti all'avvio
  useEffect(() => {
    checkRemainingGenerations();
  }, [checkRemainingGenerations]);

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

  const addMealsToShoppingList = async (mealsToAdd, dayKeys) => {
    let currentList = shoppingLists.length > 0 ? shoppingLists[0] : null;
    const ingredientsMap = new Map();

    mealsToAdd.forEach((meal, idx) => {
      const dayKey = dayKeys[idx] || meal.day_of_week || selectedDay;
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
        data: { items: Array.from(existingItemsMap.values()), last_updated: new Date().toISOString() }
      });
    } else {
      await createShoppingListMutation.mutateAsync({
        user_id: user.id,
        week_start_date: startOfWeek,
        items: newItemsToAdd,
        last_updated: new Date().toISOString()
      });
    }
  };

  const addDayToShoppingList = async (dayKey) => {
    if (!user) return;
    
    try {
      const dayMeals = mealPlans.filter(m => m.day_of_week === dayKey);
      if (dayMeals.length === 0) {
        alert('Nessun pasto per questo giorno da aggiungere alla lista.');
        return;
      }

      await addMealsToShoppingList(dayMeals, dayMeals.map(() => dayKey));
      setAddedDays(prev => Array.from(new Set([...prev, dayKey])));
      alert(`✅ Ingredienti di ${getDayLabel(dayKey)} aggiunti alla lista della spesa!`);
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      alert("Errore nell'aggiunta degli ingredienti. Riprova.");
    }
  };

  const addWeekToShoppingList = async () => {
    if (!user) return;
    try {
      if (mealPlans.length === 0) {
        alert('Nessun pasto nel piano settimanale.');
        return;
      }
      await addMealsToShoppingList(mealPlans, mealPlans.map(m => m.day_of_week));
      const allDayKeys = [...new Set(mealPlans.map(m => m.day_of_week))];
      setAddedDays(prev => Array.from(new Set([...prev, ...allDayKeys])));
      alert('✅ Ingredienti di tutta la settimana aggiunti alla lista della spesa!');
    } catch (error) {
      console.error('Error adding week to shopping list:', error);
      alert("Errore nell'aggiunta degli ingredienti. Riprova.");
    }
  };

  const regenerateSingleMeal = async (mealToRegenerate) => {
    if (!user || !nutritionData) return;
    setRegeneratingMealId(mealToRegenerate.id);
    
    try {
      const languageNames = {
        it: 'Italian',
        en: 'English', 
        es: 'Spanish',
        pt: 'Portuguese',
        de: 'German',
        fr: 'French'
      };
      const userLang = language || 'it';
      const langName = languageNames[userLang] || 'Italian';
      
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
      
      const cookingTimeContext = generationPrefs?.cooking_time_preference === 'quick' 
        ? 'Preferisci ricette VELOCI (10-20 minuti). Scegli preparazioni semplici e rapide.'
        : generationPrefs?.cooking_time_preference === 'relaxed'
        ? 'Puoi dedicare PIÙ TEMPO alla cucina (30+ minuti). Puoi includere ricette più elaborate.'
        : 'Tempo moderato (20-30 minuti). Bilanciamento tra velocità e qualità.';

      const isSnack = mealToRegenerate.meal_type?.includes('snack');
      const preparationRules = isSnack 
        ? 'ULTRA SIMPLE SNACK: ONLY ready-to-eat foods. NO cooking, NO heating, NO preparation. Examples: yogurt+fruit, crackers+cheese, nuts, protein bar. Just open and eat.'
        : 'SIMPLE ASSEMBLY ONLY: NO cooking, NO stove, NO oven. Only combine ready/pre-cooked ingredients. Examples: sandwiches, salads, cold plates.';
      
      const singleMealPrompt = `You are an expert AI nutritionist. Create ONE meal in ${langName.toUpperCase()}. 
Target: ${targetCalories} kcal. 
Diet: ${nutritionData.diet_type}. 
Allowed: ${dietRules.allowed}. 
${preparationRules}
🛒 SUPERMARKET PRIORITY: Use ONLY common, easy-to-find supermarket ingredients. NO exotic or specialty items.
${cookingTimeContext}
CRITICAL: For eggs, use ONLY whole numbers (1, 2, 3), NEVER decimals.
Use verified nutritional data. All names and units in ${langName}.`;

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
      ).map(ing => ({
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
        // ✅ Aggiungi olio SOLO per pasti principali E solo se deficit > 50 kcal
        const isMainMeal = ['breakfast', 'lunch', 'dinner'].includes(mealToRegenerate.meal_type);
        if (calorieDifference > 50 && isMainMeal) {
          const oilIndex = validIngredients.findIndex(ing => 
            ing.name.toLowerCase().includes('olio') && ing.name.toLowerCase().includes('oliva')
          );
          
          const oilMl = Math.round(calorieDifference / 9);
          const oilCalories = oilMl * 9;
          
          if (oilIndex >= 0) {
            validIngredients[oilIndex].quantity += oilMl;
            validIngredients[oilIndex].calories += oilCalories;
            validIngredients[oilIndex].fat = Math.round((validIngredients[oilIndex].fat + oilMl) * 10) / 10;
          } else {
            validIngredients.push({
              name: "olio d'oliva",
              quantity: oilMl,
              unit: "ml",
              calories: oilCalories,
              protein: 0.0,
              carbs: 0.0,
              fat: Math.round(oilMl * 10) / 10
            });
          }
          
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
      const imagePrompt = `CRITICAL: Create an accurate, realistic food photograph that shows EXACTLY what is described below.

Dish: "${llmResponse.name}"
Main ingredients (MUST be clearly visible): ${ingredientsString}

STRICT RULES:
- Show ONLY the listed ingredients in their natural, recognizable form
- If "noci" (walnuts) → show actual walnuts/nuts in a bowl, NOT bread or toast
- If "salmone" → show salmon fillet, NOT other fish
- If "petto di pollo" → show chicken breast, NOT other meats
- If "bistecca" → show beef steak, NOT chicken or pork
- NO creative interpretations or substitutions
- The photo must match the ingredient list EXACTLY
- Professional food photography, white ceramic plate, natural lighting
- 45-degree angle, appetizing presentation, realistic portions`;
      
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

  const handleWizardComplete = (wizardData) => {
    setGenerationPrefs(wizardData);
    setMealsPerDay(wizardData.meals_per_day);
    setShowGenerator(false);
    setShowCheatMealStep(true);
  };

  const handleCheatMealComplete = (config) => {
    setCheatMealConfig(config);
    setShowCheatMealStep(false);
    generateMealPlan(config);
  };

  const handleCheatMealSkip = () => {
    setCheatMealConfig([]);
    setShowCheatMealStep(false);
    generateMealPlan([]);
  };

  const generateMealPlan = async (cheatMeals = []) => {
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
    console.log('📋 Configurazione:', generationPrefs);
    console.log('🍕 Cheat meals configurati:', cheatMeals);
    console.log('🍽️ Pasti per giorno:', mealsPerDay);
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus(t('meals.startingAI'));

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, t('meals.analyzingProfile'));

      // Carica ingredienti dispensa (solo per uso futuro, non influenzano la generazione)
      const userIngredients = [];
      const pantryIngredientsPrompt = '';

      // ✅ FIX CRITICO: Struttura pasti in base al numero selezionato
      let mealStructure;
      
      if (generationPrefs.intermittent_fasting && generationPrefs.if_skip_meal === 'breakfast') {
        // ✅ SKIP BREAKFAST = pasti dalle 12:00 in poi: lunch, snack2, dinner, snack3, snack4
        const afternoonMeals = ['lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
        mealStructure = afternoonMeals.slice(0, mealsPerDay);
        console.log(`🍽️ IF SKIP BREAKFAST: usando pasti pomeridiani →`, mealStructure);
      } else if (generationPrefs.intermittent_fasting && generationPrefs.if_skip_meal === 'dinner') {
        // ✅ SKIP DINNER = pasti dalle 8:00 alle 16:00: breakfast, snack1, lunch, snack2
        const morningMeals = ['breakfast', 'snack1', 'lunch', 'snack2'];
        mealStructure = morningMeals.slice(0, mealsPerDay);
        console.log(`🍽️ IF SKIP DINNER: usando pasti mattutini →`, mealStructure);
      } else {
        // ✅ NORMALE: struttura pasti in base al numero
        if (mealsPerDay === 3) {
          mealStructure = ['breakfast', 'lunch', 'dinner'];
        } else if (mealsPerDay === 4) {
          mealStructure = ['breakfast', 'snack1', 'lunch', 'dinner'];
        } else if (mealsPerDay === 5) {
          mealStructure = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
        } else if (mealsPerDay === 6) {
          mealStructure = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3'];
        } else if (mealsPerDay === 7) {
          mealStructure = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
        } else {
          // Default: tutti i pasti disponibili
          const allMealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];
          mealStructure = allMealTypes.slice(0, mealsPerDay);
        }
        console.log(`🍽️ PASTI NORMALI (${mealsPerDay}) →`, mealStructure);
      }
      
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      // ✅ SEMPRE genera tutti e 7 i giorni (anche per utenti trial)
      const daysToGenerate = allDays;

      const dailyCalories = nutritionData.daily_calories;
      
      const mealCalorieDistribution = {};
      
      if (mealsPerDay === 3) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.30);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.40);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.30);
      } else if (mealsPerDay === 4) {
        mealCalorieDistribution.breakfast = Math.round(dailyCalories * 0.25);
        mealCalorieDistribution.snack1 = Math.round(dailyCalories * 0.10);
        mealCalorieDistribution.lunch = Math.round(dailyCalories * 0.35);
        mealCalorieDistribution.dinner = Math.round(dailyCalories * 0.30);
      } else if (mealsPerDay === 5) {
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
      
      const cookingTimeContext = generationPrefs.cooking_time_preference === 'quick' 
        ? 'User prefers QUICK recipes (10-20 minutes). Choose simple and fast preparations.'
        : generationPrefs.cooking_time_preference === 'relaxed'
        ? 'User can dedicate MORE TIME to cooking (30+ minutes). Can include more elaborate recipes.'
        : 'Moderate time (20-30 minutes). Balance between speed and quality.';

      // Mappa intolleranze per prompts
      const intolerancesMap = {
        lactose: 'LATTOSIO - NO latte, formaggi, yogurt, burro, panna, gelati, prodotti da forno con latte',
        gluten: 'GLUTINE - NO frumento, pasta normale, pane normale, orzo, segale, farro, kamut, seitan',
        nuts: 'FRUTTA SECCA - NO noci, mandorle, nocciole, pistacchi, anacardi, prodotti che li contengono',
        eggs: 'UOVA - NO uova, maionese, pasta all\'uovo, dolci con uova, frittate',
        soy: 'SOIA - NO tofu, tempeh, edamame, salsa di soia, latte di soia, proteine di soia',
        fish: 'PESCE - NO pesce, frutti di mare, crostacei, molluschi, surimi',
        peanuts: 'ARACHIDI - NO arachidi, burro di arachidi, olio di arachidi',
        sesame: 'SESAMO - NO semi di sesamo, tahini, olio di sesamo, pane con sesamo',
        sulfites: 'SOLFITI - NO vino, frutta secca, aceto, alcuni conservanti',
        histamine: 'ISTAMINA - NO formaggi stagionati, salumi, pesce in scatola, pomodori, spinaci, melanzane',
        fructose: 'FRUTTOSIO - NO miele, sciroppi, frutta ad alto fruttosio (mele, pere, mango)',
        sorbitol: 'SORBITOLO - NO dolcificanti artificiali, prugne, mele, pere'
      };

      updateProgress(15, t('meals.removingOldPlans'));
      for (const plan of mealPlans) {
        await deleteMealMutation.mutateAsync(plan.id);
      }

      await base44.auth.updateMe({
        diet_type: generationPrefs.diet_type,
        intermittent_fasting: generationPrefs.intermittent_fasting,
        if_skip_meal: generationPrefs.if_skip_meal,
        if_meal_structure: generationPrefs.if_meal_structure,
        cooking_time_preference: generationPrefs.cooking_time_preference,
        cheat_meals_config: cheatMeals,
        intolerances: generationPrefs.intolerances || [],
        custom_intolerances: generationPrefs.custom_intolerances || ''
      });

      const allGeneratedMeals = [];
      
      // ✅ GENERA UN PASTO ALLA VOLTA per maggiore affidabilità
      for (let dayIndex = 0; dayIndex < daysToGenerate.length; dayIndex++) {
        const day = daysToGenerate[dayIndex];
        const dayLabel = t(`meals.${day}`);
        
        // Genera ogni pasto individualmente
        for (let mealIndex = 0; mealIndex < mealStructure.length; mealIndex++) {
          const mealType = mealStructure[mealIndex];
          const progress = 20 + Math.round(((dayIndex * mealStructure.length + mealIndex) / (daysToGenerate.length * mealStructure.length)) * 70);
          updateProgress(progress, `${dayLabel} - ${getMealTypeLabel(mealType)} (${dayIndex * mealStructure.length + mealIndex + 1}/${daysToGenerate.length * mealStructure.length})`);
          
          const targetCals = mealCalorieDistribution[mealType];
          const isCheatMeal = cheatMeals.some(cm => cm.day === day && cm.meal_type === mealType);

          const languageNames = {
            it: 'Italian',
            en: 'English', 
            es: 'Spanish',
            pt: 'Portuguese',
            de: 'German',
            fr: 'French'
          };
          const userLang = language || t('common.lang') || 'en';
          const langName = languageNames[userLang] || 'English';

          // Context varietà per questo tipo di pasto
          const sameMealTypePrevious = allGeneratedMeals.filter(m => m.meal_type === mealType);
          const usedDishesForThisMeal = sameMealTypePrevious.map(m => m.name.toLowerCase());
          
          const varietyContext = sameMealTypePrevious.length > 0 ? `
ALREADY USED ${getMealTypeLabel(mealType).toUpperCase()} DISHES THIS WEEK:
${sameMealTypePrevious.map(m => `❌ ${m.day_of_week}: "${m.name}"`).join('\n')}

CRITICAL: Create a COMPLETELY DIFFERENT ${getMealTypeLabel(mealType)} - different ingredients, different cuisine, different style.
` : `First ${getMealTypeLabel(mealType)} of the week - set a good variety foundation!`;

          // Costruisci testo intolleranze
          let intolerancesText = '';
          if (generationPrefs.intolerances && generationPrefs.intolerances.length > 0) {
            intolerancesText = `\n\n🚫 INTOLLERANZE (NO): ${generationPrefs.intolerances.map(i => intolerancesMap[i] || i.toUpperCase()).join(', ')}`;
          }
          if (generationPrefs.custom_intolerances && generationPrefs.custom_intolerances.trim()) {
            intolerancesText += `\n🚫 User also avoids: "${generationPrefs.custom_intolerances}"`;
          }
          
          const isSnack = mealType.includes('snack');
          const preparationRules = isSnack 
            ? 'ULTRA SIMPLE SNACK: ONLY ready-to-eat. NO cooking. Examples: yogurt+fruit, nuts, crackers+cheese.'
            : 'SIMPLE ASSEMBLY ONLY: NO cooking. Examples: sandwiches, salads, cold plates with pre-cooked ingredients.';

          const singleMealPrompt = `Create ONE ${getMealTypeLabel(mealType)} in ${langName.toUpperCase()} for ${day}.
${varietyContext}

Target: ${targetCals} kcal
Diet: ${generationPrefs.diet_type}
Allowed: ${dietRules.allowed}
${preparationRules}
${isCheatMeal ? `\n🍕 CHEAT MEAL: User favorites: ${nutritionData.favorite_foods?.join(', ') || 'pizza, pasta, burger'}. Can go +20% calories.` : ''}
🛒 Use ONLY common supermarket ingredients.
${cookingTimeContext}
${intolerancesText}
${pantryIngredientsPrompt}

CRITICAL: For eggs, use ONLY whole numbers (1, 2, 3), NEVER decimals.
Use accurate nutritional data. All in ${langName.toUpperCase()}.`;

          let mealResponse = null;
          let mealRetries = 0;
          
          while (mealRetries < 3 && !mealResponse) {
            try {
              mealResponse = await base44.integrations.Core.InvokeLLM({
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
            } catch (error) {
              mealRetries++;
              console.error(`❌ Errore generazione ${day} ${mealType} (tentativo ${mealRetries}/3):`, error);
              if (mealRetries >= 3) {
                throw new Error(`Impossibile generare ${mealType} per ${day}: ${error.message}`);
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * mealRetries));
            }
          }
          
          if (!mealResponse || !mealResponse.ingredients || !Array.isArray(mealResponse.ingredients)) {
            console.error(`❌ ${day} ${mealType}: risposta LLM non valida`, mealResponse);
            continue;
          }
          // ✅ NORMALIZZA NOMI (de-duplica ingredienti)
          const normalizedIngredients = new Map();
          
          mealResponse.ingredients.forEach(ing => {
              const normalizedName = ing.name.toLowerCase().trim();
              
              const ingredient = {
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                calories: ing.calories,
                protein: Math.round((ing.protein || 0) * 10) / 10,
                carbs: Math.round((ing.carbs || 0) * 10) / 10,
                fat: Math.round((ing.fat || 0) * 10) / 10
              };
              
              // ✅ Unisci duplicati
              if (normalizedIngredients.has(normalizedName)) {
                const existing = normalizedIngredients.get(normalizedName);
                existing.quantity += ingredient.quantity;
                existing.calories += ingredient.calories;
                existing.protein += ingredient.protein;
                existing.carbs += ingredient.carbs;
                existing.fat += ingredient.fat;
              } else {
                normalizedIngredients.set(normalizedName, ingredient);
              }
          });

                let roundedIngredients = Array.from(normalizedIngredients.values());
                let calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
                const diff = targetCals - calculatedCalories;

            // ✅ Aggiungi olio SOLO per pasti principali E solo se deficit > 50 kcal
            const isMainMeal = ['breakfast', 'lunch', 'dinner'].includes(mealType);
            if (diff > 50 && isMainMeal) {
              const oilKey = roundedIngredients.findIndex(ing => 
                ing.name.toLowerCase().includes('olio') && ing.name.toLowerCase().includes('oliva')
              );

              const oilMl = Math.round(diff / 9);
              const oilCalories = oilMl * 9;

              if (oilKey >= 0) {
                roundedIngredients[oilKey].quantity += oilMl;
                roundedIngredients[oilKey].calories += oilCalories;
                roundedIngredients[oilKey].fat += Math.round(oilMl * 10) / 10;
              } else {
                roundedIngredients.push({
                  name: "olio d'oliva",
                  quantity: oilMl,
                  unit: "ml",
                  calories: oilCalories,
                  protein: 0.0,
                  carbs: 0.0,
                  fat: Math.round(oilMl * 10) / 10
                });
              }
              calculatedCalories += oilCalories;
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
              name: mealResponse.name,
              ingredients: roundedIngredients,
              instructions: mealResponse.instructions || [],
              total_calories: calculatedCalories,
              total_protein: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10,
              total_carbs: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10,
              total_fat: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10,
              prep_time: mealResponse.prep_time || 15,
              difficulty: mealResponse.difficulty || 'easy',
              image_url: null,
              is_cheat_meal: isCheatMeal
            });

          console.log(`✅ ${day} ${mealType}: ${calculatedCalories} kcal`);
        }
        
        // 🎯 VALIDAZIONE E BILANCIAMENTO GIORNALIERO (dopo tutti i pasti del giorno)
          const dayMeals = allGeneratedMeals.filter(m => m.day_of_week === day);
          let dayTotalCals = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);
          const dayGap = dailyCalories - dayTotalCals;
          
          console.log(`📊 ${day} PRIMA del bilanciamento: ${dayTotalCals} kcal (target: ${dailyCalories}, gap: ${dayGap})`);
          
          // Se gap > 10 kcal, bilancia TUTTI i pasti del giorno
          if (Math.abs(dayGap) > 10) {
            console.log(`🔧 INIZIO Bilanciamento ${day}: gap ${dayGap} kcal`);
            
            // Scala proporzionale semplice
            const scaleFactor = dailyCalories / dayTotalCals;
            console.log(`🔧 Fattore scala: ${scaleFactor.toFixed(6)}`);
            
            // Scala TUTTI gli ingredienti di TUTTI i pasti del giorno
            dayMeals.forEach(meal => {
              meal.ingredients = meal.ingredients.map(ing => ({
                ...ing,
                quantity: Math.max(1, Math.round(ing.quantity * scaleFactor)),
                calories: Math.round(ing.calories * scaleFactor),
                protein: Math.round(ing.protein * scaleFactor * 10) / 10,
                carbs: Math.round(ing.carbs * scaleFactor * 10) / 10,
                fat: Math.round(ing.fat * scaleFactor * 10) / 10
              }));
              
              // Ricalcola totali pasto
              meal.total_calories = Math.round(meal.ingredients.reduce((s, i) => s + i.calories, 0));
              meal.total_protein = Math.round(meal.ingredients.reduce((s, i) => s + i.protein, 0) * 10) / 10;
              meal.total_carbs = Math.round(meal.ingredients.reduce((s, i) => s + i.carbs, 0) * 10) / 10;
              meal.total_fat = Math.round(meal.ingredients.reduce((s, i) => s + i.fat, 0) * 10) / 10;
            });
            
            const finalDayTotal = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);
            console.log(`✅ ${day} DOPO bilanciamento: ${finalDayTotal} kcal (scarto: ${Math.abs(finalDayTotal - dailyCalories)})`);
          } else {
            console.log(`✅ ${day} già bilanciato: ${dayTotalCals} kcal (gap: ${dayGap})`);
          }
          
          // 🚨 VALIDAZIONE MACROS PER DIETA
          const dayTotalCarbs = dayMeals.reduce((sum, m) => sum + m.total_carbs, 0);
          const dayTotalFat = dayMeals.reduce((sum, m) => sum + m.total_fat, 0);
          const dayTotalProtein = dayMeals.reduce((sum, m) => sum + m.total_protein, 0);
          const totalCals = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);
          
          const fatPercent = totalCals > 0 ? (dayTotalFat * 9) / totalCals * 100 : 0;
          const proteinPercent = totalCals > 0 ? (dayTotalProtein * 4) / totalCals * 100 : 0;
          const carbsPercent = totalCals > 0 ? (dayTotalCarbs * 4) / totalCals * 100 : 0;
          
          console.log(`📊 ${day} MACROS: ${dayTotalCarbs}g carbs, ${dayTotalProtein}g protein, ${dayTotalFat}g fat`);
          console.log(`📊 ${day} %: ${carbsPercent.toFixed(1)}% carbs, ${proteinPercent.toFixed(1)}% protein, ${fatPercent.toFixed(1)}% fat`);
          
          let isValidDay = true;
          let validationError = '';
          
          const dietType = generationPrefs.diet_type;
          
          if (dietType === 'keto') {
            if (dayTotalCarbs > 50) {
              isValidDay = false;
              validationError = `KETO FAIL: ${dayTotalCarbs}g carbs (max 50g)`;
            }
            if (fatPercent < 65) {
              isValidDay = false;
              validationError += ` | Grassi ${fatPercent.toFixed(0)}% (min 65%)`;
            }
          } else if (dietType === 'carnivore') {
            if (dayTotalCarbs > 5) {
              isValidDay = false;
              validationError = `CARNIVORE FAIL: ${dayTotalCarbs}g carbs (max 5g)`;
            }
          } else if (dietType === 'low_carb') {
            if (dayTotalCarbs > 100) {
              isValidDay = false;
              validationError = `LOW CARB FAIL: ${dayTotalCarbs}g carbs (max 100g)`;
            }
          } else if (dietType === 'soft_low_carb') {
            if (dayTotalCarbs > 150) {
              isValidDay = false;
              validationError = `SOFT LOW CARB FAIL: ${dayTotalCarbs}g carbs (max 150g)`;
            }
          } else if (dietType === 'paleo') {
            // Paleo: no cereali/legumi - controllo qualitativo fatto dall'AI
            if (dayTotalCarbs > 150) {
              isValidDay = false;
              validationError = `PALEO FAIL: ${dayTotalCarbs}g carbs (max 150g)`;
            }
          }
          
          if (!isValidDay) {
            console.error(`❌ ${day} NON VALIDO: ${validationError}`);
            console.log(`🔄 RIGENERAZIONE ${day}...`);
            
            // Rimuovi pasti non validi
            allGeneratedMeals.splice(
              allGeneratedMeals.findIndex(m => m.day_of_week === day),
              dayMeals.length
            );
            
            // Decrementa dayIndex per rigenerare questo giorno
            dayIndex--;
            continue;
          }
          
          console.log(`✅ ${day} VALIDATO: macros corretti per dieta ${dietType}`);
      }

      updateProgress(90, t('meals.savingIngredients'));
      
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

      updateProgress(95, t('meals.savingMeals'));
      const createdMealIds = [];
      
      // ✅ Ricarica l'utente per assicurarsi che l'ID sia corretto
      const freshUser = await base44.auth.me();
      console.log('📝 Salvando pasti per user_id:', freshUser.id);
      
      for (let i = 0; i < allGeneratedMeals.length; i++) {
        const meal = allGeneratedMeals[i];
        // ✅ Assicurati che user_id sia sempre quello fresco
        meal.user_id = freshUser.id;
        
        console.log(`📝 Creando pasto ${i+1}/${allGeneratedMeals.length}: ${meal.name} per user_id: ${meal.user_id}`);
        
        try {
          const createdMeal = await base44.entities.MealPlan.create(meal);
          console.log(`✅ Pasto creato con ID: ${createdMeal.id}`);
          createdMealIds.push({ id: createdMeal.id, meal });
        } catch (createError) {
          console.error(`❌ Errore creazione pasto ${meal.name}:`, createError);
          throw new Error(`Impossibile salvare il pasto "${meal.name}": ${createError.message}`);
        }
      }
      
      // ✅ VALIDAZIONE FINALE: verifica che TUTTI i pasti siano stati creati
      const expectedMeals = daysToGenerate.length * mealStructure.length;
      const actualMeals = allGeneratedMeals.length;
      
      if (actualMeals < expectedMeals) {
        console.warn(`⚠️ ATTENZIONE: Creati solo ${actualMeals}/${expectedMeals} pasti!`);
        updateProgress(91, `Recupero ${expectedMeals - actualMeals} pasti mancanti...`);
        
        // Trova quali pasti mancano PER GIORNO
        const missingByDay = {};
        for (const day of daysToGenerate) {
          const dayMissingMeals = [];
          for (const mealType of mealStructure) {
            const exists = allGeneratedMeals.some(m => m.day_of_week === day && m.meal_type === mealType);
            if (!exists) {
              dayMissingMeals.push(mealType);
            }
          }
          if (dayMissingMeals.length > 0) {
            missingByDay[day] = dayMissingMeals;
          }
        }
        
        // Rigenera GIORNO INTERO se manca più di 1 pasto
        for (const [day, missingMealTypes] of Object.entries(missingByDay)) {
          try {
            console.log(`🔄 Rigenerazione ${day} (${missingMealTypes.length} pasti mancanti)...`);
            
            const mealSpecs = missingMealTypes.map(mealType => ({
              meal_type: mealType,
              label: getMealTypeLabel(mealType),
              target_calories: mealCalorieDistribution[mealType],
              is_cheat: cheatMeals.some(cm => cm.day === day && cm.meal_type === mealType)
            }));
            
            let recoveryIntolerancesText = '';
            if (generationPrefs.intolerances && generationPrefs.intolerances.length > 0) {
              recoveryIntolerancesText = `\n\n🚫 NO: ${generationPrefs.intolerances.map(i => intolerancesMap[i] || i.toUpperCase()).join(', ')}`;
            }
            if (generationPrefs.custom_intolerances && generationPrefs.custom_intolerances.trim()) {
              recoveryIntolerancesText += `\n🚫 User also said: "${generationPrefs.custom_intolerances}" - NEVER include these.`;
            }

            const langName = language || 'italian';
            const recoveryPrompt = `Create ${missingMealTypes.length} meals in ${langName.toUpperCase()} for ${day}:
${mealSpecs.map(spec => `${spec.label}: ${spec.target_calories} kcal${spec.is_cheat ? ' (CHEAT MEAL)' : ''}`).join('\n')}
Diet: ${generationPrefs.diet_type}. ${cookingTimeContext}${recoveryIntolerancesText}${pantryIngredientsPrompt}`;
            
            const recoveryResponse = await base44.integrations.Core.InvokeLLM({
              prompt: recoveryPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    minItems: missingMealTypes.length,
                    items: {
                      type: "object",
                      properties: {
                        meal_type: { type: "string", enum: missingMealTypes },
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
                      required: ["meal_type", "name", "ingredients", "instructions"]
                    }
                  }
                },
                required: ["meals"]
              }
            });
            
            for (const mealData of recoveryResponse.meals) {
              const targetCals = mealCalorieDistribution[mealData.meal_type];
              const isCheatMeal = cheatMeals.some(cm => cm.day === day && cm.meal_type === mealData.meal_type);
              
              // ✅ NORMALIZZA ingredienti per evitare duplicati
              const normalizedIngredients = new Map();
              
              // ✅ FIX: Verifica che ingredients esista prima di forEach
              if (!mealData.ingredients || !Array.isArray(mealData.ingredients)) {
                console.error(`❌ Recovery ${day} ${mealData.meal_type}: ingredients è undefined`, mealData);
                continue; // Salta questo pasto di recovery
              }
              
              mealData.ingredients.forEach(ing => {
                const normalizedName = ing.name.toLowerCase().trim();
                
                const ingredient = {
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit,
                  calories: ing.calories,
                  protein: Math.round((ing.protein || 0) * 10) / 10,
                  carbs: Math.round((ing.carbs || 0) * 10) / 10,
                  fat: Math.round((ing.fat || 0) * 10) / 10
                };
                
                // ✅ Unisci duplicati
                if (normalizedIngredients.has(normalizedName)) {
                  const existing = normalizedIngredients.get(normalizedName);
                  existing.quantity += ingredient.quantity;
                  existing.calories += ingredient.calories;
                  existing.protein += ingredient.protein;
                  existing.carbs += ingredient.carbs;
                  existing.fat += ingredient.fat;
                } else {
                  normalizedIngredients.set(normalizedName, ingredient);
                }
              });
              
              let roundedIngredients = Array.from(normalizedIngredients.values());
              let calculatedCalories = Math.round(roundedIngredients.reduce((sum, ing) => sum + (ing.calories || 0), 0));
              const diff = targetCals - calculatedCalories;
              
              // ✅ Aggiungi olio SOLO per pasti principali E solo se deficit > 50 kcal
              const isMainMeal = ['breakfast', 'lunch', 'dinner'].includes(mealData.meal_type);
              if (diff > 50 && isMainMeal) {
                const oilKey = roundedIngredients.findIndex(ing => 
                  ing.name.toLowerCase().includes('olio') && ing.name.toLowerCase().includes('oliva')
                );
                
                const oilMl = Math.round(diff / 9);
                const oilCalories = oilMl * 9;
                
                if (oilKey >= 0) {
                  roundedIngredients[oilKey].quantity += oilMl;
                  roundedIngredients[oilKey].calories += oilCalories;
                  roundedIngredients[oilKey].fat += Math.round(oilMl * 10) / 10;
                } else {
                  roundedIngredients.push({
                    name: "olio d'oliva",
                    quantity: oilMl,
                    unit: "ml",
                    calories: oilCalories,
                    protein: 0.0,
                    carbs: 0.0,
                    fat: Math.round(oilMl * 10) / 10
                  });
                }
                calculatedCalories += oilCalories;
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
              
              const recoveredMeal = {
                user_id: user.id,
                day_of_week: day,
                meal_type: mealData.meal_type,
                name: mealData.name,
                ingredients: roundedIngredients,
                instructions: mealData.instructions || [],
                total_calories: calculatedCalories,
                total_protein: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.protein, 0) * 10) / 10,
                total_carbs: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.carbs, 0) * 10) / 10,
                total_fat: Math.round(roundedIngredients.reduce((sum, ing) => sum + ing.fat, 0) * 10) / 10,
                prep_time: mealData.prep_time || 15,
                difficulty: mealData.difficulty || 'easy',
                image_url: null,
                is_cheat_meal: isCheatMeal
              };
              
              const createdMeal = await createMealMutation.mutateAsync(recoveredMeal);
              createdMealIds.push({ id: createdMeal.id, meal: recoveredMeal });
              console.log(`✅ Recuperato: ${day} ${mealData.meal_type}`);
            }
          } catch (retryError) {
            console.error(`❌ Impossibile recuperare ${day}:`, retryError);
          }
        }
      }

      updateProgress(100, t('meals.completed'));
      
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
        
        // ✅ Forza il refresh dei dati
        console.log('🔄 Refreshing meal plans...');
        await queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
        await queryClient.refetchQueries({ queryKey: ['mealPlans'] });
        
        setAddedDays([]);
        
        // Aggiorna contatore generazioni
        await checkRemainingGenerations();
        
        alert(`✅ Piano nutrizionale generato con successo!`);
        
        console.log('🎨 Inizio generazione immagini in background...');
        
        (async () => {
          for (let i = 0; i < createdMealIds.length; i++) {
            const { id, meal } = createdMealIds[i];
            
            try {
              const ingredientsString = meal.ingredients.map(ing => `${ing.quantity}${ing.unit} ${ing.name}`).join(', ');
              const imagePrompt = `CRITICAL: Create an accurate, realistic food photograph that shows EXACTLY what is described below.

Dish: "${meal.name}"
Main ingredients (MUST be clearly visible): ${ingredientsString}

STRICT RULES:
- Show ONLY the listed ingredients in their natural, recognizable form
- If "noci" (walnuts) → show actual walnuts/nuts in a bowl, NOT bread or toast
- If "salmone" → show salmon fillet, NOT other fish
- If "petto di pollo" → show chicken breast, NOT other meats
- If "bistecca" → show beef steak, NOT chicken or pork
- NO creative interpretations or substitutions
- The photo must match the ingredient list EXACTLY
- Professional food photography, white ceramic plate, natural lighting
- 45-degree angle, appetizing presentation, realistic portions`;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26847F]"></div>
          <p className="text-gray-600 font-medium">Inizializzazione protocolli...</p>
        </div>
      </div>
    );
  }
  
  if (isGenerating) {
    return <MealPlanGenerating generationProgress={generationProgress} generationStatus={generationStatus} nutritionData={nutritionData} t={t} />;
  }

  const days = [
    { key: 'monday', label: t('meals.monday') },
    { key: 'tuesday', label: t('meals.tuesday') },
    { key: 'wednesday', label: t('meals.wednesday') },
    { key: 'thursday', label: t('meals.thursday') },
    { key: 'friday', label: t('meals.friday') },
    { key: 'saturday', label: t('meals.saturday') },
    { key: 'sunday', label: t('meals.sunday') }
  ];

  const isTrialUser = user?.subscription_plan === 'trial';
  const trialBlockedDays = ['thursday', 'friday', 'saturday', 'sunday'];
  
  // Mostra solo lunedì-mercoledì per utenti trial
  const availableDays = isTrialUser 
    ? days.filter(day => !trialBlockedDays.includes(day.key))
    : days;
  
  const todaysMeals = mealPlans.filter(plan => plan.day_of_week === selectedDay);
  
  const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4'];

  // Mappa per normalizzare meal_type italiani in inglesi
  const normalizeMealType = (type) => {
    const map = {
      'colazione': 'breakfast',
      'spuntino1': 'snack1',
      'pranzo': 'lunch',
      'spuntino2': 'snack2',
      'cena': 'dinner',
      'spuntino3': 'snack3',
      'spuntino4': 'snack4'
    };
    return map[type?.toLowerCase()] || type;
  };

  const getMealTypeLabel = (type) => {
    const normalized = normalizeMealType(type);
    const labels = { 
      breakfast: t('meals.breakfast'),
      snack1: t('meals.snack1'),
      lunch: t('meals.lunch'),
      snack2: t('meals.snack2'),
      dinner: t('meals.dinner'),
      snack3: t('meals.snack3'),
      snack4: t('meals.snack4')
    };
    return labels[normalized] || type;
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
      <div className="pb-40">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('meals.title')}</h1>
              <p className="text-gray-600">{t('meals.subtitle')}</p>
              {remainingGenerations !== null && remainingGenerations !== -1 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <BrainCircuit className="w-4 h-4 text-[#26847F]" />
                    <span className={`font-semibold ${remainingGenerations === 0 ? 'text-red-600' : 'text-[#26847F]'}`}>
                      {t('meals.generationsRemaining').replace('{count}', remainingGenerations)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col lg:flex-row gap-2.5 w-full lg:w-auto">
              {/* AI Generate */}
              <button
                onClick={() => handleShowGenerator(user)}
                disabled={generationLimitReached && remainingGenerations === 0}
                className="relative order-1 lg:order-3 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm text-white w-full lg:w-auto overflow-hidden transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #26847F 0%, #1a9e97 100%)', boxShadow: '0 4px 15px rgba(38,132,127,0.4)' }}
              >
                <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity rounded-2xl" />
                <BrainCircuit className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{t('meals.regenerateWithAI')}</span>
                {generationLimitReached && remainingGenerations === 0 && (
                  <AlertCircle className="w-4 h-4 animate-pulse" />
                )}
              </button>

              {/* Carica Piano */}
              <button
                onClick={() => setShowDoctorPlanModal(true)}
                className="relative order-2 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-semibold text-sm w-full lg:w-auto overflow-hidden transition-all duration-200 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', border: '1.5px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}
              >
                <span className="absolute inset-0 bg-blue-500 opacity-0 hover:opacity-5 transition-opacity rounded-2xl" />
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>Carica il tuo Piano</span>
              </button>

              {/* Pantry + Shopping */}
              <div className="flex gap-2.5 w-full lg:w-auto order-3">
                <button
                  onClick={() => setShowPantry(true)}
                  className="relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-semibold text-sm flex-1 lg:flex-initial overflow-hidden transition-all duration-200 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)', color: '#7c3aed', border: '1.5px solid rgba(124,58,237,0.25)', boxShadow: '0 4px 12px rgba(124,58,237,0.15)' }}
                >
                  <span className="absolute inset-0 bg-purple-500 opacity-0 hover:opacity-5 transition-opacity rounded-2xl" />
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>{t('meals.pantry')}</span>
                </button>
                <button
                  onClick={() => setShowShoppingList(true)}
                  className="relative flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-semibold text-sm flex-1 lg:flex-initial transition-all duration-200 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #f0fdf8 0%, #d1fae5 100%)', color: '#047857', border: '1.5px solid rgba(4,120,87,0.25)', boxShadow: '0 4px 12px rgba(4,120,87,0.15)' }}
                >
                  <span className="absolute inset-0 bg-emerald-500 opacity-0 hover:opacity-5 transition-opacity rounded-2xl" />
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  <span>{t('meals.shoppingList')}</span>
                  {shoppingLists.length > 0 && shoppingLists[0].items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md border-2 border-white">
                      {shoppingLists[0].items.length}
                    </span>
                  )}
                </button>
              </div>
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
                      🚫 {t('meals.limitReached')}
                    </h3>
                    <p className="text-amber-800 mb-1">
                      {t('meals.limitReachedDesc')
                        .replace('{limit}', getGenerationLimit(user?.subscription_plan, 'meal'))
                        .replace('{plan}', user?.subscription_plan || 'base')}
                    </p>
                    <p className="text-sm text-amber-700">
                      💡 {t('meals.limitReachedTip')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      ⬆️ {t('meals.upgradePlan')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showGenerator && (
            <MealPlanWizard
              user={user}
              onComplete={handleWizardComplete}
              onCancel={() => setShowGenerator(false)}
            />
          )}

          {showCheatMealStep && (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardContent className="p-6">
                <CheatMealStep
                  weightLossSpeed={user?.weight_loss_speed || 'moderate'}
                  onComplete={handleCheatMealComplete}
                  onSkip={handleCheatMealSkip}
                />
              </CardContent>
            </Card>
          )}

          {mealPlans.length > 0 ? (
            <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
              <CardHeader className="border-b border-gray-200/30">
                <CardTitle className="text-lg text-gray-900">{t('meals.weeklySchedule')}</CardTitle>
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
                            ? 'text-[#26847F] border-[#26847F] bg-[#E0F2F1]/50'
                            : 'text-gray-500 border-transparent hover:text-[#26847F] hover:border-teal-300'
                        }`}
                      >
                        <span>{day.label.substring(0, 3)}</span>
                        {isAdded && <Check className="w-3 h-3 text-green-600" />}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[300px]">
                  {todaysMeals.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-lg">{t('meals.protocolFor').replace('{day}', getDayLabel(selectedDay))}</h4>
                        <Button
                          onClick={() => setShowShoppingChoice(true)}
                          size="sm"
                          variant="outline"
                          className="border-[#26847F] text-[#26847F] hover:bg-[#E0F2F1]"
                        >
                          <Plus className="w-4 h-4 mr-1" />{t('meals.addToShoppingList')}
                        </Button>
                      </div>

                      <div className="bg-gradient-to-r from-[#E0F2F1] to-blue-50 rounded-xl p-4 border-2 border-[#26847F]/30 mb-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('meals.totalCalories')}</p>
                            <p className="text-2xl font-bold text-[#26847F]">{Math.round(dailyTotals.calories)}</p>
                            <p className="text-xs text-gray-500">kcal</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('meals.protein')}</p>
                            <p className="text-2xl font-bold text-red-600">{Math.round(dailyTotals.protein * 10) / 10}</p>
                            <p className="text-xs text-gray-500">g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('meals.carbs')}</p>
                            <p className="text-2xl font-bold text-blue-600">{Math.round(dailyTotals.carbs * 10) / 10}</p>
                            <p className="text-xs text-gray-500">g</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">{t('meals.fat')}</p>
                            <p className="text-2xl font-bold text-yellow-600">{Math.round(dailyTotals.fat * 10) / 10}</p>
                            <p className="text-xs text-gray-500">g</p>
                          </div>
                        </div>
                        {nutritionData?.daily_calories && (
                          <div className="mt-3 pt-3 border-t border-[#26847F]/20">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{t('meals.dailyTarget')}: {nutritionData.daily_calories} kcal</span>
                              <span className={`font-semibold ${Math.abs(dailyTotals.calories - nutritionData.daily_calories) <= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                {dailyTotals.calories > nutritionData.daily_calories ? '+' : ''}
                                {Math.round(dailyTotals.calories - nutritionData.daily_calories)} kcal
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {mealTypes.map((mealType) => {
                        const meal = todaysMeals.find(m => normalizeMealType(m.meal_type) === mealType);
                        return meal ? (
                          <div key={meal.id} className={`relative w-full text-left rounded-lg p-3 border transition-colors group ${
                            meal.is_cheat_meal 
                              ? 'bg-gradient-to-br from-orange-50 to-pink-50 border-orange-300/60 hover:bg-gradient-to-br hover:from-orange-100 hover:to-pink-100'
                              : 'bg-gray-50/80 border-gray-200/60 hover:bg-gray-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              {/* Pulsante Sostituisci Pasto - a sinistra */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplaceMealTarget(meal);
                                }}
                                disabled={regeneratingMealId === meal.id}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[#26847F] hover:border-[#26847F] hover:bg-[#e9f6f5] shadow-sm hover:shadow-md transition-all duration-200"
                                title="Sostituisci pasto"
                              >
                                {regeneratingMealId === meal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#26847F]" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </button>
                              
                              {/* Contenuto pasto cliccabile */}
                              <button onClick={() => setSelectedMeal(meal)} className="flex-1 flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-3 text-left min-w-0">
                                  <div className="w-14 h-11 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden flex-shrink-0">
                                    {meal.is_cheat_meal ? (
                                      <span className="text-2xl">🍕</span>
                                    ) : meal.image_url ? (
                                      <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover"/>
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-gray-400 animate-pulse"/>
                                    )}
                                  </div>
                                  <div className="text-left min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{getMealTypeLabel(meal.meal_type)}</p>
                                    <p className={`text-xs truncate max-w-[120px] sm:max-w-[200px] ${
                                      meal.is_cheat_meal ? 'text-orange-600 font-bold' : 'text-gray-600'
                                    }`}>
                                      {meal.is_cheat_meal ? 'CHEAT MEAL' : meal.name}
                                    </p>
                                  </div>
                                </div>
                                {!meal.is_cheat_meal && (
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-bold text-gray-800 text-sm">{meal.total_calories} <span className="text-xs font-normal text-gray-500">kcal</span></p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      <span className="text-red-600 font-semibold">{Math.round(meal.total_protein || 0)}P</span>
                                      <span className="text-gray-400 mx-0.5">•</span>
                                      <span className="text-blue-600 font-semibold">{Math.round(meal.total_carbs || 0)}C</span>
                                      <span className="text-gray-400 mx-0.5">•</span>
                                      <span className="text-yellow-600 font-semibold">{Math.round(meal.total_fat || 0)}G</span>
                                    </p>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <Utensils className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium text-lg">{t('meals.noDataFor').replace('{day}', getDayLabel(selectedDay))}</p>
                      <p className="text-sm text-gray-400 mt-1">{t('meals.generatePrompt')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            !showGenerator && (
              <Card className="bg-white/55 backdrop-blur-md border-gray-200/30 shadow-xl rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#26847F]/10 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Database className="w-8 h-8 text-[#26847F]" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 mb-4">{t('meals.noProtocol')}</CardTitle>
                  <p className="text-gray-600 mb-6">{t('meals.generateToStart')}</p>
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
      {showPantry && (
        <PantryModal isOpen={showPantry} user={user} onClose={() => setShowPantry(false)} />
      )}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={user?.subscription_plan || 'base'} />
      )}
      {showDoctorPlanModal && (
        <DoctorMealPlanModal
          isOpen={showDoctorPlanModal}
          onClose={() => setShowDoctorPlanModal(false)}
          user={user}
          existingMealPlans={mealPlans}
          onPlanSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
          }}
        />
      )}
      {showShoppingChoice && (() => {
        const sc = {
          it: { title: 'Aggiungi alla lista della spesa', subtitle: 'Vuoi aggiungere solo gli ingredienti di oggi o di tutta la settimana?', day: `📅 Solo ${getDayLabel(selectedDay)}`, week: '📆 Tutta la settimana', cancel: 'Annulla' },
          en: { title: 'Add to shopping list', subtitle: 'Do you want to add only today\'s ingredients or the whole week?', day: `📅 Only ${getDayLabel(selectedDay)}`, week: '📆 Whole week', cancel: 'Cancel' },
          es: { title: 'Añadir a la lista de compras', subtitle: '¿Quieres añadir solo los ingredientes de hoy o de toda la semana?', day: `📅 Solo ${getDayLabel(selectedDay)}`, week: '📆 Toda la semana', cancel: 'Cancelar' },
          pt: { title: 'Adicionar à lista de compras', subtitle: 'Queres adicionar apenas os ingredientes de hoje ou de toda a semana?', day: `📅 Só ${getDayLabel(selectedDay)}`, week: '📆 Toda a semana', cancel: 'Cancelar' },
          de: { title: 'Zur Einkaufsliste hinzufügen', subtitle: 'Möchtest du nur die Zutaten von heute oder der ganzen Woche hinzufügen?', day: `📅 Nur ${getDayLabel(selectedDay)}`, week: '📆 Ganze Woche', cancel: 'Abbrechen' },
          fr: { title: 'Ajouter à la liste de courses', subtitle: 'Veux-tu ajouter seulement les ingrédients d\'aujourd\'hui ou de toute la semaine ?', day: `📅 Seulement ${getDayLabel(selectedDay)}`, week: '📆 Toute la semaine', cancel: 'Annuler' },
        };
        const txt = sc[language] || sc.it;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowShoppingChoice(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{txt.title}</h3>
              <p className="text-sm text-gray-500 mb-5">{txt.subtitle}</p>
              <div className="flex flex-col gap-2.5 mt-1">
                <button
                  onClick={() => { setShowShoppingChoice(false); addDayToShoppingList(selectedDay); }}
                  className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #26847F 0%, #1a9e97 100%)', boxShadow: '0 4px 15px rgba(38,132,127,0.35)' }}
                >{txt.day}</button>
                <button
                  onClick={() => { setShowShoppingChoice(false); addWeekToShoppingList(); }}
                  className="w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #f0fdf8 0%, #d1fae5 100%)', color: '#047857', border: '1.5px solid rgba(4,120,87,0.25)', boxShadow: '0 4px 12px rgba(4,120,87,0.12)' }}
                >{txt.week}</button>
                <button
                  onClick={() => setShowShoppingChoice(false)}
                  className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                >{txt.cancel}</button>
              </div>
            </div>
          </div>
        );
      })()}
      {replaceMealTarget && (
        <ReplaceMealModal
          isOpen={!!replaceMealTarget}
          onClose={() => setReplaceMealTarget(null)}
          meal={replaceMealTarget}
          user={user}
          nutritionData={nutritionData}
          onMealReplaced={() => {
            queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
            setReplaceMealTarget(null);
          }}
        />
      )}
    </>
  );
}