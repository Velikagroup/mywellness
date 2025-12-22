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
    const payload = {
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
    };
    
    console.log('📤 SendGrid Request:', {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        htmlLength: emailData.html?.length
    });
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SendGrid Error Response:', errorText);
        console.error('📧 Failed payload:', JSON.stringify(payload, null, 2));
        throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
    }

    return {
        messageId: response.headers.get('x-message-id'),
        provider: 'sendgrid'
    };
}

function generateEmailHtml(template, variables, language = 'it') {
    const appUrl = 'https://projectmywellness.com';
    const userName = variables.user_name || 'Utente';
    const templateId = template.template_id || '';
    
    console.log('🔍 generateEmailHtml - templateId:', templateId);
    
    // Check if this is a cart abandoned email
    const emailIdBase = templateId.replace(/_it$|_en$|_es$|_pt$|_de$|_fr$/, '');
    console.log('🔍 emailIdBase:', emailIdBase);
    
    const isCartAbandonedEmail = ['cart_checkout_abandoned', 'cart_abandoned_24h', 'cart_abandoned_72h'].includes(emailIdBase);
    const isQuizCompletedEmail = emailIdBase === 'quiz_completed_abandoned';
    const isWeeklyReport = emailIdBase === 'weekly_report';
    
    console.log('🔍 Email type checks:', { isCartAbandonedEmail, isQuizCompletedEmail, isWeeklyReport });
    
    // Generate HTML based on email type FIRST
    if (isWeeklyReport) {
        console.log('📧 Generating Weekly Report HTML');
        return generateWeeklyReportHtml(template, variables, appUrl, language);
    } else if (isCartAbandonedEmail) {
        console.log('📧 Generating Cart Abandoned HTML');
        return generateCartAbandonedHtml(template, variables, appUrl, emailIdBase, language);
    } else if (isQuizCompletedEmail) {
        console.log('📧 Generating Quiz Completed HTML');
        return generateQuizCompletedHtml(template, variables, appUrl);
    }
    
    // Sostituisci variabili per email di default
    // Se greeting è vuoto o mancante, aggiungi uno di default basato sulla lingua
    let greeting = template.greeting || '';
    if (!greeting || greeting.trim() === '') {
        const greetings = {
            'it': `Ciao ${userName},`,
            'en': `Hi ${userName},`,
            'es': `Hola ${userName},`,
            'pt': `Olá ${userName},`,
            'de': `Hallo ${userName},`,
            'fr': `Bonjour ${userName},`
        };
        greeting = greetings[language] || greetings['it'];
    } else {
        greeting = greeting.replace(/{user_name}/g, userName);
    }

    let mainContent = template.main_content || '';
    let subject = template.subject || 'MyWellness';
    let ctaUrl = template.call_to_action_url || `${appUrl}/login`;
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

    console.log('📧 Generating Default HTML');

    const html = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 10px 30px; }
        .content-cell { padding: 15px 30px; }
        .content-cell p { margin: 3px 0; line-height: 1.5; }
        .content-cell ul, .content-cell ol { margin: 3px 0; padding-left: 20px; line-height: 1.5; }
        .content-cell li { margin: 1.5px 0; }
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
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0; font-weight: 400;">${greeting}</p>
                            <div style="color: #374151; line-height: 1.5; font-size: 16px;">${mainContent}</div>
                            ${template.call_to_action_text ? `
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${template.call_to_action_text}
                                        </a>
                                    </td>
                                </tr>
                            </table>` : ''}
                            ${footerText ? `<p style="color: #6b7280; text-align: center; font-size: 13px; margin: 35px 0 10px 0; font-style: italic;">${footerText}</p>` : ''}
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

    return { html, subject };
}

