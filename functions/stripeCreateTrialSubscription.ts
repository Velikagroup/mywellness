import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 stripeCreateTrialSubscription - Start');
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        console.error('❌ STRIPE_SECRET_KEY not configured!');
        return Response.json({ 
            success: false,
            error: 'Stripe configuration missing. Please contact support.' 
        }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
    });
    
    console.log('✅ Stripe initialized');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error('❌ User not authenticated');
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ User authenticated:', user.email);

        const body = await req.json();
        const { 
            cardData,
            paymentMethodId,
            planType = 'base',
            billingPeriod = 'monthly',
            orderBumpSelected = false,
            appliedCouponCode = null,
            trafficSource = null,
            billingInfo,
            skipTrial = false,
            affiliateDiscountPercent = null
        } = body;

        console.log('📋 Request body parsed:', { planType, billingPeriod, orderBumpSelected, appliedCouponCode, skipTrial, affiliateDiscountPercent });

        // 🎫 VERIFICA SE IL COUPON È LIFETIME_FREE
        let isLifetimeFree = false;
        let lifetimePlan = null;
        
        if (appliedCouponCode) {
            const coupons = await base44.asServiceRole.entities.Coupon.filter({ 
                code: appliedCouponCode.toUpperCase() 
            });
            
            if (coupons && coupons.length > 0) {
                const coupon = coupons[0];
                
                if (coupon.discount_type === 'lifetime_free') {
                    console.log('🎉 LIFETIME FREE COUPON DETECTED!');
                    
                    // Verifica che il coupon sia assegnato a questo utente
                    if (coupon.assigned_to_email && coupon.assigned_to_email.toLowerCase() !== user.email.toLowerCase()) {
                        return Response.json({
                            success: false,
                            error: 'Questo coupon non è assegnato a te.'
                        }, { status: 403 });
                    }
                    
                    if (coupon.used_by && coupon.used_by !== user.id) {
                        return Response.json({
                            success: false,
                            error: 'Questo coupon è già stato utilizzato.'
                        }, { status: 403 });
                    }
                    
                    isLifetimeFree = true;
                    lifetimePlan = coupon.assigned_plan || 'premium';
                    
                    console.log(`✅ Lifetime free access granted: ${lifetimePlan} plan`);
                    
                    // Aggiorna l'utente con accesso lifetime gratuito
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_status: 'active',
                        subscription_plan: lifetimePlan,
                        stripe_subscription_id: null,
                        stripe_customer_id: null,
                        is_lifetime_free: true,
                        lifetime_coupon_code: appliedCouponCode,
                        traffic_source: trafficSource || 'direct',
                        quiz_completed: true
                    });
                    
                    // Marca il coupon come usato
                    await base44.asServiceRole.entities.Coupon.update(coupon.id, {
                        used_by: user.id,
                        used_at: new Date().toISOString()
                    });
                    
                    console.log('✅ User upgraded to lifetime free access');
                    
                    // Invia email lifetime usando SendGrid e template
                    (async () => {
                        try {
                            const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
                            const appUrl = 'https://app.projectmywellness.com';
                            
                            if (!sendGridApiKey) {
                                console.error('❌ SENDGRID_API_KEY not configured');
                                return;
                            }

                            const emailHtml = `
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
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">🎁 Accesso Lifetime GRATUITO!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Ciao ${user.full_name || 'Utente'}! 👋</p>
                            <p style="color: #555; line-height: 1.8; margin-bottom: 25px;">
                                Hai attivato un <strong>accesso GRATUITO A VITA</strong> al piano <strong style="text-transform: uppercase;">${lifetimePlan}</strong>! 🎉
                            </p>
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #f59e0b;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">✨ Nessun Pagamento, Mai</h3>
                                <p style="color: #78350f; margin: 0; line-height: 1.6;">
                                    Il tuo accesso è <strong>completamente gratuito per sempre</strong>. Nessun addebito, nessun trial, nessun rinnovo!
                                </p>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${appUrl}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px;">
                                    Vai alla Dashboard →
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

                            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${sendGridApiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    personalizations: [{ to: [{ email: user.email, name: user.full_name }] }],
                                    from: { email: 'info@projectmywellness.com', name: 'MyWellness' },
                                    reply_to: { email: 'info@projectmywellness.com' },
                                    subject: '🎁 Il Tuo Accesso Lifetime GRATUITO è Attivo!',
                                    content: [{ type: 'text/html', value: emailHtml }]
                                })
                            });

                            if (response.ok) {
                                console.log('✅ Lifetime email sent via SendGrid');
                            }
                        } catch (emailError) {
                            console.error('⚠️ Email error:', emailError);
                        }
                    })();
                    
                    return Response.json({
                        success: true,
                        isLifetimeFree: true,
                        plan: lifetimePlan,
                        message: 'Accesso lifetime gratuito attivato!'
                    });
                }
            }
        }

        // NORMALE FLUSSO STRIPE
        if (!cardData && !paymentMethodId) {
            console.error('❌ Missing payment information');
            return Response.json({ success: false, error: 'Missing payment information' }, { status: 400 });
        }

        const PRICE_IDS = {
            base: {
                monthly: 'price_1SNDMW2OXBs6ZYwlp5UgCO8Y',
                yearly: 'price_1SNDMW2OXBs6ZYwlUfiZP4Su'
            },
            pro: {
                monthly: 'price_1SNDMX2OXBs6ZYwlx6jXOgFf',
                yearly: 'price_1SNDMX2OXBs6ZYwlvGtzkQKA'
            },
            premium: {
                monthly: 'price_1SNDMX2OXBs6ZYwlKR7FIudX',
                yearly: 'price_1SNDMY2OXBs6ZYwlcZzmNSnk'
            }
        };

        const selectedPriceId = PRICE_IDS[planType]?.[billingPeriod];
        
        if (!selectedPriceId) {
            console.error('❌ Invalid plan/billing combination');
            return Response.json({ 
                success: false,
                error: `Invalid plan/billing combination: ${planType}/${billingPeriod}` 
            }, { status: 400 });
        }

        console.log(`💳 Using Price ID: ${selectedPriceId}`);

        let stripeCustomerId = user.stripe_customer_id;
        
        if (!stripeCustomerId) {
            console.log('🆕 Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: user.email,
                name: billingInfo?.name || user.full_name,
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
            
            await base44.asServiceRole.entities.User.update(user.id, {
                stripe_customer_id: stripeCustomerId
            });
            
            console.log(`✅ Customer created: ${stripeCustomerId}`);
        } else {
            console.log('✅ Using existing customer:', stripeCustomerId);
        }

        let finalPaymentMethodId;

        if (paymentMethodId) {
            console.log('💳 Using digital wallet payment method:', paymentMethodId);
            finalPaymentMethodId = paymentMethodId;
        } else {
            console.log('💳 Creating card payment method...');
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: cardData.number,
                    exp_month: cardData.exp_month,
                    exp_year: cardData.exp_year,
                    cvc: cardData.cvc,
                },
                billing_details: {
                    name: billingInfo?.name,
                    email: billingInfo?.email,
                    address: billingInfo ? {
                        line1: billingInfo.address,
                        city: billingInfo.city,
                        postal_code: billingInfo.zip,
                        country: billingInfo.country
                    } : undefined
                }
            });
            
            finalPaymentMethodId = paymentMethod.id;
            console.log(`✅ Card payment method created: ${finalPaymentMethodId}`);
        }

        console.log('📌 Attaching payment method to customer...');
        await stripe.paymentMethods.attach(finalPaymentMethodId, {
            customer: stripeCustomerId,
        });

        console.log('📌 Setting default payment method...');
        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
                default_payment_method: finalPaymentMethodId,
            },
        });

        console.log('✅ Payment method attached and set as default');

        let finalSubscription;
        let subscriptionSchedule = null;

        if (skipTrial) {
            console.log('🔄 Creating IMMEDIATE paid subscription (no trial)...');
            
            // 🎁 Create Stripe coupon if affiliate discount applies
            let stripeCouponId = null;
            if (affiliateDiscountPercent && affiliateDiscountPercent > 0) {
                console.log(`🎁 Creating ${affiliateDiscountPercent}% affiliate discount coupon...`);
                const stripeCoupon = await stripe.coupons.create({
                    percent_off: affiliateDiscountPercent,
                    duration: 'once',
                    name: `Affiliate Discount ${affiliateDiscountPercent}%`,
                    metadata: {
                        user_id: user.id,
                        referred_by: user.referred_by || 'unknown',
                        type: 'affiliate_first_month'
                    }
                });
                stripeCouponId = stripeCoupon.id;
                console.log(`✅ Stripe coupon created: ${stripeCouponId}`);
            }
            
            // Crea direttamente una subscription attiva a pagamento
            // IMPORTANTE: trial_period_days: 0 sovrascrive il trial configurato nel prezzo Stripe
            const subscriptionParams = {
                customer: stripeCustomerId,
                items: [{ price: selectedPriceId }],
                trial_period_days: 0, // 🔥 FORZA NESSUN TRIAL - addebita subito
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    payment_method_types: ['card'],
                    save_default_payment_method: 'on_subscription'
                },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    user_id: user.id,
                    subscription_type: 'paid',
                    plan_type: planType,
                    billing_period: billingPeriod,
                    traffic_source: trafficSource || 'direct',
                    coupon_code: appliedCouponCode || 'none',
                    affiliate_discount_applied: affiliateDiscountPercent ? 'true' : 'false'
                }
            };
            
            // Apply coupon if exists
            if (stripeCouponId) {
                subscriptionParams.coupon = stripeCouponId;
            }
            
            finalSubscription = await stripe.subscriptions.create(subscriptionParams);

            console.log(`✅ Paid subscription created: ${finalSubscription.id}`);
            
            // Conferma il pagamento immediatamente
            if (finalSubscription.latest_invoice?.payment_intent?.status === 'requires_payment_method') {
                await stripe.paymentIntents.confirm(finalSubscription.latest_invoice.payment_intent.id, {
                    payment_method: finalPaymentMethodId
                });
            }

        } else {
            console.log('🔄 Creating TRIAL subscription (3 days, €0)...');
            
            // Crea prima il trial a €0 per 3 giorni
            const trialSubscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: 'price_1SVOUk2OXBs6ZYwlA3zq3ZPq' }],
                payment_behavior: 'default_incomplete',
                cancel_at_period_end: true,
                metadata: {
                    user_id: user.id,
                    subscription_type: 'trial',
                    converts_to_plan: planType,
                    converts_to_price: selectedPriceId,
                    billing_period: billingPeriod,
                    traffic_source: trafficSource || 'direct',
                    coupon_code: appliedCouponCode || 'none'
                }
            });

            console.log(`✅ Trial subscription created: ${trialSubscription.id}`);
            
            // Schedula la subscription vera dopo 3 giorni
            const scheduledDate = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60);
            subscriptionSchedule = await stripe.subscriptionSchedules.create({
                customer: stripeCustomerId,
                start_date: scheduledDate,
                end_behavior: 'release',
                phases: [
                    {
                        items: [{ price: selectedPriceId }],
                        iterations: 1
                    }
                ],
                metadata: {
                    user_id: user.id,
                    plan_type: planType,
                    billing_period: billingPeriod,
                    converted_from_trial: 'true'
                }
            });

            console.log(`✅ Subscription scheduled for after trial: ${subscriptionSchedule.id}`);
            finalSubscription = trialSubscription;
        }

        console.log(`✅ Subscription created: ${finalSubscription.id}`);

        let orderBumpPaymentIntent = null;
        if (orderBumpSelected) {
            console.log('💰 Processing order bump...');
            const orderBumpPrice = 1999;
            orderBumpPaymentIntent = await stripe.paymentIntents.create({
                amount: orderBumpPrice,
                currency: 'eur',
                customer: stripeCustomerId,
                payment_method: finalPaymentMethodId,
                off_session: true,
                confirm: true,
                description: 'Mastery AI Wellness - Video Corso',
                metadata: {
                    user_id: user.id,
                    type: 'order_bump',
                    traffic_source: trafficSource || 'direct'
                }
            });
            
            console.log(`✅ Order Bump payment created: ${orderBumpPaymentIntent.id}`);
        }

        console.log('💾 Updating user record...');
        
        if (skipTrial) {
            // Pagamento immediato - piano attivo subito
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'active',
                subscription_plan: planType,
                trial_ends_at: null,
                stripe_subscription_id: finalSubscription.id,
                stripe_subscription_schedule_id: null,
                stripe_customer_id: stripeCustomerId,
                traffic_source: trafficSource || 'direct',
                phone_number: body.phoneNumber || user.phone_number,
                billing_name: billingInfo?.name || user.full_name,
                billing_address: billingInfo?.address,
                billing_city: billingInfo?.city,
                billing_zip: billingInfo?.zip,
                billing_country: billingInfo?.country,
                company_name: billingInfo?.companyName,
                tax_id: billingInfo?.taxId,
                pec_sdi: billingInfo?.pecSdi,
                billing_type: billingInfo?.billingType || 'private',
                quiz_completed: true
            });
        } else {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 3);
            
            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_status: 'trial',
                subscription_plan: 'trial',
                target_plan_after_trial: planType,
                trial_ends_at: trialEndsAt.toISOString(),
                stripe_subscription_id: finalSubscription.id,
                stripe_subscription_schedule_id: subscriptionSchedule?.id,
                stripe_customer_id: stripeCustomerId,
                traffic_source: trafficSource || 'direct',
                phone_number: body.phoneNumber || user.phone_number,
                billing_name: billingInfo?.name || user.full_name,
                billing_address: billingInfo?.address,
                billing_city: billingInfo?.city,
                billing_zip: billingInfo?.zip,
                billing_country: billingInfo?.country,
                company_name: billingInfo?.companyName,
                tax_id: billingInfo?.taxId,
                pec_sdi: billingInfo?.pecSdi,
                billing_type: billingInfo?.billingType || 'private',
                quiz_completed: true
            });
        }

        console.log('✅ User updated with subscription data');

        // 🎫 MARCA COUPON COME USATO (se applicabile)
        if (appliedCouponCode) {
            try {
                console.log(`🎫 Marking coupon ${appliedCouponCode} as used...`);
                const coupons = await base44.asServiceRole.entities.Coupon.filter({ 
                    code: appliedCouponCode.toUpperCase() 
                });
                
                if (coupons && coupons.length > 0) {
                    const coupon = coupons[0];
                    await base44.asServiceRole.entities.Coupon.update(coupon.id, {
                        used_by: user.id,
                        used_at: new Date().toISOString()
                    });
                    console.log(`✅ Coupon marked as used`);
                }
            } catch (couponError) {
                console.error('⚠️ Coupon marking error (non-critical):', couponError.message);
            }
        }

        // 📧 INVIA EMAIL DI BENVENUTO usando SendGrid e template
        (async () => {
            try {
                console.log('📧 Sending welcome email via SendGrid...');
                
                const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
                const appUrl = 'https://app.projectmywellness.com';
                
                if (!sendGridApiKey) {
                    console.error('❌ SENDGRID_API_KEY not configured');
                    return;
                }

                // Carica template dal database
                const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
                    template_id: 'standard_subscription_welcome',
                    is_active: true 
                });
                
                let emailHtml;
                let subject;
                
                if (templates.length > 0) {
                    const template = templates[0];
                    const greeting = template.greeting.replace('{user_name}', user.full_name || 'Utente');
                    const mainContent = template.main_content.replace('{app_url}', appUrl);
                    const ctaUrl = template.call_to_action_url.replace('{app_url}', appUrl);
                    subject = template.subject;

                    emailHtml = `
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
        }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: white; padding: 40px 30px 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">${subject}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">${greeting}</h2>
                            <p style="color: #1a5753; line-height: 1.8; white-space: pre-line;">${mainContent}</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold;">
                                    ${template.call_to_action_text}
                                </a>
                            </div>
                            <p style="color: #6b7280; margin-top: 30px;">${template.footer_text}</p>
                        </td>
                    </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St, Sheridan, WY 82801, United States</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
                } else {
                    // Fallback se template non trovato
                    subject = '🎉 Benvenuto in MyWellness!';
                    emailHtml = `<p>Benvenuto ${user.full_name}!</p>`;
                }

                const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sendGridApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email: user.email, name: user.full_name }] }],
                        from: { email: 'info@projectmywellness.com', name: 'MyWellness' },
                        reply_to: { email: 'info@projectmywellness.com' },
                        subject: subject,
                        content: [{ type: 'text/html', value: emailHtml }]
                    })
                });

                if (response.ok) {
                    console.log('✅ Welcome email sent via SendGrid');
                } else {
                    const errorText = await response.text();
                    console.error('❌ SendGrid error:', errorText);
                }
            } catch (emailError) {
                console.error('⚠️ Email error (non-critical):', emailError);
            }
        })();

        console.log('✅ Subscription setup completed successfully');

        return Response.json({
            success: true,
            subscription: {
                id: finalSubscription.id,
                status: finalSubscription.status,
                trial_end: skipTrial ? null : finalSubscription.current_period_end,
                scheduled_conversion: subscriptionSchedule?.id,
                immediate_payment: skipTrial
            },
            orderBump: orderBumpPaymentIntent ? {
                id: orderBumpPaymentIntent.id,
                status: orderBumpPaymentIntent.status
            } : null
        });

    } catch (error) {
        console.error('❌ Stripe subscription error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error',
            details: error.toString()
        }, { status: 500 });
    }
});