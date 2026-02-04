import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function generateWeeklyReportHtml(template, variables) {
    const appUrl = 'https://projectmywellness.com';
    const userName = variables.user_name || 'Utente';
    const weekRange = variables.week_range || '10-16 Gennaio 2025';
    const currentWeight = variables.current_weight || 72.5;
    const weightChange = variables.weight_change || -1.2;
    const avgCalories = variables.avg_calories || 1850;
    const workoutsCompleted = variables.workouts_completed || 4;
    const adherence = variables.adherence || 85;
    const progress = variables.progress || 65;
    const motivationalMessage = variables.motivational_message || 'Ottimo lavoro questa settimana! Continua così! 💪';
    
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa;">
<table width="100%" cellpadding="20">
<tr><td align="center">
<table style="max-width:600px;background:white;padding:30px;border-radius:12px;">
<tr><td>
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" height="30" alt="MyWellness">
<h2 style="color:#26847F;margin:10px 0 10px;">Report Settimanale</h2>
<p style="color:#6b7280;font-size:14px;">${weekRange}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
<p style="font-size:16px;">Ciao ${userName},</p>
<p style="line-height:1.6;">Ecco il tuo report settimanale! 🎯</p>

<div style="background:#f9fafb;padding:20px;border-radius:12px;margin:20px 0;">
<h3 style="color:#374151;margin:0 0 15px;font-size:16px;">📊 Peso Attuale</h3>
<p style="text-align:center;font-size:32px;color:#26847F;font-weight:bold;margin:10px 0;">${currentWeight} kg</p>
<p style="text-align:center;font-size:14px;color:${weightChange < 0 ? '#10b981' : '#ef4444'};">${weightChange > 0 ? '+' : ''}${weightChange} kg questa settimana</p>
</div>

<h3 style="color:#374151;margin:20px 0 15px;font-size:16px;">📈 Le tue statistiche</h3>

<table width="100%" cellpadding="10" cellspacing="10">
<tr>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${avgCalories}</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Calorie medie/giorno</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${workoutsCompleted}</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Allenamenti</p>
</td>
</tr>
<tr>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${adherence}%</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Aderenza</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${progress}%</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Progresso</p>
</td>
</tr>
</table>

<p style="color:#26847F;text-align:center;font-weight:600;margin:25px 0;">${motivationalMessage}</p>

<div style="text-align:center;margin:25px 0;">
<a href="${appUrl}/Dashboard" style="display:inline-block;background:#26847F;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:bold;">Vai alla Dashboard</a>
</div>

<p style="text-align:center;color:#999;font-size:12px;margin-top:30px;">© VELIKA GROUP LLC</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    return { html, subject: 'Report Settimanale - MyWellness' };
}

Deno.serve(async (req) => {
    console.log('📊 sendWeeklyReport CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json().catch(() => ({}));
        const isTestMode = body.test === true;
        
        if (isTestMode) {
            console.log('🧪 TEST MODE ENABLED');
        }

        const now = new Date();
        
        // Recupera tutti gli utenti attivi o in trial
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            (u.subscription_status === 'active' || u.subscription_status === 'trial') && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users total`);

        // Filtra solo utenti per cui è lunedì mezzanotte nel loro timezone
        const usersToEmail = [];
        
        for (const user of activeUsers) {
            if (isTestMode) {
                // In test mode, send to all active users
                usersToEmail.push(user);
                console.log(`🧪 Test mode: ${user.email} will receive report`);
            } else {
                const userTimezone = user.timezone || 'Europe/Rome';
                
                try {
                    // Calcola che ore sono nel timezone dell'utente
                    const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                    const userHour = userNow.getHours();
                    const userDay = userNow.getDay(); // 0=Sunday, 1=Monday, etc.
                    
                    // Controlla se è lunedì (1) e se è alle 9am
                    if (userDay === 1 && userHour === 9) {
                        usersToEmail.push(user);
                        console.log(`✅ User ${user.email} (${userTimezone}): is Monday 9am - will send`);
                    }
                } catch (error) {
                    console.error(`⚠️ Invalid timezone for user ${user.email}: ${userTimezone}`, error.message);
                }
            }
        }

        console.log(`📧 Sending weekly reports to ${usersToEmail.length} users (Monday 9am in their timezone)`);

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

                // Carica template direttamente (bypass functions.invoke)
                const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
                    template_id: `weekly_report_${userLanguage}`,
                    is_active: true
                });
                
                if (templates.length === 0) {
                    throw new Error(`Template not found: weekly_report_${userLanguage}`);
                }
                
                const template = templates[0];
                
                // Invia email direttamente
                const emailHtml = generateWeeklyReportHtml(template, variables);
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    subject: emailHtml.subject,
                    body: emailHtml.html,
                    from_name: 'MyWellness'
                });

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