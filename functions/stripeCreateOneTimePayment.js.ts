
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    let userId;
    let isNewUser = false;
    let tempPasswordToSend = null;
    let userEmail = null;
    let userName = null;
    let paymentIntentId = null;
    let paymentMethodId = null;
    let cardLast4 = '';
    let cardBrand = 'visa';
    let stripeCustomerId = null;

    try {
        console.log('=== PAYMENT START ===');
        
        const base44 = createClientFromRequest(req);
        
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
            console.error('❌ Stripe key not found');
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Stripe not configured' 
            }), { status: 500, headers: corsHeaders });
        }

        console.log('✅ Stripe key loaded');

        const body = await req.json();
        const { cardData, orderBumpSelected, appliedCouponCode, trafficSource, billingInfo, phoneNumber } = body;

        if (!cardData || !billingInfo || !billingInfo.email) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Missing required data' 
            }), { status: 400, headers: corsHeaders });
        }

        userEmail = billingInfo.email;
        userName = billingInfo.name;
        console.log('📧 Email:', userEmail);
        console.log('🔍 Traffic Source:', trafficSource || 'direct');

        // Check if user exists usando SDK
        console.log('👤 Checking if user exists...');
        const existingUsers = await base44.asServiceRole.entities.User.filter({
            email: userEmail
        });

        if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
            console.log('✅ User exists:', userId);
            
            if (existingUsers[0].purchased_landing_offer) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: 'Hai già acquistato questa offerta' 
                }), { status: 400, headers: corsHeaders });
            }
        }

        // Create user if doesn't exist
        if (!userId) {
            console.log('➕ Creating new user...');
            const tempPassword = generateTempPassword();
            tempPasswordToSend = tempPassword;
            
            const newUser = await base44.asServiceRole.auth.signUp({
                email: userEmail,
                password: tempPassword,
                full_name: userName
            });

            userId = newUser.id;
            isNewUser = true;
            console.log('✅ New user created:', userId);
            console.log('🔑 Temp password:', tempPassword);
        }

        // Calculate amount
        let amount = 6700;
        if (orderBumpSelected) amount += 1999;

        if (appliedCouponCode === 'PROMO100') {
            amount = 0;
            console.log('🎁 PROMO100 - FREE');
        }

        console.log('💰 Amount:', amount, 'cents (€' + (amount/100).toFixed(2) + ')');

        cardLast4 = cardData.number.replace(/\s/g, '').slice(-4);

        // Process payment with Stripe REST API
        if (amount > 0) {
            console.log('💳 Processing payment...');
            console.log('💳 Card ending in:', cardLast4);
            console.log('💳 Expiry:', cardData.exp_month + '/' + cardData.exp_year);

            const stripeHeaders = {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            try {
                // Create Payment Method
                console.log('🔄 Step 1/3: Creating Stripe Payment Method...');
                
                const pmParams = new URLSearchParams();
                pmParams.append('type', 'card');
                pmParams.append('card[number]', cardData.number.replace(/\s/g, ''));
                pmParams.append('card[exp_month]', cardData.exp_month.toString());
                pmParams.append('card[exp_year]', cardData.exp_year.toString());
                pmParams.append('card[cvc]', cardData.cvc);
                pmParams.append('billing_details[name]', userName);
                pmParams.append('billing_details[email]', userEmail);
                
                const pmRes = await fetch('https://api.stripe.com/v1/payment_methods', {
                    method: 'POST',
                    headers: stripeHeaders,
                    body: pmParams.toString()
                });

                if (!pmRes.ok) {
                    const errorData = await pmRes.json();
                    console.error('❌ Stripe error:', errorData);
                    throw new Error(errorData.error?.message || 'Payment method creation failed');
                }

                const paymentMethod = await pmRes.json();
                paymentMethodId = paymentMethod.id;
                cardLast4 = paymentMethod.card.last4;
                cardBrand = paymentMethod.card.brand;
                console.log('✅ Payment method created:', paymentMethodId);

                // Create Customer
                console.log('🔄 Step 2/3: Creating Stripe Customer...');
                const custParams = new URLSearchParams();
                custParams.append('email', userEmail);
                custParams.append('name', userName);
                custParams.append('payment_method', paymentMethod.id);
                custParams.append('invoice_settings[default_payment_method]', paymentMethod.id);
                custParams.append('metadata[user_id]', userId);

                const custRes = await fetch('https://api.stripe.com/v1/customers', {
                    method: 'POST',
                    headers: stripeHeaders,
                    body: custParams.toString()
                });

                if (!custRes.ok) {
                    const errorData = await custRes.json();
                    console.error('❌ Customer creation error:', errorData);
                    throw new Error('Customer creation failed');
                }

                const customer = await custRes.json();
                stripeCustomerId = customer.id;
                console.log('✅ Customer created:', stripeCustomerId);

                // Create Payment Intent
                console.log('🔄 Step 3/3: Creating Payment Intent...');
                const piParams = new URLSearchParams();
                piParams.append('amount', amount.toString());
                piParams.append('currency', 'eur');
                piParams.append('customer', customer.id);
                piParams.append('payment_method', paymentMethod.id);
                piParams.append('off_session', 'true');
                piParams.append('confirm', 'true');
                piParams.append('description', 'MyWellness Landing Offer - 3 Mesi Premium');
                piParams.append('metadata[user_id]', userId);
                piParams.append('metadata[type]', 'landing_offer');
                piParams.append('metadata[traffic_source]', trafficSource || 'direct');

                const piRes = await fetch('https://api.stripe.com/v1/payment_intents', {
                    method: 'POST',
                    headers: stripeHeaders,
                    body: piParams.toString()
                });

                if (!piRes.ok) {
                    const errorData = await piRes.json();
                    console.error('❌ Payment intent error:', errorData);
                    throw new Error(errorData.error?.message || 'Payment failed');
                }

                const paymentIntent = await piRes.json();

                if (paymentIntent.status !== 'succeeded') {
                    console.error('❌ Payment status:', paymentIntent.status);
                    throw new Error('Payment not succeeded: ' + paymentIntent.status);
                }

                paymentIntentId = paymentIntent.id;
                console.log('✅ Payment succeeded:', paymentIntentId);

            } catch (stripeError) {
                console.error('❌ STRIPE ERROR:', stripeError.message);
                throw stripeError;
            }
        }

        // Update user data usando SDK
        console.log('💾 Updating user data...');
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: 'active',
            subscription_plan: 'premium',
            subscription_expires_at: expiresAt.toISOString(),
            stripe_customer_id: stripeCustomerId,
            payment_method_id: paymentMethodId,
            card_last4: cardLast4,
            card_brand: cardBrand,
            last_payment_amount: amount / 100,
            last_payment_date: new Date().toISOString(),
            purchased_landing_offer: true,
            traffic_source: trafficSource || 'direct',
            billing_name: userName,
            company_name: billingInfo.companyName,
            tax_id: billingInfo.taxId,
            pec_sdi: billingInfo.pecSdi,
            billing_type: billingInfo.billingType,
            billing_address: billingInfo.address,
            billing_city: billingInfo.city,
            billing_zip: billingInfo.zip,
            billing_country: billingInfo.country,
            phone_number: phoneNumber,
            order_bump_selected: orderBumpSelected,
            temp_password_sent: isNewUser,
            created_via_landing: true
        });

        console.log('✅ User data updated');

        // Send email - ALWAYS for Landing Offer purchases
        console.log('📧 Preparing to send email...');
        const APP_URL = Deno.env.get('APP_URL') || 'https://app.mywellness.pro';
        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        
        try {
            if (isNewUser && tempPasswordToSend) {
                // NEW USER - Send password
                console.log('📧 Sending email to NEW user with temp password...');
                const dashboardUrl = APP_URL + '/reset-password?email=' + encodeURIComponent(userEmail);
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: userEmail,
                    from_name: `MyWellness <${fromEmail}>`,
                    subject: '🎉 Benvenuto in MyWellness - Il Tuo Accesso',
                    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
        <div style="background: white; padding: 24px 30px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
            <h1 style="color: #26847F; margin-top: 20px;">Benvenuto in MyWellness!</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333;">Ciao <strong>${userName}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Grazie per aver scelto MyWellness! Il tuo acquisto è stato completato con successo.</p>
            
            <div style="background-color: #f0f9f8; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>La tua password temporanea:</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #26847F; letter-spacing: 2px;">${tempPasswordToSend}</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Per iniziare, clicca sul pulsante qui sotto e crea la tua password personale:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(to right, #26847F, #14b8a6); color: #ffffff !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    Accedi alla Dashboard
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${dashboardUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">Se hai bisogno di aiuto, contattaci a <a href="mailto:support@projectmywellness.com" style="color: #26847F;">support@projectmywellness.com</a></p>
        </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999999;">
        <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
        <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
        <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
    </div>
</body>
</html>
                    `
                });
                
                console.log('✅ Email sent to NEW user');
                
            } else {
                // EXISTING USER - Send welcome with login link
                console.log('📧 Sending email to EXISTING user...');
                const loginUrl = APP_URL;
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: userEmail,
                    from_name: `MyWellness <${fromEmail}>`,
                    subject: '🎉 Grazie per il tuo acquisto - MyWellness Premium Attivato',
                    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px 0; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
        <div style="background: white; padding: 24px 30px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
            <h1 style="color: #26847F; margin-top: 20px;">Il Tuo Piano Premium è Attivo!</h1>
        </div>
        
        <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #333;">Ciao <strong>${userName}</strong>,</p>
            
            <p style="font-size: 16px; color: #333;">Grazie per aver acquistato il piano Premium di MyWellness! Il tuo pagamento è stato completato con successo.</p>
            
            <div style="background-color: #f0f9f8; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #26847F;">✅ Piano Premium Attivato</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #333;">Durata: 3 mesi</p>
            </div>
            
            <p style="font-size: 16px; color: #333;">Accedi subito alla tua dashboard per iniziare il tuo percorso di trasformazione:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #26847F, #14b8a6); color: #ffffff !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    Vai alla Dashboard
                </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${loginUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">Se hai bisogno di aiuto, contattaci a <a href="mailto:support@projectmywellness.com" style="color: #26847F;">support@projectmywellness.com</a></p>
        </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999999;">
        <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
        <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
        <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
    </div>
</body>
</html>
                    `
                });
                
                console.log('✅ Email sent to EXISTING user');
            }
            
        } catch (emailError) {
            console.error('❌ EMAIL ERROR:', emailError.message);
            console.error('❌ Email stack:', emailError.stack);
            // Don't fail the entire payment if email fails
        }

        console.log('🎉 === SUCCESS === 🎉');
        return new Response(JSON.stringify({
            success: true,
            payment: {
                id: paymentIntentId || 'free',
                status: 'succeeded',
                amount: amount / 100
            },
            user_id: userId,
            email_sent: true
        }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ PAYMENT ERROR');
        console.error('❌ ========================================');
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        
        let userMessage = 'Errore durante il pagamento';
        
        if (error.message.includes('card') || error.message.includes('declined')) {
            userMessage = 'Carta rifiutata. Controlla i dati o usa un\'altra carta.';
        } else if (error.message.includes('insufficient')) {
            userMessage = 'Fondi insufficienti sulla carta.';
        } else if (error.message.includes('incorrect_cvc')) {
            userMessage = 'CVC non corretto.';
        }
        
        return new Response(JSON.stringify({ 
            success: false,
            error: userMessage,
            details: error.message
        }), { status: 500, headers: corsHeaders });
    }
});
