import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 INVIA EMAIL TRAMITE RESEND API
 * Usa l'API diretta di Resend.com invece di Base44 Core
 */

Deno.serve(async (req) => {
    console.log('📧 sendResendEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        const { 
            to,
            templateId,
            resendTemplateId,
            variables = {},
            language = 'it',
            subject
        } = body;

        if (!to) {
            return Response.json({ 
                success: false, 
                error: 'Missing "to" email' 
            }, { status: 400 });
        }

        console.log(`📧 Sending email to ${to} via Resend API`);

        const fromEmail = 'info@notifications.projectmywellness.com';

        // Chiama API Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }
        
        console.log('📤 Calling Resend API...');
        
        let emailPayload;
        
        if (resendTemplateId) {
            // Usa template diretto da Resend
            console.log(`📋 Using Resend template: ${resendTemplateId}`);
            emailPayload = {
                from: `MyWellness <${fromEmail}>`,
                to: [to],
                template_id: resendTemplateId,
                template_data: variables
            };
        } else if (templateId) {
            // Genera HTML da database template
            console.log(`📋 Template: ${templateId}`);
            const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
                template_id: templateId,
                is_active: true 
            });
            
            if (templates.length === 0) {
                throw new Error(`Template not found or inactive: ${templateId}`);
            }

            const template = templates[0];
            const appUrl = 'https://projectmywellness.com';
            const userName = variables.user_name || 'Utente';
            
            let greeting = (template.greeting || '').replace(/{user_name}/g, userName);
            let mainContent = (template.main_content || '').replace(/{user_name}/g, userName);
            let emailSubject = (template.subject || 'MyWellness').replace(/{user_name}/g, userName);
            let ctaText = template.call_to_action_text || 'Vai alla Dashboard';
            let ctaUrl = (template.call_to_action_url || `${appUrl}/Dashboard`)
                .replace(/{app_url}/g, appUrl);
            
            Object.keys(variables).forEach(key => {
                const value = variables[key] || '';
                const regex = new RegExp(`\\{${key}\\}`, 'g');
                greeting = greeting.replace(regex, value);
                mainContent = mainContent.replace(regex, value);
                emailSubject = emailSubject.replace(regex, value);
                ctaUrl = ctaUrl.replace(regex, value);
            });

            const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 40px 20px 20px 20px; }
        .content-cell { padding: 20px; }
        .content-cell p { margin: 0 0 16px 0; line-height: 1.7; }
        .logo-img { height: 32px; width: auto; display: block; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; }
        @media only screen and (min-width: 600px) {
            .logo-cell { padding: 60px 60px 24px 60px !important; }
            .content-cell { padding: 24px 60px 60px 60px !important; }
        }
    </style>
</head>
<body>
    ${template.preview_text ? `<div style="display:none;">${template.preview_text}</div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" class="logo-img">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            ${greeting ? `<p style="color: #111827; font-size: 16px; margin: 0 0 24px 0;">${greeting}</p>` : ''}
                            <div style="color: #374151; line-height: 1.7; font-size: 16px;">${mainContent}</div>
                            ${ctaText ? `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 16px 0;">
                               <tr>
                                   <td align="center">
                                       <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
                                   </td>
                               </tr>
                            </table>` : ''}
                        </td>
                    </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px;">© VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

            emailPayload = {
                from: `MyWellness <${fromEmail}>`,
                to: [to],
                subject: emailSubject,
                html: html
            };
        } else {
            throw new Error('Either templateId or resendTemplateId is required');
        }
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error('❌ Resend API error:', result);
            throw new Error(`Resend API failed: ${result.message || 'Unknown error'}`);
        }

        console.log('✅ Email sent via Resend:', result.id);

        // Salva log
        try {
            await base44.asServiceRole.entities.EmailLog.create({
                user_email: to,
                template_id: resendTemplateId || templateId || 'unknown',
                subject: subject || emailPayload?.subject || 'N/A',
                status: 'sent',
                provider: 'resend',
                message_id: result.id,
                from_email: fromEmail,
                language: language,
                sent_at: new Date().toISOString(),
                trigger_source: 'sendResendEmail'
            });
        } catch (logError) {
            console.warn('⚠️ Failed to save email log:', logError);
        }

        return Response.json({ 
            success: true,
            message: 'Email sent via Resend',
            messageId: result.id
        });

    } catch (error) {
        console.error('❌ Error sending email via Resend:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});