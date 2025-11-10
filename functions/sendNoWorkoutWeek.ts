import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('😴 sendNoWorkoutWeek CRON - Start (runs Monday)');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const dayOfWeek = today.getDay();
        
        // Only run on Monday (1)
        if (dayOfWeek !== 1) {
            console.log('⏭️ Not Monday, skipping');
            return Response.json({ 
                success: true, 
                message: 'Skipped - only runs on Monday',
                sent_count: 0
            });
        }

        console.log(`📅 Monday check - reviewing last week workouts`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => u.subscription_status === 'active');

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of activeUsers) {
            try {
                // Check last 7 days (Monday to Sunday)
                const last7Days = [];
                for (let i = 1; i <= 7; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(checkDate.getDate() - i);
                    last7Days.push(checkDate.toISOString().split('T')[0]);
                }

                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    10
                );

                const completedWorkouts = workoutLogs.filter(w => 
                    w.completed && last7Days.includes(w.date)
                );

                if (completedWorkouts.length === 0) {
                    const emailBody = generateNoWorkoutEmail(user, appUrl);

                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        from_name: `MyWellness Team <${fromEmail}>`,
                        subject: '😊 Ci manchi! Una nuova settimana, una nuova opportunità',
                        body: emailBody
                    });

                    sentCount++;
                    console.log(`✅ No workout reminder sent to ${user.email}`);
                    
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

        console.log(`🎉 No workout reminders sent: ${sentCount}/${activeUsers.length}`);

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

function generateNoWorkoutEmail(user, appUrl) {
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
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Ho notato che la scorsa settimana non hai fatto workout. Va tutto bene?
                            </p>

                            <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #1e40af; margin: 0 0 15px 0;">💙 Nessun giudizio, solo supporto!</h3>
                                <p style="margin: 0; color: #1e3a8a; line-height: 1.6;">
                                    La vita è imprevedibile. Forse è stata una settimana impegnativa, forse hai avuto altri impegni. È normale!
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">🌟 Ma ricorda:</h3>
                            
                            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
                                <p style="margin: 5px 0; color: #991b1b;">
                                    • Una settimana diventa facilmente due settimane<br>
                                    • Il corpo perde tono più velocemente di quanto pensi<br>
                                    • I risultati ottenuti possono svanire
                                </p>
                            </div>

                            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #065f46; margin: 0 0 15px 0;">💪 È lunedì - Fresh Start!</h3>
                                <p style="margin: 10px 0; color: #047857;">Questa è la tua opportunità per ricominciare:</p>
                                <div style="margin: 15px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Anche solo <strong>15 minuti</strong> oggi fanno la differenza
                                </div>
                                <div style="margin: 15px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Inizia con un workout <strong>facile</strong>
                                </div>
                                <div style="margin: 15px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Non serve essere perfetti, basta <strong>iniziare</strong>
                                </div>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">⚡ Quick Start Workout (15 min):</h3>
                            
                            <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <div style="margin: 10px 0; padding-left: 30px; position: relative; color: #374151;">
                                    <span style="position: absolute; left: 0; font-weight: bold;">1.</span>
                                    5 minuti stretching
                                </div>
                                <div style="margin: 10px 0; padding-left: 30px; position: relative; color: #374151;">
                                    <span style="position: absolute; left: 0; font-weight: bold;">2.</span>
                                    3x10 squat
                                </div>
                                <div style="margin: 10px 0; padding-left: 30px; position: relative; color: #374151;">
                                    <span style="position: absolute; left: 0; font-weight: bold;">3.</span>
                                    3x10 push-up (anche da ginocchia)
                                </div>
                                <div style="margin: 10px 0; padding-left: 30px; position: relative; color: #374151;">
                                    <span style="position: absolute; left: 0; font-weight: bold;">4.</span>
                                    2 min plank (anche a intervalli)
                                </div>
                                <div style="margin: 10px 0; padding-left: 30px; position: relative; color: #374151;">
                                    <span style="position: absolute; left: 0; font-weight: bold;">5.</span>
                                    3 minuti cool down
                                </div>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">
                                    "La perfezione è nemica del progresso"
                                </p>
                                <p style="margin: 10px 0 0 0; color: #78350f; font-size: 14px;">
                                    Meglio un workout breve che nessun workout!
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Workouts" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💪 Scegli un Workout
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #26847F; text-align: center; font-size: 14px; margin: 20px 0;">
                                Siamo qui per te! Ogni giorno è una nuova opportunità 💚
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