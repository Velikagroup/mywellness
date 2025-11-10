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

        console.log(`📅 Looking for users created on ${fourteenDaysAgo.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetUsers = allUsers.filter(u => {
            if (!u.created_date || u.subscription_status !== 'active') return false;
            const createdDate = new Date(u.created_date);
            return createdDate.toISOString().split('T')[0] === fourteenDaysAgo.toISOString().split('T')[0];
        });

        console.log(`👥 Found ${targetUsers.length} users at 14-day mark`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of targetUsers) {
            try {
                // 🔐 GENERA COUPON PERSONALIZZATO
                const couponResponse = await base44.asServiceRole.functions.invoke('generatePersonalCoupon', {
                    userId: user.id,
                    baseCode: 'FEEDBACK10',
                    discountValue: 10,
                    emailTrigger: 'feedback_request_14_days'
                });

                const personalCouponCode = couponResponse.coupon_code;
                console.log(`🎫 Generated personal coupon: ${personalCouponCode}`);

                const emailBody = generateFeedbackEmail(user, personalCouponCode, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '💬 La tua opinione vale! (+ 10% sconto omaggio)',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Feedback request sent to ${user.email} with coupon ${personalCouponCode}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    coupon: personalCouponCode,
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

        console.log(`🎉 Feedback requests sent: ${sentCount}/${targetUsers.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: targetUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateFeedbackEmail(user, couponCode, appUrl) {
    const replyEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
    
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
                            
                            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 24px;">💬 Come sta andando con MyWellness?</h2>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Sono passate 2 settimane dal tuo primo giorno con noi. Vorremmo sapere come sta andando il tuo percorso e se c'è qualcosa che possiamo migliorare.
                            </p>

                            <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🤔 Ci piacerebbe sapere:</h3>
                                <ul style="color: #374151; line-height: 1.8; margin: 0; padding-left: 20px;">
                                    <li>Le funzionalità ti sono utili?</li>
                                    <li>Hai trovato difficoltà nell'usare l'app?</li>
                                    <li>Cosa ti piace di più?</li>
                                    <li>Cosa potremmo migliorare?</li>
                                </ul>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="mailto:${replyEmail}?subject=Feedback MyWellness - ${user.email}&body=Ciao Team MyWellness,%0D%0A%0D%0AEcco il mio feedback:" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💬 Lascia il Tuo Feedback
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 24px;">🎁 GRAZIE IN ANTICIPO!</h2>
                                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">Come ringraziamento per il tuo tempo, ecco il tuo codice sconto personale:</p>
                                <div style="background: white; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #26847F; letter-spacing: 2px;">${couponCode}</p>
                                </div>
                                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 18px; font-weight: bold;">= 10% DI SCONTO</p>
                                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 12px;">🔒 Codice univoco - non condivisibile</p>
                            </div>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                                <strong>Nota:</strong> Puoi anche rispondere direttamente a questa email con il tuo feedback. Leggiamo personalmente ogni messaggio e lo usiamo per migliorare continuamente l'app.
                            </p>

                            <p style="color: #374151; line-height: 1.6; font-size: 16px; margin: 30px 0 0 0;">
                                Grazie per essere parte della famiglia MyWellness! 💚
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