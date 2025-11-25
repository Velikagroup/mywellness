import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Database, BrainCircuit, CheckCircle, ImageIcon, ShoppingCart, Plus, Check, RotateCcw, Loader2, Activity, AlertCircle, Package } from "lucide-react";
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
    if (status === 'in-progress') return <Loader2 className="inline w-4 h-4 mr-2 text-[#26847F] animate-spin" />;
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
              <Progress value={generationProgress} className="w-full h-2.5 [&>div]:bg-[#26847F]" />
              <p className="text-sm text-[#26847F] font-semibold text-center min-h-[20px]">
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
  const [showPantry, setShowPantry] = useState(false);
  const [addedDays, setAddedDays] = useState([]);
  const [regeneratingMealId, setRegeneratingMealId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(5);
  const [remainingGenerations, setRemainingGenerations] = useState(null);
  const [generationLimitReached, setGenerationLimitReached] = useState(false);
  const [showCheatMealStep, setShowCheatMealStep] = useState(false);
  const [cheatMealConfig, setCheatMealConfig] = useState([]);

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
      console.log('🔍 Fetching meal plans for user_id:', user.id);
      const plans = await base44.entities.MealPlan.list();
      console.log('📦 All meal plans fetched:', plans.length, plans.map(p => ({ id: p.id, user_id: p.user_id, name: p.name })));
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
      
      const cookingTimeContext = generationPrefs?.cooking_time_preference === 'quick' 
        ? 'Preferisci ricette VELOCI (10-20 minuti). Scegli preparazioni semplici e rapide.'
        : generationPrefs?.cooking_time_preference === 'relaxed'
        ? 'Puoi dedicare PIÙ TEMPO alla cucina (30+ minuti). Puoi includere ricette più elaborate.'
        : 'Tempo moderato (20-30 minuti). Bilanciamento tra velocità e qualità.';

      const singleMealPrompt = `You are an expert AI nutritionist. Create ONE meal in ITALIAN. 
Target: ${targetCalories} kcal. 
Diet: ${nutritionData.diet_type}. 
Allowed: ${dietRules.allowed}. 
${cookingTimeContext}
CRITICAL: For eggs ('uova'), use ONLY whole numbers (1, 2, 3), NEVER decimals.
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

      // ✅ MATCH con dispensa utente
      const userIngredients = await base44.entities.UserIngredient.filter({ user_id: user.id });
      
      let validIngredients = llmResponse.ingredients.filter(ing => 
        ing.name && ing.quantity != null && ing.unit && ing.calories != null
      );

      // Sostituisci con ingredienti dalla dispensa se disponibili
      validIngredients = validIngredients.map(ing => {
        const pantryMatch = userIngredients.find(ui => 
          ui.name.toLowerCase().includes(ing.name.toLowerCase()) || 
          ing.name.toLowerCase().includes(ui.name.toLowerCase())
        );
        
        if (pantryMatch) {
          // Assuming ing.quantity is in grams or a unit that scales linearly for 100g metrics
          const gramsUsed = ing.quantity;
          return {
            name: pantryMatch.name, // Use pantry's name for consistency
            quantity: gramsUsed,
            unit: pantryMatch.unit, // Use pantry's unit (or consider LLM's unit if more appropriate for recipe steps)
            calories: Math.round((pantryMatch.calories_per_100g / 100) * gramsUsed),
            protein: Math.round((pantryMatch.protein_per_100g / 100) * gramsUsed * 10) / 10,
            carbs: Math.round((pantryMatch.carbs_per_100g / 100) * gramsUsed * 10) / 10,
            fat: Math.round((pantryMatch.fat_per_100g / 100) * gramsUsed * 10) / 10
          };
        }
        
        return {
          ...ing,
          protein: Math.round(ing.protein * 10) / 10,
          carbs: Math.round(ing.carbs * 10) / 10,
          fat: Math.round(ing.fat * 10) / 10
        };
      });

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
        if (calorieDifference > 5) {
          // ✅ Controlla se l'olio è già presente
          const oilIndex = validIngredients.findIndex(ing => 
            ing.name.toLowerCase().includes('olio') && ing.name.toLowerCase().includes('oliva')
          );
          
          const oilMl = Math.round(calorieDifference / 9);
          const oilCalories = oilMl * 9;
          
          if (oilIndex >= 0) {
            // Se esiste già, aumenta la quantità
            validIngredients[oilIndex].quantity += oilMl;
            validIngredients[oilIndex].calories += oilCalories;
            validIngredients[oilIndex].fat = Math.round((validIngredients[oilIndex].fat + oilMl) * 10) / 10;
          } else {
            // Aggiungi nuovo
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
    setGenerationStatus("Avvio protocollo AI...");

    try {
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, "Analisi profilo metabolico...");

      // Carica ingredienti dispensa
      const userIngredients = await base44.entities.UserIngredient.filter({ user_id: user.id });
      console.log('📦 Ingredienti dispensa caricati:', userIngredients.length);
      
      // ✅ CREA LISTA INGREDIENTI PRIORITARI da passare all'AI
      const pantryIngredientsPrompt = userIngredients.length > 0 
        ? `\n\nPRIORITY INGREDIENTS FROM USER'S PANTRY (use these when possible with EXACT nutritional values):\n${
            userIngredients.map(ing => 
              `- ${ing.name}: ${ing.calories_per_100g}kcal, ${ing.protein_per_100g}g protein, ${ing.carbs_per_100g}g carbs, ${ing.fat_per_100g}g fat per 100g (unit: ${ing.unit})`
            ).join('\n')
          }`
        : '';

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

      updateProgress(15, "Rimozione piani precedenti...");
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
      
      // ✅ OTTIMIZZAZIONE: genera tutti i pasti di un giorno in UNA SOLA chiamata LLM
      // Invece di 35 chiamate (5 pasti × 7 giorni), ne facciamo solo 7!
      for (let dayIndex = 0; dayIndex < daysToGenerate.length; dayIndex++) {
        const day = daysToGenerate[dayIndex];
        const progress = 20 + Math.round((dayIndex / daysToGenerate.length) * 70);
        const dayLabel = { monday: 'Lunedì', tuesday: 'Martedì', wednesday: 'Mercoledì', thursday: 'Giovedì', friday: 'Venerdì', saturday: 'Sabato', sunday: 'Domenica' }[day];
        updateProgress(progress, `Generazione ${dayLabel} (${dayIndex + 1}/${daysToGenerate.length})...`);
        
        // Costruisci le specifiche per ogni pasto del giorno
        const mealSpecs = mealStructure.map(mealType => {
          const isCheatMeal = cheatMeals.some(cm => cm.day === day && cm.meal_type === mealType);
          return {
            meal_type: mealType,
            label: getMealTypeLabel(mealType),
            target_calories: mealCalorieDistribution[mealType],
            is_cheat: isCheatMeal
          };
        });
        
        // Costruisci testo intolleranze
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
        
        let intolerancesText = '';
        if (generationPrefs.intolerances && generationPrefs.intolerances.length > 0) {
          intolerancesText = `\n\n🚫 INTOLLERANZE ALIMENTARI (ASSOLUTAMENTE DA EVITARE):\n${generationPrefs.intolerances.map(i => `- ${intolerancesMap[i] || i.toUpperCase()}`).join('\n')}`;
        }
        if (generationPrefs.custom_intolerances && generationPrefs.custom_intolerances.trim()) {
          intolerancesText += `\n\n🚫 CIBI DA EVITARE (custom user preferences):\nUser wrote: "${generationPrefs.custom_intolerances}"\nInterpret this and NEVER include these foods/ingredients in ANY meal.`;
        }
        if (intolerancesText) {
          intolerancesText += '\n\n⚠️ VERIFICA ATTENTAMENTE CHE NESSUN INGREDIENTE CONTENGA QUESTI ALLERGENI!';
        }

        const dayPrompt = `You are an expert nutritionist. Create a COMPLETE DAY of ${mealsPerDay} meals in ITALIAN for ${day}.

