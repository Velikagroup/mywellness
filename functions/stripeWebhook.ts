import { Base44 } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    console.log('🔔 Stripe Webhook - Start');

    const sig = req.headers.get('stripe-signature');

    if (!sig || !webhookSecret) {
        console.error('❌ Missing signature or webhook secret');
        return Response.json({ error: 'Webhook configuration error' }, { status: 400 });
    }

    let event;

    try {
        const body = await req.text();
        console.log('📦 Request body length:', body.length);
        
        // ✅ Initialize Base44 SDK with service role BEFORE using the request body
        const base44 = new Base44({
            appId: Deno.env.get('BASE44_APP_ID'),
            serviceRole: true
        });
        console.log('✅ Base44 SDK initialized');

        // Validate Stripe signature
        event = await stripe.webhooks.constructEventAsync(
            body,
            sig,
            webhookSecret
        );
        console.log(`📨 Event validated: ${event.type} - ID: ${event.id}`);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                console.log('💳 Processing checkout.session.completed...');
                const session = event.data.object;
                console.log('Session ID:', session.id);
                console.log('Customer ID:', session.customer);
                console.log('Payment Intent ID:', session.payment_intent);

                const customerId = session.customer;
                const paymentIntentId = session.payment_intent;

                console.log('🔍 Searching for user with stripe_customer_id:', customerId);
                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
                console.log('👥 Users found:', users.length);

                if (users.length > 0) {
                    const user = users[0];
                    console.log('✅ User found:', user.id, user.email);
                    
                    const metadata = session.metadata || {};
                    console.log('📋 Session metadata:', JSON.stringify(metadata));

                    const isLandingOffer = metadata.type === 'landing_offer';
                    const plan = metadata.plan_type || 'premium';
                    const amount = session.amount_total / 100;
                    const trafficSource = metadata.traffic_source || user.traffic_source || 'direct';

                    console.log('💰 Transaction details:', {
                        isLandingOffer,
                        plan,
                        amount,
                        trafficSource
                    });

                    // Create transaction record
                    console.log('💾 Creating transaction...');
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_payment_intent_id: paymentIntentId,
                        stripe_invoice_id: session.invoice || null,
                        amount: amount,
                        currency: session.currency || 'eur',
                        status: 'succeeded',
                        type: isLandingOffer ? 'one_time_payment' : 'subscription_payment',
                        plan: isLandingOffer ? 'landing_offer' : plan,
                        billing_period: isLandingOffer ? 'one_time' : (metadata.billing_period || 'monthly'),
                        payment_date: new Date().toISOString(),
                        description: isLandingOffer ? 'Landing Offer - 3 mesi Premium' : `Checkout ${plan}`,
                        traffic_source: trafficSource,
                        metadata: {
                            ...metadata,
                            payment_method: session.payment_method_types?.[0] || 'card',
                            coupon_code: user.applied_coupon_code || metadata.coupon_code || null,
                            original_amount: session.amount_total + (session.total_details?.amount_discount || 0)
                        }
                    });

                    console.log(`✅ Transaction created successfully: ${transaction.id}`);

                    // 🔗 AFFILIATE: Traccia commissione se utente è affiliato
                    if (user.referred_by_affiliate_code) {
                        try {
                            const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                                affiliate_code: user.referred_by_affiliate_code
                            });

                            if (affiliateLinks.length > 0) {
                                const affiliateLink = affiliateLinks[0];
                                const affiliateLinkId = affiliateLink.id || affiliateLink._id;
                                const commissionAmount = amount * 0.10; // 10%
                                
                                console.log(`📋 AffiliateLink found - ID: ${affiliateLinkId}, user_id: ${affiliateLink.user_id}`);
                                console.log(`📊 Current totals - earned: ${affiliateLink.total_earned || 0}, balance: ${affiliateLink.available_balance || 0}`);

                                // Crea credito commissione
                                const creditResult = await base44.asServiceRole.entities.AffiliateCredit.create({
                                    affiliate_user_id: affiliateLink.user_id,
                                    referred_user_id: user.id,
                                    transaction_id: transaction.id,
                                    stripe_payment_intent_id: paymentIntentId,
                                    amount_paid: amount,
                                    commission_amount: commissionAmount,
                                    commission_status: 'available',
                                    payment_date: new Date().toISOString()
                                });
                                console.log(`✅ AffiliateCredit created: ${creditResult.id}`);

                                // Aggiorna totali affiliate link
                                const newTotalEarned = (affiliateLink.total_earned || 0) + commissionAmount;
                                const newAvailableBalance = (affiliateLink.available_balance || 0) + commissionAmount;
                                
                                try {
                                    const updateResult = await base44.asServiceRole.entities.AffiliateLink.update(affiliateLinkId, {
                                        total_earned: newTotalEarned,
                                        available_balance: newAvailableBalance
                                    });
                                    console.log(`✅ AffiliateLink updated - new earned: ${newTotalEarned}, new balance: ${newAvailableBalance}`);
                                    console.log(`📋 Update result:`, JSON.stringify(updateResult));
                                } catch (updateErr) {
                                    console.error(`❌ AffiliateLink update FAILED: ${updateErr.message}`);
                                    console.error(`Stack: ${updateErr.stack}`);
                                }

                                console.log(`✅ Affiliate commission tracked: €${commissionAmount.toFixed(2)} for ${affiliateLink.user_id}`);
                            }
                        } catch (affiliateError) {
                            console.error('⚠️ Affiliate tracking error:', affiliateError);
                        }
                    }

                    // Generate and save invoice PDF
                    try {
                        console.log('📄 Generating invoice PDF...');
                        const invoiceResponse = await base44.asServiceRole.functions.invoke('generateInvoicePDF', {
                            transactionId: transaction.id
                        });

                        if (invoiceResponse?.data?.invoice_url) {
                            console.log('✅ Invoice generated:', invoiceResponse.data.invoice_url);
                            await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                                invoice_pdf_url: invoiceResponse.data.invoice_url,
                                metadata: {
                                    ...transaction.metadata,
                                    invoice_url: invoiceResponse.data.invoice_url
                                }
                            });
                            console.log('✅ Invoice URL saved to transaction');
                        } else {
                            console.warn('⚠️ No invoice URL returned');
                        }
                    } catch (invoiceError) {
                        console.error('⚠️ Invoice generation failed:', invoiceError.message);
                        console.error('Stack:', invoiceError.stack);
                    }

                    console.log(`✅ Transaction recorded for user ${user.id}: €${amount} (ID: ${transaction.id})`);
                } else {
                    console.warn('⚠️ No user found with stripe_customer_id:', customerId);
                }
                break;
            }

            case 'invoice.created': {
                    // 🔗 AFFILIATE: Applica credito affiliazione come sconto sulla fattura di rinnovo
                    const invoiceCreated = event.data.object;
                    console.log('📄 Invoice created:', invoiceCreated.id);
                    console.log('📋 Billing reason:', invoiceCreated.billing_reason);
                    console.log('📋 Subscription:', invoiceCreated.subscription);

                    // Solo per fatture di rinnovo subscription (non creazione iniziale)
                    if (!invoiceCreated.subscription) {
                        console.log('⏭️ Skipping - not a subscription invoice');
                        break;
                    }

                    // Salta la prima fattura (creazione subscription)
                    if (invoiceCreated.billing_reason === 'subscription_create') {
                        console.log('⏭️ Skipping - initial subscription invoice');
                        break;
                    }

                    const invoiceCustomerId = invoiceCreated.customer;
                    console.log('🔍 Looking for user with stripe_customer_id:', invoiceCustomerId);

                    const invoiceUsers = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: invoiceCustomerId });
                    console.log('👥 Users found:', invoiceUsers.length);

                    if (invoiceUsers.length > 0) {
                        const invoiceUser = invoiceUsers[0];
                        console.log('👤 User found:', invoiceUser.email, 'ID:', invoiceUser.id);

                        // Cerca affiliate link dell'utente (l'utente è un affiliato con crediti)
                        const userAffiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: invoiceUser.id });
                        console.log('🔗 Affiliate links found:', userAffiliateLinks.length);

                        if (userAffiliateLinks.length > 0) {
                            const userAffiliateLink = userAffiliateLinks[0];
                            const availableBalance = userAffiliateLink.available_balance || 0;
                            console.log(`💰 Available affiliate balance: €${availableBalance.toFixed(2)}`);

                            if (availableBalance > 0) {
                                // Calcola quanto sconto applicare (massimo = importo fattura)
                                const invoiceAmount = invoiceCreated.amount_due / 100;
                                const discountToApply = Math.min(availableBalance, invoiceAmount);
                                const discountInCents = Math.round(discountToApply * 100);

                                console.log(`📊 Invoice amount: €${invoiceAmount}, Discount to apply: €${discountToApply}`);

                                if (discountInCents > 0) {
                                    try {
                                        // Crea un invoice item negativo (sconto)
                                        await stripe.invoiceItems.create({
                                            customer: invoiceCustomerId,
                                            invoice: invoiceCreated.id,
                                            amount: -discountInCents,
                                            currency: 'eur',
                                            description: `Credito Affiliazione MyWellness (-€${discountToApply.toFixed(2)})`
                                        });

                                        console.log(`✅ Applied €${discountToApply.toFixed(2)} affiliate discount to invoice ${invoiceCreated.id}`);

                                        // Aggiorna il saldo disponibile
                                        const newBalance = availableBalance - discountToApply;
                                        await base44.asServiceRole.entities.AffiliateLink.update(userAffiliateLink.id, {
                                            available_balance: newBalance
                                        });
                                        console.log(`✅ Updated affiliate balance: €${availableBalance.toFixed(2)} → €${newBalance.toFixed(2)}`);

                                        // Trova i crediti disponibili e marcali come usati
                                        const availableCredits = await base44.asServiceRole.entities.AffiliateCredit.filter({
                                            affiliate_user_id: invoiceUser.id,
                                            commission_status: 'available'
                                        });
                                        console.log(`📋 Found ${availableCredits.length} available credits to mark as used`);

                                        let remainingToMark = discountToApply;
                                        for (const credit of availableCredits) {
                                            if (remainingToMark <= 0) break;

                                            if (credit.commission_amount <= remainingToMark) {
                                                await base44.asServiceRole.entities.AffiliateCredit.update(credit.id, {
                                                    commission_status: 'used_for_subscription'
                                                });
                                                remainingToMark -= credit.commission_amount;
                                                console.log(`✅ Marked credit ${credit.id} (€${credit.commission_amount}) as used`);
                                            } else {
                                                // Credito parzialmente usato - per semplicità lo marchiamo tutto come usato
                                                await base44.asServiceRole.entities.AffiliateCredit.update(credit.id, {
                                                    commission_status: 'used_for_subscription'
                                                });
                                                remainingToMark = 0;
                                                console.log(`✅ Marked credit ${credit.id} (€${credit.commission_amount}) as partially used`);
                                            }
                                        }

                                        console.log(`✅ Affiliate credit applied successfully to renewal invoice`);
                                    } catch (discountError) {
                                        console.error('❌ Error applying affiliate discount:', discountError.message);
                                        console.error('Stack:', discountError.stack);
                                    }
                                }
                            } else {
                                console.log('⏭️ No affiliate credit available (balance is 0)');
                            }
                        } else {
                            console.log('⏭️ User is not an affiliate (no AffiliateLink found)');
                        }
                    } else {
                        console.warn('⚠️ No user found with stripe_customer_id:', invoiceCustomerId);
                    }
                    break;
                }

        case 'invoice.payment_succeeded': {
                console.log('💰 Processing invoice.payment_succeeded...');
                const invoice = event.data.object;
                console.log('Invoice ID:', invoice.id);

                const customerId = invoice.customer;
                const subscriptionId = invoice.subscription;
                const amount = invoice.amount_paid / 100;

                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
                console.log('👥 Users found:', users.length);

                if (users.length > 0) {
                    const user = users[0];
                    console.log('✅ User found:', user.id);
                    const trafficSource = invoice.metadata?.traffic_source || user.traffic_source || 'direct';

                    // Update user payment info
                    await base44.asServiceRole.entities.User.update(user.id, {
                        last_payment_date: new Date(invoice.created * 1000).toISOString(),
                        last_payment_amount: amount,
                        subscription_status: 'active'
                    });

                    // Create transaction record
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_invoice_id: invoice.id,
                        stripe_subscription_id: subscriptionId,
                        stripe_payment_intent_id: invoice.payment_intent,
                        amount: amount,
                        currency: invoice.currency || 'eur',
                        status: 'succeeded',
                        type: 'subscription_payment',
                        plan: user.subscription_plan || 'base',
                        billing_period: invoice.lines?.data?.[0]?.price?.recurring?.interval || 'monthly',
                        payment_date: new Date(invoice.created * 1000).toISOString(),
                        description: `Pagamento ${user.subscription_plan || 'subscription'}`,
                        traffic_source: trafficSource,
                        metadata: {
                            ...invoice.metadata,
                            payment_method: 'card',
                            invoice_number: invoice.number,
                            coupon_code: user.applied_coupon_code || invoice.metadata?.coupon_code || null,
                            original_amount: invoice.total + (invoice.discount?.coupon?.amount_off || 0)
                        }
                    });

                    console.log(`✅ Transaction created: ${transaction.id}`);

                    // Generate and save invoice PDF
                    try {
                        const invoiceResponse = await base44.asServiceRole.functions.invoke('generateInvoicePDF', {
                            transactionId: transaction.id
                        });

                        if (invoiceResponse?.data?.invoice_url) {
                            await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                                invoice_pdf_url: invoiceResponse.data.invoice_url,
                                metadata: {
                                    ...transaction.metadata,
                                    invoice_url: invoiceResponse.data.invoice_url
                                }
                            });
                            console.log(`✅ Invoice PDF generated: ${invoiceResponse.data.invoice_url}`);
                        }
                    } catch (invoiceError) {
                        console.error('⚠️ Invoice generation failed:', invoiceError.message);
                    }

                    console.log(`✅ Payment recorded for user ${user.id}: €${amount} (ID: ${transaction.id})`);

                    // 🔗 AFFILIATE: Traccia commissione per pagamenti ricorrenti
                    if (user.referred_by_affiliate_code) {
                        try {
                            const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                                affiliate_code: user.referred_by_affiliate_code
                            });

                            if (affiliateLinks.length > 0) {
                                const affiliateLink = affiliateLinks[0];
                                const commissionAmount = amount * 0.10; // 10%

                                // Crea credito commissione
                                await base44.asServiceRole.entities.AffiliateCredit.create({
                                    affiliate_user_id: affiliateLink.user_id,
                                    referred_user_id: user.id,
                                    transaction_id: transaction.id,
                                    stripe_payment_intent_id: invoice.payment_intent,
                                    amount_paid: amount,
                                    commission_amount: commissionAmount,
                                    commission_status: 'available',
                                    payment_date: new Date(invoice.created * 1000).toISOString()
                                });

                                // Aggiorna totali affiliate link
                                await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
                                    total_earned: affiliateLink.total_earned + commissionAmount,
                                    available_balance: affiliateLink.available_balance + commissionAmount
                                });

                                console.log(`✅ Affiliate commission tracked: €${commissionAmount.toFixed(2)} for ${affiliateLink.user_id}`);
                            }
                        } catch (affiliateError) {
                            console.error('⚠️ Affiliate tracking error:', affiliateError);
                        }
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                console.log('❌ Payment failed:', invoice.id);

                const customerId = invoice.customer;
                const amount = invoice.amount_due / 100;

                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

                if (users.length > 0) {
                    const user = users[0];
                    const trafficSource = invoice.metadata?.traffic_source || user.traffic_source || 'direct';

                    // Update user status
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_status: 'payment_failed'
                    });

                    // Create failed transaction record
                    await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_invoice_id: invoice.id,
                        stripe_subscription_id: invoice.subscription,
                        amount: amount,
                        currency: invoice.currency || 'eur',
                        status: 'failed',
                        type: 'subscription_payment',
                        plan: user.subscription_plan || 'base',
                        payment_date: new Date(invoice.created * 1000).toISOString(),
                        description: `Pagamento fallito - ${user.subscription_plan || 'subscription'}`,
                        traffic_source: trafficSource,
                        metadata: invoice.metadata
                    });

                    console.log(`❌ Failed payment recorded for user ${user.id}`);
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                console.log(`📋 Subscription ${event.type}:`, subscription.id);
                console.log('Subscription status:', subscription.status);
                console.log('Current period end:', subscription.current_period_end);

                const customerId = subscription.customer;
                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

                if (users.length > 0) {
                    const user = users[0];

                    // ✅ Safe date conversion with try-catch
                    let periodEnd = null;
                    try {
                        if (subscription.current_period_end && typeof subscription.current_period_end === 'number' && subscription.current_period_end > 0) {
                            const dateObj = new Date(subscription.current_period_end * 1000);
                            if (!isNaN(dateObj.getTime())) {
                                periodEnd = dateObj.toISOString();
                            }
                        }
                    } catch (dateError) {
                        console.warn('⚠️ Error parsing period end date:', dateError.message);
                    }

                    const updateData = {
                        stripe_subscription_id: subscription.id,
                        subscription_status: subscription.status === 'active' ? 'active' :
                                           subscription.status === 'trialing' ? 'trial' :
                                           subscription.status === 'canceled' ? 'cancelled' : 'expired'
                    };

                    // Solo aggiungi period_end se valido
                    if (periodEnd) {
                        updateData.subscription_period_end = periodEnd;
                    }

                    // Determine plan from price
                    if (subscription.items?.data?.[0]?.price) {
                        const priceId = subscription.items.data[0].price.id;
                        const PRICE_MAP = {
                            // Nuovi prezzi senza trial
                            'price_1SXADj2OXBs6ZYwlY8id3Yhy': 'base',
                            'price_1SXADj2OXBs6ZYwlywQCp6oR': 'base',
                            'price_1SXADj2OXBs6ZYwlqdFI6aUU': 'pro',
                            'price_1SXADk2OXBs6ZYwl0zZsxETJ': 'pro',
                            'price_1SXADk2OXBs6ZYwlxiqqQqVA': 'premium',
                            'price_1SXADl2OXBs6ZYwl0PlnAeX9': 'premium',
                            // Vecchi prezzi (per retrocompatibilità)
                            'price_1SNDMW2OXBs6ZYwlp5UgCO8Y': 'base',
                            'price_1SNDMW2OXBs6ZYwlUfiZP4Su': 'base',
                            'price_1SNDMX2OXBs6ZYwlx6jXOgFf': 'pro',
                            'price_1SNDMX2OXBs6ZYwlvGtzkQKA': 'pro',
                            'price_1SNDMX2OXBs6ZYwlKR7FIudX': 'premium',
                            'price_1SNDMY2OXBs6ZYwlcZzmNSnk': 'premium'
                        };

                        if (PRICE_MAP[priceId]) {
                            updateData.subscription_plan = PRICE_MAP[priceId];
                        }
                    }

                    await base44.asServiceRole.entities.User.update(user.id, updateData);
                    console.log(`✅ Subscription updated for user ${user.id}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                console.log('🗑️ Subscription deleted:', subscription.id);

                const customerId = subscription.customer;
                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

                if (users.length > 0) {
                    const user = users[0];

                    // Se era trial e si cancella, attiva automaticamente il piano schedulato
                    if (subscription.metadata?.subscription_type === 'trial') {
                        console.log('✅ Trial ended, scheduled subscription should activate');
                    } else {
                        await base44.asServiceRole.entities.User.update(user.id, {
                            subscription_status: 'cancelled',
                            stripe_subscription_id: null
                        });
                        console.log(`✅ Subscription cancelled for user ${user.id}`);
                    }
                }
                break;
            }

            case 'subscription_schedule.created':
            case 'subscription_schedule.completed': {
                const schedule = event.data.object;
                console.log(`📅 Subscription schedule ${event.type}:`, schedule.id);

                if (event.type === 'subscription_schedule.completed' && schedule.metadata?.converted_from_trial === 'true') {
                    const userId = schedule.metadata.user_id;
                    const planType = schedule.metadata.plan_type;
                    
                    if (userId) {
                        await base44.asServiceRole.entities.User.update(userId, {
                            subscription_status: 'active',
                            subscription_plan: planType,
                            trial_ends_at: null
                        });
                        console.log(`✅ User ${userId} converted from trial to ${planType}`);
                    }
                }
                break;
            }

            case 'refund.created':
            case 'charge.refunded': {
                const charge = event.data.object;
                console.log('💸 Refund processed:', charge.id);
                console.log('📊 Charge amount:', charge.amount / 100, 'Refunded:', charge.amount_refunded / 100);

                const customerId = charge.customer;
                const refundAmount = charge.amount_refunded / 100;
                const originalAmount = charge.amount / 100;
                const isFullRefund = charge.refunded === true || charge.amount_refunded >= charge.amount;

                console.log(`💰 Full refund: ${isFullRefund}`);

                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

                if (users.length > 0) {
                    const user = users[0];
                    console.log(`👤 User found: ${user.email}, current plan: ${user.subscription_plan}`);

                    // Cerca la transazione originale per capire il piano precedente
                    let previousPlan = null;
                    let billingPeriod = 'monthly';
                    
                    if (charge.payment_intent) {
                        const originalTransactions = await base44.asServiceRole.entities.Transaction.filter({
                            stripe_payment_intent_id: charge.payment_intent,
                            status: 'succeeded'
                        });
                        
                        if (originalTransactions.length > 0) {
                            const origTx = originalTransactions[0];
                            previousPlan = origTx.plan;
                            billingPeriod = origTx.billing_period || 'monthly';
                            console.log(`📋 Found original transaction: plan=${previousPlan}, period=${billingPeriod}`);
                        }
                    }

                    // Create refund transaction
                    await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_payment_intent_id: charge.payment_intent,
                        amount: -refundAmount,
                        currency: charge.currency || 'eur',
                        status: 'refunded',
                        type: 'refund',
                        plan: user.subscription_plan,
                        payment_date: new Date().toISOString(),
                        description: isFullRefund ? 'Rimborso completo' : 'Rimborso parziale',
                        metadata: {
                            original_amount: originalAmount,
                            refund_amount: refundAmount,
                            is_full_refund: isFullRefund,
                            previous_plan: previousPlan
                        }
                    });

                    console.log(`✅ Refund transaction recorded for user ${user.id}: €${refundAmount}`);

                    // 🔄 GESTIONE DOWNGRADE/CANCELLAZIONE BASATA SUL RIMBORSO
                    const currentPlan = user.subscription_plan;
                    
                    // Prezzi dei piani (in centesimi per Stripe)
                    const planPrices = {
                        base: { monthly: 19, yearly: 182.40 },
                        pro: { monthly: 29, yearly: 278.40 },
                        premium: { monthly: 39, yearly: 374.40 }
                    };

                    // Gerarchia piani
                    const planHierarchy = { free: 0, base: 1, pro: 2, premium: 3 };
                    const planByHierarchy = ['free', 'base', 'pro', 'premium'];

                    if (isFullRefund) {
                        // RIMBORSO TOTALE: Cancella abbonamento e porta a free
                        console.log('🚫 Full refund - cancelling subscription and setting to free');
                        
                        if (user.stripe_subscription_id) {
                            try {
                                await stripe.subscriptions.cancel(user.stripe_subscription_id);
                                console.log(`✅ Stripe subscription ${user.stripe_subscription_id} cancelled`);
                            } catch (cancelError) {
                                console.error('⚠️ Error cancelling Stripe subscription:', cancelError.message);
                            }
                        }

                        await base44.asServiceRole.entities.User.update(user.id, {
                            subscription_plan: 'free',
                            subscription_status: 'cancelled',
                            stripe_subscription_id: null,
                            subscription_period_end: null
                        });

                        console.log(`✅ User ${user.id} downgraded to FREE due to full refund`);

                    } else {
                        // RIMBORSO PARZIALE: Determina piano in base alla differenza di prezzo rimborsata
                        console.log(`💵 Partial refund: €${refundAmount.toFixed(2)} of €${originalAmount.toFixed(2)}`);
                        
                        // Logica: se rimborsi la differenza tra due piani, fai downgrade di un livello
                        // Es: Pro (29) -> Base (19) = differenza 10€
                        // Es: Premium (39) -> Pro (29) = differenza 10€
                        // Es: Premium (39) -> Base (19) = differenza 20€
                        
                        const currentLevel = planHierarchy[currentPlan] || 0;
                        let newLevel = currentLevel;
                        
                        // Calcola quanti livelli scendere in base al rimborso
                        const period = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
                        
                        if (currentPlan === 'premium') {
                            const diffToPro = planPrices.premium[period] - planPrices.pro[period];
                            const diffToBase = planPrices.premium[period] - planPrices.base[period];
                            
                            if (refundAmount >= diffToBase - 1) {
                                newLevel = 1; // base
                            } else if (refundAmount >= diffToPro - 1) {
                                newLevel = 2; // pro
                            }
                        } else if (currentPlan === 'pro') {
                            const diffToBase = planPrices.pro[period] - planPrices.base[period];
                            
                            if (refundAmount >= diffToBase - 1) {
                                newLevel = 1; // base
                            }
                        }
                        
                        const newPlan = planByHierarchy[newLevel];
                        console.log(`📊 Refund €${refundAmount} → downgrade from ${currentPlan} (level ${currentLevel}) to ${newPlan} (level ${newLevel})`);

                        if (newLevel < currentLevel) {
                            console.log(`⬇️ Downgrading from ${currentPlan} to ${newPlan}`);

                            // Aggiorna subscription su Stripe al nuovo piano
                            if (user.stripe_subscription_id && newPlan !== 'free') {
                                try {
                                    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
                                    const currentItemId = subscription.items.data[0]?.id;

                                    const priceMap = {
                                        base: period === 'monthly' ? 'price_1SXADj2OXBs6ZYwlY8id3Yhy' : 'price_1SXADj2OXBs6ZYwlywQCp6oR',
                                        pro: period === 'monthly' ? 'price_1SXADj2OXBs6ZYwlqdFI6aUU' : 'price_1SXADk2OXBs6ZYwl0zZsxETJ',
                                        premium: period === 'monthly' ? 'price_1SXADk2OXBs6ZYwlxiqqQqVA' : 'price_1SXADl2OXBs6ZYwl0PlnAeX9'
                                    };

                                    if (currentItemId && priceMap[newPlan]) {
                                        await stripe.subscriptions.update(user.stripe_subscription_id, {
                                            items: [{
                                                id: currentItemId,
                                                price: priceMap[newPlan]
                                            }],
                                            proration_behavior: 'none'
                                        });
                                        console.log(`✅ Stripe subscription updated to ${newPlan}`);
                                    }
                                } catch (updateError) {
                                    console.error('⚠️ Error updating Stripe subscription:', updateError.message);
                                }
                            }

                            await base44.asServiceRole.entities.User.update(user.id, {
                                subscription_plan: newPlan
                            });

                            console.log(`✅ User ${user.id} downgraded from ${currentPlan} to ${newPlan} due to partial refund of €${refundAmount}`);
                        } else {
                            console.log(`ℹ️ No downgrade needed - refund amount €${refundAmount} doesn't match plan difference`);
                        }
                    }
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('💳 Processing payment_intent.succeeded:', paymentIntent.id);
                console.log('Amount:', paymentIntent.amount / 100, paymentIntent.currency);
                console.log('Customer:', paymentIntent.customer);
                console.log('Metadata:', JSON.stringify(paymentIntent.metadata));

                const customerId = paymentIntent.customer;
                const amount = paymentIntent.amount / 100;

                if (!customerId) {
                    console.log('⚠️ No customer ID on payment intent, skipping');
                    break;
                }

                const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
                console.log('👥 Users found:', users.length);

                if (users.length > 0) {
                    const user = users[0];
                    console.log('✅ User found:', user.id, user.email);

                    // Controlla se esiste già una transaction con questo payment_intent_id
                    const existingTransactions = await base44.asServiceRole.entities.Transaction.filter({
                        stripe_payment_intent_id: paymentIntent.id
                    });

                    if (existingTransactions.length > 0) {
                        console.log('⚠️ Transaction already exists for this payment intent, skipping');
                        break;
                    }

                    const metadata = paymentIntent.metadata || {};
                    const trafficSource = metadata.traffic_source || user.traffic_source || 'direct';
                    const plan = metadata.plan || user.subscription_plan || 'base';
                    const billingPeriod = metadata.billing_period || 'monthly';

                    // Crea transaction
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_payment_intent_id: paymentIntent.id,
                        amount: amount,
                        currency: paymentIntent.currency || 'eur',
                        status: 'succeeded',
                        type: metadata.type || 'subscription_payment',
                        plan: plan,
                        billing_period: billingPeriod,
                        payment_date: new Date(paymentIntent.created * 1000).toISOString(),
                        description: metadata.description || `Pagamento ${plan}`,
                        traffic_source: trafficSource,
                        metadata: {
                            ...metadata,
                            payment_method: paymentIntent.payment_method_types?.[0] || 'card',
                            coupon_code: user.applied_coupon_code || metadata.coupon_code || null
                        }
                    });

                    console.log(`✅ Transaction created from payment_intent: ${transaction.id}`);

                    // 🔗 AFFILIATE: Traccia commissione se utente è affiliato
                    if (user.referred_by_affiliate_code && amount > 0) {
                        try {
                            const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                                affiliate_code: user.referred_by_affiliate_code
                            });

                            if (affiliateLinks.length > 0) {
                                const affiliateLink = affiliateLinks[0];
                                const commissionAmount = amount * 0.10; // 10%

                                await base44.asServiceRole.entities.AffiliateCredit.create({
                                    affiliate_user_id: affiliateLink.user_id,
                                    referred_user_id: user.id,
                                    transaction_id: transaction.id,
                                    stripe_payment_intent_id: paymentIntent.id,
                                    amount_paid: amount,
                                    commission_amount: commissionAmount,
                                    commission_status: 'available',
                                    payment_date: new Date(paymentIntent.created * 1000).toISOString()
                                });

                                await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
                                    total_earned: affiliateLink.total_earned + commissionAmount,
                                    available_balance: affiliateLink.available_balance + commissionAmount
                                });

                                console.log(`✅ Affiliate commission tracked: €${commissionAmount.toFixed(2)}`);
                            }
                        } catch (affiliateError) {
                            console.error('⚠️ Affiliate tracking error:', affiliateError);
                        }
                    }

                    // Genera fattura PDF
                    try {
                        const invoiceResponse = await base44.asServiceRole.functions.invoke('generateInvoicePDF', {
                            transactionId: transaction.id
                        });

                        if (invoiceResponse?.data?.invoice_url) {
                            await base44.asServiceRole.entities.Transaction.update(transaction.id, {
                                invoice_pdf_url: invoiceResponse.data.invoice_url
                            });
                            console.log(`✅ Invoice PDF generated`);
                        }
                    } catch (invoiceError) {
                        console.error('⚠️ Invoice generation failed:', invoiceError.message);
                    }
                } else {
                    console.warn('⚠️ No user found with stripe_customer_id:', customerId);
                }
                break;
            }

            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        console.log('✅ Webhook processed successfully');
        return Response.json({ received: true });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return Response.json({
            error: error.message
        }, { status: 400 });
    }
});