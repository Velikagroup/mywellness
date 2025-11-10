import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('📧 sendScheduledBroadcasts CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const cronSecret = Deno.env.get('CRON_SECRET');
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        console.log(`📅 Checking for scheduled broadcasts at ${now.toISOString()}`);

        const scheduledBroadcasts = await base44.asServiceRole.entities.BroadcastEmail.filter({
            status: 'scheduled'
        });

        const dueNow = scheduledBroadcasts.filter(b => {
            const scheduledDate = new Date(b.scheduled_for);
            return scheduledDate <= now;
        });

        console.log(`📬 Found ${dueNow.length} broadcasts ready to send`);

        const results = [];

        for (const broadcast of dueNow) {
            try {
                console.log(`📧 Sending broadcast: ${broadcast.name}`);

                await base44.asServiceRole.entities.BroadcastEmail.update(broadcast.id, {
                    status: 'sending'
                });

                const recipients = await getRecipientsByFilters(base44, broadcast.filters || {});
                
                console.log(`👥 Recipients: ${recipients.length}`);

                let sentCount = 0;
                let errorCount = 0;

                for (const recipient of recipients) {
                    try {
                        const emailBody = generateBroadcastEmail(broadcast, recipient);

                        await base44.asServiceRole.integrations.Core.SendEmail({
                            to: recipient.email,
                            from_name: `MyWellness <${broadcast.from_email}>`,
                            subject: broadcast.subject,
                            body: emailBody
                        });

                        sentCount++;
                        await new Promise(resolve => setTimeout(resolve, 100));

                    } catch (error) {
                        console.error(`❌ Failed to send to ${recipient.email}:`, error.message);
                        errorCount++;
                    }
                }

                await base44.asServiceRole.entities.BroadcastEmail.update(broadcast.id, {
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    sent_count: sentCount,
                    error_count: errorCount,
                    recipients_count: recipients.length
                });

                console.log(`✅ Broadcast ${broadcast.name} completed: ${sentCount}/${recipients.length} sent`);
                
                results.push({
                    broadcast_id: broadcast.id,
                    name: broadcast.name,
                    sent: sentCount,
                    errors: errorCount,
                    total: recipients.length
                });

            } catch (error) {
                console.error(`❌ Error processing broadcast ${broadcast.name}:`, error.message);
                
                await base44.asServiceRole.entities.BroadcastEmail.update(broadcast.id, {
                    status: 'draft'
                });

                results.push({
                    broadcast_id: broadcast.id,
                    name: broadcast.name,
                    error: error.message
                });
            }
        }

        console.log('🎉 Scheduled broadcasts completed');

        return Response.json({
            success: true,
            processed: dueNow.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

async function getRecipientsByFilters(base44, filters) {
    console.log('🔍 Applying filters:', JSON.stringify(filters));
    
    let users = await base44.asServiceRole.entities.User.list();
    
    // Filtra per stato abbonamento
    if (filters.subscription_status && filters.subscription_status.length > 0) {
        users = users.filter(u => filters.subscription_status.includes(u.subscription_status));
        console.log(`📊 After subscription_status filter: ${users.length} users`);
    }
    
    // Filtra per piano abbonamento
    if (filters.subscription_plan && filters.subscription_plan.length > 0) {
        users = users.filter(u => filters.subscription_plan.includes(u.subscription_plan));
        console.log(`📊 After subscription_plan filter: ${users.length} users`);
    }
    
    // Filtra per lingua
    if (filters.languages && filters.languages.length > 0) {
        users = users.filter(u => {
            const userLang = u.language || 'it';
            return filters.languages.includes(userLang);
        });
        console.log(`📊 After languages filter: ${users.length} users`);
    }
    
    // Filtra per inattività
    if (filters.inactive_days && filters.inactive_days > 0) {
        const inactiveSince = new Date();
        inactiveSince.setDate(inactiveSince.getDate() - filters.inactive_days);
        users = users.filter(u => {
            if (!u.last_login_date) return false;
            return new Date(u.last_login_date) < inactiveSince;
        });
        console.log(`📊 After inactive_days filter: ${users.length} users`);
    }
    
    // Filtra per trial scaduti senza conversione
    if (filters.trial_expired_no_conversion === true) {
        users = users.filter(u => {
            if (!u.subscription_period_end) return false;
            const expiryDate = new Date(u.subscription_period_end);
            const didNotPurchase = !u.last_payment_amount || u.last_payment_amount === 0;
            return expiryDate < new Date() && didNotPurchase;
        });
        console.log(`📊 After trial_expired_no_conversion filter: ${users.length} users`);
    }
    
    // Filtra per landing offer acquistato
    if (filters.purchased_landing_offer !== undefined) {
        users = users.filter(u => u.purchased_landing_offer === filters.purchased_landing_offer);
        console.log(`📊 After purchased_landing_offer filter: ${users.length} users`);
    }
    
    // Filtra per quiz abbandonato
    if (filters.quiz_abandoned === true) {
        const quizActivities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'quiz_started',
            completed: false
        });
        const quizEmails = quizActivities.map(a => a.user_id);
        users = users.filter(u => quizEmails.includes(u.email));
        console.log(`📊 After quiz_abandoned filter: ${users.length} users`);
    }
    
    // Filtra per trial setup abbandonato
    if (filters.trial_setup_abandoned === true) {
        const trialActivities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'trial_setup_opened',
            completed: false
        });
        const trialEmails = trialActivities.map(a => a.user_id);
        users = users.filter(u => trialEmails.includes(u.email));
        console.log(`📊 After trial_setup_abandoned filter: ${users.length} users`);
    }
    
    // Filtra per pricing visitato
    if (filters.pricing_visited === true) {
        const pricingActivities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'pricing_visited',
            completed: false
        });
        const pricingEmails = pricingActivities.map(a => a.user_id);
        users = users.filter(u => pricingEmails.includes(u.email));
        console.log(`📊 After pricing_visited filter: ${users.length} users`);
    }
    
    // Filtra per checkout abbandonato
    if (filters.checkout_abandoned === true) {
        const checkoutActivities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'checkout_started',
            completed: false
        });
        const checkoutEmails = checkoutActivities.map(a => a.user_id);
        users = users.filter(u => checkoutEmails.includes(u.email));
        console.log(`📊 After checkout_abandoned filter: ${users.length} users`);
    }
    
    // Filtra per giorni al rinnovo
    if (filters.renewal_days && filters.renewal_days > 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + filters.renewal_days);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        users = users.filter(u => {
            if (!u.subscription_period_end) return false;
            if (!u.cancellation_at_period_end) return false;
            const endDateStr = new Date(u.subscription_period_end).toISOString().split('T')[0];
            return endDateStr === targetDateStr;
        });
        console.log(`📊 After renewal_days filter: ${users.length} users`);
    }
    
    // Filtra per milestone giorni
    if (filters.milestone_days && filters.milestone_days > 0) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - filters.milestone_days);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        users = users.filter(u => {
            if (!u.created_date) return false;
            if (u.subscription_status !== 'active') return false;
            const createdDateStr = new Date(u.created_date).toISOString().split('T')[0];
            return createdDateStr === targetDateStr;
        });
        console.log(`📊 After milestone_days filter: ${users.length} users`);
    }
    
    console.log(`✅ Final recipients count: ${users.length}`);
    return users;
}

