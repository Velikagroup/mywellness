import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, startDate, endDate) {
    const weekRange = `${startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    
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

    let weightChange = 0;
    let weightTrend = 'stable';
    if (weekWeights.length >= 2) {
        const oldestWeight = weekWeights[weekWeights.length - 1].weight;
        const newestWeight = weekWeights[0].weight;
        weightChange = newestWeight - oldestWeight;
        weightTrend = weightChange < -0.2 ? 'down' : weightChange > 0.2 ? 'up' : 'stable';
    }

    const totalCalories = weekMeals.reduce((sum, m) => sum + (m.actual_calories || 0), 0);
    const avgCalories = weekMeals.length > 0 ? Math.round(totalCalories / weekMeals.length) : 0;

    const workoutsCompleted = weekWorkouts.filter(w => w.completed === true).length;

    const totalDays = 7;
    const daysWithLogs = new Set(weekMeals.map(m => m.date)).size;
    const adherence = Math.round((daysWithLogs / totalDays) * 100);

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

function getMotivationalMessageText(stats, language = 'it') {
    const messages = {
        it: {
            great75: '🔥 Incredibile! Sei oltre il 75% del tuo obiettivo! Il traguardo è vicino, continua così!',
            excellent: '💪 Ottimo lavoro! La tua costanza sta dando risultati. Mantieni questo ritmo!',
            down: '📉 Ben fatto! Il peso sta scendendo. Stai andando nella direzione giusta!',
            advice: '💡 Consiglio: Cerca di seguire il piano con maggiore costanza questa settimana. Piccoli passi portano a grandi risultati!'
        },
        en: {
            great75: '🔥 Incredible! You\'re over 75% of your goal! The finish line is near, keep it up!',
            excellent: '💪 Great work! Your consistency is paying off. Maintain this pace!',
            down: '📉 Well done! Your weight is going down. You\'re heading in the right direction!',
            advice: '💡 Tip: Try to follow your plan more consistently this week. Small steps lead to big results!'
        },
        es: {
            great75: '🔥 ¡Increíble! ¡Estás por encima del 75% de tu objetivo! La meta está cerca, ¡sigue así!',
            excellent: '💪 ¡Excelente trabajo! Tu consistencia está dando resultados. ¡Mantén este ritmo!',
            down: '📉 ¡Bien hecho! Tu peso está bajando. ¡Vas en la dirección correcta!',
            advice: '💡 Consejo: Intenta seguir tu plan con mayor consistencia esta semana. ¡Los pequeños pasos llevan a grandes resultados!'
        },
        pt: {
            great75: '🔥 Incrível! Você está acima de 75% da sua meta! A linha de chegada está perto, continue assim!',
            excellent: '💪 Ótimo trabalho! Sua consistência está dando resultados. Mantenha esse ritmo!',
            down: '📉 Bem feito! Seu peso está diminuindo. Você está na direção certa!',
            advice: '💡 Dica: Tente seguir seu plano com maior consistência esta semana. Pequenos passos levam a grandes resultados!'
        },
        de: {
            great75: '🔥 Unglaublich! Du bist über 75% deines Ziels! Das Ziel ist in Reichweite, mach weiter so!',
            excellent: '💪 Großartig! Deine Konsistenz bringt Ergebnisse. Behalte dieses Tempo bei!',
            down: '📉 Gut gemacht! Dein Gewicht sinkt. Du bist auf dem richtigen Weg!',
            advice: '💡 Tipp: Versuche, deinen Plan diese Woche konsistenter zu befolgen. Kleine Schritte führen zu großen Ergebnissen!'
        },
        fr: {
            great75: '🔥 Incroyable! Tu es à plus de 75% de ton objectif! La ligne d\'arrivée approche, continue comme ça!',
            excellent: '💪 Excellent travail! Ta constance porte ses fruits. Maintiens ce rythme!',
            down: '📉 Bien joué! Ton poids diminue. Tu es sur la bonne voie!',
            advice: '💡 Conseil: Essaie de suivre ton plan avec plus de constance cette semaine. Les petits pas mènent à de grands résultats!'
        }
    };

    const msgs = messages[language] || messages.it;

    if (stats.progressPercentage >= 75) {
        return msgs.great75;
    } else if (stats.adherence >= 80 && stats.workoutsCompleted >= stats.plannedWorkouts * 0.8) {
        return msgs.excellent;
    } else if (stats.weightTrend === 'down') {
        return msgs.down;
    } else {
        return msgs.advice;
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

function generateWeeklyReportEmailHtml(template, variables, stats) {
    const appUrl = 'https://projectmywellness.com';
    const userName = variables.user_name || 'Utente';
    const weekRange = stats.weekRange;
    const currentWeight = variables.current_weight || 72.5;
    const weightChange = variables.weight_change || -1.2;
    const avgCalories = variables.avg_calories || 0;
    const workoutsCompleted = variables.workouts_completed || 0;
    const adherence = variables.adherence || 0;
    const progress = variables.progress || 0;
    const motivationalMessage = variables.motivational_message || 'Continua così! 💪';
    
    const stripePortalUrl = 'https://billing.stripe.com/p/login/6oU8wIbUs08heL0dI08k800';
    
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa;">
<table width="100%" cellpadding="20">
<tr><td align="center">
<table style="max-width:600px;background:white;padding:30px;border-radius:12px;">
<tr><td>
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" height="30" alt="MyWellness">
<h2 style="color:#26847F;margin:10px 0 10px;">${template.header_title || 'Report Settimanale'}</h2>
<p style="color:#6b7280;font-size:14px;">${weekRange}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
<p style="font-size:16px;">${template.greeting ? template.greeting.replace(/{user_name}/g, userName) : 'Ciao ' + userName + ','}</p>
<p style="line-height:1.6;">${template.intro_text || 'Ecco il tuo report settimanale!'}</p>

<div style="background:#f9fafb;padding:20px;border-radius:12px;margin:20px 0;">
<h3 style="color:#374151;margin:0 0 15px;font-size:16px;">📊 ${template.weight_card_title || 'Peso Attuale'}</h3>
<p style="text-align:center;font-size:32px;color:#26847F;font-weight:bold;margin:10px 0;">${currentWeight} kg</p>
<p style="text-align:center;font-size:14px;color:${weightChange < 0 ? '#10b981' : '#ef4444'};">${weightChange > 0 ? '+' : ''}${weightChange} kg questa settimana</p>
</div>

<p style="color:#26847F;text-align:center;font-weight:600;margin:25px 0;">${motivationalMessage}</p>

<div style="text-align:center;margin:25px 0;">
<a href="${template.call_to_action_url || appUrl + '/Dashboard'}" style="display:inline-block;background:#26847F;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:bold;">${template.call_to_action_text || 'Vai alla Dashboard'}</a>
</div>

<p style="text-align:center;color:#6b7280;font-size:13px;margin:20px 0 0 0;">${template.footer_text || 'Continua così!'}</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin-top:20px;background-color:#fafafa;">
<tr>
<td align="center" style="padding:20px;color:#999999;background-color:#fafafa;">
<p style="margin:5px 0;font-size:12px;font-weight:600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
<p style="margin:5px 0;font-size:11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
<p style="margin:5px 0;font-size:11px;">EIN: 36-5141800 - velika.03@outlook.it - <a href="${stripePortalUrl}" style="color:#999999;text-decoration:none;">Stripe Portal</a></p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    return html;
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
        
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            (u.subscription_status === 'active' || u.subscription_status === 'trial') && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users total`);

        const usersToEmail = [];
        
        for (const user of activeUsers) {
            if (isTestMode) {
                usersToEmail.push(user);
                console.log(`🧪 Test mode: ${user.email} will receive report`);
            } else {
                const userTimezone = user.timezone || 'Europe/Rome';
                
                try {
                    const userNow = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
                    const userHour = userNow.getHours();
                    const userDay = userNow.getDay();
                    
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
        
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        for (const user of usersToEmail) {
            try {
                const userLanguage = user.preferred_language || 'it';
                
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

                const stats = calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, oneWeekAgo, today);

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

                const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
                    template_id: `weekly_report_${userLanguage}`,
                    is_active: true
                });
                
                if (templates.length === 0) {
                    throw new Error(`Template not found: weekly_report_${userLanguage}`);
                }
                
                const template = templates[0];
                const subject = template.subject
                    .replace(/{week_range}/g, stats.weekRange)
                    .replace(/{user_name}/g, user.full_name || 'Utente');
                
                const html = generateWeeklyReportEmailHtml(template, variables, stats);
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    subject: subject,
                    body: html,
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