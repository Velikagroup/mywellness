import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🏆 sendMilestones CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        console.log(`📅 Checking milestones for date: ${today.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => u.subscription_status === 'active' && u.created_date);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sent30 = 0, sent60 = 0, sent90 = 0;
        const results = [];

        for (const user of activeUsers) {
            const createdDate = new Date(user.created_date);
            const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

            let milestone = null;
            if (daysSinceCreation === 30) milestone = 30;
            else if (daysSinceCreation === 60) milestone = 60;
            else if (daysSinceCreation === 90) milestone = 90;

            if (!milestone) continue;

            try {
                const [weightHistory, workoutLogs, mealLogs] = await Promise.all([
                    base44.asServiceRole.entities.WeightHistory.filter({ user_id: user.id }, ['-date'], 50),
                    base44.asServiceRole.entities.WorkoutLog.filter({ user_id: user.id }),
                    base44.asServiceRole.entities.MealLog.filter({ user_id: user.id }, ['-date'], 100)
                ]);

                const stats = calculateMilestoneStats(user, weightHistory, workoutLogs, mealLogs, milestone);
                const emailBody = getMilestoneEmailTemplate(user, stats, milestone, appUrl);
                const subject = getSubjectForMilestone(milestone);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: subject,
                    body: emailBody
                });

                if (milestone === 30) sent30++;
                else if (milestone === 60) sent60++;
                else if (milestone === 90) sent90++;

                console.log(`✅ ${milestone}-day milestone sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    milestone: milestone,
                    status: 'sent'
                });

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to send to ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    milestone: milestone,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Milestones sent: 30d=${sent30}, 60d=${sent60}, 90d=${sent90}`);

        return Response.json({
            success: true,
            sent_30_days: sent30,
            sent_60_days: sent60,
            sent_90_days: sent90,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateMilestoneStats(user, weightHistory, workoutLogs, mealLogs, milestone) {
    const workoutsCompleted = workoutLogs.filter(w => w.completed).length;
    const adherence = Math.round((workoutsCompleted / (milestone / 7 * (user.workout_days || 3))) * 100);
    
    const weightChange = weightHistory.length >= 2 
        ? (weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)
        : '0';
    
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight.toFixed(1) : user.current_weight;
    const startWeight = user.current_weight;
    const targetWeight = user.target_weight;
    const totalDistance = Math.abs(startWeight - targetWeight);
    const distanceCovered = Math.abs(startWeight - parseFloat(currentWeight));
    const progress = totalDistance > 0 ? Math.round((distanceCovered / totalDistance) * 100) : 0;
    const distanceRemaining = (totalDistance - distanceCovered).toFixed(1);

    const totalCalories = mealLogs.reduce((sum, m) => sum + (m.actual_calories || 0), 0);
    const avgCalories = mealLogs.length > 0 ? Math.round(totalCalories / mealLogs.length) : 0;

    const weeklyAvg = milestone >= 7 ? (Math.abs(parseFloat(weightChange)) / (milestone / 7)).toFixed(1) : '0';

    return {
        workoutsCompleted,
        adherence,
        weightChange,
        currentWeight,
        targetWeight,
        progress,
        distanceRemaining,
        avgCalories,
        weeklyAvg
    };
}

function getSubjectForMilestone(milestone) {
    const subjects = {
        30: '🏆 30 Giorni con MyWellness - I tuoi progressi!',
        60: '🔥 60 Giorni di Costanza - Risultati Incredibili!',
        90: '👑 90 GIORNI! Sei un CAMPIONE assoluto!'
    };
    return subjects[milestone];
}

function getMilestoneEmailTemplate(user, stats, milestone, appUrl) {
    const templates = {
        30: get30DayTemplate,
        60: get60DayTemplate,
        90: get90DayTemplate
    };
    return templates[milestone](user, stats, appUrl);
}

function get30DayTemplate(user, stats, appUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 24px 30px; }
        .content-cell { padding: 40px 30px; }
        @media only screen and (min-width: 600px) {
            .logo-cell { padding: 60px 60px 24px 60px !important; }
            .content-cell { padding: 60px 60px 40px 60px !important; }
        }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .outer-wrapper { padding: 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell" style="background: white;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h1 style="color: #26847F; margin: 0 0 20px 0; font-size: 28px;">🎉 Congratulazioni! 30 Giorni con MyWellness!</h1>
                            
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h2 style="color: #26847F; margin: 0 0 15px 0; text-align: center;">📊 I TUOI PROGRESSI</h2>
                                
                                <div style="margin: 15px 0;">
                                    <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">🏋️ Allenamenti</h3>
                                    <p style="margin: 5px 0; color: #374151;">• Completati: <strong>${stats.workoutsCompleted}</strong></p>
                                    <p style="margin: 5px 0; color: #374151;">• Tasso di aderenza: <strong>${stats.adherence}%</strong></p>
                                </div>

                                <div style="margin: 15px 0;">
                                    <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">⚖️ Peso</h3>
                                    <p style="margin: 5px 0; color: #374151;">• Variazione: <strong>${stats.weightChange} kg</strong></p>
                                    <p style="margin: 5px 0; color: #374151;">• Peso attuale: <strong>${stats.currentWeight} kg</strong></p>
                                </div>

                                <div style="margin: 15px 0;">
                                    <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">🍽️ Nutrizione</h3>
                                    <p style="margin: 5px 0; color: #374151;">• Calorie medie: <strong>${stats.avgCalories} kcal/giorno</strong></p>
                                    <p style="margin: 5px 0; color: #374151;">• Aderenza piano: <strong>${stats.adherence}%</strong></p>
                                </div>
                            </div>

                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
                                💪 <strong>Sei sulla strada giusta!</strong> I primi 30 giorni sono cruciali per stabilire le basi del successo, e tu li hai completati con determinazione!
                            </p>

                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
                                🎯 <strong>Prossimo traguardo: 60 giorni</strong><br>
                                Continua così e i risultati saranno ancora più evidenti!
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            📊 Vedi Dashboard Completa
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
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

function get60DayTemplate(user, stats, appUrl) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 24px 30px; }
        .content-cell { padding: 40px 30px; }
        @media only screen and (min-width: 600px) {
            .logo-cell { padding: 60px 60px 24px 60px !important; }
            .content-cell { padding: 60px 60px 40px 60px !important; }
        }
    </style>
</head>
<body>
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h1 style="color: #26847F; margin: 0 0 20px 0;">🔥 60 Giorni - La Costanza Sta Pagando!</h1>
                            <p>Ciao ${user.full_name},</p>
                            <p><strong>2 MESI con MyWellness!</strong> I cambiamenti sono ormai evidenti!</p>
                            <div style="background: #e9f6f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
                                <h3>📈 Trasformazione:</h3>
                                <p>• Variazione: ${stats.weightChange} kg</p>
                                <p>• Progresso: ${stats.progress}%</p>
                                <p>• Workout: ${stats.workoutsCompleted}</p>
                            </div>
                            <p>🎯 Obiettivo 90 giorni: quasi arrivati!</p>
                            <a href="${appUrl}/Dashboard" style="display: inline-block; background: #26847F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">Vedi Progressi</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function get90DayTemplate(user, stats, appUrl) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 24px 30px; }
        .content-cell { padding: 40px 30px; }
        @media only screen and (min-width: 600px) {
            .logo-cell { padding: 60px 60px 24px 60px !important; }
            .content-cell { padding: 60px 60px 40px 60px !important; }
        }
    </style>
</head>
<body>
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h1 style="color: #26847F; margin: 0 0 20px 0;">👑 90 GIORNI! SEI UN CAMPIONE!</h1>
                            <p>Ciao ${user.full_name},</p>
                            <p><strong>3 MESI! HAI CREATO UNA NUOVA ABITUDINE!</strong></p>
                            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 30px; border-radius: 16px; text-align: center; margin: 20px 0;">
                                <h2 style="margin: 0;">🎁 REWARD SPECIALE</h2>
                                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">1 MESE GRATIS</p>
                                <p style="background: white; padding: 10px; border-radius: 8px; font-weight: bold; color: #f59e0b;">Codice: CHAMPION90</p>
                            </div>
                            <p>• Peso perso: ${stats.weightChange} kg</p>
                            <p>• Workout: ${stats.workoutsCompleted}</p>
                            <p>• Progresso: ${stats.progress}%</p>
                            <p>🌟 <strong>Le abitudini sono permanenti!</strong></p>
                            <a href="${appUrl}/Dashboard" style="display: inline-block; background: #26847F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0;">🎁 Riscatta Regalo</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}