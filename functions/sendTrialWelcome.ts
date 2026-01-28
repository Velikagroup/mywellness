import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialWelcome - Start');

    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userId, userEmail, userName } = body;

        if (!userEmail) {
            return Response.json({ 
                success: false, 
                error: 'Missing userEmail' 
            }, { status: 400 });
        }

        console.log(`📧 Sending trial welcome to: ${userEmail}`);

        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendGridApiKey) {
            console.error('❌ SENDGRID_API_KEY not configured');
            return Response.json({ 
                success: false, 
                error: 'Email service not configured' 
            }, { status: 500 });
        }

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
                        <td style="background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">🎉 Benvenuto su MyWellness!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Ciao ${userName || 'Utente'}! 👋</p>
                            <p style="color: #555; line-height: 1.8; margin-bottom: 25px;">
                                Il tuo <strong>trial gratuito di 3 giorni</strong> è iniziato! Hai accesso completo a tutte le funzionalità premium.
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #26847F;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">✨ Cosa Include il Tuo Trial</h3>
                                <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>📊 Calcolo età biologica e massa grassa</li>
                                    <li>🍽️ Piano nutrizionale personalizzato</li>
                                    <li>💪 Piano di allenamento su misura</li>
                                    <li>📸 Scan automatico cibi ed etichette</li>
                                    <li>📈 Dashboard con progressi in tempo reale</li>
                                </ul>
                            </div>
                            
                            <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">⏰ Timeline del Tuo Trial</h4>
                                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>Oggi:</strong> Accesso completo attivo<br>
                                    <strong>Tra 2 giorni:</strong> Riceverai un promemoria<br>
                                    <strong>Tra 3 giorni:</strong> Inizio fatturazione (puoi cancellare prima)
                                </p>
                            </div>

                            <div style="text-align: center; margin: 35px 0;">
                                <a href="https://app.projectmywellness.com/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px;">
                                    Inizia Subito →
                                </a>
                            </div>

                            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                                Nessun pagamento richiesto ora. Puoi cancellare in qualsiasi momento prima della fine del trial.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendGridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: userEmail, name: userName }] }],
                from: { email: 'info@projectmywellness.com', name: 'MyWellness' },
                reply_to: { email: 'info@projectmywellness.com' },
                subject: '🎉 Il Tuo Trial di 3 Giorni è Iniziato!',
                content: [{ type: 'text/html', value: emailHtml }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ SendGrid error:', errorText);
            return Response.json({ 
                success: false, 
                error: 'Failed to send email' 
            }, { status: 500 });
        }

        console.log('✅ Trial welcome email sent');

        // Log email
        if (userId) {
            try {
                await base44.asServiceRole.entities.EmailLog.create({
                    user_id: userId,
                    email_type: 'trial_welcome',
                    recipient_email: userEmail,
                    subject: '🎉 Il Tuo Trial di 3 Giorni è Iniziato!',
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });
            } catch (logError) {
                console.warn('⚠️ Email log error:', logError);
            }
        }

        return Response.json({ 
            success: true,
            message: 'Trial welcome email sent'
        });

    } catch (error) {
        console.error('❌ Send email error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});