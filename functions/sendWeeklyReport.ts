import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📊 sendWeeklyReport CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check disabled for testing - re-enable in production if needed
        // const cronSecret = Deno.env.get('CRON_SECRET');
        // const authHeader = req.headers.get('Authorization');
        // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        //     console.error('Unauthorized cron call');
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        
        // Recupera tutti gli utenti attivi
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            u.subscription_status === 'active' && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users total`);

        // Filtra solo utenti per cui è lunedì mezzanotte nel loro timezone
        const usersToEmail = [];
        
        for (const user of activeUsers) {
            const userTimezone = user.timezone || 'Europe/Rome';
            
            try {
                // Calcola che ore sono nel timezone dell'utente
                const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                const userHour = userNow.getHours();
                const userDay = userNow.getDay(); // 0=Sunday, 1=Monday, etc.
                
                // Controlla se è lunedì (1) e se è tra mezzanotte e 1am
                if (userDay === 1 && userHour === 0) {
                    usersToEmail.push(user);
                    console.log(`✅ User ${user.email} (${userTimezone}): is Monday midnight - will send`);
                }
            } catch (error) {
                console.error(`⚠️ Invalid timezone for user ${user.email}: ${userTimezone}`, error.message);
            }
        }

        console.log(`📧 Sending weekly reports to ${usersToEmail.length} users (Monday midnight in their timezone)`);

        let sentCount = 0;
        const results = [];
        
        // Calcola periodo settimanale (ultimi 7 giorni)
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        for (const user of usersToEmail) {
            try {
                // Rileva lingua utente
                const userLanguage = user.preferred_language || 'it';
                
                // Recupera i dati della settimana
                const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                    { user_id: user.id },
                    ['-date'],
                    10
                );

                const mealLogs = await base44.asServiceRole.entities.MealLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    50
                );

                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    20
                );

                // Calcola statistiche
                const stats = calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, oneWeekAgo, today);

                // Prepara variabili per sendEmailUnified
                const variables = {
                    user_name: user.full_name || 'Utente',
                    week_range: stats.weekRange,
                    weight_change: stats.weightChange,
                    current_weight: stats.currentWeight,
                    target_weight: stats.targetWeight,
                    start_weight: user.current_weight,
                    distance_remaining: stats.distanceRemaining,
                    avg_calories: stats.avgCalories,
                    workouts_completed: stats.workoutsCompleted,
                    adherence: stats.adherence,
                    progress: stats.progressPercentage,
                    motivational_message: getMotivationalMessageText(stats),
                    weight_data: generateWeightDataForEmail(weightHistory, oneWeekAgo, today)
                };

                // Usa sendEmailUnified con template localizzato
                const templateId = `weekly_report_${userLanguage}`;
                
                // Invia email direttamente usando l'SDK
                const response = await fetch(`${Deno.env.get('BASE44_FUNCTION_URL') || 'https://projectmywellness.base44.app/functions'}/sendEmailUnified`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': req.headers.get('Authorization') || ''
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        userEmail: user.email,
                        templateId: templateId,
                        variables: variables,
                        language: userLanguage,
                        triggerSource: 'sendWeeklyReport_cron'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`sendEmailUnified returned ${response.status}`);
                }

                sentCount++;
                console.log(`✅ Weekly report sent to ${user.email} (${userLanguage})`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    language: userLanguage,
                    status: 'sent',
                    stats: stats
                });

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`❌ Failed to send report to ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Weekly reports sent: ${sentCount}/${usersToEmail.length} (total active users: ${activeUsers.length})`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            eligible_users: usersToEmail.length,
            total_active_users: activeUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, startDate, endDate) {
    const weekRange = `${startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    
    // Filtra dati della settimana
    const weekWeights = weightHistory.filter(w => {
        const date = new Date(w.date);
        return date >= startDate && date <= endDate;
    });

    const weekMeals = mealLogs.filter(m => {
        const date = new Date(m.date);
        return date >= startDate && date <= endDate;
    });

    const weekWorkouts = workoutLogs.filter(w => {
        const date = new Date(w.date);
        return date >= startDate && date <= endDate;
    });

    // Calcola variazione peso
    let weightChange = 0;
    let weightTrend = 'stable';
    if (weekWeights.length >= 2) {
        const oldestWeight = weekWeights[weekWeights.length - 1].weight;
        const newestWeight = weekWeights[0].weight;
        weightChange = newestWeight - oldestWeight;
        weightTrend = weightChange < -0.2 ? 'down' : weightChange > 0.2 ? 'up' : 'stable';
    }

    // Calcola calorie medie
    const totalCalories = weekMeals.reduce((sum, m) => sum + (m.actual_calories || 0), 0);
    const avgCalories = weekMeals.length > 0 ? Math.round(totalCalories / weekMeals.length) : 0;

    // Conta allenamenti completati (con completed: true)
    const workoutsCompleted = weekWorkouts.filter(w => w.completed === true).length;

    // Calcola aderenza al piano
    const totalDays = 7;
    const daysWithLogs = new Set(weekMeals.map(m => m.date)).size;
    const adherence = Math.round((daysWithLogs / totalDays) * 100);

    // Progresso verso obiettivo
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : user.current_weight;
    const startWeight = user.current_weight;
    const targetWeight = user.target_weight;
    const totalDistance = Math.abs(startWeight - targetWeight);
    const distanceCovered = Math.abs(startWeight - currentWeight);
    const progressPercentage = totalDistance > 0 ? Math.round((distanceCovered / totalDistance) * 100) : 0;

    return {
        weekRange,
        weightChange: weightChange.toFixed(1),
        weightTrend,
        currentWeight: currentWeight.toFixed(1),
        targetWeight: targetWeight.toFixed(1),
        avgCalories,
        workoutsCompleted,
        plannedWorkouts: user.workout_days || 3,
        adherence,
        progressPercentage,
        totalDistance: totalDistance.toFixed(1),
        distanceRemaining: (totalDistance - distanceCovered).toFixed(1)
    };
}

function getMotivationalMessageText(stats) {
    if (stats.progressPercentage >= 75) {
        return '🔥 Incredibile! Sei oltre il 75% del tuo obiettivo! Il traguardo è vicino, continua così!';
    } else if (stats.adherence >= 80 && stats.workoutsCompleted >= stats.plannedWorkouts * 0.8) {
        return '💪 Ottimo lavoro! La tua costanza sta dando risultati. Mantieni questo ritmo!';
    } else if (stats.weightTrend === 'down') {
        return '📉 Ben fatto! Il peso sta scendendo. Stai andando nella direzione giusta!';
    } else {
        return '💡 Consiglio: Cerca di seguire il piano con maggiore costanza questa settimana. Piccoli passi portano a grandi risultati!';
    }
}

function generateWeightDataForEmail(weightHistory, startDate, endDate) {
    const weekWeights = weightHistory.filter(w => {
        const date = new Date(w.date);
        return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return weekWeights.map(w => ({
        date: new Date(w.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
        weight: parseFloat(w.weight.toFixed(1))
    }));
}