import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔐 sendPasswordResetConfirmed - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`🔒 Sending password reset confirmation to ${user.email}`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        const emailBody = `
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
                            
                            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                                <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 24px;">Password Modificata con Successo</h2>
                                <p style="margin: 0; color: #047857; font-size: 16px;">
                                    La tua password è stata aggiornata correttamente
                                </p>
                            </div>

                            <p style="color: #374151; line-height: 1.6;">
                                Questa è un'email di conferma per informarti che la password del tuo account MyWellness è stata modificata con successo.
                            </p>

                            <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli modifica:</h3>
                                <p style="margin: 5px 0; color: #374151;">• Email account: <strong>${user.email}</strong></p>
                                <p style="margin: 5px 0; color: #374151;">• Data modifica: <strong>${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>
                                <p style="margin: 5px 0; color: #374151;">• Dispositivo: <strong>Browser</strong></p>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">🔒 Consigli per la sicurezza:</h3>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Usa una password unica e complessa
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Non condividere mai la tua password
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Cambia password periodicamente
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Diffida di email sospette
                                </div>
                            </div>

                            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                <h3 style="color: #991b1b; margin: 0 0 15px 0;">⚠️ Non sei stato tu?</h3>
                                <p style="margin: 0 0 15px 0; color: #7c2d12; line-height: 1.6;">
                                    Se NON hai richiesto questa modifica, il tuo account potrebbe essere compromesso.
                                </p>
                                <p style="margin: 0; color: #7c2d12; font-weight: bold;">
                                    🚨 Contattaci IMMEDIATAMENTE a: <a href="mailto:velika.03@outlook.it" style="color: #ef4444;">velika.03@outlook.it</a>
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🔐 Accedi con Nuova Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 14px; margin: 30px 0;">
                                Il tuo account è al sicuro. Continua il tuo percorso di benessere! 💚
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

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness Security <${fromEmail}>`,
            subject: '🔐 Password Modificata - Conferma Sicurezza',
            body: emailBody
        });

        console.log('✅ Password reset confirmation sent');

        return Response.json({ 
            success: true,
            message: 'Password reset confirmation email sent'
        });

    } catch (error) {
        console.error('❌ Error sending password reset confirmation:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});