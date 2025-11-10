import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔥 sendWorkoutStreak7Days CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        console.log(`📅 Checking 7-day workout streaks for ${today.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => u.subscription_status === 'active');

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of activeUsers) {
            try {
                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    30
                );

                const completedWorkouts = workoutLogs.filter(w => w.completed);
                
                // Check last 7 days for consecutive workouts
                const last7Days = [];
                for (let i = 0; i < 7; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(checkDate.getDate() - i);
                    const dateStr = checkDate.toISOString().split('T')[0];
                    last7Days.push(dateStr);
                }

                const workoutDates = completedWorkouts.map(w => w.date);
                const hasWorkoutEveryDay = last7Days.every(date => workoutDates.includes(date));

                if (hasWorkoutEveryDay) {
                    const emailBody = generateStreakEmail(user, appUrl);

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        from_name: `MyWellness Team <${fromEmail}>`,
                        subject: '🔥 7 GIORNI DI FILA! Sei inarrestabile!',
                        body: emailBody
                    });

                    sentCount++;
                    console.log(`✅ Streak email sent to ${user.email}`);
                    
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        status: 'sent'
                    });
                }

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to process ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Streak emails sent: ${sentCount}/${activeUsers.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_checked: activeUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateStreakEmail(user, appUrl) {
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
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="font-size: 80px; line-height: 1;">🔥</div>
                                <h1 style="color: #ef4444; margin: 20px 0 10px 0; font-size: 36px;">STREAK DI 7 GIORNI!</h1>
                                <p style="color: #f59e0b; font-size: 24px; font-weight: bold; margin: 0;">SEI INARRESTABILE!</p>
                            </div>

                            <p style="color: #111827; font-size: 18px; margin: 0 0 20px 0; text-align: center;">
                                Ciao <strong>${user.full_name || 'Campione'}</strong>,
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 3px solid #ef4444; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #991b1b; margin: 0 0 20px 0; font-size: 28px;">💪 7 WORKOUT CONSECUTIVI</h2>
                                <div style="display: flex; justify-content: center; gap: 10px; margin: 20px 0;">
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">L</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">M</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">M</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">G</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">V</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">S</div>
                                    <div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold;">D</div>
                                </div>
                                <p style="margin: 20px 0 0 0; color: #7c2d12; font-size: 18px; font-weight: bold;">
                                    NON HAI SALTATO NEMMENO UN GIORNO! 🔥
                                </p>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">💡 Lo sai che:</h3>
                                <p style="margin: 10px 0; color: #78350f; line-height: 1.6;">
                                    • Serve <strong>21 giorni</strong> per creare un'abitudine<br>
                                    • Sei già a <strong>33%</strong> del percorso!<br>
                                    • Meno del <strong>5%</strong> delle persone arriva a 7 giorni consecutivi<br>
                                    • Statisticamente, hai <strong>10x più probabilità</strong> di raggiungere i tuoi obiettivi
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0; text-align: center;">🎯 Prossimo Traguardo:</h3>
                            
                            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                                <h4 style="color: #065f46; margin: 0 0 10px 0;">🏆 Obiettivo 21 Giorni:</h4>
                                <p style="margin: 5px 0; color: #047857;">• Continua così per altri 14 giorni</p>
                                <p style="margin: 5px 0; color: #047857;">• Avrai creato un'abitudine permanente</p>
                                <p style="margin: 5px 0; color: #047857;">• I risultati saranno incredibili</p>
                            </div>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 16px; padding: 25px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0; font-size: 18px; color: #78350f; font-weight: bold;">
                                    💪 Continua così e raggiungi i 21 giorni per un <strong style="color: #f59e0b;">PREMIO ESCLUSIVO!</strong>
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Workouts" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🔥 Continua lo Streak!
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #ef4444; text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0;">
                                NON SPEGNERE IL FUOCO! 🔥💪
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