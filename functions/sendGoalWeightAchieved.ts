import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        console.log(`📬 Sending goal achievement email to ${user.email}`);

        // Recupera lo storico peso per calcolare i progressi
        const weightHistory = await base44.asServiceRole.entities.WeightHistory.filter(
            { user_id: userId },
            ['-date'],
            100
        );

        const startWeight = weightHistory.length > 0 
            ? weightHistory[weightHistory.length - 1].weight 
            : user.current_weight;
        const currentWeight = weightHistory.length > 0 
            ? weightHistory[0].weight 
            : user.current_weight;
        const weightLost = (startWeight - currentWeight).toFixed(1);
        const daysToGoal = weightHistory.length > 1 
            ? Math.floor((new Date(weightHistory[0].date) - new Date(weightHistory[weightHistory.length - 1].date)) / (1000 * 60 * 60 * 24))
            : 0;

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.mywellness.it';

        // 🔐 GENERA COUPON PERSONALIZZATO inline
        function generatePersonalCode(userId, baseCode) {
            const hash = userId.split('').reduce((acc, char) => {
                return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            const shortHash = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
            return `${baseCode}_${shortHash}`;
        }

        const personalCouponCode = generatePersonalCode(user.id, 'WINNER30');

        // Verifica se il coupon esiste già
        const existingCoupons = await base44.asServiceRole.entities.Coupon.filter({
            code: personalCouponCode
        });

        if (existingCoupons.length === 0) {
            await base44.asServiceRole.entities.Coupon.create({
                code: personalCouponCode,
                discount_type: "percentage",
                discount_value: 30,
                is_active: true,
                expires_at: null
            });
            console.log(`✅ Created coupon: ${personalCouponCode}`);
        } else {
            console.log(`ℹ️ Coupon already exists: ${personalCouponCode}`);
        }

        // Marca come inviata sul profilo utente
        await base44.asServiceRole.entities.User.update(user.id, {
            goal_achieved_email_sent: true,
            goal_achieved_date: new Date().toISOString()
        });

        console.log(`🎫 Using coupon: ${personalCouponCode}`);

        const emailBody = generateGoalEmail(user, weightLost, daysToGoal, personalCouponCode, appUrl);

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness Team <${fromEmail}>`,
            subject: '🎉 HAI RAGGIUNTO IL TUO OBIETTIVO! Incredibile!',
            body: emailBody
        });

        console.log('✅ Goal achievement email sent');

        return Response.json({ 
            success: true,
            message: 'Goal achievement email sent',
            coupon_code: personalCouponCode
        });

    } catch (error) {
        console.error('❌ Error sending goal achievement email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

function generateGoalEmail(user, weightLost, daysToGoal, couponCode, appUrl) {
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
                        <td class="logo-cell" style="background: white;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td class="content-cell">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #26847F; margin: 0; font-size: 48px;">🎉🎊🏆</h1>
                                <h2 style="color: #111827; margin: 10px 0; font-size: 32px; font-weight: bold;">CE L'HAI FATTA!</h2>
                                <p style="color: #6b7280; font-size: 18px; margin: 10px 0;">Hai raggiunto il tuo peso obiettivo!</p>
                            </div>

                            <p style="color: #111827; font-size: 16px; margin: 0 0 20px 0;">Ciao ${user.full_name || 'Campione'},</p>
                            
                            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
                                Non abbiamo parole. Sei stato incredibile! Hai dimostrato una determinazione e una costanza che pochi hanno.
                            </p>

                            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 3px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px;">🎯 I Tuoi Progressi Straordinari</h3>
                                <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                                    <div style="margin: 10px;">
                                        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #10b981;">${weightLost} kg</p>
                                        <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">Persi</p>
                                    </div>
                                    <div style="margin: 10px;">
                                        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #10b981;">${daysToGoal}</p>
                                        <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">Giorni</p>
                                    </div>
                                    <div style="margin: 10px;">
                                        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #10b981;">100%</p>
                                        <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">Obiettivo</p>
                                    </div>
                                </div>
                            </div>

                            <h3 style="color: #111827; margin: 30px 0 15px 0;">💪 Cosa hai conquistato:</h3>
                            
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                Disciplina alimentare e scelte consapevoli
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                Abitudine all'esercizio fisico regolare
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                Maggiore energia e vitalità quotidiana
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                Fiducia in te stesso e nelle tue capacità
                            </div>
                            <div style="margin: 15px 0; padding-left: 30px; position: relative;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px;">✓</span>
                                Un corpo più sano e in forma
                            </div>

                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px solid #f59e0b; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 28px;">🎁 30% DI SCONTO ESCLUSIVO</h2>
                                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">Per celebrare il tuo successo, ecco il tuo codice personale:</p>
                                <div style="background: white; padding: 15px 25px; border-radius: 8px; display: inline-block;">
                                    <p style="margin: 0; font-size: 28px; font-weight: bold; color: #26847F; letter-spacing: 2px;">${couponCode}</p>
                                </div>
                                <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px; font-weight: bold;">⏰ Valido per i prossimi 7 giorni</p>
                                <p style="margin: 5px 0 0 0; color: #b45309; font-size: 12px;">🔒 Codice univoco - non condivisibile</p>
                            </div>

                            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
                                Ora che hai raggiunto il tuo obiettivo, il prossimo step è <strong>mantenerlo</strong>. Continua a usare MyWellness per consolidare le tue nuove abitudini.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/pricing?coupon=${couponCode}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                            🏆 Mantieni i Risultati con -30%
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 30px 0 10px 0; font-style: italic;">
                                "Il successo è la somma di piccoli sforzi ripetuti giorno dopo giorno."
                            </p>

                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 10px 0;">
                                Siamo orgogliosi di te! 💚
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