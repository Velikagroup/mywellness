import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('👋 sendInactiveUserReminder CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log(`📅 Checking users inactive since ${sevenDaysAgo.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const inactiveUsers = allUsers.filter(u => {
            if (u.subscription_status !== 'active') return false;
            if (!u.last_login_date) return false;
            
            const lastLogin = new Date(u.last_login_date);
            const daysSinceLogin = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
            
            return daysSinceLogin === 7;
        });

        console.log(`👥 Found ${inactiveUsers.length} users inactive for exactly 7 days`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of inactiveUsers) {
            try {
                const emailBody = generateInactiveReminderEmail(user, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '👋 Ti abbiamo notato... Il tuo piano ti aspetta!',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Inactive reminder sent to ${user.email}`);
                
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

        console.log(`🎉 Inactive reminders sent: ${sentCount}/${inactiveUsers.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: inactiveUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateInactiveReminderEmail(user, appUrl) {
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
                                È passata una settimana dal tuo ultimo accesso a MyWellness.
                            </p>

                            <p style="color: #6b7280; line-height: 1.6; font-style: italic;">
                                💭 Sappiamo che la vita può essere frenetica...
                            </p>

                            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #92400e; margin: 0 0 10px 0;">🎯 Ricorda perché hai iniziato:</h3>
                                <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: bold;">
                                    ${user.target_weight ? `Raggiungere ${user.target_weight} kg` : 'Il tuo obiettivo di benessere'}
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">⚠️ Gli studi dimostrano che:</h3>
                            
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #374151;">
                                <span style="position: absolute; left: 0; color: #ef4444; font-weight: bold;">•</span>
                                7 giorni di pausa possono diventare 30
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #374151;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold;">•</span>
                                La costanza è più importante dell'intensità
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #374151;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold;">•</span>
                                Anche 10 minuti al giorno fanno la differenza
                            </div>

                            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <h3 style="color: #065f46; margin: 0 0 10px 0;">💪 NON È TROPPO TARDI!</h3>
                                <p style="margin: 0; color: #047857;">Il tuo piano personalizzato ti aspetta:</p>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Piano nutrizionale aggiornato
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Allenamenti pronti
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    Progressi salvati
                                </div>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">🔥 Quick Start:</h3>
                            
                            <div style="background: #f9fafb; border-left: 4px solid #26847F; padding: 15px; margin: 10px 0;">
                                <p style="margin: 5px 0; color: #374151;"><strong>1.</strong> Apri l'app</p>
                                <p style="margin: 5px 0; color: #374151;"><strong>2.</strong> Traccia il peso di oggi</p>
                                <p style="margin: 5px 0; color: #374151;"><strong>3.</strong> Segui anche solo 1 pasto del piano</p>
                                <p style="margin: 5px 0; color: #374151;"><strong>4.</strong> Fai 10 minuti di movimento</p>
                            </div>

                            <p style="color: #10b981; font-weight: bold; font-size: 18px; text-align: center; margin: 30px 0;">
                                Un piccolo passo oggi = grandi risultati domani!
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Riprendi il Percorso
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #26847F; text-align: center; font-size: 14px; margin: 20px 0;">
                                Torna, siamo qui per te! 💚
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