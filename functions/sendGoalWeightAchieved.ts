import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('🎉 sendGoalWeightAchieved - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`🎯 Sending goal achieved email to ${user.email}`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';
        
        const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
            { user_id: userId },
            ['-date'],
            50
        );

        const startWeight = user.current_weight;
        const currentWeight = weightHistory[0]?.weight || startWeight;
        const weightLost = (startWeight - currentWeight).toFixed(1);
        const daysSinceStart = Math.floor((new Date() - new Date(user.created_date)) / (1000 * 60 * 60 * 24));

        const emailBody = `
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
                        <td class="logo-cell" style="background: white;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="font-size: 80px; line-height: 1;">🎉</div>
                                <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 36px;">OBIETTIVO RAGGIUNTO!</h1>
                                <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">CE L'HAI FATTA!</p>
                            </div>

                            <p style="color: #111827; font-size: 18px; margin: 0 0 20px 0; text-align: center;">
                                Ciao <strong>${user.full_name || 'Campione'}</strong>,
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 3px solid #10b981; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #065f46; margin: 0 0 20px 0; font-size: 28px;">🏆 HAI RAGGIUNTO</h2>
                                <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 64px; font-weight: bold; color: #10b981; line-height: 1;">${user.target_weight}</p>
                                    <p style="margin: 5px 0 0 0; font-size: 24px; color: #065f46; font-weight: bold;">KG</p>
                                </div>
                                <div style="margin-top: 20px;">
                                    <p style="margin: 5px 0; color: #047857; font-size: 18px;">Peso iniziale: <strong>${startWeight} kg</strong></p>
                                    <p style="margin: 5px 0; color: #047857; font-size: 18px;">Peso perso: <strong>${weightLost} kg</strong></p>
                                    <p style="margin: 5px 0; color: #047857; font-size: 18px;">In soli: <strong>${daysSinceStart} giorni</strong></p>
                                </div>
                            </div>

                            <div style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0; text-align: center;">💪 Questo risultato non è casuale:</h3>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Hai seguito il piano con costanza
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Hai fatto scelte consapevoli ogni giorno
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Hai creduto in te stesso
                                </div>
                                <div style="margin: 10px 0; padding-left: 25px; position: relative; color: #78350f;">
                                    <span style="position: absolute; left: 0; color: #fbbf24;">✓</span>
                                    Hai trasformato le abitudini in uno stile di vita
                                </div>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0; text-align: center;">🎯 E ora?</h3>
                            
                            <p style="color: #374151; line-height: 1.6; text-align: center;">
                                Questo è solo l'inizio! Il vero successo è <strong>mantenere</strong> questi risultati nel tempo.
                            </p>

                            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                                <h4 style="color: #065f46; margin: 0 0 10px 0;">💡 Suggerimenti per il mantenimento:</h4>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Continua a tracciare il peso settimanalmente</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Mantieni l'attività fisica regolare</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Adatta il piano alle tue nuove esigenze</p>
                                <p style="margin: 5px 0; color: #047857; font-size: 14px;">• Celebra i piccoli successi quotidiani</p>
                            </div>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 32px;">🎁 REGALO SPECIALE</h2>
                                <p style="margin: 0 0 20px 0; font-size: 18px; color: #78350f;">
                                    Per celebrare questo traguardo incredibile:
                                </p>
                                <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block; margin-bottom: 15px;">
                                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Codice sconto:</p>
                                    <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 2px;">WINNER30</p>
                                </div>
                                <p style="margin: 0; font-size: 16px; color: #92400e;">
                                    <strong>30% di sconto</strong> sul prossimo rinnovo<br>
                                    Valido per 7 giorni
                                </p>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🏆 Vedi la Tua Trasformazione
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #10b981; text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0;">
                                Sei un CAMPIONE! 🎉👑💪
                            </p>

                            <p style="color: #6b7280; text-align: center; font-size: 14px; margin: 20px 0;">
                                Condividi il tuo successo con noi! Rispondi a questa email con una foto del tuo progresso e potresti essere featured nella nostra community!
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

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness Team <${fromEmail}>`,
            subject: '🎉🏆 HAI RAGGIUNTO IL TUO OBIETTIVO! INCREDIBILE!',
            body: emailBody
        });

        console.log('✅ Goal achieved email sent');

        return Response.json({ 
            success: true,
            message: 'Goal achieved email sent'
        });

    } catch (error) {
        console.error('❌ Error sending goal achieved email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});