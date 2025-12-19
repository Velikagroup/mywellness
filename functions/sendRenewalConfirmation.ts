import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('✅ sendRenewalConfirmation - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId, transactionId, amount } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        // Rileva lingua utente
        const userLanguage = user.preferred_language || 'it';
        console.log(`🌍 User language: ${userLanguage}`);

        console.log(`📬 Sending renewal confirmation to ${user.email}`);

        // Carica template localizzato
        // Usa sendEmailUnified
        await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: user.email,
            templateId: 'renewal_confirmation',
            variables: {
                user_name: user.full_name || 'Utente',
                plan_name: user.subscription_plan || 'Premium',
                amount: amount || user.subscription_amount || '€0.00',
                next_billing_date: nextRenewalDate
            },
            language: userLanguage,
            triggerSource: 'sendRenewalConfirmation'
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

/*
OLD HARDCODED VERSION:
        const templateId = `renewal_confirmation_${userLanguage}`;
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        
        const localeMap = {
            'it': 'it-IT',
            'en': 'en-US',
            'es': 'es-ES',
            'pt': 'pt-PT',
            'de': 'de-DE',
            'fr': 'fr-FR'
        };
        
        const nextRenewalDate = user.subscription_period_end 
            ? new Date(user.subscription_period_end).toLocaleDateString(localeMap[userLanguage] || 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
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

        // Usa template localizzato se disponibile
        const templateId = `renewal_confirmation_${userLanguage}`;
        
        let emailBody;
        let emailSubject;

        if (templates.length > 0) {
            // Usa template localizzato
            const template = templates[0];
            const planNames = {
                'it': { base: 'Base', pro: 'Pro', premium: 'Premium' },
                'en': { base: 'Base', pro: 'Pro', premium: 'Premium' },
                'es': { base: 'Base', pro: 'Pro', premium: 'Premium' },
                'pt': { base: 'Base', pro: 'Pro', premium: 'Premium' },
                'de': { base: 'Basis', pro: 'Pro', premium: 'Premium' },
                'fr': { base: 'Base', pro: 'Pro', premium: 'Premium' }
            };
            
            const planName = planNames[userLanguage]?.[user.subscription_plan] || user.subscription_plan;
            
            // Sostituisci variabili nel template
            let content = template.main_content || '';
            content = content.replace(/\{plan_name\}/g, planName);
            content = content.replace(/\{amount\}/g, amount ? `€${parseFloat(amount).toFixed(2)}` : (user.subscription_amount || '€0.00'));
            content = content.replace(/\{next_billing_date\}/g, nextRenewalDate);
            content = content.replace(/\{user_name\}/g, user.full_name || 'Utente');
            
            let ctaUrl = (template.call_to_action_url || '{app_url}/Dashboard').replace(/\{app_url\}/g, Deno.env.get('APP_URL') || 'https://projectmywellness.com');
            
            emailSubject = (template.subject || 'Abbonamento Rinnovato').replace(/\{plan_name\}/g, planName);
            
            emailBody = `<!DOCTYPE html>
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
                            <div style="color: #374151; line-height: 1.8; font-size: 16px; white-space: pre-line;">${content}</div>
                            ${template.call_to_action_text ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                    ${template.call_to_action_text}
                                </a>
                            </div>` : ''}
                            ${template.footer_text ? `<p style="color: #6b7280; margin-top: 30px; font-size: 14px;">${template.footer_text}</p>` : ''}
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

        } else {
            // Fallback: usa HTML hardcoded se template non trovato
            console.warn(`⚠️ Template ${templateId} not found, using fallback`);
            emailSubject = `✅ Abbonamento MyWellness Rinnovato${invoiceNumber ? ` - Fattura ${invoiceNumber}` : ''}`;
            emailBody = `<!DOCTYPE html>
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
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">✅ Subscription Renewed</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">Hi ${user.full_name || 'User'}!</h2>
                            <p style="margin: 0; color: #1a5753; line-height: 1.6;">Your MyWellness subscription has been renewed successfully! 🎉</p>
                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                                <h2 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">✨ Active Subscription</h2>
                                <p style="margin: 0; font-size: 16px; color: #111827;">Plan: <strong>${user.subscription_plan}</strong></p>
                                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Next renewal: ${nextRenewalDate}</p>
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
    ${invoiceHTML ? `<div style="margin-top: 40px; page-break-before: always;">${invoiceHTML}</div>` : ''}
</body>
</html>`;
        }

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness <${fromEmail}>`,
            subject: emailSubject,
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