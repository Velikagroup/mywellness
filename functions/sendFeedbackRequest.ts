import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('💬 sendFeedbackRequest CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        console.log(`📅 Checking users active for exactly 14 days`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersAt14Days = allUsers.filter(u => {
            if (u.subscription_status !== 'active') return false;
            if (!u.created_date) return false;
            
            const createdDate = new Date(u.created_date);
            const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
            
            return daysSinceCreation === 14;
        });

        console.log(`👥 Found ${usersAt14Days.length} users at 14 days milestone`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of usersAt14Days) {
            try {
                const emailBody = generateFeedbackEmail(user, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '💬 La tua opinione conta! 2 settimane con MyWellness',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Feedback request sent to ${user.email}`);
                
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

        console.log(`🎉 Feedback requests sent: ${sentCount}/${usersAt14Days.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: usersAt14Days.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateFeedbackEmail(user, appUrl) {
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
                                Sono passate <strong>2 settimane</strong> da quando hai iniziato il tuo percorso con MyWellness!
                            </p>

                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #26847F; margin: 0 0 15px 0; font-size: 28px;">💬 La tua opinione è preziosa!</h2>
                                <p style="margin: 0; color: #1a5753; font-size: 16px;">
                                    Aiutaci a migliorare MyWellness per te e per tutti gli altri utenti
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">🎯 Ci vogliono solo 2 minuti:</h3>
                            
                            <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h4 style="color: #111827; margin: 0 0 15px 0;">📝 Domande rapide:</h4>
                                <div style="margin: 10px 0; color: #374151;">
                                    ✓ Come valuti l'esperienza finora? (1-5 stelle)
                                </div>
                                <div style="margin: 10px 0; color: #374151;">
                                    ✓ Quale funzionalità ti piace di più?
                                </div>
                                <div style="margin: 10px 0; color: #374151;">
                                    ✓ Cosa potremmo migliorare?
                                </div>
                                <div style="margin: 10px 0; color: #374151;">
                                    ✓ Consiglieresti MyWellness?
                                </div>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <h3 style="color: #92400e; margin: 0 0 10px 0;">🎁 GRAZIE per il tuo tempo!</h3>
                                <p style="margin: 0; color: #78350f; line-height: 1.6;">
                                    Come ringraziamento per il tuo feedback, riceverai un <strong>codice sconto del 10%</strong> da usare sul prossimo rinnovo!
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:velika.03@outlook.it?subject=Feedback MyWellness - ${user.full_name}&body=Ciao! Ecco il mio feedback dopo 2 settimane:%0D%0A%0D%0A1. Valutazione (1-5): %0D%0A%0D%0A2. Funzionalità preferita: %0D%0A%0D%0A3. Cosa migliorare: %0D%0A%0D%0A4. Consiglierei ad altri? %0D%0A%0D%0A5. Note aggiuntive: %0D%0A" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💬 Lascia il tuo Feedback
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 14px; margin: 20px 0;">
                                Oppure rispondi direttamente a questa email con le tue impressioni!
                            </p>

                            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                                <h4 style="color: #065f46; margin: 0 0 10px 0;">💡 Il tuo feedback ci aiuta a:</h4>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Migliorare l'AI per piani ancora più personalizzati</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Aggiungere le funzionalità che desideri</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Rendere l'esperienza più facile e intuitiva</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Aiutare altri utenti come te</p>
                            </div>

                            <p style="color: #26847F; text-align: center; font-size: 16px; margin: 30px 0; font-weight: bold;">
                                Grazie per essere parte della community MyWellness! 💚
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