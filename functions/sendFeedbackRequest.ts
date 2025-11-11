import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('💬 sendFeedbackRequest CRON - Start (runs on day 7, 30, 60)');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        console.log(`📅 Checking feedback requests for ${today.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => u.subscription_status === 'active');

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.projectmywellness.com';

        let sentCount = 0;
        const results = [];

        for (const user of activeUsers) {
            try {
                // ✅ CONTROLLO PREFERENZE EMAIL
                if (user.email_notifications?.product_updates === false) {
                    console.log(`⏭️ Skipping ${user.email} - product updates disabled`);
                    continue;
                }

                const accountAge = Math.floor((today - new Date(user.created_date)) / (1000 * 60 * 60 * 24));
                
                // Richiesta feedback a 7, 30 o 60 giorni
                if (accountAge !== 7 && accountAge !== 30 && accountAge !== 60) {
                    continue;
                }

                const emailBody = generateFeedbackEmail(user, accountAge, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: `💬 Come sta andando con MyWellness? (${accountAge} giorni)`,
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Feedback request sent to ${user.email} (${accountAge} days)`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    days: accountAge,
                    status: 'sent'
                });

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

        console.log(`🎉 Feedback requests sent: ${sentCount}/${activeUsers.length}`);

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

function generateFeedbackEmail(user, days, appUrl) {
    const milestoneText = days === 7 ? 'prima settimana' : days === 30 ? 'primo mese' : 'due mesi';
    
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
                            
                            <h2 style="color: #26847F; margin: 0 0 15px 0; font-size: 24px;">💬 Raccontaci la tua esperienza!</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Sono passati <strong>${days} giorni</strong> da quando hai iniziato il tuo percorso con MyWellness. Come sta andando?
                            </p>

                            <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h3 style="color: #1e40af; margin: 0 0 15px 0;">📊 Dopo ${milestoneText}</h3>
                                <p style="margin: 0; color: #1e3a8a;">Il tuo feedback è prezioso per migliorare MyWellness</p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">❓ Ci piacerebbe sapere:</h3>
                            
                            <div style="background: #f9fafb; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
                                <p style="margin: 5px 0; color: #374151;">• Come ti trovi con i piani nutrizionali?</p>
                                <p style="margin: 5px 0; color: #374151;">• Gli allenamenti sono efficaci?</p>
                                <p style="margin: 5px 0; color: #374151;">• Ci sono funzionalità che vorresti?</p>
                                <p style="margin: 5px 0; color: #374151;">• Cosa miglioreresti?</p>
                            </div>

                            <p style="color: #6b7280; line-height: 1.6; margin: 20px 0;">
                                Bastano <strong>2 minuti</strong>! Il tuo feedback ci aiuta a rendere MyWellness sempre migliore per te e per tutti gli utenti.
                            </p>

                            <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: bold;">
                                    💡 Ogni feedback viene letto personalmente dal nostro team
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:velika.03@outlook.it?subject=Feedback MyWellness - ${days} giorni&body=Ciao Team MyWellness,%0D%0A%0D%0AEcco il mio feedback dopo ${days} giorni:%0D%0A%0D%0A[Scrivi qui il tuo feedback]" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💬 Invia Feedback via Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 14px; margin: 20px 0;">
                                Oppure rispondi direttamente a questa email con il tuo feedback!
                            </p>

                            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                                <p style="margin: 0; color: #065f46; font-size: 14px;">
                                    💚 <strong>Grazie per essere parte di MyWellness!</strong> Il tuo percorso e i tuoi progressi sono importanti per noi.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
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