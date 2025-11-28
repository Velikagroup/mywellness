import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('⏰ sendQuizReminderNoPlan CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check disabled for testing - re-enable in production if needed
        // const cronSecret = Deno.env.get('CRON_SECRET');
        // const authHeader = req.headers.get('Authorization');
        // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        //     console.error('Unauthorized cron call');
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        console.log(`📅 Checking users with quiz completed on ${yesterday.toISOString().split('T')[0]}`);

        // Carica template dal database
        let emailTemplate = null;
        try {
            const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
                template_id: 'quiz_completed_abandoned'
            });
            if (templates.length > 0) {
                emailTemplate = templates[0];
                console.log('📧 Template loaded from database');
            }
        } catch (e) {
            console.log('⚠️ Could not load template, using fallback');
        }

        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersWithQuizNoPlan = [];

        for (const user of allUsers) {
            if (!user.quiz_completed) continue;
            if (!user.updated_date) continue;
            
            // Salta utenti che hanno già un piano a pagamento
            if (user.subscription_plan && user.subscription_plan !== 'free' && user.subscription_plan !== 'standard') continue;

            const quizDate = new Date(user.updated_date);
            const hoursSinceQuiz = (today - quizDate) / (1000 * 60 * 60);

            if (hoursSinceQuiz >= 24 && hoursSinceQuiz < 48) {
                usersWithQuizNoPlan.push(user);
            }
        }

        console.log(`👥 Found ${usersWithQuizNoPlan.length} users with quiz completed but no paid plan`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of usersWithQuizNoPlan) {
            try {
                const emailSubject = emailTemplate?.subject || '🎯 Il tuo piano personalizzato ti aspetta! Attivalo ora';
                const emailBody = generateQuizReminderEmail(user, appUrl, emailTemplate);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness <${fromEmail}>`,
                    subject: emailSubject.replace('{user_name}', user.full_name || 'Utente'),
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Promo email sent to ${user.email}`);
                
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

        console.log(`🎉 Promo emails sent: ${sentCount}/${usersWithQuizNoPlan.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: usersWithQuizNoPlan.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateQuizReminderEmail(user, appUrl, template) {
    const userName = user.full_name || 'Utente';
    
    const ctaText = template?.call_to_action_text || 'Attiva Piano Base - €19/mese';
    const ctaUrl = (template?.call_to_action_url || '{app_url}/pricing').replace(/{app_url}/g, appUrl);
    const footerText = template?.footer_text || 'Il tuo piano personalizzato ti aspetta';

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
                            <!-- Hero Card -->
                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 25px;">
                                <p style="font-size: 48px; margin: 0 0 10px 0;">🎯</p>
                                <h1 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">Quiz Completato!</h1>
                                <p style="color: #374151; margin: 0; font-size: 16px;">Il tuo piano personalizzato è pronto</p>
                            </div>

                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${userName},</p>
                            
                            <p style="color: #374151; line-height: 1.6; font-size: 15px; margin: 0 0 25px 0;">
                                Complimenti per aver completato il quiz! 🎉 Abbiamo analizzato le tue risposte e calcolato il tuo profilo metabolico completo.
                            </p>

                            <!-- Stats Cards -->
                            <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">📊 Cosa abbiamo calcolato per te:</h3>
                            <table class="feature-table" width="100%" cellpadding="0" cellspacing="8" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">🔥</p>
                                        <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Fabbisogno Calorico</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">⚖️</p>
                                        <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Macro Ottimali</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">🍽️</p>
                                        <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Ricette Personalizzate</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">📈</p>
                                        <p style="font-size: 14px; font-weight: bold; color: #111827; margin: 8px 0 0 0;">Proiezione Obiettivo</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Plan Features -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; text-align: center;">💡 Piano Base - Solo €19/mese</h3>
                                <table width="100%" cellpadding="0" cellspacing="8" border="0">
                                    <tr>
                                        <td width="50%" style="color: #92400e; font-size: 14px;"><span style="color: #10b981; font-weight: bold;">✓</span> Piano nutrizionale AI</td>
                                        <td width="50%" style="color: #92400e; font-size: 14px;"><span style="color: #10b981; font-weight: bold;">✓</span> Ricette settimanali</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #92400e; font-size: 14px;"><span style="color: #10b981; font-weight: bold;">✓</span> Lista della spesa</td>
                                        <td style="color: #92400e; font-size: 14px;"><span style="color: #10b981; font-weight: bold;">✓</span> Dashboard progressi</td>
                                    </tr>
                                </table>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #26847F; text-align: center; font-size: 14px; margin: 15px 0 0 0;">
                                ${footerText}
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