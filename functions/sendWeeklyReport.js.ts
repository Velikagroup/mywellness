
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('📊 sendWeeklyReport CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica autenticazione cron
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        console.log(`📅 Generating weekly reports from ${oneWeekAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

        // Recupera tutti gli utenti attivi
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            u.subscription_status === 'active' && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users to send reports`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';

        let sentCount = 0;
        const results = [];

        for (const user of activeUsers) {
            try {
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

                const emailBody = getWeeklyReportTemplate(user, stats);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: `📊 Il tuo Report Settimanale MyWellness - ${stats.weekRange}`,
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Weekly report sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent',
                    stats: stats
                });

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 150));

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

        console.log(`🎉 Weekly reports sent: ${sentCount}/${activeUsers.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: activeUsers.length,
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

    // Conta allenamenti
    const workoutsCompleted = weekWorkouts.filter(w => w.completed).length;

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

function getWeeklyReportTemplate(user, stats) {
    const weightEmoji = stats.weightTrend === 'down' ? '📉' : stats.weightTrend === 'up' ? '📈' : '➡️';
    const weightColor = stats.weightTrend === 'down' ? '#10b981' : stats.weightTrend === 'up' ? '#ef4444' : '#6b7280';
    const adherenceColor = stats.adherence >= 80 ? '#10b981' : stats.adherence >= 50 ? '#f59e0b' : '#ef4444';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 30px 20px !important; }
            .stat-table { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <tr>
                        <td style="background: white; padding: 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">📊 Report Settimanale</h1>
                            <p style="color: #6b7280; margin: 0; font-size: 16px;">${stats.weekRange}</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Ecco il riassunto dei tuoi progressi questa settimana! 💪
                            </p>

                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                                <h2 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">${weightEmoji} Variazione Peso</h2>
                                <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${weightColor};">
                                    ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg
                                </p>
                                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                                    Peso attuale: ${stats.currentWeight} kg · Target: ${stats.targetWeight} kg
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">📈 Le tue statistiche</h3>
                            
                            <table class="stat-table" width="100%" cellpadding="0" cellspacing="15" border="0">
                                <tr>
                                    <td width="50%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">🍽️</p>
                                        <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.avgCalories}</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Calorie medie/giorno</p>
                                    </td>
                                    <td width="50%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">💪</p>
                                        <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.workoutsCompleted}/${stats.plannedWorkouts}</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Allenamenti completati</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: ${adherenceColor};">✓</p>
                                        <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.adherence}%</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Aderenza al piano</p>
                                    </td>
                                    <td width="50%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">🎯</p>
                                        <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.progressPercentage}%</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">Progresso obiettivo</p>
                                    </td>
                                </tr>
                            </table>

                            <h3 style="color: #111827; margin: 30px 0 10px 0;">🎯 Progresso verso l'obiettivo</h3>
                            <div style="background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 10px 0;">
                                <div style="background: linear-gradient(90deg, #26847F 0%, #1f6b66 100%); height: 100%; width: ${Math.min(stats.progressPercentage, 100)}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                                    ${stats.progressPercentage}%
                                </div>
                            </div>
                            <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">
                                Rimangono ${stats.distanceRemaining} kg al tuo obiettivo!
                            </p>

                            ${getMotivationalMessage(stats)}

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            📊 Vedi Dashboard Completa
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                                Continua così! La costanza è la chiave del successo 🌟
                            </p>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

function getMotivationalMessage(stats) {
    if (stats.progressPercentage >= 75) {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                🔥 <strong>Incredibile!</strong> Sei oltre il 75% del tuo obiettivo! Il traguardo è vicino, continua così!
            </p>
        </div>
        `;
    } else if (stats.adherence >= 80 && stats.workoutsCompleted >= stats.plannedWorkouts * 0.8) {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                💪 <strong>Ottimo lavoro!</strong> La tua costanza sta dando risultati. Mantieni questo ritmo!
            </p>
        </div>
        `;
    } else if (stats.weightTrend === 'down') {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                📉 <strong>Ben fatto!</strong> Il peso sta scendendo. Stai andando nella direzione giusta!
            </p>
        </div>
        `;
    } else {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                💡 <strong>Consiglio:</strong> Cerca di seguire il piano con maggiore costanza questa settimana. Piccoli passi portano a grandi risultati!
            </p>
        </div>
        `;
    }
}