function generateBroadcastEmail(broadcast, user) {
    const replaceVars = (text, vars) => {
        let result = text || '';
        Object.keys(vars).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, vars[key]);
        });
        return result;
    };

    const variables = {
        user_name: user.full_name || 'Utente',
        user_email: user.email,
        app_url: Deno.env.get('APP_URL') || 'https://app.mywellness.it'
    };

    const replacedGreeting = replaceVars(broadcast.greeting, variables);
    const replacedMainContent = replaceVars(broadcast.main_content, variables);
    const replacedCtaUrl = replaceVars(broadcast.call_to_action_url || '', variables);

    const ctaHtml = broadcast.call_to_action_text && broadcast.call_to_action_url ? 
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
            <tr>
                <td align="center">
                    <a href="${replacedCtaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                        ${broadcast.call_to_action_text}
                    </a>
                </td>
            </tr>
        </table>` : '';

    return `<!DOCTYPE html>
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
<td class="logo-cell">
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
</td>
</tr>
<tr>
<td class="content-cell">
<p style="color: #111827; font-size: 16px;">${replacedGreeting}</p>
<div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${replacedMainContent}</div>
${ctaHtml}
${broadcast.footer_text ? `<p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px; font-style: italic;">${broadcast.footer_text}</p>` : ''}
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
}