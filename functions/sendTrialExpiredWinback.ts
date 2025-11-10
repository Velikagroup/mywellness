import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎁 sendTrialExpiredWinback CRON - Start');
    
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

        console.log(`📅 Checking trials expired on ${yesterday.toISOString().split('T')[0]}`);

        const allUsers = await base44.asServiceRole.entities.User.list();
        const trialExpiredYesterday = allUsers.filter(u => {
            if (u.subscription_status !== 'trial' && u.subscription_status !== 'expired') return false;
            if (!u.subscription_period_end) return false;
            if (u.purchased_landing_offer) return false; // Skip landing offer users
            
            const expiryDate = new Date(u.subscription_period_end);
            return expiryDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        });

        console.log(`👥 Found ${trialExpiredYesterday.length} trials expired yesterday without conversion`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const user of trialExpiredYesterday) {
            try {
                const emailBody = generateTrialWinbackEmail(user, appUrl);

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: user.email,
                    from_name: `MyWellness Team <${fromEmail}>`,
                    subject: '🎁 Offerta Esclusiva: 20% di sconto per te!',
                    body: emailBody
                });

                sentCount++;
                console.log(`✅ Trial winback email sent to ${user.email}`);
                
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

        console.log(`🎉 Trial winback emails sent: ${sentCount}/${trialExpiredYesterday.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: trialExpiredYesterday.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateTrialWinbackEmail(user, appUrl) {
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
                                Il tuo trial di 3 giorni è terminato, ma non è troppo tardi!
                            </p>

                            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #065f46; margin: 0 0 10px 0;">💪 Durante il trial hai:</h3>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Generato il tuo piano personalizzato
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Iniziato a tracciare i progressi
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #065f46;">
                                    <span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>
                                    Visto il potenziale di MyWellness
                                </div>
                            </div>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 32px;">🎁 SOLO PER TE</h2>
                                <p style="margin: 0 0 20px 0; font-size: 24px; color: #78350f; font-weight: bold;">
                                    20% di sconto<br>sul primo mese!
                                </p>
                                <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block; margin-bottom: 15px;">
                                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Codice sconto:</p>
                                    <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 2px;">TRIAL20</p>
                                </div>
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    ⏰ Valido per le prossime <strong>48 ore</strong>
                                </p>
                            </div>

                            <h3 style="color: #991b1b; margin: 30px 0 15px 0;">✗ Senza MyWellness perdi:</h3>
                            
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #6b7280;">
                                <span style="position: absolute; left: 0; color: #ef4444; font-weight: bold; font-size: 18px;">•</span>
                                Piano nutrizionale personalizzato
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #6b7280;">
                                <span style="position: absolute; left: 0; color: #ef4444; font-weight: bold; font-size: 18px;">•</span>
                                Allenamenti adattivi
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #6b7280;">
                                <span style="position: absolute; left: 0; color: #ef4444; font-weight: bold; font-size: 18px;">•</span>
                                Analisi AI delle foto pasti
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative; color: #6b7280;">
                                <span style="position: absolute; left: 0; color: #ef4444; font-weight: bold; font-size: 18px;">•</span>
                                Tracciamento progressi
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing?coupon=TRIAL20" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            💎 Attiva Abbonamento con 20% OFF
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #ef4444; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                                ⏰ <strong>Questa offerta scade tra 48 ore.</strong> Non lasciartela scappare!
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