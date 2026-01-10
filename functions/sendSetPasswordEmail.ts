import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🔍 DEBUG
        console.log('🔍 User SSO provider:', user.sso_provider);
        console.log('🔍 User has password_hash:', !!user.password_hash);

        // ✅ Se l'utente ha già una password, non serve impostarne una nuova
        if (user.password_hash) {
            return Response.json({ 
                error: 'You already have a password set. Use the change password form instead.' 
            }, { status: 400 });
        }

        // Genera token reset password (usa l'endpoint esistente di Base44)
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

        // Salva il token nel database (usando campo custom su User)
        await base44.asServiceRole.entities.User.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: expiresAt.toISOString()
        });

        const resetUrl = `https://projectmywellness.com/reset-password?token=${resetToken}&setup=true`;

        // Determina lingua utente
        const userLanguage = user.preferred_language || user.language || 'it';
        const templateId = `set_password_${userLanguage}`;

        // Carica template email nella lingua dell'utente
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });

        let emailHtml;
        let subject;

        if (templates.length > 0) {
            const template = templates[0];
            subject = template.subject || 'Imposta la tua password - MyWellness';
            
            // Replace variables
            const userName = user.full_name || 'Utente';
            let mainContent = template.main_content || '';
            mainContent = mainContent.replace(/{user_name}/g, userName);
            mainContent = mainContent.replace(/{reset_url}/g, resetUrl);
            
            const ctaUrl = template.call_to_action_url?.replace(/{reset_url}/g, resetUrl) || resetUrl;
            const ctaText = template.call_to_action_text || '🔐 Imposta Password';
            
            emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
.logo-cell { padding: 60px 30px 10px 30px; }
.content-cell { padding: 15px 30px 60px 30px; }
@media only screen and (min-width: 600px) {
.logo-cell { padding: 60px 60px 10px 60px !important; }
.content-cell { padding: 15px 60px 60px 60px !important; }
}
@media only screen and (max-width: 600px) {
.container { width: 100% !important; border-radius: 0 !important; }
.outer-wrapper { padding: 0 !important; }
}
</style>
</head>
<body style="margin: 0; padding: 0;">
${template.preview_text ? `<div style="display:none;max-height:0px;overflow:hidden;">${template.preview_text}</div>` : ''}
<table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
<tr>
<td align="center">
<table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
<tr>
<td class="logo-cell">
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 30px; width: auto; display: block;">
</td>
</tr>
<tr>
<td class="content-cell">
<div style="color: #374151; font-size: 16px; line-height: 1.5;">${mainContent}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
<tr>
<td align="center">
<a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
${ctaText}
</a>
</td>
</tr>
</table>
${template.footer_text ? `<p style="color: #9ca3af; text-align: center; font-size: 13px; margin: 20px 0 0 0; font-style: italic;">${template.footer_text}</p>` : ''}
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
</html>`;
        } else {
            // Fallback default (italiano)
            subject = 'Imposta la tua password - MyWellness';
            emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
</style>
</head>
<body style="margin: 0; padding: 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
<tr>
<td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
<tr>
<td style="padding: 60px 30px 10px 30px;">
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 30px;">
</td>
</tr>
<tr>
<td style="padding: 15px 30px 60px 30px;">
<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>
<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
Hai richiesto di impostare una password per il tuo account MyWellness. In questo modo potrai accedere anche con email e password, oltre che con Google.
</p>
<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
Questo è particolarmente utile per l'app iOS, dove potrai scegliere il metodo di accesso che preferisci.
</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
<tr>
<td align="center">
<a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
🔐 Imposta Password
</a>
</td>
</tr>
</table>
<p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
Il link è valido per 24 ore. Se non hai richiesto questa operazione, ignora questa email.
</p>
</td>
</tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px;">
<tr>
<td align="center" style="padding: 20px; color: #999999;">
<p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
<p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
        }

        // Invia email
        const sgApiKey = Deno.env.get('SENDGRID_API_KEY');
        const fromEmail = 'info@projectmywellness.com';

        const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sgApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: user.email, name: user.full_name || '' }],
                    subject: subject
                }],
                from: {
                    email: fromEmail,
                    name: 'MyWellness'
                },
                reply_to: {
                    email: 'no-reply@projectmywellness.com'
                },
                content: [{
                    type: 'text/html',
                    value: emailHtml
                }]
            })
        });

        if (!sendGridResponse.ok) {
            const errorText = await sendGridResponse.text();
            console.error('SendGrid error:', errorText);
            return Response.json({ 
                error: 'Failed to send email',
                details: errorText
            }, { status: 500 });
        }

        // Log email
        await base44.asServiceRole.entities.EmailLog.create({
            user_id: user.id,
            user_email: user.email,
            template_id: templateId,
            language: userLanguage,
            subject: subject,
            status: 'sent',
            provider: 'sendgrid',
            sent_at: new Date().toISOString()
        });

        return Response.json({ 
            success: true,
            message: 'Password setup email sent successfully'
        });

    } catch (error) {
        console.error('Error in sendSetPasswordEmail:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});