import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎯 sendMilestones CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        console.log(`📅 Checking milestones for ${today.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            u.subscription_status === 'active' && u.quiz_completed
        );

        console.log(`👥 Found ${activeUsers.length} active users to check`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';

        let sent30 = 0;
        let sent60 = 0;
        let sent90 = 0;
        const results = [];

        for (const user of activeUsers) {
            const createdDate = new Date(user.created_date);
            const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

            let milestone = null;
            if (daysSinceCreation === 30) milestone = 30;
            else if (daysSinceCreation === 60) milestone = 60;
            else if (daysSinceCreation === 90) milestone = 90;

            if (!milestone) continue;

            console.log(`🎯 User ${user.email}: ${milestone} days milestone`);

            try {
                const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                    { user_id: user.id },
                    ['-date'],
                    100
                );

                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id }
                );

                const mealLogs = await base44.asServiceRole.entities.MealLog.filter(
                    { user_id: user.id }
                );

                const stats = calculateStats(user, weightHistory, workoutLogs, mealLogs, daysSinceCreation);

                let personalCouponCode = null;
                
                // 🔐 GENERA COUPON PERSONALIZZATO SOLO PER 90 GIORNI
                if (milestone === 90) {
                    const couponResponse = await base44.asServiceRole.functions.invoke('generatePersonalCoupon', {
                        userId: user.id,
                        baseCode: 'CHAMPION90',
                        discountValue: 100,
                        emailTrigger: 'milestone_90_days'
                    });
                    personalCouponCode = couponResponse.coupon_code;
                    console.log(`🎫 Generated 90-day coupon: ${personalCouponCode}`);
                }

                const subject = getMilestoneSubject(milestone);
                const emailBody = getMilestoneTemplate(milestone, user, stats, personalCouponCode);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: subject,
                    body: emailBody
                });

                if (milestone === 30) sent30++;
                else if (milestone === 60) sent60++;
                else if (milestone === 90) sent90++;

                console.log(`✅ ${milestone}-day milestone email sent to ${user.email}${personalCouponCode ? ` with coupon ${personalCouponCode}` : ''}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    milestone: milestone,
                    coupon: personalCouponCode,
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

        console.log('🎉 Milestone emails completed');
        console.log(`📊 Sent: ${sent30} (30d) + ${sent60} (60d) + ${sent90} (90d)`);

        return Response.json({
            success: true,
            sent_30_days: sent30,
            sent_60_days: sent60,
            sent_90_days: sent90,
            total_sent: sent30 + sent60 + sent90,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function calculateStats(user, weightHistory, workoutLogs, mealLogs, days) {
    const workoutsCompleted = workoutLogs.filter(w => w.completed).length;
    const plannedWorkouts = user.workout_days ? user.workout_days * Math.floor(days / 7) : 0;
    const adherence = plannedWorkouts > 0 ? Math.round((workoutsCompleted / plannedWorkouts) * 100) : 0;

    let weightChange = 0;
    if (weightHistory.length >= 2) {
        const latest = weightHistory[0].weight;
        const oldest = weightHistory[weightHistory.length - 1].weight;
        weightChange = (oldest - latest).toFixed(1);
    }

    const avgCalories = mealLogs.length > 0
        ? Math.round(mealLogs.reduce((sum, log) => sum + (log.actual_calories || 0), 0) / mealLogs.length)
        : user.daily_calories || 0;

    return {
        workoutsCompleted,
        adherence,
        weightChange,
        avgCalories,
        days
    };
}

function getMilestoneSubject(milestone) {
    const subjects = {
        30: '🎉 30 giorni insieme! I tuoi primi progressi',
        60: '🔥 2 mesi di trasformazione! Sei sulla strada giusta',
        90: '👑 90 GIORNI! Sei un CAMPIONE - Ricompensa Speciale Dentro!'
    };
    return subjects[milestone] || 'Milestone raggiunto!';
}

function getMilestoneTemplate(milestone, user, stats, couponCode) {
    if (milestone === 30) return get30DayEmail(user, stats);
    if (milestone === 60) return get60DayEmail(user, stats);
    if (milestone === 90) return get90DayEmail(user, stats, couponCode);
}

function get30DayEmail(user, stats) {
    const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
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
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h2 style="color: #26847F; margin: 0 0 20px 0;">🎉 30 Giorni di Progressi!</h2>
                            <p style="color: #111827; font-size: 16px;">Ciao ${user.full_name || 'Utente'},</p>
                            <p style="color: #374151; line-height: 1.6;">È passato un mese dall'inizio del tuo percorso con MyWellness. Ecco i tuoi progressi:</p>
                            
                            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <p style="margin: 10px 0;"><strong>💪 Allenamenti:</strong> ${stats.workoutsCompleted} completati (${stats.adherence}% aderenza)</p>
                                <p style="margin: 10px 0;"><strong>⚖️ Peso perso:</strong> ${stats.weightChange} kg</p>
                                <p style="margin: 10px 0;"><strong>🍽️ Calorie medie:</strong> ${stats.avgCalories} kcal/giorno</p>
                            </div>

                            <p style="color: #374151; line-height: 1.6;">Continua così! I primi 30 giorni sono fondamentali per creare abitudini durature.</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: #26847F; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                                            📊 Vedi Dashboard Completa
                                        </a>
                                    </td>
                                </tr>
                            </table>
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

function get60DayEmail(user, stats) {
    const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
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
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h2 style="color: #26847F; margin: 0 0 20px 0;">🔥 2 Mesi di Trasformazione!</h2>
                            <p style="color: #111827; font-size: 16px;">Ciao ${user.full_name || 'Utente'},</p>
                            <p style="color: #374151; line-height: 1.6;">Sei a metà strada verso i 90 giorni necessari per consolidare un'abitudine permanente!</p>
                            
                            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #92400e;">📊 I Tuoi Progressi in 60 Giorni:</h3>
                                <p style="margin: 10px 0;"><strong>💪 Allenamenti:</strong> ${stats.workoutsCompleted} completati (${stats.adherence}% aderenza)</p>
                                <p style="margin: 10px 0;"><strong>⚖️ Peso perso:</strong> ${stats.weightChange} kg</p>
                                <p style="margin: 10px 0;"><strong>🍽️ Calorie medie:</strong> ${stats.avgCalories} kcal/giorno</p>
                            </div>

                            <p style="color: #374151; line-height: 1.6;"><strong>Ancora 30 giorni</strong> e raggiungerai il traguardo dei 90 giorni - il punto in cui le nuove abitudini diventano parte permanente della tua vita!</p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: #26847F; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                                            🎯 Continua il Percorso
                                        </a>
                                    </td>
                                </tr>
                            </table>
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

function get90DayEmail(user, stats, couponCode) {
    const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
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
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #26847F; margin: 0; font-size: 48px;">👑🏆🎉</h1>
                                <h2 style="color: #111827; margin: 10px 0; font-size: 32px; font-weight: bold;">SEI UN CAMPIONE!</h2>
                                <p style="color: #6b7280; font-size: 18px; margin: 10px 0;">90 GIORNI COMPLETATI</p>
                            </div>

                            <p style="color: #111827; font-size: 16px;">Ciao ${user.full_name || 'Campione'},</p>
                            
                            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
                                Hai raggiunto un traguardo straordinario! <strong>90 giorni</strong> di costanza. Gli studi scientifici dimostrano che hai creato <strong>abitudini permanenti</strong> che ti accompagneranno per sempre.
                            </p>

                            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 3px solid #10b981; border-radius: 12px; padding: 25px; margin: 20px 0;">
                                <h3 style="color: #065f46; margin: 0 0 20px 0; text-align: center;">📊 La Tua Trasformazione Completa</h3>
                                <p style="margin: 10px 0; text-align: center;"><strong style="font-size: 32px; color: #10b981;">${stats.workoutsCompleted}</strong><br><span style="color: #065f46;">Allenamenti Completati</span></p>
                                <p style="margin: 10px 0; text-align: center;"><strong style="font-size: 32px; color: #10b981;">${stats.weightChange} kg</strong><br><span style="color: #065f46;">Peso Perso</span></p>
                                <p style="margin: 10px 0; text-align: center;"><strong style="font-size: 32px; color: #10b981;">${stats.adherence}%</strong><br><span style="color: #065f46;">Aderenza al Piano</span></p>
                            </div>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 28px;">🎁 REGALO SPECIALE: 1 MESE GRATIS!</h2>
                                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">Per celebrare la tua incredibile costanza, ecco il tuo codice personale:</p>
                                <div style="background: white; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #26847F; letter-spacing: 2px;">${couponCode}</p>
                                </div>
                                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px; font-weight: bold;">= 100% SCONTO = 1 MESE GRATIS!</p>
                                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 12px;">🔒 Codice univoco - non condivisibile</p>
                            </div>

                            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
                                Hai trasformato completamente il tuo stile di vita. Sei la prova vivente che <strong>la costanza vince sempre</strong>.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing?coupon=${couponCode}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            👑 Riscatta il Tuo Mese Gratis
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; font-style: italic; margin: 30px 0;">
                                "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno. E tu l'hai fatto per 90 giorni di fila."
                            </p>

                            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                                Siamo incredibilmente orgogliosi di te! 💚
                            </p>
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