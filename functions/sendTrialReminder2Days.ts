import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialReminder2Days - Start');

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔍 Finding users with trial ending in ~2 days...');

        // Trova tutti gli utenti con trial attivo che finisce tra 1.5 e 2.5 giorni
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
        const oneDayHalfFromNow = new Date(now.getTime() + (1.5 * 24 * 60 * 60 * 1000));

        const users = await base44.asServiceRole.entities.User.filter({
            subscription_status: 'trial'
        });

        console.log(`📊 Found ${users.length} users with trial status`);

        let emailsSent = 0;

        for (const targetUser of users) {
            if (!targetUser.trial_ends_at || !targetUser.email) continue;

            const trialEndsAt = new Date(targetUser.trial_ends_at);
            
            // Controlla se il trial finisce tra 1.5 e 2.5 giorni
            if (trialEndsAt < oneDayHalfFromNow || trialEndsAt > twoDaysFromNow) {
                continue;
            }

            // Verifica che non abbia già ricevuto il reminder
            const existingReminders = await base44.asServiceRole.entities.EmailLog.filter({
                user_id: targetUser.id,
                email_type: 'trial_reminder_2days'
            });

            if (existingReminders.length > 0) {
                console.log(`⏭️ Skipping ${targetUser.email} - reminder already sent`);
                continue;
            }

            console.log(`📧 Sending 2-day reminder to: ${targetUser.email}`);

            const endDate = trialEndsAt.toLocaleDateString('it-IT', { 
                day: 'numeric', 
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });

            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body style="background-color: #fafafa; padding: 20px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
                            <div style="font-size: 64px; margin-bottom: 10px;">⏰</div>
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Il Tuo Trial Sta per Finire!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Ciao ${targetUser.full_name || 'Utente'}! 👋</p>
                            <p style="color: #555; line-height: 1.8; margin-bottom: 25px;">
                                Il tuo trial gratuito di MyWellness termina il <strong>${endDate}</strong>.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #3b82f6;">
                                <h3 style="color: #1e40af; margin: 0 0 15px 0;">💡 Non Perdere i Tuoi Progressi</h3>
                                <p style="color: #1e3a8a; margin: 0; line-height: 1.6;">
                                    Hai fatto grandi passi avanti! Continua il tuo percorso per raggiungere i tuoi obiettivi senza interruzioni.
                                </p>
                            </div>

                            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">📋 Cosa Succede Dopo?</h4>
                                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                                    ✅ Se non fai nulla, il tuo abbonamento continuerà automaticamente<br>
                                    ❌ Se vuoi cancellare, fallo prima del ${endDate}<br>
                                    💳 Il pagamento partirà solo alla fine del trial
                                </p>
                            </div>

                            <div style="text-align: center; margin: 35px 0;">
                                <a href="https://app.projectmywellness.com/Settings" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; margin-right: 10px;">
                                    Gestisci Abbonamento
                                </a>
                            </div>

                            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                                Puoi cancellare in qualsiasi momento dalle impostazioni. Nessun costo nascosto.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: targetUser.email,
                    subject: '⏰ Il Tuo Trial Termina Tra 2 Giorni',
                    body: emailHtml,
                    from_name: 'MyWellness'
                });

                emailsSent++;
                console.log(`✅ Email sent to ${targetUser.email} via Base44 Core`);

                // Log email
                try {
                    await base44.asServiceRole.entities.EmailLog.create({
                        user_id: targetUser.id,
                        email_type: 'trial_reminder_2days',
                        recipient_email: targetUser.email,
                        subject: '⏰ Il Tuo Trial Termina Tra 2 Giorni',
                        status: 'sent',
                        provider: 'base44_core',
                        sent_at: new Date().toISOString()
                    });
                } catch (logError) {
                    console.warn('⚠️ Email log error:', logError);
                }
            } catch (error) {
                console.error(`❌ Failed to send to ${targetUser.email}:`, error.message);
            }
        }

        console.log(`✅ Trial reminder process completed. Emails sent: ${emailsSent}`);

        return Response.json({ 
            success: true,
            emailsSent,
            message: `Sent ${emailsSent} trial reminder emails`
        });

    } catch (error) {
        console.error('❌ Trial reminder error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});