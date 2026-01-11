import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const KCAL_PER_KG = 7700;

const calculateBMR = (userData) => {
  if (!userData?.gender || !userData?.current_weight || !userData?.height) return 0;
  
  let age = 30;
  if (userData.birthdate) {
    const birthDate = new Date(userData.birthdate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  
  const weight = userData.current_weight;
  const height = userData.height;
  
  if (userData.gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

const calculateNEAT = (userData) => {
  const bmr = calculateBMR(userData);
  const activityMultipliers = {
    sedentary: 0.2,
    light: 0.375,
    moderate: 0.55,
    active: 0.725,
    very_active: 0.9
  };
  
  const multiplier = activityMultipliers[userData?.activity_level] || 0.375;
  return bmr * multiplier;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica autenticazione admin o cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    console.log('🔄 Starting calorie balance accumulation...');

    // Ottieni tutti gli utenti con subscription attiva (base, pro, premium)
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const activeUsers = allUsers.filter(u => 
      u.subscription_status === 'active' && 
      ['base', 'pro', 'premium'].includes(u.subscription_plan)
    );

    console.log(`👥 Found ${activeUsers.length} active users with valid subscription`);

    const results = [];

    for (const user of activeUsers) {
      try {
        // Calcola la data di "ieri" per l'utente (poiché il cron gira a mezzanotte UTC)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][yesterday.getDay()];

        console.log(`📊 Processing user ${user.email} for date ${dateStr} (${dayOfWeek})`);

        // Verifica se esiste già un record per questa data
        const existingBalance = await base44.asServiceRole.entities.CalorieBalance.filter({
          user_id: user.id,
          date: dateStr
        });

        if (existingBalance.length > 0) {
          console.log(`⏭️ Balance already exists for ${user.email} on ${dateStr}, skipping`);
          continue;
        }

        // Carica piano nutrizionale del giorno
        const mealPlans = await base44.asServiceRole.entities.MealPlan.filter({
          user_id: user.id,
          day_of_week: dayOfWeek
        });

        // Carica pasti loggati
        const mealLogs = await base44.asServiceRole.entities.MealLog.filter({
          user_id: user.id,
          date: dateStr
        });

        // Calcola calorie pianificate
        const plannedCalories = mealPlans.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);

        // Calcola calorie consumate
        let consumedCalories = 0;
        const loggedMealTypes = new Set(mealLogs.map(log => log.meal_type));
        
        // Usa i log se esistono, altrimenti usa il piano
        consumedCalories += mealLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0);
        
        mealPlans.forEach(meal => {
          if (!loggedMealTypes.has(meal.meal_type)) {
            consumedCalories += (meal.total_calories || 0);
          }
        });

        // Calcola calorie bruciate
        const bmr = calculateBMR(user);
        const neat = calculateNEAT(user);
        const totalBurned = bmr + neat;

        // Bilancio giornaliero
        const dailyBalance = consumedCalories - totalBurned;

        // Ottieni l'ultima registrazione peso per sapere da quando accumulare
        const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
          { user_id: user.id },
          '-created_date',
          1
        );
        const lastWeightLogId = weightHistory.length > 0 ? weightHistory[0].id : null;

        // Ottieni l'ultimo accumulo precedente (se esiste)
        const previousBalances = await base44.asServiceRole.entities.CalorieBalance.filter(
          { user_id: user.id },
          '-date',
          1
        );

        let accumulatedBalance = dailyBalance;

        // Se c'è un accumulo precedente e non c'è stata una nuova registrazione peso, continua ad accumulare
        if (previousBalances.length > 0) {
          const prevBalance = previousBalances[0];
          
          // Se l'ultima registrazione peso è la stessa, continua ad accumulare
          if (prevBalance.last_weight_log_id === lastWeightLogId) {
            accumulatedBalance = prevBalance.accumulated_balance + dailyBalance;
          }
          // Altrimenti resetta (c'è stata una nuova registrazione peso)
        }

        // Salva il bilancio
        await base44.asServiceRole.entities.CalorieBalance.create({
          user_id: user.id,
          date: dateStr,
          daily_balance: Math.round(dailyBalance),
          accumulated_balance: Math.round(accumulatedBalance),
          planned_calories: Math.round(plannedCalories),
          consumed_calories: Math.round(consumedCalories),
          burned_calories: Math.round(totalBurned),
          last_weight_log_id: lastWeightLogId
        });

        console.log(`✅ Saved balance for ${user.email}: daily=${dailyBalance}, accumulated=${accumulatedBalance}`);

        results.push({
          user_email: user.email,
          date: dateStr,
          daily_balance: Math.round(dailyBalance),
          accumulated_balance: Math.round(accumulatedBalance)
        });

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
        results.push({
          user_email: user.email,
          error: error.message
        });
      }
    }

    console.log('✅ Calorie balance accumulation completed');

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('❌ Error in accumulateCalorieBalance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});