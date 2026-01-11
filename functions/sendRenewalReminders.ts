import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔔 sendRenewalReminders CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);

        const today = new Date();
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);
        const in3Days = new Date(today);
        in3Days.setDate(in3Days.getDate() + 3);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log(`📅 Today: ${today.toISOString().split('T')[0]}`);

        // Recupera tutti gli utenti con subscription attiva E che hanno cancellato il rinnovo automatico
        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersWithCancelledRenewal = allUsers.filter(u => 
            u.subscription_status === 'active' && 
            u.subscription_period_end &&
            u.cancellation_at_period_end === true  // SOLO utenti che hanno annullato il rinnovo automatico
        );

        console.log(`👥 Found ${usersWithCancelledRenewal.length} users with cancelled auto-renewal to check`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';

        let sent7Days = 0;
        let sent3Days = 0;
        let sent1Day = 0;
        const results = [];

        for (const user of usersWithCancelledRenewal) {
            // ✅ CONTROLLO PREFERENZE EMAIL
            if (user.email_notifications?.renewal_reminders === false) {
                console.log(`⏭️ Skipping ${user.email} - renewal reminders disabled`);
                continue;
            }

            const expiresAt = new Date(user.subscription_period_end);
            const daysUntilExpiry = Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            console.log(`📧 User ${user.email}: expires in ${daysUntilExpiry} days (auto-renewal cancelled)`);

            let emailSubject = '';
            let emailBody = '';
            let shouldSend = false;

            // Reminder a 7 giorni
            if (daysUntilExpiry === 7) {
                shouldSend = true;
                sent7Days++;
                emailSubject = '⏰ Il tuo abbonamento MyWellness scade tra 7 giorni';
                emailBody = getEmailTemplate(user, 7, expiresAt);
            }
            // Reminder a 3 giorni
            else if (daysUntilExpiry === 3) {
                shouldSend = true;
                sent3Days++;
                emailSubject = '🔔 Ultimi 3 giorni - Non perdere MyWellness!';
                emailBody = getEmailTemplate(user, 3, expiresAt);
            }
            // Reminder a 1 giorno
            else if (daysUntilExpiry === 1) {
                shouldSend = true;
                sent1Day++;
                emailSubject = '🚨 Ultimo giorno! Il tuo abbonamento MyWellness scade domani';
                emailBody = getEmailTemplate(user, 1, expiresAt);
            }

            if (shouldSend) {
                try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        from_name: `MyWellness Team <${fromEmail}>`,
                        subject: emailSubject,
                        body: emailBody
                    });

                    console.log(`✅ Reminder sent to ${user.email} (${daysUntilExpiry} days)`);
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        days_until_expiry: daysUntilExpiry,
                        status: 'sent'
                    });
                } catch (error) {
                    console.error(`❌ Failed to send to ${user.email}:`, error.message);
                    results.push({
                        user_id: user.id,
                        email: user.email,
                        days_until_expiry: daysUntilExpiry,
                        status: 'failed',
                        error: error.message
                    });
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log('🎉 Renewal reminders completed');
        console.log(`📊 Sent: ${sent7Days} (7d) + ${sent3Days} (3d) + ${sent1Day} (1d)`);

        return Response.json({
            success: true,
            sent_7_days: sent7Days,
            sent_3_days: sent3Days,
            sent_1_day: sent1Day,
            total_sent: sent7Days + sent3Days + sent1Day,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function getEmailTemplate(user, daysLeft, expiryDate) {
    const urgencyColor = daysLeft === 1 ? '#ef4444' : daysLeft === 3 ? '#f59e0b' : '#3b82f6';
    const urgencyBg = daysLeft === 1 ? '#fef2f2' : daysLeft === 3 ? '#fef3c7' : '#eff6ff';
    
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
                            <h1 style="color: #26847F; margin: 20px 0 0 0; font-size: 24px;">⏰ Promemoria Rinnovo</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <div style="background: ${urgencyBg}; border: 3px solid ${urgencyColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                                <h2 style="color: ${urgencyColor}; margin: 0 0 10px 0; font-size: 32px;">${daysLeft === 1 ? '🚨 ULTIMO GIORNO!' : daysLeft === 3 ? '⏰ Ultimi 3 giorni' : '📅 Promemoria'}</h2>
                                <p style="margin: 0; color: #111827; font-size: 18px;">
                                    Il tuo abbonamento MyWellness scade ${daysLeft === 1 ? 'domani' : `tra ${daysLeft} giorni`}
                                </p>
                                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                                    Data scadenza: ${new Date(expiryDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            <p style="color: #374151; line-height: 1.6;">
                                Hai scelto di non rinnovare automaticamente il tuo abbonamento. Non perdere l'accesso a tutte le funzionalità Premium che ti aiutano a raggiungere i tuoi obiettivi:
                            </p>

                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Piano nutrizionale personalizzato con AI
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Allenamenti adattivi basati sui tuoi progressi
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Analisi foto pasti automatica
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Tracciamento completo dei progressi
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #26847F; font-weight: bold; font-size: 18px;">✓</span>
                                Supporto prioritario
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🔄 Rinnova Abbonamento
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                                ${daysLeft === 1 ? 
                                    '⚡ Ultimo giorno per rinnovare senza interruzioni!' : 
                                    'Rinnova ora per continuare senza interruzioni'}
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