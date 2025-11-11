import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('✅ sendRenewalConfirmation - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId, transactionId } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`📬 Sending renewal confirmation to ${user.email}`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        
        const nextRenewalDate = user.subscription_period_end 
            ? new Date(user.subscription_period_end).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'non disponibile';

        // 🧾 GENERA FATTURA SE PRESENTE TRANSACTION ID
        let invoiceHTML = '';
        let invoiceNumber = '';
        
        if (transactionId) {
            try {
                console.log('📄 Generating invoice for transaction:', transactionId);
                const invoiceResponse = await base44.asServiceRole.functions.invoke('generateInvoicePDF', {
                    transactionId: transactionId
                });
                
                const invoiceData = invoiceResponse.data || invoiceResponse;
                
                if (invoiceData.success) {
                    invoiceHTML = invoiceData.invoiceHTML;
                    invoiceNumber = invoiceData.invoiceNumber;
                    console.log('✅ Invoice generated:', invoiceNumber);
                }
            } catch (invoiceError) {
                console.error('⚠️ Invoice generation error (non-critical):', invoiceError.message);
            }
        }

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
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">✅ Abbonamento Rinnovato con Successo</h1>
                            <p style="color: #6b7280; margin: 0; font-size: 16px;">Grazie per aver scelto MyWellness</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <div style="margin-bottom: 30px;">
                                <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">👋 Ciao ${user.full_name || 'Utente'}!</h2>
                                <p style="margin: 0; color: #1a5753; line-height: 1.6;">
                                    Il tuo abbonamento MyWellness è stato rinnovato automaticamente con successo! 🎉
                                </p>
                            </div>

                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                                <h2 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">✨ Abbonamento Attivo</h2>
                                <p style="margin: 0; font-size: 16px; color: #111827;">
                                    Piano: <strong>${user.subscription_plan === 'premium' ? 'Premium' : user.subscription_plan === 'pro' ? 'Pro' : 'Base'}</strong>
                                </p>
                                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                                    Prossimo rinnovo: ${nextRenewalDate}
                                </p>
                            </div>

                            ${invoiceHTML ? `
                            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                                <h3 style="color: #92400e; margin: 0 0 10px 0;">📄 Fattura Allegata</h3>
                                <p style="color: #78350f; margin: 0; font-size: 14px;">
                                    La tua fattura <strong>${invoiceNumber}</strong> è allegata a questa email
                                </p>
                            </div>
                            ` : ''}

                            <h2 style="color: #111827; margin: 30px 0 20px 0;">💪 Continua il tuo percorso:</h2>
                            
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">🍽️</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Piano Nutrizionale AI</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Ricette personalizzate aggiornate in base ai tuoi progressi</p>
                                    </td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">💪</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Allenamenti Personalizzati</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Programmi adattivi che evolvono con te</p>
                                    </td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">📊</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Tracciamento Avanzato</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Analisi dettagliata dei tuoi progressi</p>
                                    </td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0 10px 0;">
                                <a href="${Deno.env.get('APP_URL') || 'https://app.projectmywellness.com'}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                    🎯 Vai alla Dashboard
                                </a>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 15px; margin: 30px 0;">
                                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                                    <strong>💡 Gestisci il tuo abbonamento:</strong> Puoi modificare o annullare il rinnovo automatico in qualsiasi momento dalla sezione Impostazioni.
                                </p>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">❓ Hai bisogno di aiuto?</h3>
                            <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                                Il nostro team è qui per te! Rispondi a questa email o scrivici a 
                                <a href="mailto:velika.03@outlook.it" style="color: #26847F; text-decoration: none; font-weight: 600;">velika.03@outlook.it</a>
                            </p>

                            <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
                                <p style="margin: 0 0 10px 0;"><strong style="color: #111827;">MyWellness</strong></p>
                                <p style="margin: 0 0 10px 0;">Grazie per essere parte della nostra community 🌟</p>
                                <p style="margin: 0; font-size: 12px;">
                                    <a href="${Deno.env.get('APP_URL') || 'https://app.projectmywellness.com'}/Privacy" style="color: #26847F; text-decoration: none;">Privacy Policy</a> &middot; 
                                    <a href="${Deno.env.get('APP_URL') || 'https://app.projectmywellness.com'}/Terms" style="color: #26847F; text-decoration: none;">Termini di Servizio</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    ${invoiceHTML ? `
    <!-- FATTURA ALLEGATA -->
    <div style="margin-top: 40px; page-break-before: always;">
        ${invoiceHTML}
    </div>
    ` : ''}
</body>
</html>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness <${fromEmail}>`,
            subject: `✅ Abbonamento MyWellness Rinnovato${invoiceNumber ? ` - Fattura ${invoiceNumber}` : ''}`,
            body: emailBody
        });

        console.log('✅ Renewal confirmation email sent successfully');

        return Response.json({ 
            success: true,
            message: 'Renewal confirmation email sent'
        });

    } catch (error) {
        console.error('❌ Error sending renewal confirmation email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});