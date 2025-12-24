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
        }, '-updated_date', 1);
        return templates.length > 0 ? templates[0] : null;
    } catch (error) {
        console.error('Error loading template:', error);
        return null;
    }
}

function replaceVariables(text, variables) {
    if (!text) return '';
    // Se text è un oggetto, non è una stringa valida - ritorna stringa vuota
    if (typeof text === 'object') return '';
    let result = text;
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, variables[key] || '');
    });
    return result;
}

Deno.serve(async (req) => {
    console.log('📊 sendWeeklyReport CRON - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check disabled for testing - re-enable in production if needed
        // const cronSecret = Deno.env.get('CRON_SECRET');
        // const authHeader = req.headers.get('Authorization');
        // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        //     console.error('Unauthorized cron call');
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        console.log(`📅 Generating weekly reports from ${oneWeekAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

        // Recupera tutti gli utenti attivi
        const allUsers = await base44.asServiceRole.entities.User.list();
        const activeUsers = allUsers.filter(u => 
            u.subscription_status === 'active' && 
            u.quiz_completed === true
        );

        console.log(`👥 Found ${activeUsers.length} active users to send reports`);

        // Carica template dall'admin
        const template = await loadEmailTemplate(base44, 'weekly_report');
        
        let sentCount = 0;
        const results = [];

        for (const user of activeUsers) {
            try {
                // Recupera i dati della settimana
                const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
                    { user_id: user.id },
                    ['-date'],
                    10
                );

                const mealLogs = await base44.asServiceRole.entities.MealLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    50
                );

                const workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
                    { user_id: user.id },
                    ['-date'],
                    20
                );

                // Calcola statistiche
                const stats = calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, oneWeekAgo, today);

                // Prepara variabili per il template
                const variables = {
                    user_name: user.full_name || 'Utente',
                    week_range: stats.weekRange,
                    weight_change: stats.weightChange,
                    current_weight: stats.currentWeight,
                    target_weight: stats.targetWeight,
                    avg_calories: stats.avgCalories,
                    workouts_completed: stats.workoutsCompleted,
                    planned_workouts: stats.plannedWorkouts,
                    adherence: stats.adherence,
                    progress: stats.progressPercentage,
                    distance_remaining: stats.distanceRemaining,
                    app_url: Deno.env.get('APP_URL') || 'https://projectmywellness.com'
                };

                const emailBody = getWeeklyReportTemplate(user, stats, template, variables);
                
                // Usa valori dal template se disponibili
                const fromEmail = template?.from_email || 'info@projectmywellness.com';
                const replyToEmail = template?.reply_to_email || 'no-reply@projectmywellness.com';
                const subject = template?.subject 
                    ? replaceVariables(template.subject, variables)
                    : `📊 Il tuo Report Settimanale MyWellness - ${stats.weekRange}`;

                await sendEmailViaSendGrid(
                    user.email,
                    subject,
                    emailBody,
                    fromEmail,
                    replyToEmail
                );

                sentCount++;
                console.log(`✅ Weekly report sent to ${user.email}`);
                
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'sent',
                    stats: stats
                });

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (error) {
                console.error(`❌ Failed to send report to ${user.email}:`, error.message);
                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        console.log(`🎉 Weekly reports sent: ${sentCount}/${activeUsers.length}`);

        return Response.json({
            success: true,
            sent_count: sentCount,
            total_users: activeUsers.length,
            results: results
        });

    } catch (error) {
        console.error('❌ CRON Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function calculateWeeklyStats(user, weightHistory, mealLogs, workoutLogs, startDate, endDate) {
    const weekRange = `${startDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    
    // Filtra dati della settimana
    const weekWeights = weightHistory.filter(w => {
        const date = new Date(w.date);
        return date >= startDate && date <= endDate;
    });

    const weekMeals = mealLogs.filter(m => {
        const date = new Date(m.date);
        return date >= startDate && date <= endDate;
    });

    const weekWorkouts = workoutLogs.filter(w => {
        const date = new Date(w.date);
        return date >= startDate && date <= endDate;
    });

    // Calcola variazione peso
    let weightChange = 0;
    let weightTrend = 'stable';
    if (weekWeights.length >= 2) {
        const oldestWeight = weekWeights[weekWeights.length - 1].weight;
        const newestWeight = weekWeights[0].weight;
        weightChange = newestWeight - oldestWeight;
        weightTrend = weightChange < -0.2 ? 'down' : weightChange > 0.2 ? 'up' : 'stable';
    }

    // Calcola calorie medie
    const totalCalories = weekMeals.reduce((sum, m) => sum + (m.actual_calories || 0), 0);
    const avgCalories = weekMeals.length > 0 ? Math.round(totalCalories / weekMeals.length) : 0;

    // Conta allenamenti completati (con completed: true)
    const workoutsCompleted = weekWorkouts.filter(w => w.completed === true).length;

    // Calcola aderenza al piano
    const totalDays = 7;
    const daysWithLogs = new Set(weekMeals.map(m => m.date)).size;
    const adherence = Math.round((daysWithLogs / totalDays) * 100);

    // Progresso verso obiettivo
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : user.current_weight;
    const startWeight = user.current_weight;
    const targetWeight = user.target_weight;
    const totalDistance = Math.abs(startWeight - targetWeight);
    const distanceCovered = Math.abs(startWeight - currentWeight);
    const progressPercentage = totalDistance > 0 ? Math.round((distanceCovered / totalDistance) * 100) : 0;

    return {
        weekRange,
        weightChange: weightChange.toFixed(1),
        weightTrend,
        currentWeight: currentWeight.toFixed(1),
        targetWeight: targetWeight.toFixed(1),
        avgCalories,
        workoutsCompleted,
        plannedWorkouts: user.workout_days || 3,
        adherence,
        progressPercentage,
        totalDistance: totalDistance.toFixed(1),
        distanceRemaining: (totalDistance - distanceCovered).toFixed(1)
    };
}

function getWeeklyReportTemplate(user, stats, template, variables) {
    const weightEmoji = stats.weightTrend === 'down' ? '📉' : stats.weightTrend === 'up' ? '📈' : '➡️';
    const weightColor = stats.weightTrend === 'down' ? '#10b981' : stats.weightTrend === 'up' ? '#ef4444' : '#6b7280';
    const adherenceColor = stats.adherence >= 80 ? '#10b981' : stats.adherence >= 50 ? '#f59e0b' : '#ef4444';

    // Valori dal template admin o fallback
    const headerTitle = template?.header_title 
        ? replaceVariables(template.header_title, variables) 
        : 'Report Settimanale';
    const headerSubtitle = template?.header_subtitle 
        ? replaceVariables(template.header_subtitle, variables) 
        : stats.weekRange;
    // Helper per verificare se un campo è una stringa valida e non vuota
    const isValidString = (val) => val && typeof val === 'string' && val.trim() !== '';
    
    const greeting = isValidString(template?.greeting) 
        ? replaceVariables(template.greeting, variables) 
        : '';
    const introText = isValidString(template?.intro_text)
        ? replaceVariables(template.intro_text, variables)
        : '';
    const mainContent = isValidString(template?.main_content)
        ? replaceVariables(template.main_content, variables)
        : '';
    const ctaText = isValidString(template?.call_to_action_text) 
        ? template.call_to_action_text 
        : '📊 Vedi Dashboard Completa';
    const ctaUrl = isValidString(template?.call_to_action_url)
        ? replaceVariables(template.call_to_action_url, variables) 
        : (Deno.env.get('APP_URL') || 'https://projectmywellness.com') + '/Dashboard';
    const footerText = isValidString(template?.footer_text)
        ? replaceVariables(template.footer_text, variables)
        : '';
    const showFooter = isValidString(template?.footer_text);

    // Configurazione grafici/sezioni dall'admin
    const showWeightCard = template?.show_weight_card !== false;
    const weightCardTitle = template?.weight_card_title || 'Variazione Peso';
    const showStatsSection = template?.show_stats_section !== false;
    const statsSectionTitle = template?.stats_section_title || '📈 Le tue statistiche';
    const showCaloriesStat = template?.show_calories_stat !== false;
    const caloriesStatLabel = template?.calories_stat_label || 'Calorie medie/giorno';
    const showWorkoutsStat = template?.show_workouts_stat !== false;
    const workoutsStatLabel = template?.workouts_stat_label || 'Allenamenti completati';
    const showAdherenceStat = template?.show_adherence_stat !== false;
    const adherenceStatLabel = template?.adherence_stat_label || 'Aderenza al piano';
    const showProgressStat = template?.show_progress_stat !== false;
    const progressStatLabel = template?.progress_stat_label || 'Progresso obiettivo';
    const showProgressBar = template?.show_progress_bar !== false;
    const progressBarTitle = template?.progress_bar_title || '🎯 Progresso verso l\'obiettivo';
    const progressBarSubtitle = template?.progress_bar_subtitle 
        ? replaceVariables(template.progress_bar_subtitle, variables)
        : `Rimangono ${stats.distanceRemaining} kg al tuo obiettivo!`;
    const showMotivationalMessage = template?.show_motivational_message !== false;

    // Costruisci HTML per card peso
    const weightCardHtml = showWeightCard ? `
        <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%); border: 2px solid #26847F; border-radius: 12px; padding: 20px; margin: 10px 0 20px 0; text-align: center;">
            <h2 style="color: #26847F; margin: 0 0 10px 0; font-size: 24px;">${weightEmoji} ${weightCardTitle}</h2>
            <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${weightColor};">
                ${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg
            </p>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                Peso attuale: ${stats.currentWeight} kg · Target: ${stats.targetWeight} kg
            </p>
        </div>
    ` : '';

    // Costruisci HTML per statistiche
    let statsHtml = '';
    if (showStatsSection) {
        const statsRows = [];
        
        // Prima riga: calorie + allenamenti
        const row1Stats = [];
        if (showCaloriesStat) {
            row1Stats.push(`
                <td width="48%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">🍽️</p>
                    <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.avgCalories}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${caloriesStatLabel}</p>
                </td>
            `);
        }
        if (showWorkoutsStat) {
            row1Stats.push(`
                <td width="48%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">💪</p>
                    <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.workoutsCompleted}/${stats.plannedWorkouts}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${workoutsStatLabel}</p>
                </td>
            `);
        }
        if (row1Stats.length > 0) {
            statsRows.push(`<tr>${row1Stats.join('<td width="4%"></td>')}</tr>`);
        }

        // Spacer row per distanza verticale uguale
        statsRows.push(`<tr><td colspan="3" style="height: 8px;"></td></tr>`);

        // Seconda riga: aderenza + progresso
        const row2Stats = [];
        if (showAdherenceStat) {
            row2Stats.push(`
                <td width="48%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: ${adherenceColor};">✓</p>
                    <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.adherence}%</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${adherenceStatLabel}</p>
                </td>
            `);
        }
        if (showProgressStat) {
            row2Stats.push(`
                <td width="48%" style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #26847F;">🎯</p>
                    <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 10px 0;">${stats.progressPercentage}%</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${progressStatLabel}</p>
                </td>
            `);
        }
        if (row2Stats.length > 0) {
            statsRows.push(`<tr>${row2Stats.join('<td width="4%"></td>')}</tr>`);
        }

        if (statsRows.length > 0) {
        statsHtml = `
            <h3 style="color: #111827; margin: 30px 0 15px 0;">${statsSectionTitle}</h3>
            <table class="stat-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed; border-spacing: 8px;">
                ${statsRows.join('')}
            </table>
        `;
        }
    }

    // Costruisci HTML per barra progresso
    const progressBarHtml = showProgressBar ? `
        <h3 style="color: #111827; margin: 30px 0 10px 0;">${progressBarTitle}</h3>
        <div style="background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 10px 0;">
            <div style="background: linear-gradient(90deg, #26847F 0%, #1f6b66 100%); height: 100%; width: ${Math.min(stats.progressPercentage, 100)}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                ${stats.progressPercentage}%
            </div>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">
            ${progressBarSubtitle}
        </p>
    ` : '';

    // Messaggio motivazionale
    const motivationalHtml = showMotivationalMessage ? getMotivationalMessage(stats) : '';

    return `
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
            .stat-table { width: 100% !important; }
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
                        <td style="background: white; padding: 40px 30px 10px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 30px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 5px 0; font-size: 28px;">${headerTitle}</h1>
                            <p style="color: #6b7280; margin: 0; font-size: 16px;">${headerSubtitle}</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 20px 30px 40px 30px;">
                            ${greeting ? `<p style="color: #111827; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">${greeting}</p>` : ''}
                            
                            ${introText ? `<p style="color: #374151; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">${introText}</p>` : ''}
                            
                            ${mainContent ? `<div style="color: #374151; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">${mainContent}</div>` : ''}

                            ${weightCardHtml}

                            ${statsHtml}

                            ${progressBarHtml}

                            ${motivationalHtml}

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            ${ctaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            ${showFooter ? `<p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">${footerText}</p>` : ''}
                        </td>
                    </tr>
                </table>
                
                ${showFooter ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px; background-color: #fafafa;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999; background-color: #fafafa;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                        </td>
                    </tr>
                </table>
                ` : ''}
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

function getMotivationalMessage(stats) {
    if (stats.progressPercentage >= 75) {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                🔥 <strong>Incredibile!</strong> Sei oltre il 75% del tuo obiettivo! Il traguardo è vicino, continua così!
            </p>
        </div>
        `;
    } else if (stats.adherence >= 80 && stats.workoutsCompleted >= stats.plannedWorkouts * 0.8) {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                💪 <strong>Ottimo lavoro!</strong> La tua costanza sta dando risultati. Mantieni questo ritmo!
            </p>
        </div>
        `;
    } else if (stats.weightTrend === 'down') {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                📉 <strong>Ben fatto!</strong> Il peso sta scendendo. Stai andando nella direzione giusta!
            </p>
        </div>
        `;
    } else {
        return `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
                💡 <strong>Consiglio:</strong> Cerca di seguire il piano con maggiore costanza questa settimana. Piccoli passi portano a grandi risultati!
            </p>
        </div>
        `;
    }
}