import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('⏰ sendSubscriptionExpired CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        console.log(`📅 Checking subscriptions expired on ${yesterday.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const expiredYesterday = allUsers.filter(u => {
            if (!u.subscription_period_end) return false;
            const expiryDate = new Date(u.subscription_period_end);
            return expiryDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        });

        console.log(`👥 Found ${expiredYesterday.length} subscriptions expired yesterday`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of expiredYesterday) {
            try {
                const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                    { user_id: user.id },
                    ['-date'],
                    2
                );

                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id }
                );

                const weightChange = weightHistory.length >= 2 
                    ? (weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1)
                    : '0';

                const daysActive = Math.floor((today - new Date(user.created_date)) / (1000 * 60 * 60 * 24));
                const workoutsCompleted = workoutLogs.filter(w => w.completed).length;

                // Rileva lingua utente
                const userLanguage = user.preferred_language || 'it';

                // Usa sendEmailUnified
                await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                    userId: user.id,
                    userEmail: user.email,
                    templateId: 'subscription_expired',
                    variables: {
                        user_name: user.full_name || 'Utente',
                        expiry_date: yesterday.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
                        user_stats: `• Peso perso: ${weightChange > 0 ? weightChange : '0'} kg\n• Giorni attivi: ${daysActive}\n• Allenamenti completati: ${workoutsCompleted}`
                    },
                    language: userLanguage,
                    triggerSource: 'sendSubscriptionExpired_cron'
                });

                sentCount++;
                console.log(`✅ Expired email sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent'
                });

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to send to ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Expired emails sent: ${sentCount}/${expiredYesterday.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: expiredYesterday.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateExpiredEmail(user, weightChange, daysActive, workoutsCompleted, appUrl) {
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
                                Il tuo abbonamento MyWellness è scaduto ieri.
                            </p>

                            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 20px;">😢 Ci mancherai! Ma i tuoi progressi non sono persi:</h2>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Peso perso: ${weightChange > 0 ? weightChange : '0'} kg
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Giorni attivi: ${daysActive}
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Allenamenti completati: ${workoutsCompleted}
                                </div>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">🎯 Non lasciare che il tuo duro lavoro vada sprecato!</h3>
                            
                            <p style="color: #374151; line-height: 1.6;">Rinnova ora e:</p>

                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Riprendi esattamente da dove hai lasciato
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Mantieni tutti i tuoi dati e progressi
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Continua il tuo percorso di trasformazione
                            </div>

                            <div style="background: #fffbeb; border: 3px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">🔥 OFFERTA SPECIALE</h2>
                                <p style="margin: 0; font-size: 18px; color: #92400e;">
                                    Rinnova entro 7 giorni e ottieni<br>
                                    <strong style="font-size: 28px;">il primo mese a €29</strong><br>
                                    invece di €39!
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Rinnova Abbonamento
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