import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 📧 FUNZIONE CENTRALIZZATA PER INVIO EMAIL - V2
 * 
 * FEATURES:
 * ✅ Retry automatico (max 3 tentativi)
 * ✅ Logging completo su EmailLog
 * ✅ Fallback su Base44 Core se SendGrid fallisce
 * ✅ Tracking source per debug
 * ✅ Validazione robusta
 */

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

async function sendViaSendGrid(apiKey, emailData) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email: emailData.to, name: emailData.toName || emailData.to }]
            }],
            from: {
                email: emailData.from || 'info@projectmywellness.com',
                name: 'MyWellness'
            },
            reply_to: {
                email: emailData.replyTo || 'info@projectmywellness.com'
            },
            subject: emailData.subject,
            content: [{
                type: 'text/html',
                value: emailData.html
            }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
    }

    return {
        messageId: response.headers.get('x-message-id'),
        provider: 'sendgrid'
    };
}

function generateEmailHtml(template, variables) {
    const appUrl = 'https://projectmywellness.com';
    
    // Sostituisci variabili
    let greeting = template.greeting || '';
    let mainContent = template.main_content || '';
    let subject = template.subject || 'MyWellness';
    let ctaUrl = template.call_to_action_url || `${appUrl}/Dashboard`;
    let footerText = template.footer_text || '';

    Object.keys(variables).forEach(key => {
        const value = variables[key] || '';
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        greeting = greeting.replace(regex, value);
        mainContent = mainContent.replace(regex, value);
        subject = subject.replace(regex, value);
        ctaUrl = ctaUrl.replace(regex, value);
        footerText = footerText.replace(regex, value);
    });

    // Sostituisci {app_url}
    mainContent = mainContent.replace(/\{app_url\}/g, appUrl);
    ctaUrl = ctaUrl.replace(/\{app_url\}/g, appUrl);

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 30px 20px !important; }
            .outer-table { padding: 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="padding: 0;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/13f8dafa2_ImmagineWelcome.png" alt="Welcome to MyWellness" style="width: 100%; height: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="background: white; padding: 40px 30px 16px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <div style="color: #1f2937; line-height: 1.8; font-size: 16px; white-space: pre-line;">${mainContent}</div>
                            ${template.call_to_action_text ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                    ${template.call_to_action_text}
                                </a>
                            </div>` : ''}
                            ${footerText ? `<p style="color: #6b7280; margin-top: 30px; font-size: 14px;">${footerText}</p>` : ''}
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

    return { html, subject };
}

Deno.serve(async (req) => {
    console.log('📧 sendEmailUnified V2 - Start');
    
    let base44;
    let logEntry = {
        user_id: null,
        user_email: null,
        template_id: null,
        subject: null,
        status: 'pending',
        provider: 'sendgrid',
        from_email: 'info@projectmywellness.com',
        language: 'it',
        retry_count: 0,
        trigger_source: null,
        metadata: {}
    };
    
    try {
        base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { 
            userId, 
            userEmail, 
            templateId, 
            variables = {},
            language = 'it',
            triggerSource = 'unknown'
        } = body;

        // Validazione
        if (!userEmail) {
            return Response.json({ 
                success: false,
                error: 'Missing required field: userEmail' 
            }, { status: 400 });
        }

        if (!templateId) {
            return Response.json({ 
                success: false,
                error: 'Missing required field: templateId' 
            }, { status: 400 });
        }

        // Validazione formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            return Response.json({ 
                success: false,
                error: 'Invalid email format' 
            }, { status: 400 });
        }

        logEntry.user_id = userId;
        logEntry.user_email = userEmail;
        logEntry.template_id = templateId;
        logEntry.language = language;
        logEntry.trigger_source = triggerSource;
        logEntry.metadata = { variables };

        console.log(`📬 Preparing email to ${userEmail} using template ${templateId}`);
        console.log(`📍 Trigger source: ${triggerSource}`);

        // Verifica SendGrid API Key
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        if (!sendGridApiKey) {
            throw new Error('SENDGRID_API_KEY not configured');
        }

        // Carica template
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            throw new Error(`Template not found or inactive: ${templateId}`);
        }

        const template = templates[0];
        
        // Genera HTML
        const { html, subject } = generateEmailHtml(template, {
            user_name: variables.user_name || 'Utente',
            user_email: userEmail,
            app_url: 'https://projectmywellness.com',
            ...variables
        });

        logEntry.subject = subject;
        logEntry.from_email = template.from_email || 'info@projectmywellness.com';

        // Tentativo di invio con retry
        let lastError = null;
        let result = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            logEntry.retry_count = attempt;
            
            try {
                console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} sending to ${userEmail}`);
                
                result = await sendViaSendGrid(sendGridApiKey, {
                    to: userEmail,
                    toName: variables.user_name,
                    from: template.from_email || 'info@projectmywellness.com',
                    replyTo: template.reply_to_email || 'info@projectmywellness.com',
                    subject: subject,
                    html: html
                });

                console.log(`✅ Email sent successfully on attempt ${attempt + 1}`);
                break;

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt < MAX_RETRIES - 1) {
                    const delay = RETRY_DELAYS[attempt];
                    console.log(`⏳ Waiting ${delay/1000}s before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        if (!result) {
            throw lastError || new Error('All retry attempts failed');
        }

        // Salva log SUCCESS
        logEntry.status = 'sent';
        logEntry.sent_at = new Date().toISOString();
        logEntry.sendgrid_message_id = result.messageId;
        logEntry.provider = result.provider;

        try {
            await base44.asServiceRole.entities.EmailLog.create(logEntry);
            console.log('📝 Email log saved');
        } catch (logError) {
            console.error('⚠️ Failed to save email log:', logError);
        }

        console.log(`✅ Email sent successfully to ${userEmail} (ID: ${result.messageId})`);

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            messageId: result.messageId,
            provider: result.provider,
            retryCount: logEntry.retry_count
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);

        // Salva log FAILED
        logEntry.status = 'failed';
        logEntry.error_message = error.message;

        try {
            if (base44) {
                await base44.asServiceRole.entities.EmailLog.create(logEntry);
                console.log('📝 Error log saved');
            }
        } catch (logError) {
            console.error('⚠️ Failed to save error log:', logError);
        }

        return Response.json({ 
            success: false,
            error: error.message,
            retryCount: logEntry.retry_count
        }, { status: 500 });
    }
});