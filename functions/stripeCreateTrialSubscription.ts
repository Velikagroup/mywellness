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
            billingInfo 
        } = body;

        console.log('📋 Request body parsed:', { planType, billingPeriod, orderBumpSelected, appliedCouponCode });

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
                    
                    // Invia email di benvenuto (in background)
                    (async () => {
                        try {
                            const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
                            const appUrl = 'https://app.projectmywellness.com';
                            
                            const htmlBody = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                                    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">🎁 Accesso Lifetime GRATUITO Attivato!</h1>
                                    </div>
                                    
                                    <div style="padding: 40px 30px;">
                                        <p style="font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 20px;">
                                            Ciao <strong>${user.full_name || 'benvenuto'}</strong>! 👋
                                        </p>
                                        
                                        <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">
                                            Hai attivato un <strong>accesso GRATUITO A VITA</strong> al piano <strong style="text-transform: uppercase;">${lifetimePlan}</strong>! 🎉
                                        </p>
                                        
                                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #f59e0b;">
                                            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">✨ Nessun Pagamento, Mai</h3>
                                            <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.6;">
                                                Il tuo accesso al piano <strong>${lifetimePlan.toUpperCase()}</strong> è <strong>completamente gratuito per sempre</strong>. Non ci saranno addebiti, nessun trial, nessun rinnovo. Goditi tutte le funzionalità premium!
                                            </p>
                                        </div>
                                        
                                        <div style="margin-bottom: 30px;">
                                            <h3 style="color: #333; margin-bottom: 15px; font-size: 20px;">🎯 Inizia Subito:</h3>
                                            <ul style="list-style: none; padding: 0; margin: 0;">
                                                <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                                    <strong style="color: #26847F;">1.</strong> Accedi alla tua dashboard personalizzata
                                                </li>
                                                <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                                    <strong style="color: #26847F;">2.</strong> Genera il tuo piano nutrizionale
                                                </li>
                                                <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                                    <strong style="color: #26847F;">3.</strong> Crea il tuo piano di allenamento
                                                </li>
                                                <li style="padding: 12px 0; font-size: 15px; color: #555;">
                                                    <strong style="color: #26847F;">4.</strong> Traccia i tuoi progressi senza limiti
                                                </li>
                                            </ul>
                                        </div>
                                        
                                        <div style="text-align: center; margin: 35px 0;">
                                            <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(38,132,127,0.3);">
                                                Vai alla Dashboard →
                                            </a>
                                        </div>
                                        
                                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 30px;">
                                            <p style="color: #666; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
                                                Hai domande? Siamo qui per aiutarti! Contattaci a <a href="mailto:${fromEmail}" style="color: #26847F; text-decoration: none;">${fromEmail}</a>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                        <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">© 2025 MyWellness by VELIKA GROUP LLC. All Rights Reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                            `;
                            
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                from_name: 'MyWellness',
                                to: user.email,
                                subject: '🎁 Il Tuo Accesso Lifetime GRATUITO è Attivo!',
                                body: htmlBody
                            });
                            
                            console.log('✅ Lifetime welcome email sent');
                        } catch (emailError) {
                            console.error('⚠️ Email error (non-critical):', emailError.message);
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

        // NORMALE FLUSSO STRIPE (se non è lifetime_free)
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

        console.log('🔄 Creating subscription...');
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: selectedPriceId }],
            trial_period_days: 3,
            payment_behavior: 'default_incomplete',
            payment_settings: { 
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                user_id: user.id,
                plan_type: planType,
                billing_period: billingPeriod,
                order_bump_selected: orderBumpSelected.toString(),
                traffic_source: trafficSource || 'direct',
                coupon_code: appliedCouponCode || 'none'
            }
        });

        console.log(`✅ Subscription created: ${subscription.id}`);

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

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 3);

        console.log('💾 Updating user record...');
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'trial',
            subscription_plan: planType,
            trial_ends_at: trialEndsAt.toISOString(),
            stripe_subscription_id: subscription.id,
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

        // 📧 INVIA EMAIL DI BENVENUTO (in background)
        (async () => {
            try {
                console.log('📧 Sending welcome email...');
                
                const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';
                const appUrl = 'https://app.projectmywellness.com';
                
                const htmlBody = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                        <div style="background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">🎉 Benvenuto in MyWellness!</h1>
                        </div>
                        
                        <div style="padding: 40px 30px;">
                            <p style="font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 20px;">
                                Ciao <strong>${user.full_name || 'benvenuto'}</strong>! 👋
                            </p>
                            
                            <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">
                                Grazie per aver scelto <strong>MyWellness</strong>! Il tuo percorso verso il benessere inizia ora. 🚀
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ec 100%); padding: 25px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #26847F;">
                                <h3 style="color: #26847F; margin: 0 0 15px 0; font-size: 18px;">✨ Prova Gratuita Attivata</h3>
                                <p style="color: #1a5753; margin: 0; font-size: 15px; line-height: 1.6;">
                                    Hai <strong>3 giorni gratis</strong> per esplorare tutte le funzionalità premium. Nessun addebito ora!
                                </p>
                            </div>
                            
                            <div style="margin-bottom: 30px;">
                                <h3 style="color: #333; margin-bottom: 15px; font-size: 20px;">🎯 Cosa Fare Adesso:</h3>
                                <ul style="list-style: none; padding: 0; margin: 0;">
                                    <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                        <strong style="color: #26847F;">1.</strong> Accedi alla tua dashboard personalizzata
                                    </li>
                                    <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                        <strong style="color: #26847F;">2.</strong> Genera il tuo piano nutrizionale settimanale
                                    </li>
                                    <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 15px; color: #555;">
                                        <strong style="color: #26847F;">3.</strong> Inizia il tuo piano di allenamento personalizzato
                                    </li>
                                    <li style="padding: 12px 0; font-size: 15px; color: #555;">
                                        <strong style="color: #26847F;">4.</strong> Traccia i tuoi progressi giornalieri
                                    </li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 20px rgba(38,132,127,0.3); transition: all 0.3s;">
                                    Vai alla Dashboard →
                                </a>
                            </div>
                            
                            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-top: 30px;">
                                <p style="color: #666; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
                                    Hai domande? Siamo qui per aiutarti! Rispondi a questa email o contattaci a <a href="mailto:${fromEmail}" style="color: #26847F; text-decoration: none;">${fromEmail}</a>
                                </p>
                            </div>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #999; font-size: 12px; margin: 0 0 5px 0;">© 2025 MyWellness by VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="color: #999; font-size: 11px; margin: 0;">30 N Gould St, Sheridan, WY 82801, United States</p>
                        </div>
                    </div>
                </body>
                </html>
                `;
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    from_name: 'MyWellness',
                    to: user.email,
                    subject: '🎉 Benvenuto in MyWellness - La Tua Prova Gratuita È Attiva!',
                    body: htmlBody
                });
                
                console.log('✅ Welcome email sent');
            } catch (emailError) {
                console.error('⚠️ Email error (non-critical):', emailError.message);
            }
        })();

        console.log('✅ Subscription setup completed successfully');

        return Response.json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                trial_end: subscription.trial_end
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