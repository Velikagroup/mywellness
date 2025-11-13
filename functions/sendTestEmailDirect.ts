import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTestEmailDirect - Start');
    
    const logEntry = {
        user_id: null,
        user_email: null,
        template_id: null,
        subject: null,
        status: 'pending',
        provider: 'sendgrid',
        from_email: 'info@projectmywellness.com',
        language: 'it',
        metadata: { test_email: true }
    };
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica che l'utente sia admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { to, templateId } = body;

        if (!to || !templateId) {
            return Response.json({ error: 'Missing required fields: to, templateId' }, { status: 400 });
        }

        logEntry.user_email = to;
        logEntry.template_id = templateId;

        const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendgridApiKey) {
            return Response.json({ error: 'SendGrid API key not configured' }, { status: 500 });
        }

        // Carica il template dal database (STESSO PROCESSO DI sendEmailUnified)
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            return Response.json({ 
                error: `Template not found or inactive: ${templateId}` 
            }, { status: 404 });
        }

        const template = templates[0];
        const appUrl = 'https://app.projectmywellness.com';

        // Sostituisci variabili con valori di test
        const testVariables = {
            user_name: user.full_name || 'Admin Test',
            app_url: appUrl
        };

        let greeting = template.greeting || '';
        let mainContent = template.main_content || '';
        let subject = template.subject || 'MyWellness';
        let ctaUrl = template.call_to_action_url || `${appUrl}/Dashboard`;
        let footerText = template.footer_text || '';

        // Sostituisci variabili
        Object.keys(testVariables).forEach(key => {
            const value = testVariables[key];
            greeting = greeting.replace(`{${key}}`, value);
            mainContent = mainContent.replace(`{${key}}`, value);
            subject = subject.replace(`{${key}}`, value);
            ctaUrl = ctaUrl.replace(`{${key}}`, value);
            footerText = footerText.replace(`{${key}}`, value);
        });

        // Aggiungi [TEST] al subject
        subject = `[TEST] ${subject}`;
        logEntry.subject = subject;

        // STESSO IDENTICO HTML TEMPLATE DI sendEmailUnified
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
</html>
        `;

        console.log(`📬 Sending test email to ${to} from ${template.from_email}`);

        // Chiama SendGrid API (STESSO PROCESSO DI sendEmailUnified)
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: to }]
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

        if (!sendgridResponse.ok) {
            const errorText = await sendgridResponse.text();
            console.error('❌ SendGrid API error:', errorText);
            
            // Salva log FAILED
            logEntry.status = 'failed';
            logEntry.error_message = errorText;
            await base44.asServiceRole.entities.EmailLog.create(logEntry);
            
            return Response.json({ 
                error: 'SendGrid API error',
                details: errorText 
            }, { status: sendgridResponse.status });
        }

        // Estrai message ID da SendGrid
        const messageId = sendgridResponse.headers.get('x-message-id');

        // Salva log SUCCESS
        logEntry.status = 'sent';
        logEntry.sent_at = new Date().toISOString();
        logEntry.sendgrid_message_id = messageId;
        logEntry.from_email = template.from_email || 'info@projectmywellness.com';

        await base44.asServiceRole.entities.EmailLog.create(logEntry);

        console.log('✅ Test email sent successfully via SendGrid API');

        return Response.json({ 
            success: true,
            message: 'Test email sent successfully'
        });

    } catch (error) {
        console.error('❌ Error sending test email:', error);
        
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
            error: error.message 
        }, { status: 500 });
    }
});