CRITICAL INSTRUCTIONS:
- Create EXACTLY ${mealsPerDay} meals
- Each meal must have accurate nutritional data
- Use ITALIAN names for all ingredients, meals, and units
- ${cookingTimeContext}
- Diet: ${generationPrefs.diet_type}
- Allowed foods: ${dietRules.allowed}
- CRITICAL: For eggs ('uova'), ALWAYS use whole numbers (1, 2, 3, etc.), NEVER decimals like 1.47
${intolerancesText}
${pantryIngredientsPrompt}

MEALS TO CREATE:
${mealSpecs.map(spec => `
${spec.label}:
- Target: ${spec.target_calories} kcal
${spec.is_cheat ? `- THIS IS A CHEAT MEAL: Make it delicious! User favorites: ${nutritionData.favorite_foods?.join(', ') || 'pizza, pasta, hamburger'}. Can go +20% calories.` : '- Follow diet rules strictly'}
`).join('\n')}

User: ${nutritionData.age} anni, ${nutritionData.gender}, ${nutritionData.current_weight}kg → ${nutritionData.target_weight}kg

Return a JSON with "${mealsPerDay} meals" array, each with exact structure as specified in schema.`;

        let retryCount = 0;
        const MAX_RETRIES = 3;
        let dayResponse = null;
        
        while (retryCount < MAX_RETRIES && !dayResponse) {
          try {
            dayResponse = await base44.integrations.Core.InvokeLLM({
              prompt: dayPrompt,
              response_json_schema: {
              type: "object",
              properties: {
                meals: {
                  type: "array",
                  minItems: mealsPerDay,
                  maxItems: mealsPerDay,
                  items: {
                    type: "object",
                    properties: {
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
            
            // Se arrivo qui, la chiamata è riuscita
            console.log(`✅ LLM response per ${day}:`, dayResponse?.meals?.length, 'pasti');
            break;
          } catch (llmError) {
            retryCount++;
            console.error(`❌ Errore LLM per ${day} (tentativo ${retryCount}/${MAX_RETRIES}):`, llmError);
            
            if (retryCount >= MAX_RETRIES) {
              console.error(`💥 GENERAZIONE FALLITA per ${day} dopo ${MAX_RETRIES} tentativi`);
              alert(`Errore durante la generazione di ${day}. Riprova o contatta il supporto.`);
              throw new Error(`Impossibile generare ${day} dopo ${MAX_RETRIES} tentativi: ${llmError.message}`);
            }
            
            // Attendi prima di ritentare (backoff esponenziale)
            const waitTime = 2000 * retryCount;
            console.log(`⏳ Attendo ${waitTime}ms prima del retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }

          if (!dayResponse?.meals || dayResponse.meals.length !== mealsPerDay) {
            console.error(`❌ SKIP: Giorno ${day} ha ${dayResponse?.meals?.length || 0} pasti invece di ${mealsPerDay}`);
            alert(`⚠️ Impossibile generare tutti i pasti per ${day}. Continuo con gli altri giorni...`);
            continue;
          }

          // Processa ogni pasto del giorno
          for (const mealData of dayResponse.meals) {
            const mealType = mealData.meal_type;
            const targetCals = mealCalorieDistribution[mealType];
            const isCheatMeal = cheatMeals.some(cm => cm.day === day && cm.meal_type === mealType);
            
            // ✅ MATCH ingredienti con dispensa + NORMALIZZA NOMI
            const normalizedIngredients = new Map();
            
            mealData.ingredients.forEach(ing => {
              const normalizedName = ing.name.toLowerCase().trim();
              
              const pantryMatch = userIngredients.find(ui => 
                ui.name.toLowerCase().includes(normalizedName) || 
                normalizedName.includes(ui.name.toLowerCase())
              );
              
              const ingredient = pantryMatch ? {
                name: pantryMatch.name,
                quantity: ing.quantity,
                unit: pantryMatch.unit,
                calories: Math.round((pantryMatch.calories_per_100g / 100) * ing.quantity),
                protein: Math.round((pantryMatch.protein_per_100g / 100) * ing.quantity * 10) / 10,
                carbs: Math.round((pantryMatch.carbs_per_100g / 100) * ing.quantity * 10) / 10,
                fat: Math.round((pantryMatch.fat_per_100g / 100) * ing.quantity * 10) / 10
              } : {
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

            if (diff > 5) {
              // ✅ Controlla se olio già presente
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

            const recoveryPrompt = `Create ${missingMealTypes.length} meals in ITALIAN for ${day}:
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
              
              mealData.ingredients.forEach(ing => {
                const normalizedName = ing.name.toLowerCase().trim();
                
                const pantryMatch = userIngredients.find(ui => 
                  ui.name.toLowerCase().includes(normalizedName) || 
                  normalizedName.includes(ui.name.toLowerCase())
                );
                
                const ingredient = pantryMatch ? {
                  name: pantryMatch.name,
                  quantity: ing.quantity,
                  unit: pantryMatch.unit,
                  calories: Math.round((pantryMatch.calories_per_100g / 100) * ing.quantity),
                  protein: Math.round((pantryMatch.protein_per_100g / 100) * ing.quantity * 10) / 10,
                  carbs: Math.round((pantryMatch.carbs_per_100g / 100) * ing.quantity * 10) / 10,
                  fat: Math.round((pantryMatch.fat_per_100g / 100) * ing.quantity * 10) / 10
                } : {
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
              
              if (diff > 5) {
                // ✅ Controlla se olio già presente
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
        
        // ✅ Forza il refresh dei dati
        console.log('🔄 Refreshing meal plans...');
        await queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
        await queryClient.refetchQueries({ queryKey: ['mealPlans'] });
        
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

  const isTrialUser = user?.subscription_plan === 'trial';
  const trialBlockedDays = ['thursday', 'friday', 'saturday', 'sunday'];
  
  // Mostra solo lunedì-mercoledì per utenti trial
  const availableDays = isTrialUser 
    ? days.filter(day => !trialBlockedDays.includes(day.key))
    : days;
  
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
                    <BrainCircuit className="w-4 h-4 text-[#26847F]" />
                    <span className={`font-semibold ${remainingGenerations === 0 ? 'text-red-600' : 'text-[#26847F]'}`}>
                      {remainingGenerations} generazioni rimaste questo mese
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
              <Button
                onClick={() => handleShowGenerator(user)}
                className="bg-[#26847F] hover:bg-[#1f6b66] text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all px-6 py-6 text-base font-semibold rounded-xl w-full lg:w-auto relative order-1 lg:order-3"
                disabled={generationLimitReached && remainingGenerations === 0}
              >
                <BrainCircuit className="w-5 h-5" />
                <span>Rigenera Piano con AI</span>
                {generationLimitReached && remainingGenerations === 0 && (
                  <AlertCircle className="w-4 h-4 ml-1 animate-pulse" />
                )}
              </Button>
              <div className="flex gap-2 w-full lg:w-auto order-2">
                <Button
                  onClick={() => setShowPantry(true)}
                  className="bg-white border-2 border-purple-500 text-purple-600 hover:bg-purple-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all px-4 py-6 text-base font-semibold rounded-xl flex-1 lg:flex-initial"
                >
                  <Package className="w-5 h-5" />
                  <span>Dispensa</span>
                </Button>
                <Button
                  onClick={() => setShowShoppingList(true)}
                  className="bg-white border-2 border-[#26847F] text-[#26847F] hover:bg-[#26847F]/10 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all px-4 py-6 text-base font-semibold rounded-xl flex-1 lg:flex-initial relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Lista Spesa</span>
                  {shoppingLists.length > 0 && shoppingLists[0].items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                      {shoppingLists[0].items.length}
                    </span>
                  )}
                </Button>
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
                      🚫 Limite Generazioni Raggiunto
                    </h3>
                    <p className="text-amber-800 mb-1">
                      Hai utilizzato tutte le <strong>{getGenerationLimit(user?.subscription_plan, 'meal')} generazioni</strong> disponibili questo mese con il piano <strong className="capitalize">{user?.subscription_plan || 'base'}</strong>.
                    </p>
                    <p className="text-sm text-amber-700">
                      💡 Fai l'upgrade per ottenere più generazioni o generazioni illimitate!
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-[#26847F] to-teal-500 hover:from-[#1f6b66] hover:to-teal-600 text-white px-6 py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      ⬆️ Upgrade Piano
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
                        <h4 className="font-bold text-gray-900 text-lg">Protocollo di {getDayLabel(selectedDay)}</h4>
                        <Button
                          onClick={() => addDayToShoppingList(selectedDay)}
                          size="sm"
                          variant="outline"
                          className="border-[#26847F] text-[#26847F] hover:bg-[#E0F2F1]"
                          disabled={addedDays.includes(selectedDay)}
                        >
                          {addedDays.includes(selectedDay) ? (
                            <><Check className="w-4 h-4 mr-1" />Aggiunto</>
                          ) : (
                            <><Plus className="w-4 h-4 mr-1" />Aggiungi a Lista Spesa</>
                          )}
                        </Button>
                      </div>

                      <div className="bg-gradient-to-r from-[#E0F2F1] to-blue-50 rounded-xl p-4 border-2 border-[#26847F]/30 mb-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 font-medium mb-1">Calorie Totali</p>
                            <p className="text-2xl font-bold text-[#26847F]">{Math.round(dailyTotals.calories)}</p>
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
                          <div className="mt-3 pt-3 border-t border-[#26847F]/20">
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
                          <div key={meal.id} className={`relative w-full text-left rounded-lg p-3 border transition-colors group ${
                            meal.is_cheat_meal 
                              ? 'bg-gradient-to-br from-orange-50 to-pink-50 border-orange-300/60 hover:bg-gradient-to-br hover:from-orange-100 hover:to-pink-100'
                              : 'bg-gray-50/80 border-gray-200/60 hover:bg-gray-100'
                          }`}>
                            <button onClick={() => setSelectedMeal(meal)} className="w-full flex items-center justify-between">
                              <div className="flex items-center gap-3 text-left">
                                <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden">
                                  {meal.is_cheat_meal ? (
                                    <span className="text-3xl">🍕</span>
                                  ) : meal.image_url ? (
                                    <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover"/>
                                  ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse"/>
                                  )}
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold text-gray-800">{getMealTypeLabel(meal.meal_type)}</p>
                                  <p className={`text-sm truncate max-w-[150px] sm:max-w-xs ${
                                    meal.is_cheat_meal ? 'text-orange-600 font-bold' : 'text-gray-600'
                                  }`}>
                                    {meal.is_cheat_meal ? 'CHEAT MEAL PIANIFICATO' : meal.name}
                                  </p>
                                </div>
                              </div>
                              {!meal.is_cheat_meal && (
                                <div className="text-right">
                                  <p className="font-bold text-gray-800">{meal.total_calories} <span className="text-xs font-normal text-gray-500">kcal</span></p>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => regenerateSingleMeal(meal)}
                              disabled={regeneratingMealId === meal.id}
                              className="absolute top-1/2 -translate-y-1/2 right-3 md:right-4 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 rounded-full text-gray-500 hover:text-[#26847F] hover:bg-gray-200/50"
                              title="Rigenera questo pasto"
                            >
                              {regeneratingMealId === meal.id ? (
                                <RotateCcw className="w-4 h-4 animate-spin text-[#26847F]" />
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
      {showPantry && (
        <PantryModal isOpen={showPantry} user={user} onClose={() => setShowPantry(false)} />
      )}
      {showUpgradeModal && (
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentPlan={user?.subscription_plan || 'base'} />
      )}
    </>
  );
}