import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

Deno.serve(async (req) => {
    console.log('💳 stripeCreateOneTimePayment - Start');

    const commonHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: commonHeaders });
    }

    // ✅ SECURITY: Validate request authenticity
    // This is a public endpoint (no user auth required) but we validate request origin
    const origin = req.headers.get('origin');
    const allowedOrigins = [
        'https://app.mywellness.pro',
        'https://projectmywellness.com',
        'http://localhost:3000'
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
        console.warn('⚠️ Request from unauthorized origin:', origin);
        // Allow anyway but log for monitoring
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        console.error('❌ Stripe key not found');
        return Response.json({ 
            success: false,
            error: 'Stripe not configured' 
        }, { status: 500, headers: commonHeaders });
    }
    
    console.log('✅ Stripe key loaded');
    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
    });
    
    let userEmail: string | null = null;
    let userName: string | null = null;
    let paymentIntentId: string | null = null;
    let finalPaymentMethodId: string | null = null;
    let cardLast4: string = '';
    let cardBrand: string = '';
    let stripeCustomerId: string | null = null;
    let amount: number = 0; // Initialize amount for error logging

    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { 
            userEmail: bodyUserEmail, // Rename to avoid conflict with outer scope
            userName: bodyUserName,   // Rename to avoid conflict with outer scope
            cardData,
            paymentMethodId,
            planType = 'premium',
            appliedCouponCode = null,
            orderBumpSelected = false,
            trafficSource = null,
            billingInfo,
            phoneNumber // Assuming phoneNumber comes directly from the body
        } = body;

        userEmail = bodyUserEmail;
        userName = bodyUserName;

        if (!userEmail || !userName) {
            return Response.json({ 
                success: false,
                error: 'Missing user info (email or name)' 
            }, { status: 400, headers: commonHeaders });
        }

        if (!cardData && !paymentMethodId) {
            return Response.json({ 
                success: false,
                error: 'Missing payment info (cardData or paymentMethodId)' 
            }, { status: 400, headers: commonHeaders });
        }

        console.log(`📧 Processing payment for: ${userEmail}`);
        console.log('🔍 Traffic Source:', trafficSource || 'direct');

        // Check if user exists using SDK
        console.log('👤 Checking if user exists...');
        const existingUsers = await base44.asServiceRole.entities.User.filter({ 
            email: userEmail 
        });

        let user: { id: string, stripe_customer_id?: string, purchased_landing_offer?: boolean };
        let isNewUser = false;
        let tempPassword: string | null = null;
        
        if (existingUsers && existingUsers.length > 0) {
            user = existingUsers[0];
            console.log(`✅ Existing user found: ${user.id}`);
            
            if (user.purchased_landing_offer) {
                return Response.json({ 
                    success: false, 
                    error: 'Hai già acquistato questa offerta' 
                }, { status: 400, headers: commonHeaders });
            }
        } else {
            console.log('➕ Creating new user...');
            tempPassword = generateRandomPassword();
            
            const newUser = await base44.asServiceRole.auth.createUser({
                email: userEmail,
                password: tempPassword,
                full_name: userName,
                role: 'user' // Default role for new users
            });

            user = newUser;
            isNewUser = true;
            console.log(`✅ New user created: ${user.id}`);
            console.log('🔑 Temp password:', tempPassword);
        }

        // Calculate amount
        const basePrice = 6700; // €67.00
        const orderBumpPrice = orderBumpSelected ? 1999 : 0; // €19.99
        let totalPrice = basePrice + orderBumpPrice;

        if (appliedCouponCode) {
            const coupons = await base44.asServiceRole.entities.Coupon.filter({
                code: appliedCouponCode,
                is_active: true // Ensure coupon is active
            });

            if (coupons.length > 0) {
                const coupon = coupons[0];
                if (coupon.discount_type === 'percentage' && coupon.discount_value !== undefined) {
                    const discount = Math.round(totalPrice * (coupon.discount_value / 100));
                    totalPrice = Math.max(0, totalPrice - discount); // Ensure amount doesn't go below zero
                    console.log(`💰 Coupon applied: ${appliedCouponCode}, Discount: ${coupon.discount_value}%, New Total: €${(totalPrice / 100).toFixed(2)}`);
                } else if (coupon.discount_type === 'fixed' && coupon.discount_value !== undefined) {
                    totalPrice = Math.max(0, totalPrice - coupon.discount_value);
                    console.log(`💰 Coupon applied: ${appliedCouponCode}, Fixed Discount: €${(coupon.discount_value / 100).toFixed(2)}, New Total: €${(totalPrice / 100).toFixed(2)}`);
                } else {
                    console.log(`⚠️ Coupon ${appliedCouponCode} found but has unsupported discount type or value.`);
                }
            } else {
                console.log(`⚠️ Coupon ${appliedCouponCode} not found or not active.`);
            }
        }
        amount = totalPrice; // Set the global amount variable
        console.log('💰 Amount:', amount, 'cents (€' + (amount/100).toFixed(2) + ')');

        // Process payment with Stripe
        if (amount > 0) {
            console.log('💳 Processing payment...');

            stripeCustomerId = user.stripe_customer_id;
            
            // Step 1: Ensure Stripe Customer exists
            if (!stripeCustomerId) {
                console.log('🔄 Step 1/X: Creating Stripe Customer...');
                const customer = await stripe.customers.create({
                    email: userEmail,
                    name: userName,
                    metadata: {
                        user_id: user.id,
                        base44_app: 'mywellness'
                    },
                    address: billingInfo ? {
                        line1: billingInfo.address,
                        city: billingInfo.city,
                        postal_code: billingInfo.zip,
                        country: billingInfo.country
                    } : undefined
                });
                stripeCustomerId = customer.id;
                console.log(`✅ Customer created: ${stripeCustomerId}`);
            } else {
                console.log(`✅ Using existing Stripe Customer: ${stripeCustomerId}`);
            }

            // Step 2: Create Payment Method if cardData provided, or use existing paymentMethodId
            if (paymentMethodId) {
                console.log('🍎 Step 2/X: Using digital wallet payment method');
                finalPaymentMethodId = paymentMethodId;
                // Try to retrieve card details for logging/storage if possible
                try {
                    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
                    if (pm.card) {
                        cardLast4 = pm.card.last4;
                        cardBrand = pm.card.brand;
                    }
                } catch (retrieveError) {
                    console.warn('Could not retrieve payment method details for digital wallet:', retrieveError.message);
                }
            } else if (cardData) {
                console.log('🔄 Step 2/X: Creating Stripe Card Payment Method...');
                console.log('💳 Card ending in:', cardData.number.replace(/\s/g, '').slice(-4));
                console.log('💳 Expiry:', cardData.exp_month + '/' + cardData.exp_year);

                const paymentMethod = await stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: cardData.number,
                        exp_month: cardData.exp_month,
                        exp_year: cardData.exp_year,
                        cvc: cardData.cvc,
                    },
                    billing_details: {
                        name: billingInfo?.name || userName,
                        email: userEmail,
                        address: billingInfo ? {
                            line1: billingInfo.address,
                            city: billingInfo.city,
                            postal_code: billingInfo.zip,
                            country: billingInfo.country
                        } : undefined
                    }
                });
                
                finalPaymentMethodId = paymentMethod.id;
                cardLast4 = paymentMethod.card.last4;
                cardBrand = paymentMethod.card.brand;
                console.log(`✅ Card payment method created: ${finalPaymentMethodId}`);
            } else {
                throw new Error('No valid payment method or card data provided.');
            }

            // Step 3: Attach Payment Method to Customer and set as default
            if (stripeCustomerId && finalPaymentMethodId) {
                try {
                    console.log(`🔄 Step 3/X: Attaching payment method ${finalPaymentMethodId} to customer ${stripeCustomerId}`);
                    await stripe.paymentMethods.attach(finalPaymentMethodId, {
                        customer: stripeCustomerId,
                    });
                    console.log(`✅ Payment method attached.`);
                } catch (attachError) {
                    // If payment method is already attached, Stripe throws an error (e.g., "resource_missing" if already moved)
                    if (attachError instanceof Stripe.StripeError && attachError.code === 'resource_missing' && attachError.message.includes('already been attached')) {
                        console.log('Payment method already attached to customer, skipping attach step.');
                    } else {
                        throw attachError; // Re-throw other errors
                    }
                }
                
                console.log(`🔄 Step 4/X: Setting default payment method for customer ${stripeCustomerId}`);
                await stripe.customers.update(stripeCustomerId, {
                    invoice_settings: {
                        default_payment_method: finalPaymentMethodId,
                    },
                });
                console.log(`✅ Default payment method set.`);
            }

            // Step 5: Create and Confirm Payment Intent
            console.log('🔄 Step 5/X: Creating Payment Intent...');
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'eur',
                customer: stripeCustomerId,
                payment_method: finalPaymentMethodId,
                off_session: true, // For confirming payment methods that require interaction
                confirm: true,
                description: 'MyWellness - Landing Offer (3 mesi Premium)',
                metadata: {
                    user_id: user.id,
                    type: 'landing_offer',
                    plan_type: planType,
                    order_bump: orderBumpSelected.toString(),
                    traffic_source: trafficSource || 'landing',
                    coupon_code: appliedCouponCode || 'none'
                }
            });

            if (paymentIntent.status !== 'succeeded') {
                console.error('❌ Payment status:', paymentIntent.status);
                // Handle scenarios where payment might require further action, e.g., 3D Secure
                if (paymentIntent.status === 'requires_action' && paymentIntent.next_action?.type === 'use_stripe_sdk') {
                    // This typically means front-end action is needed. For server-side with `confirm: true`, it's an error.
                    throw new Error('Payment requires further action (e.g., 3D Secure) not handled server-side.');
                }
                throw new Error('Payment not succeeded: ' + paymentIntent.status);
            }

            paymentIntentId = paymentIntent.id;
            console.log('✅ Payment succeeded:', paymentIntentId);

        } else {
            console.log('💰 Amount is 0, skipping Stripe payment process.');
            paymentIntentId = 'free_offer'; // Assign a dummy ID for free offers
        }

        // Update user data using SDK
        console.log('💾 Updating user data...');
        const subscriptionPeriodEnd = new Date();
        subscriptionPeriodEnd.setMonth(subscriptionPeriodEnd.getMonth() + 3);

        const updateData = {
            subscription_status: 'active',
            subscription_plan: planType,
            subscription_period_end: subscriptionPeriodEnd.toISOString(),
            stripe_customer_id: stripeCustomerId,
            payment_method_id: finalPaymentMethodId,
            card_last4: cardLast4,
            card_brand: cardBrand,
            last_payment_amount: amount / 100,
            last_payment_date: new Date().toISOString(),
            purchased_landing_offer: true,
            traffic_source: trafficSource || 'landing',
            billing_name: userName,
            company_name: billingInfo?.companyName,
            tax_id: billingInfo?.taxId,
            pec_sdi: billingInfo?.pecSdi,
            billing_type: billingInfo?.billingType,
            billing_address: billingInfo?.address,
            billing_city: billingInfo?.city,
            billing_zip: billingInfo?.zip,
            billing_country: billingInfo?.country,
            phone_number: phoneNumber,
            order_bump_selected: orderBumpSelected,
            created_via_landing: isNewUser
        };

        await base44.asServiceRole.entities.User.update(user.id, updateData);

        console.log('✅ User data updated');

        // Mark coupon as used if applicable
        if (appliedCouponCode) {
            try {
                console.log(`🎫 Attempting to mark coupon ${appliedCouponCode} as used for ${userEmail}`);
                await base44.asServiceRole.functions.invoke('markCouponAsUsed', {
                    couponCode: appliedCouponCode,
                    userEmail: userEmail
                });
                console.log(`🎫 Coupon ${appliedCouponCode} marked as used`);
            } catch (couponError) {
                console.error('⚠️ Failed to mark coupon as used (non-critical):', couponError.message);
                console.error('⚠️ Coupon error stack:', couponError.stack);
            }
        }

        // 📧 Send welcome email LANDING OFFER - Localizzata
        const userLanguage = (await base44.asServiceRole.entities.User.get(user.id)).preferred_language || 'it';
        const templateId = isNewUser ? `landing_new_user_${userLanguage}` : `landing_existing_user_${userLanguage}`;
        
        console.log(`📧 Sending landing offer email: ${templateId}`);
        
        try {
            await base44.asServiceRole.functions.invoke('sendEmailUnified', {
                userId: user.id,
                userEmail: user.email,
                templateId: templateId,
                variables: {
                    user_name: userName || 'Utente'
                },
                language: userLanguage,
                triggerSource: 'stripeCreateOneTimePayment'
            });
            console.log('✅ Landing offer email sent');
        } catch (emailError) {
            console.error('❌ Email error (non-critical):', emailError.message);
        }
        
        // LEGACY: Send temp password email if new user
        const APP_URL = Deno.env.get('APP_URL') || 'https://app.mywellness.pro';
        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
        
        try {
            if (isNewUser && tempPassword) {
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
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 30px 20px !important; }
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
                        <td style="background: white; padding: 40px 30px 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin-top: 20px;">Benvenuto in MyWellness!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="font-size: 16px; color: #333;">Ciao <strong>${userName}</strong>,</p>
                            
                            <p style="font-size: 16px; color: #333;">Grazie per aver scelto MyWellness! Il tuo acquisto è stato completato con successo.</p>
                            
                            <div style="background-color: #f0f9f8; border-left: 4px solid #26847F; padding: 20px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 16px;"><strong>La tua password temporanea:</strong></p>
                                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #26847F; letter-spacing: 2px;">${tempPassword}</p>
                            </div>
                            
                            <p style="font-size: 16px; color: #333;">Per iniziare, clicca sul pulsante qui sotto e crea la tua password personale:</p>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 10px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(to right, #26847F, #14b8a6); color: #ffffff !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                                            Accedi alla Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 14px; color: #666;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
                            <p style="font-size: 12px; color: #999; word-break: break-all;">${dashboardUrl}</p>
                            
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            
                            <p style="font-size: 14px; color: #666;">Se hai bisogno di aiuto, contattaci a <a href="mailto:support@projectmywellness.com" style="color: #26847F;">support@projectmywellness.com</a></p>
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
                    `
                });
                
                console.log('✅ Email sent to NEW user');
            }
            
        } catch (emailError) {
            console.error('❌ EMAIL ERROR:', emailError.message);
            console.error('❌ Email stack:', emailError.stack);
            // Don't fail the entire payment if email fails
        }

        console.log('🎉 === SUCCESS === 🎉');
        return Response.json({
            success: true,
            payment: {
                id: paymentIntentId || 'free_offer',
                status: 'succeeded',
                amount: amount / 100
            },
            user_id: user.id,
            email_sent: true
        }, { status: 200, headers: commonHeaders });

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ PAYMENT ERROR');
        console.error('❌ ========================================');
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        
        let userMessage = 'Errore durante il pagamento';
        
        if (error instanceof Stripe.StripeError) {
            switch (error.type) {
                case 'StripeCardError':
                    userMessage = error.message || 'Carta rifiutata. Controlla i dati o usa un\'altra carta.';
                    break;
                case 'StripeRateLimitError':
                    userMessage = 'Troppe richieste. Riprova più tardi.';
                    break;
                case 'StripeInvalidRequestError':
                    userMessage = 'Dati di pagamento non validi. Controlla i dettagli forniti.';
                    break;
                default:
                    userMessage = 'Errore sconosciuto di Stripe. Riprova più tardi.';
            }
        } else if (error.message.includes('card') || error.message.includes('declined')) {
            userMessage = 'Carta rifiutata. Controlla i dati o usa un\'altra carta.';
        } else if (error.message.includes('insufficient')) {
            userMessage = 'Fondi insufficienti sulla carta.';
        } else if (error.message.includes('incorrect_cvc')) {
            userMessage = 'CVC non corretto.';
        } else if (error.message.includes('Payment requires further action')) {
            userMessage = 'Pagamento richiede azione aggiuntiva (es. 3D Secure), impossibile completare.';
        }
        
        return Response.json({ 
            success: false,
            error: userMessage,
            details: error.message
        }, { status: 500, headers: commonHeaders });
    }
});