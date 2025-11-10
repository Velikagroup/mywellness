import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🔄 sendPlanChange - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId, changeType, oldPlan, newPlan } = body;

        if (!userId || !changeType || !oldPlan || !newPlan) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['upgrade', 'downgrade'].includes(changeType)) {
            return Response.json({ error: 'Invalid changeType. Use "upgrade" or "downgrade"' }, { status: 400 });
        }

        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`📧 Sending ${changeType} email to ${user.email}: ${oldPlan} → ${newPlan}`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        const emailBody = changeType === 'upgrade' 
            ? generateUpgradeEmail(user, oldPlan, newPlan, appUrl)
            : generateDowngradeEmail(user, oldPlan, newPlan, appUrl);

        const subject = changeType === 'upgrade'
            ? `🚀 Piano Aggiornato a ${newPlan.toUpperCase()}! Nuove Funzionalità Disponibili`
            : `✅ Piano Modificato a ${newPlan.toUpperCase()} - Conferma`;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness Team <${fromEmail}>`,
            subject: subject,
            body: emailBody
        });

        console.log(`✅ ${changeType} email sent`);

        return Response.json({ 
            success: true,
            message: `Plan ${changeType} email sent`
        });

    } catch (error) {
        console.error('❌ Error sending plan change email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function getPlanFeatures(plan) {
    const features = {
        base: [
            'Piano nutrizionale personalizzato',
            'Ricette con ingredienti',
            'Lista spesa automatica',
            'Tracciamento peso'
        ],
        pro: [
            'Piano nutrizionale personalizzato',
            'Ricette con ingredienti',
            'Lista spesa automatica',
            'Tracciamento peso',
            'Piano allenamenti personalizzato',
            'Tracciamento workout',
            'Analisi progressi avanzata'
        ],
        premium: [
            'Piano nutrizionale personalizzato',
            'Ricette con ingredienti',
            'Lista spesa automatica',
            'Tracciamento peso',
            'Piano allenamenti personalizzato',
            'Tracciamento workout',
            'Analisi progressi avanzata',
            'Analisi foto pasti con AI',
            'Analisi foto progressi',
            'Supporto prioritario',
            'Ribilanciamento automatico pasti'
        ]
    };
    return features[plan.toLowerCase()] || [];
}

function generateUpgradeEmail(user, oldPlan, newPlan, appUrl) {
    const newFeatures = getPlanFeatures(newPlan);
    
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
    </style>
</head>
<body>
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="font-size: 64px;">🚀</div>
                                <h1 style="color: #26847F; margin: 20px 0 10px 0;">UPGRADE COMPLETATO!</h1>
                                <p style="color: #10b981; font-size: 20px; font-weight: bold;">Piano ${newPlan.toUpperCase()} Attivo</p>
                            </div>

                            <p style="color: #111827; font-size: 16px;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Ottima scelta! Hai effettuato l'upgrade da <strong>${oldPlan}</strong> a <strong>${newPlan.toUpperCase()}</strong> ✨
                            </p>

                            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #065f46; margin: 0 0 15px 0;">✨ Nuove Funzionalità Disponibili:</h3>
                                ${newFeatures.map(f => `<div style="margin: 10px 0; padding-left: 25px; position: relative; color: #047857;">
                                    <span style="position: absolute; left: 0; color: #10b981;">✓</span>
                                    ${f}
                                </div>`).join('')}
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🎯 Esplora Nuove Funzionalità
                                        </a>
                                    </td>
                                </tr>
                            </table>
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

function generateDowngradeEmail(user, oldPlan, newPlan, appUrl) {
    const remainingFeatures = getPlanFeatures(newPlan);
    
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
    </style>
</head>
<body>
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px;">
                    <tr>
                        <td class="logo-cell">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <h1 style="color: #26847F; margin: 0 0 20px 0;">Piano Modificato</h1>
                            <p style="color: #111827;">Ciao ${user.full_name || 'Utente'},</p>
                            
                            <p style="color: #374151; line-height: 1.6;">
                                Abbiamo modificato il tuo piano da <strong>${oldPlan}</strong> a <strong>${newPlan.toUpperCase()}</strong>.
                            </p>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">📋 Funzionalità Disponibili:</h3>
                                ${remainingFeatures.map(f => `<div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    ${f}
                                </div>`).join('')}
                            </div>

                            <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin: 20px 0;">
                                <p style="margin: 0; color: #047857;">💚 Puoi sempre fare upgrade per accedere a tutte le funzionalità Premium!</p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing" style="display: inline-block; background: #26847F; color: white !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                                            📊 Vedi Piani Disponibili
                                        </a>
                                    </td>
                                </tr>
                            </table>
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