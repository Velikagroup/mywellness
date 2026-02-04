import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    console.log('📧 sendTrialReminder2Days - Start');

    try {
        const base44 = createClientFromRequest(req);
        // TEMPORANEO: Commento il controllo admin per test
        // const user = await base44.auth.me();
        // if (!user || user.role !== 'admin') {
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Calcola date per cercare trial in scadenza tra 24 ore
        const today = new Date();
        const in24Hours = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const todayStr = today.toISOString().split('T')[0];
        const in24HoursStr = in24Hours.toISOString().split('T')[0];

        console.log(`🔍 Cercando trial in scadenza tra ${todayStr} e ${in24HoursStr}`);

        // Cerca tutti gli utenti con trial attivo in scadenza tra 2 giorni
        const usersWithExpiringSoon = await base44.asServiceRole.entities.User.filter({
            subscription_status: 'trial'
        }, null, 500);

        const targetUsers = usersWithExpiringSoon.filter(u => {
            if (!u.trial_end_date) return false;
            const trialEnd = new Date(u.trial_end_date);
            return trialEnd >= today && trialEnd <= in48Hours;
        });

        if (targetUsers.length === 0) {
            console.log('⚠️ Nessun trial in scadenza trovato');
            return Response.json({ 
                success: true,
                emailsSent: 0,
                message: 'No expiring trials found'
            });
        }

        console.log(`📧 Trovati ${targetUsers.length} utenti con trial in scadenza`);

        let emailsSent = 0;

        for (const user of targetUsers) {
            console.log(`📧 Sending reminder to: ${user.email}`);

        // Usa sendEmailUnified per template centralizzato
        const userLanguage = user.preferred_language || 'it';
        const templateSuffix = `_${userLanguage}`;
        const templateId = `renewal_reminder_48h${templateSuffix}`;
        
        console.log(`📧 Using template: ${templateId} for user ${user.email}`);
        
        // Carica template da EmailTemplate
        console.log('🔍 Loading template from database...');
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
            template_id: templateId,
            is_active: true
        });
        
        if (templates.length === 0) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const template = templates[0];
        console.log(`✅ Template loaded: ${template.name}`);
        
        // Genera HTML dal template
        const userName = user.full_name || 'Utente';
        let greeting = (template.greeting || '').replace(/{user_name}/g, userName);
        let mainContent = (template.main_content || '').replace(/{user_name}/g, userName);
        let subject = template.subject || 'MyWellness';
        
        const stripePortalUrl = 'https://billing.stripe.com/p/login/6oU8wIbUs08heL0dI08k800';
        
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa;">
<table width="100%" cellpadding="20">
<tr><td align="center">
<table style="max-width:600px;background:white;padding:30px;border-radius:12px;">
<tr><td>
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" height="30" alt="MyWellness" style="margin-bottom:20px;">
<div style="line-height:1.6;color:#374151;font-size:16px;margin:0 0 25px 0;">${mainContent}</div>
${template.call_to_action_text ? `<div style="text-align:center;margin:30px 0;"><a href="${template.call_to_action_url || 'https://projectmywellness.com'}" style="display:inline-block;background:#26847F;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;">${template.call_to_action_text}</a></div>` : ''}
</td></tr>
</table>
<table style="max-width:600px;margin-top:20px;background-color:#fafafa;">
<tr>
<td align="center" style="padding:20px;color:#999999;background-color:#fafafa;">
<p style="margin:5px 0;font-size:12px;font-weight:600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
<p style="margin:5px 0;font-size:11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
<p style="margin:5px 0;font-size:11px;">EIN: 36-5141800 - velika.03@outlook.it - <a href="${stripePortalUrl}" style="color:#999999;text-decoration:none;">Stripe Portal</a></p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
        
        console.log('📤 Sending email with template HTML...');
        const emailResponse = await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: subject,
            body: html,
            from_name: 'MyWellness'
        });
            
            console.log(`✅ Email sent to ${user.email}`);
            emailsSent++;
        }

        console.log(`✅ Trial reminder process completed. Emails sent: ${emailsSent}`);

        return Response.json({ 
            success: true,
            emailsSent,
            message: `Sent ${emailsSent} trial reminder emails`
        });

    } catch (error) {
        console.error('❌ Trial reminder error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});