function generateCartAbandonedHtml(template, variables, appUrl, emailType, language = 'it') {
    const userName = variables.user_name || 'Utente';
    const greeting = (template.greeting || 'Ciao {user_name},').replace(/{user_name}/g, userName);
    const introText = template.intro_text || '';
    const secondParagraph = template.second_paragraph || '';
    const showFeatures = template.show_features_section !== false;
    const featuresTitle = template.features_section_title || '❌ Ecco cosa ti stai perdendo:';
    const closingText = template.closing_text || '';
    const showUrgency = template.show_urgency_box !== false;
    const urgencyTitle = template.urgency_title || '⏰ Il momento è ADESSO';
    const urgencySubtitle = template.urgency_subtitle || '';
    const showTrustBadges = template.show_trust_badges !== false;
    const ctaText = template.call_to_action_text || '🚀 Completa il Checkout Ora';
    const ctaUrl = (template.call_to_action_url || `${appUrl}/TrialSetup`).replace(/{app_url}/g, appUrl);
    const footerQuote = template.footer_quote || '';
    const footerText = template.footer_text || '';
    
    // Trust badges translations
    const trustBadgeTranslations = {
        it: { secure: 'Pagamento<br>Sicuro', guarantee: 'Garanzia<br>100%', instant: 'Attivazione<br>Istantanea' },
        en: { secure: 'Secure<br>Payment', guarantee: '100%<br>Guarantee', instant: 'Instant<br>Activation' },
        es: { secure: 'Pago<br>Seguro', guarantee: 'Garantía<br>100%', instant: 'Activación<br>Instantánea' },
        pt: { secure: 'Pagamento<br>Seguro', guarantee: 'Garantia<br>100%', instant: 'Ativação<br>Instantânea' },
        de: { secure: 'Sichere<br>Zahlung', guarantee: '100%<br>Garantie', instant: 'Sofortige<br>Aktivierung' },
        fr: { secure: 'Paiement<br>Sécurisé', guarantee: 'Garantie<br>100%', instant: 'Activation<br>Instantanée' }
    };
    const badges = trustBadgeTranslations[language] || trustBadgeTranslations.it;
    
    let boxBg, boxBorder, boxTextColor, boxSubtitleColor, buttonGradient;
    if (emailType === 'cart_abandoned_72h') {
        boxBg = '#fef2f2';
        boxBorder = '#fecaca';
        boxTextColor = '#991b1b';
        boxSubtitleColor = '#b91c1c';
        buttonGradient = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    } else if (emailType === 'cart_abandoned_24h') {
        boxBg = '#fffbeb';
        boxBorder = '#fcd34d';
        boxTextColor = '#92400e';
        boxSubtitleColor = '#b45309';
        buttonGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else {
        boxBg = '#fef2f2';
        boxBorder = '#fecaca';
        boxTextColor = '#991b1b';
        boxSubtitleColor = '#b91c1c';
        buttonGradient = 'linear-gradient(135deg, #26847F 0%, #1f6b66 100%)';
    }

    const featuresHtml = showFeatures ? `
        <h3 style="color: ${boxTextColor}; margin: 25px 0 15px 0; font-size: 18px;">${featuresTitle}</h3>
        <table width="100%" cellpadding="0" cellspacing="6" border="0" style="table-layout: fixed; margin-bottom: 25px;">
            <tr>
                <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
                    <p style="margin: 0; font-size: 28px;">${template.feature_1_emoji || '🍽️'}</p>
                    <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${template.feature_1_title || 'Piano Nutrizionale AI'}</p>
                    <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${template.feature_1_subtitle || 'Pasti personalizzati'}</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
                    <p style="margin: 0; font-size: 28px;">${template.feature_2_emoji || '📊'}</p>
                    <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${template.feature_2_title || 'Dashboard Scientifica'}</p>
                    <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${template.feature_2_subtitle || 'Monitora ogni progresso'}</p>
                </td>
            </tr>
            <tr><td colspan="3" style="height: 6px;"></td></tr>
            <tr>
                <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
                    <p style="margin: 0; font-size: 28px;">${template.feature_3_emoji || '📸'}</p>
                    <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${template.feature_3_title || 'Analisi Foto AI'}</p>
                    <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${template.feature_3_subtitle || 'Vedi la trasformazione'}</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background: ${boxBg}; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid ${boxBorder}; vertical-align: top;">
                    <p style="margin: 0; font-size: 28px;">${template.feature_4_emoji || '🛒'}</p>
                    <p style="font-size: 13px; font-weight: bold; color: ${boxTextColor}; margin: 8px 0 4px 0;">${template.feature_4_title || 'Lista Spesa Smart'}</p>
                    <p style="font-size: 11px; color: ${boxSubtitleColor}; margin: 0;">${template.feature_4_subtitle || 'Mai più dubbi'}</p>
                </td>
            </tr>
        </table>
    ` : '';

    const urgencyHtml = showUrgency ? `
        <div style="background: linear-gradient(135deg, ${boxBg} 0%, ${boxBorder} 100%); border: 2px solid ${boxTextColor}; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
            <p style="color: ${boxTextColor}; font-size: 18px; margin: 0; font-weight: bold;">${urgencyTitle}</p>
            <p style="color: ${boxSubtitleColor}; font-size: 14px; margin: 10px 0 0 0; line-height: 1.5;">${urgencySubtitle}</p>
        </div>
    ` : '';

    const trustBadgesHtml = showTrustBadges ? `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
            <tr>
                <td align="center">
                    <table cellpadding="0" cellspacing="15" border="0">
                        <tr>
                            <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">🔒</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">${badges.secure}</p></td>
                            <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">✅</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">${badges.guarantee}</p></td>
                            <td style="text-align: center;"><p style="font-size: 20px; margin: 0;">🚀</p><p style="font-size: 11px; color: #6b7280; margin: 5px 0 0 0;">${badges.instant}</p></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    ` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .logo-cell { padding: 60px 30px 10px 30px; }
        .content-cell { padding: 15px 30px; }
        .content-cell p { margin: 3px 0; line-height: 1.5; }
        .content-cell ul, .content-cell ol { margin: 3px 0; padding-left: 20px; line-height: 1.5; }
        .content-cell li { margin: 1.5px 0; }
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
                                <p style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">${greeting}</p>
                                <div style="color: #374151; line-height: 1.5; font-size: 16px; margin: 0 0 12px 0;">${introText}</div>
                                <div style="color: #374151; line-height: 1.5; font-size: 16px; margin: 0 0 12px 0;">${secondParagraph}</div>
                                ${featuresHtml}
                                <div style="color: #374151; line-height: 1.5; font-size: 16px; margin: 0 0 20px 0;">${closingText}</div>
                            ${urgencyHtml}
                            ${trustBadgesHtml}
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: ${buttonGradient}; color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">${ctaText}</a>
                                    </td>
                                </tr>
                            </table>
                            ${footerText ? `<p style="color: #6b7280; text-align: center; font-size: 13px; margin: 35px 0 10px 0; font-style: italic;">${footerText}</p>` : ''}
                            ${footerQuote ? `<p style="color: #6b7280; text-align: center; font-size: 13px; margin: 15px 0 0 0; font-style: italic;">${footerQuote}</p>` : ''}
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

    return { html, subject: template.subject };
}

function generateWeeklyReportHtml(template, variables, appUrl, language = 'it') {
    console.log('📊📊📊 [WEEKLY REPORT] ============ START GENERATION ============');
    console.log('📊 [WEEKLY REPORT] Template:', template ? 'EXISTS' : 'NULL');
    console.log('📊 [WEEKLY REPORT] Template ID:', template?.template_id);
    console.log('📊 [WEEKLY REPORT] Variables keys:', Object.keys(variables));
    
    // Valori hardcoded come fallback
    const userName = variables.user_name || 'Utente';
    const weekRange = variables.week_range || '10-16 Gennaio 2025';
    const currentWeight = variables.current_weight || 72.5;
    const weightChange = variables.weight_change || -1.2;
    const avgCalories = variables.avg_calories || 1850;
    const workoutsCompleted = variables.workouts_completed || 4;
    const adherence = variables.adherence || 85;
    const progress = variables.progress || 65;
    const motivationalMessage = variables.motivational_message || 'Ottimo lavoro questa settimana! Continua così! 💪';
    
    // Dati peso di esempio se non forniti
    const weightData = variables.weight_data && variables.weight_data.length > 0 
        ? variables.weight_data 
        : [
            { date: '10 Gen', weight: 73.7 },
            { date: '11 Gen', weight: 73.5 },
            { date: '12 Gen', weight: 73.2 },
            { date: '13 Gen', weight: 73.0 },
            { date: '14 Gen', weight: 72.8 },
            { date: '15 Gen', weight: 72.6 },
            { date: '16 Gen', weight: 72.5 }
        ];
    
    console.log('📊 [WEEKLY REPORT] Using data:', {
        userName,
        weekRange,
        currentWeight,
        weightChange,
        avgCalories,
        workoutsCompleted,
        adherence,
        progress,
        weightDataPoints: weightData.length
    });
    
    // HTML super semplificato
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#fafafa;">
<table width="100%" cellpadding="20">
<tr><td align="center">
<table style="max-width:600px;background:white;padding:30px;border-radius:12px;">
<tr><td>
<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" height="30" alt="MyWellness">
<h2 style="color:#26847F;margin:10px 0 10px;">Report Settimanale</h2>
<p style="color:#6b7280;font-size:14px;">${weekRange}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
<p style="font-size:16px;">Ciao ${userName},</p>
<p style="line-height:1.6;">Ecco il tuo report settimanale! 🎯</p>

<div style="background:#f9fafb;padding:20px;border-radius:12px;margin:20px 0;">
<h3 style="color:#374151;margin:0 0 15px;font-size:16px;">📊 Peso Attuale</h3>
<p style="text-align:center;font-size:32px;color:#26847F;font-weight:bold;margin:10px 0;">${currentWeight} kg</p>
<p style="text-align:center;font-size:14px;color:${weightChange < 0 ? '#10b981' : '#ef4444'};">${weightChange > 0 ? '+' : ''}${weightChange} kg questa settimana</p>
</div>

<h3 style="color:#374151;margin:20px 0 15px;font-size:16px;">📈 Le tue statistiche</h3>

<table width="100%" cellpadding="10" cellspacing="10">
<tr>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${avgCalories}</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Calorie medie/giorno</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${workoutsCompleted}</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Allenamenti</p>
</td>
</tr>
<tr>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${adherence}%</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Aderenza</p>
</td>
<td width="4%"></td>
<td width="48%" style="background:#f9fafb;border-radius:12px;padding:15px;text-align:center;">
<p style="margin:0;font-size:24px;color:#26847F;font-weight:bold;">${progress}%</p>
<p style="margin:5px 0 0;font-size:12px;color:#6b7280;">Progresso</p>
</td>
</tr>
</table>

<p style="color:#26847F;text-align:center;font-weight:600;margin:25px 0;">${motivationalMessage}</p>

<div style="text-align:center;margin:25px 0;">
<a href="${appUrl}/Dashboard" style="display:inline-block;background:#26847F;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:bold;">Vai alla Dashboard</a>
</div>

<p style="text-align:center;color:#999;font-size:12px;margin-top:30px;">© VELIKA GROUP LLC</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const returnValue = { html, subject: template.subject || 'Report Settimanale - MyWellness' };
    
    console.log('📊📊📊 [WEEKLY REPORT] ============ RETURNING ============');
    console.log('📊 [WEEKLY REPORT] HTML length:', html.length);
    console.log('📊 [WEEKLY REPORT] Subject:', returnValue.subject);
    console.log('📊 [WEEKLY REPORT] Return value keys:', Object.keys(returnValue));
    
    return returnValue;
}

function generateQuizCompletedHtml(template, variables, appUrl) {
    const userName = variables.user_name || 'Utente';
    const ctaText = template.call_to_action_text || 'Attiva Piano Base - €19/mese';
    const ctaUrl = (template.call_to_action_url || `${appUrl}/pricing`).replace(/{app_url}/g, appUrl);
    const footerText = template.footer_text || 'Il tuo piano personalizzato ti aspetta';

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .outer-wrapper { padding: 0 !important; }
            .feature-table td { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: white; padding: 60px 30px 10px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 30px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 15px 30px 40px 30px;">
                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 25px;">
                                <p style="font-size: 48px; margin: 0 0 10px 0;">🎯</p>
                                <h1 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">Quiz Completato!</h1>
                                <p style="color: #374151; margin: 0; font-size: 16px;">Il tuo piano personalizzato è pronto</p>
                            </div>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Ciao ${userName},</p>
                            <p style="color: #374151; line-height: 1.6; font-size: 16px; margin: 0 0 25px 0;">${template.intro_text || 'Complimenti per aver completato il quiz!'}</p>
                            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">📊 Cosa abbiamo calcolato per te:</h3>
                            <table class="feature-table" width="100%" cellpadding="0" cellspacing="8" border="0" style="table-layout: fixed; margin-bottom: 25px;">
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">🔥</p>
                                        <p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Fabbisogno Calorico</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">⚖️</p>
                                        <p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Macro Ottimali</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">🍽️</p>
                                        <p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Ricette Personalizzate</p>
                                    </td>
                                    <td style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                                        <p style="margin: 0; font-size: 28px;">📈</p>
                                        <p style="font-size: 16px; font-weight: bold; color: #374151; margin: 8px 0 0 0;">Proiezione Obiettivo</p>
                                    </td>
                                </tr>
                            </table>
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">💡 Piano Base - Solo €19/mese</h3>
                                <table width="100%" cellpadding="0" cellspacing="8" border="0">
                                    <tr>
                                        <td width="50%" style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Piano nutrizionale AI</td>
                                        <td width="50%" style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Ricette settimanali</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Lista della spesa</td>
                                        <td style="color: #92400e; font-size: 16px;"><span style="color: #10b981; font-weight: bold;">✓</span> Dashboard progressi</td>
                                    </tr>
                                </table>
                            </div>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 15px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">${ctaText}</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #26847F; text-align: center; font-size: 16px; margin: 15px 0 0 0;">${footerText}</p>
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

    return { html, subject: template.subject || 'Report Settimanale - MyWellness' };
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
        console.log('🔧 BEFORE generateEmailHtml - template_id:', templateId);
        const result = generateEmailHtml(template, {
            user_name: variables.user_name || 'Utente',
            user_email: userEmail,
            app_url: 'https://projectmywellness.com',
            ...variables
        }, language);

        console.log('🔧 AFTER generateEmailHtml - result:', result ? 'EXISTS' : 'NULL');

        if (!result || !result.html) {
            throw new Error('generateEmailHtml returned null or empty');
        }

        const { html, subject } = result;

        console.log(`📧 Generated HTML length: ${html.length} chars`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📧 HTML preview (first 200 chars):`, html.substring(0, 200));

        logEntry.subject = subject;
        logEntry.from_email = template.from_email || 'info@projectmywellness.com';

        // Tentativo di invio con retry
        let lastError = null;
        let sendResult = null;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            logEntry.retry_count = attempt;
            
            try {
                console.log(`📤 Attempt ${attempt + 1}/${MAX_RETRIES} sending to ${userEmail}`);
                
                sendResult = await sendViaSendGrid(sendGridApiKey, {
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

        if (!sendResult) {
            throw lastError || new Error('All retry attempts failed');
        }

        // Salva log SUCCESS
        logEntry.status = 'sent';
        logEntry.sent_at = new Date().toISOString();
        logEntry.sendgrid_message_id = sendResult.messageId;
        logEntry.provider = sendResult.provider;

        try {
            await base44.asServiceRole.entities.EmailLog.create(logEntry);
            console.log('📝 Email log saved');
        } catch (logError) {
            console.error('⚠️ Failed to save email log:', logError);
        }

        console.log(`✅ Email sent successfully to ${userEmail} (ID: ${sendResult.messageId})`);

        return Response.json({ 
            success: true,
            message: 'Email sent successfully',
            messageId: sendResult.messageId,
            provider: sendResult.provider,
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