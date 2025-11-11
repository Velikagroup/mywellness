import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 stripeCreateTrialSubscription - Start');
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        console.error('❌ STRIPE_SECRET_KEY not configured!');
        return Response.json({ 
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
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        if (!cardData && !paymentMethodId) {
            return Response.json({ error: 'Missing payment information' }, { status: 400 });
        }

        console.log(`📋 Plan: ${planType}, Billing: ${billingPeriod}, Coupon: ${appliedCouponCode || 'None'}`);

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
            return Response.json({ 
                error: `Invalid plan/billing combination: ${planType}/${billingPeriod}` 
            }, { status: 400 });
        }

        console.log(`💳 Using Price ID: ${selectedPriceId}`);

        let stripeCustomerId = user.stripe_customer_id;
        
        if (!stripeCustomerId) {
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
        }

        let finalPaymentMethodId;

        if (paymentMethodId) {
            // Digital wallet - il Payment Method è già creato da Stripe.js
            console.log('💳 Using digital wallet payment method:', paymentMethodId);
            finalPaymentMethodId = paymentMethodId;
        } else {
            // Card - creiamo il Payment Method sul backend
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

        await stripe.paymentMethods.attach(finalPaymentMethodId, {
            customer: stripeCustomerId,
        });

        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
                default_payment_method: finalPaymentMethodId,
            },
        });

        console.log('✅ Payment method attached and set as default');

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
            billing_type: billingInfo?.billingType || 'private'
        });

        console.log('✅ User updated with subscription data');

        // 🔐 MARCA COUPON COME USATO (non-blocking)
        if (appliedCouponCode) {
            try {
                await base44.asServiceRole.functions.invoke('markCouponAsUsed', {
                    couponCode: appliedCouponCode,
                    userEmail: user.email
                });
                console.log(`🎫 Coupon ${appliedCouponCode} marked as used`);
            } catch (couponError) {
                console.error('⚠️ Failed to mark coupon as used (non-critical):', couponError.message);
            }
        }

        // 📧 INVIA EMAIL DI BENVENUTO (non-blocking, in background)
        // Non aspettiamo la risposta per non rallentare la subscription
        base44.asServiceRole.functions.invoke('sendTrialWelcomeEmail', {
            userId: user.id
        }).then(() => {
            console.log('📧 Trial welcome email trigger sent');
        }).catch((emailError) => {
            console.error('⚠️ Failed to send welcome email (non-critical):', emailError.message);
        });

        // IMPORTANTE: Restituisci subito la risposta senza aspettare l'email
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
        return Response.json({ 
            error: error.message,
            type: error.type,
            details: error.raw?.message || error.toString()
        }, { status: 500 });
    }
});