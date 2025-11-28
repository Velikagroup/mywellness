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
    console.log('🛒 sendCartCheckoutAbandoned CRON - Start');

    try {
        const base44 = createClientFromRequest(req);

        // Load template from admin
        const template = await loadEmailTemplate(base44, 'cart_checkout_abandoned');

        // Check for test mode - send immediately to specific email
        let body = {};
        try {
            body = await req.json();
        } catch (e) {
            // No body, that's ok for CRON
        }

        const testEmail = body.test_email;
        const forceTest = body.force_test === true;

        if (testEmail && forceTest) {
            console.log(`🧪 TEST MODE: Sending to ${testEmail}`);

            const users = await base44.asServiceRole.entities.User.filter({
                email: testEmail
            });

            if (users.length === 0) {
                return Response.json({ error: `User not found: ${testEmail}` }, { status: 404 });
            }

            const user = users[0];
            const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
            const emailBody = generateCartAbandonedEmail(user, appUrl, template);
            const subject = template?.subject || '🛒 Il tuo carrello ti aspetta! Non perdere l\'offerta';

            await sendEmailViaSendGrid(
                user.email,
                subject,
                emailBody,
                template?.from_email || 'info@projectmywellness.com',
                template?.reply_to_email || 'no-reply@projectmywellness.com'
            );

            return Response.json({ success: true, message: `Test email sent to ${testEmail}` });
        }

        const now = new Date();
                    const thirtyMinutesAgo = new Date(now.getTime() - (30 * 60 * 1000));

                    console.log(`📅 Checking for checkout started more than 30 minutes ago`);

        const activities = await base44.asServiceRole.entities.UserActivity.filter({
            event_type: 'checkout_started',
            completed: false
        });

        const targetActivities = activities.filter(a => {
                        const activityDate = new Date(a.created_date);
                        return activityDate <= thirtyMinutesAgo;
                    });

        console.log(`👥 Found ${targetActivities.length} abandoned checkouts`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        let sentCount = 0;
        const results = [];

        for (const activity of targetActivities) {
            try {
                const users = await base44.asServiceRole.entities.User.filter({
                    email: activity.user_id
                });

                if (users.length === 0) {
                    console.log(`⚠️ User not found for ${activity.user_id}`);
                    continue;
                }

                const user = users[0];

                if (user.subscription_status === 'active') {
                    await base44.asServiceRole.entities.UserActivity.update(activity.id, {
                        completed: true,
                        completed_at: new Date().toISOString()
                    });
                    console.log(`✅ User ${user.email} completed purchase, marked as done`);
                    continue;
                }

                const emailBody = generateCartAbandonedEmail(user, appUrl, template);
                const subject = template?.subject || '🛒 Il tuo carrello ti aspetta! Non perdere l\'offerta';

                await sendEmailViaSendGrid(
                    user.email,
                    subject,
                    emailBody,
                    template?.from_email || 'info@projectmywellness.com',
                    template?.reply_to_email || 'no-reply@projectmywellness.com'
                );

                sentCount++;
                console.log(`✅ Cart abandoned email sent to ${user.email}`);
                
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

        console.log(`🎉 Cart abandoned emails sent: ${sentCount}/${targetActivities.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_activities: targetActivities.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateCartAbandonedEmail(user, appUrl, template) {
    // Default values
    const greeting = template?.greeting || `Ciao ${user.full_name || 'Utente'},`;
    const introText = template?.intro_text || 'Hai fatto il primo passo verso la versione migliore di te stesso... ma poi ti sei fermato.';
    const secondParagraph = template?.second_paragraph || '<strong>Ogni giorno che passa è un giorno in meno verso i tuoi obiettivi.</strong> Mentre leggi questa email, potresti già avere un piano alimentare personalizzato pronto per te, creato dall\'intelligenza artificiale in base al TUO corpo, ai TUOI gusti e ai TUOI obiettivi.';
    
    const showFeatures = template?.show_features_section !== false;
    const featuresTitle = template?.features_section_title || '❌ Ecco cosa ti stai perdendo:';
    const feature1Emoji = template?.feature_1_emoji || '🍽️';
    const feature1Title = template?.feature_1_title || 'Piano Nutrizionale AI';
    const feature1Subtitle = template?.feature_1_subtitle || 'Pasti personalizzati ogni giorno';
    const feature2Emoji = template?.feature_2_emoji || '📊';
    const feature2Title = template?.feature_2_title || 'Dashboard Scientifica';
    const feature2Subtitle = template?.feature_2_subtitle || 'Monitora ogni progresso';
    const feature3Emoji = template?.feature_3_emoji || '📸';
    const feature3Title = template?.feature_3_title || 'Analisi Foto AI';
    const feature3Subtitle = template?.feature_3_subtitle || 'Vedi la trasformazione';
    const feature4Emoji = template?.feature_4_emoji || '🛒';
    const feature4Title = template?.feature_4_title || 'Lista Spesa Smart';
    const feature4Subtitle = template?.feature_4_subtitle || 'Mai più dubbi al supermercato';
    
    const closingText = template?.closing_text || '<strong>Immagina tra 30 giorni:</strong> guardarti allo specchio e vedere finalmente i risultati. Sentirti energico, motivato, orgoglioso di te stesso. Questo può essere il TUO futuro... ma solo se agisci adesso.';
    
    const showUrgency = template?.show_urgency_box !== false;
    const urgencyTitle = template?.urgency_title || '⏰ Il momento è ADESSO';
    const urgencySubtitle = template?.urgency_subtitle || 'Non rimandare a domani quello che può cambiarti la vita oggi.<br>Il tuo piano personalizzato è pronto e ti aspetta.';
    
    const showTrustBadges = template?.show_trust_badges !== false;
    const ctaText = template?.call_to_action_text || '🚀 Riprendi il Tuo Percorso Ora';
    const ctaUrl = template?.call_to_action_url || `${appUrl}/TrialSetup`;
    const footerQuote = template?.footer_quote || '"Il miglior momento per iniziare era ieri. Il secondo miglior momento è adesso."';

    // Build features HTML
    const featuresHtml = showFeatures ? `
                            <h3 style="color: #dc2626; margin: 25px 0 15px 0; font-size: 18px;">${featuresTitle}</h3>
                            
                            <table width="100%" cellpadding="0" cellspacing="6" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature1Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">${feature1Title}</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">${feature1Subtitle}</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature2Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">${feature2Title}</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">${feature2Subtitle}</p>
                                    </td>
                                </tr>
                                <tr><td colspan="3" style="height: 6px;"></td></tr>
                                <tr>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature3Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">${feature3Title}</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">${feature3Subtitle}</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">${feature4Emoji}</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">${feature4Title}</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">${feature4Subtitle}</p>
                                    </td>
                                </tr>
                            </table>
    ` : '';

    // Build urgency box HTML
    const urgencyHtml = showUrgency ? `
                            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                                <p style="color: #dc2626; font-size: 18px; margin: 0; font-weight: bold;">
                                    ${urgencyTitle}
                                </p>
                                <p style="color: #b91c1c; font-size: 14px; margin: 10px 0 0 0; line-height: 1.5;">
                                    ${urgencySubtitle}
                                </p>
                            </div>
    ` : '';

    // Build trust badges HTML
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
                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Utente'},</p>

                            <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 20px 0;">
                                Hai fatto il primo passo verso la versione migliore di te stesso... ma poi ti sei fermato.
                            </p>

                            <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 20px 0;">
                                <strong>Ogni giorno che passa è un giorno in meno verso i tuoi obiettivi.</strong> Mentre leggi questa email, potresti già avere un piano alimentare personalizzato pronto per te, creato dall'intelligenza artificiale in base al TUO corpo, ai TUOI gusti e ai TUOI obiettivi.
                            </p>

                            <!-- Cosa ti stai perdendo -->
                            <h3 style="color: #dc2626; margin: 25px 0 15px 0; font-size: 18px;">❌ Ecco cosa ti stai perdendo:</h3>

                            <table width="100%" cellpadding="0" cellspacing="6" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">🍽️</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">Piano Nutrizionale AI</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">Pasti personalizzati ogni giorno</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">📊</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">Dashboard Scientifica</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">Monitora ogni progresso</p>
                                    </td>
                                </tr>
                                <tr><td colspan="3" style="height: 6px;"></td></tr>
                                <tr>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">📸</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">Analisi Foto AI</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">Vedi la trasformazione</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid #fecaca; vertical-align: top;">
                                        <p style="margin: 0; font-size: 28px;">🛒</p>
                                        <p style="font-size: 13px; font-weight: bold; color: #991b1b; margin: 8px 0 4px 0;">Lista Spesa Smart</p>
                                        <p style="font-size: 11px; color: #b91c1c; margin: 0;">Mai più dubbi al supermercato</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #374151; line-height: 1.7; font-size: 15px; margin: 0 0 25px 0;">
                                <strong>Immagina tra 30 giorni:</strong> guardarti allo specchio e vedere finalmente i risultati. Sentirti energico, motivato, orgoglioso di te stesso. Questo può essere il TUO futuro... ma solo se agisci adesso.
                            </p>

                            <!-- Urgency Box -->
                            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                                <p style="color: #dc2626; font-size: 18px; margin: 0; font-weight: bold;">
                                    ⏰ Il momento è ADESSO
                                </p>
                                <p style="color: #b91c1c; font-size: 14px; margin: 10px 0 0 0; line-height: 1.5;">
                                    Non rimandare a domani quello che può cambiarti la vita oggi.<br>Il tuo piano personalizzato è pronto e ti aspetta.
                                </p>
                            </div>

                            <!-- Trust badges -->
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

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/TrialSetup" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🚀 Riprendi il Tuo Percorso Ora
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; text-align: center; font-size: 13px; margin: 15px 0 0 0; font-style: italic;">
                                "Il miglior momento per iniziare era ieri. Il secondo miglior momento è adesso."
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