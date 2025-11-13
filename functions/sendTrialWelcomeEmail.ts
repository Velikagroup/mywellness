import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialWelcomeEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Recupera i dati utente
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        const user = users && users.length > 0 ? users[0] : null;
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`📬 Sending trial welcome email to ${user.email}`);

        // Carica il template dal database
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: 'standard_subscription_welcome',
            is_active: true 
        });
        
        if (templates.length === 0) {
            console.error('❌ Template not found: standard_subscription_welcome');
            return Response.json({ error: 'Email template not found' }, { status: 404 });
        }

        const template = templates[0];
        const appUrl = 'https://app.projectmywellness.com';

        // Sostituisci le variabili nel template
        const greeting = template.greeting.replace('{user_name}', user.full_name || 'Utente');
        const mainContent = template.main_content.replace('{app_url}', appUrl);
        const ctaUrl = template.call_to_action_url.replace('{app_url}', appUrl);

        // Genera HTML email usando il template
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
                        <td style="background: white; padding: 40px 30px 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">${template.subject}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <div style="margin-bottom: 30px;">
                                <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">${greeting}</h2>
                                <p style="margin: 0; color: #1a5753; line-height: 1.8; white-space: pre-line;">
                                    ${mainContent}
                                </p>
                            </div>

                            <div style="text-align: center; margin: 30px 0 10px 0;">
                                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                    ${template.call_to_action_text}
                                </a>
                            </div>

                            <div style="margin-top: 30px;">
                                <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                                    ${template.footer_text}
                                </p>
                            </div>

                            <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
                                <p style="margin: 0 0 10px 0;"><strong style="color: #111827;">MyWellness</strong></p>
                                <p style="margin: 0; font-size: 12px;">
                                    <a href="${appUrl}/Privacy" style="color: #26847F; text-decoration: none;">Privacy Policy</a> &middot; 
                                    <a href="${appUrl}/Terms" style="color: #26847F; text-decoration: none;">Termini di Servizio</a>
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
</body>
</html>
        `;

        // Usa SendGrid per inviare l'email
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        
        if (!sendGridApiKey) {
            console.error('❌ SENDGRID_API_KEY not configured');
            return Response.json({ error: 'Email service not configured' }, { status: 500 });
        }

        const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendGridApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: user.email, name: user.full_name }]
                }],
                from: {
                    email: template.from_email,
                    name: 'MyWellness'
                },
                reply_to: {
                    email: template.reply_to_email
                },
                subject: template.subject,
                content: [{
                    type: 'text/html',
                    value: emailHtml
                }]
            })
        });

        if (!sendGridResponse.ok) {
            const errorText = await sendGridResponse.text();
            console.error('❌ SendGrid error:', errorText);
            return Response.json({ 
                error: 'Failed to send email',
                details: errorText 
            }, { status: 500 });
        }

        console.log('✅ Trial welcome email sent successfully via SendGrid');

        return Response.json({ 
            success: true,
            message: 'Trial welcome email sent'
        });

    } catch (error) {
        console.error('❌ Error sending trial welcome email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});