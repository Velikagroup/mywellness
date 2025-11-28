import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('🛒 sendCartCheckoutAbandoned CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Check for test mode - send immediately to specific email
        let body = {};
        try {
            body = await req.json();
        } catch (e) {
            // No body, that's ok for CRON
        }
        
        const testEmail = body.test_email;
        const forceTest = body.force_test === true;
        
        if (testEmail && forceTest) {
            console.log(`🧪 TEST MODE: Sending to ${testEmail}`);
            
            const users = await base44.asServiceRole.entities.User.filter({
                email: testEmail
            });
            
            if (users.length === 0) {
                return Response.json({ error: `User not found: ${testEmail}` }, { status: 404 });
            }
            
            const user = users[0];
            const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
            const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
            const emailBody = generateCartAbandonedEmail(user, 1900, appUrl);
            
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                from_name: `MyWellness <${fromEmail}>`,
                subject: '🛒 Il tuo carrello ti aspetta! Non perdere l\'offerta',
                body: emailBody
            });
            
            return Response.json({ success: true, message: `Test email sent to ${testEmail}` });
        }

        const now = new Date();
                    const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));

                    console.log(`📅 Checking for checkout started more than 30 minutes ago`);

        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'checkout_started',
            completed: false
        });

        const targetActivities = activities.filter(a => {
                        const activityDate = new Date(a.created_date);
                        return activityDate <= thirtyMinutesAgo;
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
                    from_name: `MyWellness <${fromEmail}>`,
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
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .outer-wrapper { padding: 0 !important; }
            .feature-table td { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: white; padding: 40px 30px 10px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px 40px 30px;">
                            <!-- Hero Card - Carrello Abbandonato -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
                                <p style="font-size: 48px; margin: 0 0 10px 0;">🛒</p>
                                <h1 style="color: #92400e; margin: 0 0 10px 0; font-size: 24px;">Carrello in Attesa!</h1>
                                <p style="color: #92400e; margin: 0; font-size: 16px;">Il tuo piano è ancora disponibile</p>
                                ${amount > 0 ? `<p style="color: #92400e; font-size: 28px; font-weight: bold; margin: 15px 0 0 0;">€${(amount / 100).toFixed(2)}</p>` : ''}
                            </div>

                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <p style="color: #374151; line-height: 1.6; font-size: 15px; margin: 0 0 25px 0;">
                                Hai lasciato il checkout a metà! Il tuo piano personalizzato è pronto e ti sta aspettando.
                            </p>

                            <!-- Features nel carrello -->
                            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">✨ Nel Tuo Carrello:</h3>
                            <table class="feature-table" width="100%" cellpadding="0" cellspacing="8" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 18px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 24px;">🍽️</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Piano Nutrizionale AI</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 18px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 24px;">📊</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Dashboard Avanzata</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 18px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 24px;">📸</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Tracking AI Foto</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 18px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 24px;">🛒</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Lista Spesa Auto</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Timer/Urgency -->
                            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
                                <p style="color: #dc2626; font-size: 16px; margin: 0; font-weight: bold;">
                                    ⏰ Offerta valida ancora per poco!
                                </p>
                                <p style="color: #dc2626; font-size: 14px; margin: 8px 0 0 0;">
                                    3 Giorni Gratis + Cancellazione istantanea
                                </p>
                            </div>

                            <!-- Trust badges -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="15" border="0">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">🔒</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Pagamento<br>Sicuro</p>
                                                </td>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">✅</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Garanzia<br>100%</p>
                                                </td>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">🚀</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Attivazione<br>Istantanea</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/TrialSetup" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Completa L'Acquisto Ora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 13px; margin: 15px 0 0 0;">
                                Non perdere l'offerta - il tuo piano ti aspetta!
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