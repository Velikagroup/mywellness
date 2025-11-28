import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🛒 sendCartCheckoutAbandoned CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check disabled for testing - re-enable in production if needed
        // const cronSecret = Deno.env.get('CRON_SECRET');
        // const authHeader = req.headers.get('Authorization');
        // if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
        //     console.error('Unauthorized cron call');
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

        console.log(`📅 Checking for checkout started between ${threeHoursAgo.toISOString()} and ${now.toISOString()}`);

        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'checkout_started',
            completed: false
        });

        const targetActivities = activities.filter(a => {
            const activityDate = new Date(a.created_date);
            return activityDate <= threeHoursAgo;
        });

        console.log(`👥 Found ${targetActivities.length} abandoned checkouts`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const activity of targetActivities) {
            try {
                const users = await base44.asServiceRole.entities.User.filter({
                    email: activity.user_id
                });

                if (users.length === 0) {
                    console.log(`⚠️ User not found for ${activity.user_id}`);
                    continue;
                }

                const user = users[0];

                if (user.subscription_status === 'active') {
                    await base44.asServiceRole.entities.UserActivity.update(activity.id, {
                        completed: true,
                        completed_at: new Date().toISOString()
                    });
                    console.log(`✅ User ${user.email} completed purchase, marked as done`);
                    continue;
                }

                const amount = activity.event_data?.amount || 0;
                const emailBody = generateCartAbandonedEmail(user, amount, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '🛒 Il tuo carrello ti aspetta! Non perdere l\'offerta',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Cart abandoned email sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent'
                });

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to send to ${activity.user_id}:`, error.message);
                results.push({
                    user_id: activity.user_id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Cart abandoned emails sent: ${sentCount}/${targetActivities.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_activities: targetActivities.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateCartAbandonedEmail(user, amount, appUrl) {
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
                            <p style="color: #111827; font-size: 16px;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">🛒 Il Tuo Carrello Ti Aspetta!</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Hai lasciato il processo di pagamento a metà. Il tuo piano personalizzato è pronto e ti sta aspettando!
                            </p>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 28px;">⏰ OFFERTA VALIDA ANCORA PER POCO</h2>
                                ${amount > 0 ? `<p style="color: #92400e; font-size: 20px; margin: 0;">Totale: €${(amount / 100).toFixed(2)}</p>` : ''}
                                <p style="color: #92400e; font-size: 16px; margin: 10px 0 0 0;">3 Giorni Gratis + Cancellazione istantanea</p>
                            </div>

                            <h3 style="color: #111827; margin: 20px 0 10px 0;">✨ Nel Tuo Carrello:</h3>
                            
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Piano nutrizionale personalizzato completo
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Dashboard scientifica avanzata
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Tracking automatico con AI fotografica
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Accesso immediato a tutte le funzionalità
                            </div>

                            <div style="background: #dbeafe; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                                <p style="color: #1e40af; font-size: 16px; margin: 0; font-weight: bold;">
                                    🔒 Pagamento Sicuro • ✅ Garanzia 100% • 🚀 Attivazione Istantanea
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/TrialSetup" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Completa L'Acquisto Ora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #ef4444; font-size: 14px; text-align: center; margin: 20px 0; font-weight: bold;">
                                ⚠️ I posti sono limitati - Completa ora prima che scada l'offerta!
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