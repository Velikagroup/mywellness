// Definizione dei piani e delle loro features
export const PLANS = {
  TRIAL: 'trial',
  STANDARD: 'standard',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const PLAN_FEATURES = {
  [PLANS.TRIAL]: {
    name: 'Trial',
    dashboard: true,
    meal_plan: false,
    recipes_with_images: false,
    bmr_calculation: true,
    shopping_list: false,
    weight_tracking: true,
    ingredient_substitution: false,
    workout_plan: false,
    meal_photo_analysis: false,
    auto_rebalance: false,
    workout_tracking: false,
    workout_modification: false,
    progress_photo_analysis: false,
    priority_support: false,
    calorie_balance: false,
    smartwatch_sync: false,
    meal_plan_generations_per_month: 0,
    workout_plan_generations_per_month: 0
  },
  [PLANS.STANDARD]: {
    name: 'Standard',
    dashboard: true,
    meal_plan: false,
    recipes_with_images: false,
    bmr_calculation: true,
    shopping_list: false,
    weight_tracking: true,
    ingredient_substitution: false,
    workout_plan: false,
    meal_photo_analysis: false,
    auto_rebalance: false,
    workout_tracking: false,
    workout_modification: false,
    progress_photo_analysis: false,
    priority_support: false,
    calorie_balance: false,
    smartwatch_sync: false,
    meal_plan_generations_per_month: 0,
    workout_plan_generations_per_month: 0
  },
  [PLANS.MONTHLY]: {
    name: 'Monthly',
    dashboard: true,
    meal_plan: true,
    recipes_with_images: true,
    bmr_calculation: true,
    shopping_list: true,
    weight_tracking: true,
    ingredient_substitution: true,
    workout_plan: true,
    meal_photo_analysis: true,
    auto_rebalance: true,
    workout_tracking: true,
    workout_modification: true,
    progress_photo_analysis: true,
    priority_support: true,
    calorie_balance: true,
    smartwatch_sync: true,
    meal_plan_generations_per_month: -1, // -1 = illimitato
    workout_plan_generations_per_month: -1 // -1 = illimitato
  },
  [PLANS.YEARLY]: {
    name: 'Yearly',
    dashboard: true,
    meal_plan: true,
    recipes_with_images: true,
    bmr_calculation: true,
    shopping_list: true,
    weight_tracking: true,
    ingredient_substitution: true,
    workout_plan: true,
    meal_photo_analysis: true,
    auto_rebalance: true,
    workout_tracking: true,
    workout_modification: true,
    progress_photo_analysis: true,
    priority_support: true,
    calorie_balance: true,
    smartwatch_sync: true,
    meal_plan_generations_per_month: -1, // -1 = illimitato
    workout_plan_generations_per_month: -1 // -1 = illimitato
  }
};

// Funzione per verificare se l'utente ha accesso a una feature
export const hasFeatureAccess = (userPlan, featureName) => {
  const plan = userPlan || PLANS.MONTHLY;
  return PLAN_FEATURES[plan]?.[featureName] || false;
};

// Funzione per ottenere il limite di generazioni
export const getGenerationLimit = (userPlan, planType) => {
  const plan = userPlan || PLANS.BASE;
  const featureName = planType === 'meal' 
    ? 'meal_plan_generations_per_month' 
    : 'workout_plan_generations_per_month';
  return PLAN_FEATURES[plan]?.[featureName] || 0;
};

// Funzione per ottenere il nome del piano
export const getPlanName = (planId) => {
  return PLAN_FEATURES[planId]?.name || 'Monthly';
};

// Componente React per mostrare upgrade prompt
export const UpgradePrompt = ({ requiredPlan, featureName, onUpgradeClick }) => {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Feature Premium</h3>
      <p className="text-gray-600 mb-4">
        {featureName} è disponibile con l'abbonamento
      </p>
      <button
        onClick={onUpgradeClick}
        className="inline-block bg-[#26847F] hover:bg-[#1f6b66] text-white px-6 py-3 rounded-lg font-semibold transition-all"
      >
        Attiva Abbonamento
      </button>
    </div>
  );
};