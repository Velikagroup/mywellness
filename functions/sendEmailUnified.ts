import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 📧 FUNZIONE CENTRALIZZATA PER INVIO EMAIL
 * 
 * Questa funzione:
 * ✅ Usa SEMPRE SendGrid (dominio projectmywellness.com)
 * ✅ Carica template dal database (EmailTemplate)
 * ✅ Supporta multilingua automatico
 * ✅ Logga TUTTI gli invii (EmailLog)
 * ✅ Gestisce errori in modo robusto
 * ✅ Ritorna status chiaro
 */
Deno.serve(async (req) => {
    console.log('📧 sendEmailUnified - Start');
    
    const logEntry = {
        user_id: null,
        user_email: null,
        template_id: null,
        subject: null,
        status: 'pending',
        provider: 'sendgrid',
        from_email: 'info@projectmywellness.com',
        language: 'it',
        metadata: {}
    };
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Parametri richiesti
        const body = await req.json();
        const { 
            userId, 
            userEmail, 
            templateId, 
            variables = {},
            language = 'it' 
        } = body;

        if (!userEmail || !templateId) {
            return Response.json({ 
                success: false,
                error: 'Missing required fields: userEmail, templateId' 
            }, { status: 400 });
        }

        logEntry.user_id = userId;
        logEntry.user_email = userEmail;
        logEntry.template_id = templateId;
        logEntry.language = language;
        logEntry.metadata = { variables };

        console.log(`📬 Sending email to ${userEmail} using template ${templateId} (${language})`);

        // Verifica SendGrid API Key
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendGridApiKey) {
            throw new Error('SENDGRID_API_KEY not configured');
        }

        // Carica template dal database
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            throw new Error(`Template not found or inactive: ${templateId}`);
        }

        const template = templates[0];
        const appUrl = 'https://app.projectmywellness.com';

        // Sostituisci variabili nel template
        let greeting = template.greeting || '';
        let mainContent = template.main_content || '';
        let subject = template.subject || 'MyWellness';
        let ctaUrl = template.call_to_action_url || `${appUrl}/Dashboard`;
        let footerText = template.footer_text || '';

        // Sostituisci tutte le variabili
        Object.keys(variables).forEach(key => {
            const value = variables[key];
            greeting = greeting.replace(`{${key}}`, value);
            mainContent = mainContent.replace(`{${key}}`, value);
            subject = subject.replace(`{${key}}`, value);
            ctaUrl = ctaUrl.replace(`{${key}}`, value);
            footerText = footerText.replace(`{${key}}`, value);
        });

        // Sostituisci {app_url}
        mainContent = mainContent.replace(/\{app_url\}/g, appUrl);
        ctaUrl = ctaUrl.replace(/\{app_url\}/g, appUrl);

        logEntry.subject = subject;

        // Genera HTML email
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: white; padding: 40px 30px 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">${subject}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            ${greeting ? `<h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">${greeting}</h2>` : ''}
                            <p style="color: #1a5753; line-height: 1.8; white-space: pre-line;">${mainContent}</p>
                            ${template.call_to_action_text ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                                    ${template.call_to_action_text}
                                </a>
                            </div>` : ''}
                            ${footerText ? `<p style="color: #6b7280; margin-top: 30px;">${footerText}</p>` : ''}
                        </td>
                    </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St, Sheridan, WY 82801, United States</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        // Invia via SendGrid
        const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendGridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: userEmail, name: variables.user_name || userEmail }]
                }],
                from: {
                    email: template.from_email || 'info@projectmywellness.com',
                    name: 'MyWellness'
                },
                reply_to: {
                    email: template.reply_to_email || 'info@projectmywellness.com'
                },
                subject: subject,
                content: [{
                    type: 'text/html',
                    value: emailHtml
                }]
            })
        });

        if (!sendGridResponse.ok) {
            const errorText = await sendGridResponse.text();
            throw new Error(`SendGrid error: ${errorText}`);
        }

        // Estrai message ID da SendGrid (se disponibile)
        const messageId = sendGridResponse.headers.get('x-message-id');

        // Salva log SUCCESS
        logEntry.status = 'sent';
        logEntry.sent_at = new Date().toISOString();
        logEntry.sendgrid_message_id = messageId;

        await base44.asServiceRole.entities.EmailLog.create(logEntry);

        console.log(`✅ Email sent successfully to ${userEmail}`);

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            messageId: messageId,
            logId: logEntry.id
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);

        // Salva log FAILED
        logEntry.status = 'failed';
        logEntry.error_message = error.message;

        try {
            const base44 = createClientFromRequest(req);
            await base44.asServiceRole.entities.EmailLog.create(logEntry);
        } catch (logError) {
            console.error('❌ Failed to save error log:', logError);
        }

        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});