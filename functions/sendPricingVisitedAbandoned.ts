import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('💰 sendPricingVisitedAbandoned CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        console.log(`📅 Checking for pricing visited between ${twentyFourHoursAgo.toISOString()} and ${now.toISOString()}`);

        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'pricing_visited',
            completed: false
        });

        const targetActivities = activities.filter(a => {
            const activityDate = new Date(a.created_date);
            return activityDate <= twentyFourHoursAgo;
        });

        console.log(`👥 Found ${targetActivities.length} abandoned pricing visits`);

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

                const emailBody = generatePricingAbandonedEmail(user, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '❓ Hai dubbi sul piano? Ecco tutto quello che offriamo',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Pricing abandoned email sent to ${user.email}`);
                
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

        console.log(`🎉 Pricing abandoned emails sent: ${sentCount}/${targetActivities.length}`);

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

function generatePricingAbandonedEmail(user, appUrl) {
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
                            
                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">❓ Hai Dubbi sul Piano?</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Abbiamo notato che hai visitato la nostra pagina prezzi ma non hai scelto un piano. Vogliamo aiutarti a prendere la decisione migliore!
                            </p>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">🎯 Cosa Rende MyWellness Unico:</h3>
                            
                            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">🤖</span>
                                    <strong>AI Personalizzata:</strong> Il piano si adatta ai TUOI obiettivi, non è un template generico
                                </div>
                                <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">📸</span>
                                    <strong>Foto AI dei Pasti:</strong> Fotografa e analizza automaticamente calorie e macro
                                </div>
                                <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">🔬</span>
                                    <strong>Dashboard Scientifica:</strong> BMR, massa grassa, proiezioni precise
                                </div>
                                <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">🛒</span>
                                    <strong>Lista Spesa Auto:</strong> Organizza tutto per te, risparmi tempo
                                </div>
                            </div>

                            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                                <h3 style="color: #1e40af; margin: 0 0 10px 0;">💡 Domande Frequenti:</h3>
                                <p style="color: #1e3a8a; font-size: 14px; margin: 10px 0;"><strong>Q:</strong> Posso cancellare quando voglio?<br><strong>A:</strong> Sì, sempre, senza penali!</p>
                                <p style="color: #1e3a8a; font-size: 14px; margin: 10px 0;"><strong>Q:</strong> I 3 giorni gratis sono vincolanti?<br><strong>A:</strong> No, puoi cancellare prima e non paghi nulla</p>
                                <p style="color: #1e3a8a; font-size: 14px; margin: 10px 0;"><strong>Q:</strong> Funziona per me?<br><strong>A:</strong> Sì! L'AI si adatta a qualsiasi obiettivo</p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💚 Scopri i Piani - 3 Giorni Gratis
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0; font-style: italic;">
                                "Ho provato 5 app diverse. MyWellness è l'unica che funziona davvero." - Valentina C.
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