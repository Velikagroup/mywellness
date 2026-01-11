import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('💳 sendTrialSetupAbandoned CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (1 * 60 * 60 * 1000));

        console.log(`📅 Checking for trial setup opened between ${oneHourAgo.toISOString()} and ${now.toISOString()}`);

        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'trial_setup_opened',
            completed: false
        });

        const targetActivities = activities.filter(a => {
            const activityDate = new Date(a.created_date);
            return activityDate <= oneHourAgo;
        });

        console.log(`👥 Found ${targetActivities.length} abandoned trial setups`);

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

                if (user.subscription_status === 'trial' || user.subscription_status === 'active') {
                    await base44.asServiceRole.entities.UserActivity.update(activity.id, {
                        completed: true,
                        completed_at: new Date().toISOString()
                    });
                    console.log(`✅ User ${user.email} already subscribed, marked as done`);
                    continue;
                }

                const planData = activity.event_data?.plan_selected || 'base';
                const emailBody = generateAbandonedTrialSetupEmail(user, planData, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '🔐 Completa l\'attivazione - 3 Giorni Gratis ti aspettano!',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Abandoned trial setup email sent to ${user.email}`);
                
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

        console.log(`🎉 Trial setup abandoned emails sent: ${sentCount}/${targetActivities.length}`);

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

function generateAbandonedTrialSetupEmail(user, plan, appUrl) {
    const planNames = {
        base: 'Base',
        pro: 'Pro',
        premium: 'Premium'
    };

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
                            
                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">🔐 Sei a Un Passo dal Tuo Obiettivo!</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Hai scelto il piano <strong>${planNames[plan] || 'Base'}</strong> ma non hai completato l'attivazione.
                            </p>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 28px;">🎁 3 GIORNI GRATIS</h2>
                                <p style="margin: 0; color: #92400e; font-size: 16px;">Nessun addebito durante la prova!</p>
                            </div>

                            <h3 style="color: #111827; margin: 20px 0 10px 0;">✨ Cosa Riceverai Subito:</h3>
                            
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Piano nutrizionale personalizzato completo
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Dashboard scientifica con BMR e massa grassa
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Lista della spesa automatica
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Tracking progressi in tempo reale
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/TrialSetup?plan=${plan}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Completa l'Attivazione Ora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                                ⏰ Bastano 2 minuti • Cancella quando vuoi • Nessun impegno
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