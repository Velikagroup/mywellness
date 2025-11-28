import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('⏰ sendQuizReminderNoPlan CRON - Start');
    
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
                    from_name: `MyWellness Team <${fromEmail}>`,
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
    
    // Usa contenuto dal template se disponibile, altrimenti fallback
    const mainContent = template?.main_content 
        ? template.main_content
            .replace(/{user_name}/g, userName)
            .replace(/{user_email}/g, user.email || '')
            .replace(/{app_url}/g, appUrl)
        : `Complimenti per aver completato il quiz MyWellness! 🎉

Abbiamo analizzato le tue risposte e il tuo piano personalizzato è pronto per essere generato.

📊 Ecco cosa abbiamo calcolato per te:
• Il tuo fabbisogno calorico giornaliero
• I macronutrienti ottimali per il tuo obiettivo
• Le ricette più adatte alle tue preferenze

💡 Con il Piano Base a soli €19/mese avrai:

✅ Piano nutrizionale AI personalizzato
✅ Ricette settimanali con lista della spesa
✅ Dashboard con tracciamento progressi
✅ Ricalcolo automatico del piano

🔥 Non lasciare che il tuo impegno vada sprecato - hai già fatto il passo più importante completando il quiz!

Attiva ora il tuo piano e inizia subito il tuo percorso verso gli obiettivi che ti sei prefissato.`;

    const ctaText = template?.call_to_action_text || 'Attiva Piano Base - €19/mese';
    const ctaUrl = (template?.call_to_action_url || '{app_url}/pricing').replace(/{app_url}/g, appUrl);
    const footerText = template?.footer_text || 'Il tuo piano personalizzato ti aspetta';

    // Converti newlines in <br> per HTML
    const htmlContent = mainContent.replace(/\n/g, '<br>');

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
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${userName},</p>
                            
                            <div style="color: #374151; line-height: 1.8; font-size: 15px;">
                                ${htmlContent}
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #26847F; text-align: center; font-size: 14px; margin: 20px 0;">
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