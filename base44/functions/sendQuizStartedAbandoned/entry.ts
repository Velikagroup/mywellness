import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎯 sendQuizStartedAbandoned CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

        console.log(`📅 Checking for quiz started between ${twoHoursAgo.toISOString()} and ${now.toISOString()}`);

        // Trova attività quiz_started non completate più vecchie di 2 ore
        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'quiz_started',
            completed: false
        });

        const targetActivities = activities.filter(a => {
            const activityDate = new Date(a.created_date);
            return activityDate <= twoHoursAgo;
        });

        console.log(`👥 Found ${targetActivities.length} abandoned quiz starts`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const activity of targetActivities) {
            try {
                // Trova l'utente
                const users = await base44.asServiceRole.entities.User.filter({
                    email: activity.user_id
                });

                if (users.length === 0) {
                    console.log(`⚠️ User not found for ${activity.user_id}`);
                    continue;
                }

                const user = users[0];

                // Controlla se ha già completato il quiz
                if (user.quiz_completed) {
                    await base44.asServiceRole.entities.UserActivity.update(activity.id, {
                        completed: true,
                        completed_at: new Date().toISOString()
                    });
                    console.log(`✅ User ${user.email} already completed quiz, marked as done`);
                    continue;
                }

                const emailBody = generateAbandonedQuizEmail(user, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '⏰ Il tuo piano personalizzato ti aspetta!',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Abandoned quiz email sent to ${user.email}`);
                
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

        console.log(`🎉 Quiz abandoned emails sent: ${sentCount}/${targetActivities.length}`);

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

function generateAbandonedQuizEmail(user, appUrl) {
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
                            
                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">⏰ Il Tuo Piano Ti Aspetta!</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Abbiamo notato che hai iniziato il quiz per creare il tuo piano wellness personalizzato, ma non l'hai ancora completato.
                            </p>

                            <p style="color: #374151; line-height: 1.6;">
                                <strong>Ci vogliono solo 3 minuti</strong> per avere:
                            </p>

                            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <div style="margin: 10px 0;">✅ Piano nutrizionale completo personalizzato</div>
                                <div style="margin: 10px 0;">✅ Ricette con foto e istruzioni</div>
                                <div style="margin: 10px 0;">✅ Lista della spesa automatica</div>
                                <div style="margin: 10px 0;">✅ Dashboard scientifica con BMR e massa grassa</div>
                            </div>

                            <p style="color: #374151; line-height: 1.6;">
                                Riprendi da dove hai lasciato - i tuoi progressi sono salvati!
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Quiz" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🎯 Completa il Quiz Ora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                                ⏱️ Bastano 3 minuti per iniziare la tua trasformazione
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