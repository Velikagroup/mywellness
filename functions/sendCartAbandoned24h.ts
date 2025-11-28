import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

async function sendEmailViaSendGrid(to, subject, htmlBody, fromEmail, replyToEmail) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: fromEmail || 'info@projectmywellness.com', name: 'MyWellness' },
            reply_to: { email: replyToEmail || 'no-reply@projectmywellness.com', name: 'MyWellness' },
            subject: subject,
            content: [{ type: 'text/html', value: htmlBody }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
    }

    return true;
}

async function loadEmailTemplate(base44, templateId) {
    try {
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
            template_id: templateId,
            is_active: true
        });
        return templates.length > 0 ? templates[0] : null;
    } catch (error) {
        console.error('Error loading template:', error);
        return null;
    }
}

Deno.serve(async (req) => {
    console.log('🛒 sendCartAbandoned24h CRON - Start');

    try {
        const base44 = createClientFromRequest(req);

        // Load template from admin
        const template = await loadEmailTemplate(base44, 'cart_abandoned_24h');

        const now = new Date();
        // Between 24h and 48h ago
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

        console.log(`📅 Checking for checkout started between 24h and 48h ago`);

        // Get activities that received the first email (completed=true) but not the 24h email
        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'checkout_started'
        });

        // Filter activities in the 24-48h window
        const targetActivities = activities.filter(a => {
            const activityDate = new Date(a.created_date);
            return activityDate <= twentyFourHoursAgo && activityDate >= fortyEightHoursAgo && !a.email_24h_sent;
        });

        // Group by user_id
        const userActivitiesMap = new Map();
        for (const activity of targetActivities) {
            const existing = userActivitiesMap.get(activity.user_id);
            if (!existing || new Date(activity.created_date) > new Date(existing.created_date)) {
                userActivitiesMap.set(activity.user_id, activity);
            }
        }

        const uniqueActivities = Array.from(userActivitiesMap.values());
        console.log(`👥 Unique users to process: ${uniqueActivities.length}`);

        const appUrl = Deno.env.get('APP_URL') || 'https://projectmywellness.com';

        let sentCount = 0;
        const results = [];

        for (const activity of uniqueActivities) {
            try {
                const users = await base44.asServiceRole.entities.User.filter({
                    email: activity.user_id
                });

                if (users.length === 0) {
                    console.log(`⚠️ User not found for ${activity.user_id}`);
                    continue;
                }

                const user = users[0];

                // Check if user has already purchased
                const hasPurchased = user.subscription_status === 'active' || 
                                     user.subscription_status === 'trialing' ||
                                     (user.subscription_plan && user.subscription_plan !== 'standard' && user.subscription_plan !== 'trial');

                if (hasPurchased) {
                    console.log(`✅ User ${user.email} already purchased, skipping`);
                    continue;
                }

                const emailBody = generateEmail(user, appUrl, template);
                const subject = template?.subject || '⏰ Ti restano solo poche ore... Non perdere questa opportunità!';

                await sendEmailViaSendGrid(
                    user.email,
                    subject,
                    emailBody,
                    template?.from_email || 'info@projectmywellness.com',
                    template?.reply_to_email || 'no-reply@projectmywellness.com'
                );

                // Mark 24h email as sent
                await base44.asServiceRole.entities.UserActivity.update(activity.id, {
                    email_24h_sent: true
                });

                sentCount++;
                console.log(`✅ 24h abandoned email sent to ${user.email}`);

                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent'
                });

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`❌ Failed to send to ${activity.user_id}:`, error.message);
                results.push({
                    user_id: activity.user_id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 24h abandoned emails sent: ${sentCount}/${uniqueActivities.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_activities: uniqueActivities.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateEmail(user, appUrl, template) {
    const greeting = template?.greeting || `Ciao ${user.full_name || 'Utente'},`;
    const introText = template?.intro_text || 'Sono passate 24 ore da quando hai iniziato il tuo percorso con MyWellness...';
    const secondParagraph = template?.second_paragraph || 'In queste 24 ore, <strong>centinaia di persone</strong> hanno già iniziato a trasformare il loro corpo e la loro vita. E tu? Sei ancora qui a pensarci.';

    const showFeatures = template?.show_features_section !== false;
    const featuresTitle = template?.features_section_title || '🔥 Cosa sta succedendo mentre aspetti:';
    const feature1Emoji = template?.feature_1_emoji || '⏳';
    const feature1Title = template?.feature_1_title || 'Il tempo passa';
    const feature1Subtitle = template?.feature_1_subtitle || 'Ogni giorno conta per i tuoi obiettivi';
    const feature2Emoji = template?.feature_2_emoji || '💪';
    const feature2Title = template?.feature_2_title || 'Altri stanno agendo';
    const feature2Subtitle = template?.feature_2_subtitle || 'Mentre tu aspetti, loro trasformano';
    const feature3Emoji = template?.feature_3_emoji || '🎯';
    const feature3Title = template?.feature_3_title || 'I tuoi obiettivi';
    const feature3Subtitle = template?.feature_3_subtitle || 'Sono ancora lì ad aspettarti';
    const feature4Emoji = template?.feature_4_emoji || '🚀';
    const feature4Title = template?.feature_4_title || 'Il piano è pronto';
    const feature4Subtitle = template?.feature_4_subtitle || 'Creato su misura per te';

    const closingText = template?.closing_text || '<strong>Non lasciare che la procrastinazione vinca.</strong> Il momento perfetto non esiste, ma il momento giusto è ADESSO.';

    const showUrgency = template?.show_urgency_box !== false;
    const urgencyTitle = template?.urgency_title || '💡 Un piccolo passo oggi = Grandi risultati domani';
    const urgencySubtitle = template?.urgency_subtitle || 'Le persone di successo non aspettano il momento perfetto.<br>Lo creano.';

    const showTrustBadges = template?.show_trust_badges !== false;
    const ctaText = template?.call_to_action_text || '🔥 Inizia Adesso - Non Rimandare';
    const ctaUrl = template?.call_to_action_url || `${appUrl}/TrialSetup`;
    const footerQuote = template?.footer_quote || '"Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno."';

    const featuresHtml = showFeatures ? `
                            <h3 style="color: #f59e0b; margin: 25px 0 15px 0; font-size: 18px;">${featuresTitle}</h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="6" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td width="48%" style="background: #fffbeb; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fcd34d; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature1Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #92400e; margin: 8px 0 4px 0;">${feature1Title}</p>
                                        <p style="font-size: 11px; color: #b45309; margin: 0;">${feature1Subtitle}</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fffbeb; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fcd34d; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature2Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #92400e; margin: 8px 0 4px 0;">${feature2Title}</p>
                                        <p style="font-size: 11px; color: #b45309; margin: 0;">${feature2Subtitle}</p>
                                    </td>
                                </tr>
                                <tr><td colspan="3" style="height: 6px;"></td></tr>
                                <tr>
                                    <td width="48%" style="background: #fffbeb; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fcd34d; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature3Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #92400e; margin: 8px 0 4px 0;">${feature3Title}</p>
                                        <p style="font-size: 11px; color: #b45309; margin: 0;">${feature3Subtitle}</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fffbeb; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fcd34d; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature4Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #92400e; margin: 8px 0 4px 0;">${feature4Title}</p>
                                        <p style="font-size: 11px; color: #b45309; margin: 0;">${feature4Subtitle}</p>
                                    </td>
                                </tr>
                            </table>
    ` : '';

    const urgencyHtml = showUrgency ? `
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                                <p style="color: #92400e; font-size: 18px; margin: 0; font-weight: bold;">
                                    ${urgencyTitle}
                                </p>
                                <p style="color: #b45309; font-size: 14px; margin: 10px 0 0 0; line-height: 1.5;">
                                    ${urgencySubtitle}
                                </p>
                            </div>
    ` : '';

    const trustBadgesHtml = showTrustBadges ? `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="15" border="0">
                                            <tr>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">🔒</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Pagamento<br>Sicuro</p>
                                                </td>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">✅</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Garanzia<br>100%</p>
                                                </td>
                                                <td style="text-align: center;">
                                                    <p style="font-size: 20px; margin: 0;">🚀</p>
                                                    <p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">Attivazione<br>Istantanea</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
    ` : '';

    return `
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
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">${greeting.replace('{user_name}', user.full_name || 'Utente')}</p>

                            <p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 20px 0;">
                                ${introText}
                            </p>

                            <p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 20px 0;">
                                ${secondParagraph}
                            </p>

                            ${featuresHtml}

                            <p style="color: #374151; line-height: 1.7; font-size: 16px; margin: 0 0 25px 0;">
                                ${closingText}
                            </p>

                            ${urgencyHtml}

                            ${trustBadgesHtml}

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl.replace('{app_url}', appUrl)}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 13px; margin: 15px 0 0 0; font-style: italic;">
                                ${footerQuote}
                            </p>
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
</html>
    `;
}