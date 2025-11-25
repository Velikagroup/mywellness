import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🔄 upgradeDowngradeSubscription - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { newPlan, newBillingPeriod, calculateOnly } = await req.json();
        
        if (!newPlan || !newBillingPeriod) {
            return Response.json({ 
                success: false, 
                error: 'Missing newPlan or newBillingPeriod' 
            }, { status: 400 });
        }

        console.log(`✅ User ${user.email} requesting change to ${newPlan}/${newBillingPeriod}`);

        const PLAN_PRICES = {
            base: { monthly: 19, yearly: 182.4 },
            pro: { monthly: 29, yearly: 278.4 },
            premium: { monthly: 39, yearly: 374.4 }
        };

        const PRICE_IDS = {
            base: { monthly: 'price_1SXADj2OXBs6ZYwlY8id3Yhy', yearly: 'price_1SXADj2OXBs6ZYwlywQCp6oR' },
            pro: { monthly: 'price_1SXADj2OXBs6ZYwlqdFI6aUU', yearly: 'price_1SXADk2OXBs6ZYwl0zZsxETJ' },
            premium: { monthly: 'price_1SXADk2OXBs6ZYwlxiqqQqVA', yearly: 'price_1SXADl2OXBs6ZYwl0PlnAeX9' }
        };

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        // ========== UPGRADE DA PIANO GRATUITO ==========
        const isUpgradeFromFree = !user.stripe_subscription_id || user.subscription_plan === 'trial' || user.subscription_plan === 'standard';
        
        if (isUpgradeFromFree) {
            console.log('🆕 Upgrade from free/trial plan');
            
            const planPrice = PLAN_PRICES[newPlan]?.[newBillingPeriod];
            
            // Verifica metodo di pagamento
            let hasPaymentMethod = false;
            if (user.stripe_customer_id) {
                try {
                    const paymentMethods = await stripe.paymentMethods.list({
                        customer: user.stripe_customer_id,
                        type: 'card'
                    });
                    hasPaymentMethod = paymentMethods.data.length > 0;
                    console.log(`💳 User has ${paymentMethods.data.length} saved payment methods`);
                } catch (e) {
                    console.error('Error checking payment methods:', e.message);
                }
            }
            
            // Cerca credito affiliazione
            let affiliateCredit = 0;
            try {
                const userAffiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
                if (userAffiliateLinks.length > 0) {
                    affiliateCredit = userAffiliateLinks[0].available_balance || 0;
                }
            } catch (e) {
                console.log('No affiliate credit found');
            }

            const affiliateCreditToApply = Math.min(affiliateCredit, planPrice);
            const finalAmountToPay = Math.max(0, planPrice - affiliateCreditToApply);
            
            if (calculateOnly) {
                return Response.json({ 
                    success: true,
                    calculate: true,
                    requiresCheckout: !hasPaymentMethod,
                    hasPaymentMethod: hasPaymentMethod,
                    currentPlan: user.subscription_plan || 'standard',
                    currentBillingPeriod: 'none',
                    newPlanPrice: planPrice,
                    amountToPay: finalAmountToPay,
                    creditFromCurrentPlan: 0,
                    affiliateCredit: affiliateCredit,
                    affiliateCreditApplied: affiliateCreditToApply,
                    isDowngrade: false,
                    percentageRemaining: 0
                });
            }
            
            // Se ha metodo di pagamento, crea subscription direttamente
            if (hasPaymentMethod) {
                console.log('✅ User has payment method - creating subscription directly');
                
                const newPriceId = PRICE_IDS[newPlan]?.[newBillingPeriod];
                
                const subscription = await stripe.subscriptions.create({
                    customer: user.stripe_customer_id,
                    items: [{ price: newPriceId }],
                    payment_behavior: 'error_if_incomplete',
                    expand: ['latest_invoice.payment_intent'],
                    metadata: {
                        user_id: user.id,
                        subscription_type: 'paid',
                        plan_type: newPlan,
                        billing_period: newBillingPeriod,
                        upgraded_from: user.subscription_plan || 'standard'
                    }
                });
                
                console.log(`✅ Subscription created: ${subscription.id}`);
                
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: 'active',
                    subscription_plan: newPlan,
                    stripe_subscription_id: subscription.id,
                    trial_ends_at: null
                });
                
                // Crea Transaction
                const paidAmount = subscription.latest_invoice?.amount_paid 
                    ? subscription.latest_invoice.amount_paid / 100 
                    : planPrice;
                    
                try {
                    await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_payment_intent_id: subscription.latest_invoice?.payment_intent?.id || subscription.latest_invoice?.payment_intent,
                        stripe_invoice_id: subscription.latest_invoice?.id,
                        stripe_subscription_id: subscription.id,
                        amount: paidAmount,
                        currency: 'eur',
                        status: 'succeeded',
                        type: 'subscription_payment',
                        plan: newPlan,
                        billing_period: newBillingPeriod,
                        payment_date: new Date().toISOString(),
                        description: `Upgrade a ${newPlan} (${newBillingPeriod === 'yearly' ? 'Annuale' : 'Mensile'})`,
                        traffic_source: user.traffic_source || 'direct'
                    });
                } catch (txError) {
                    console.error('⚠️ Transaction creation error:', txError.message);
                }
                
                // Traccia commissione affiliato
                const affiliateCode = user.referred_by_affiliate_code || user.referred_by;
                const invoiceAmount = subscription.latest_invoice?.amount_paid;
                
                if (affiliateCode && invoiceAmount > 0) {
                    try {
                        const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                            affiliate_code: affiliateCode.toUpperCase()
                        });

                        if (affiliateLinks.length > 0) {
                            const affiliateLink = affiliateLinks[0];
                            const commissionAmount = (invoiceAmount / 100) * 0.10;
                            
                            await base44.asServiceRole.entities.AffiliateCredit.create({
                                affiliate_user_id: affiliateLink.user_id,
                                referred_user_id: user.id,
                                stripe_payment_intent_id: subscription.latest_invoice?.payment_intent?.id || subscription.latest_invoice?.payment_intent,
                                amount_paid: invoiceAmount / 100,
                                commission_amount: commissionAmount,
                                commission_status: 'available',
                                payment_date: new Date().toISOString()
                            });

                            await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
                                total_referrals: (affiliateLink.total_referrals || 0) + 1,
                                total_earned: (affiliateLink.total_earned || 0) + commissionAmount,
                                available_balance: (affiliateLink.available_balance || 0) + commissionAmount
                            });
                        }
                    } catch (affiliateError) {
                        console.error('⚠️ Affiliate tracking error:', affiliateError.message);
                    }
                }
                
                return Response.json({
                    success: true,
                    isDowngrade: false,
                    message: `Piano aggiornato a ${newPlan}!`,
                    amountCharged: planPrice,
                    subscriptionId: subscription.id
                });
            }
            
            return Response.json({ 
                success: true,
                requiresCheckout: true,
                redirectUrl: '/TrialSetup',
                message: 'Completa il checkout per attivare il piano'
            });
        }

        // ========== UPGRADE/DOWNGRADE DA PIANO A PAGAMENTO ==========
        if (!user.stripe_subscription_id) {
            return Response.json({ 
                success: false, 
                error: 'No active subscription found' 
            }, { status: 400 });
        }

        const newPriceId = PRICE_IDS[newPlan]?.[newBillingPeriod];
        
        if (!newPriceId) {
            return Response.json({ 
                success: false, 
                error: 'Invalid plan or billing period' 
            }, { status: 400 });
        }

        console.log('📦 Retrieving current subscription...');
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        
        const currentPlan = user.subscription_plan || 'base';
        const currentBillingPeriod = subscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';

        // Calcola proration
        const now = Math.floor(Date.now() / 1000);
        const periodStart = subscription.current_period_start;
        const periodEnd = subscription.current_period_end;
        const totalPeriodDuration = periodEnd - periodStart;
        const remainingTime = periodEnd - now;
        const percentageRemaining = remainingTime / totalPeriodDuration;

        const currentPlanPrice = PLAN_PRICES[currentPlan][currentBillingPeriod];
        const creditFromCurrentPlan = currentPlanPrice * percentageRemaining;
        const newPlanPrice = PLAN_PRICES[newPlan][newBillingPeriod];

        const isDowngrade = (
            (currentPlan === 'premium' && (newPlan === 'pro' || newPlan === 'base')) ||
            (currentPlan === 'pro' && newPlan === 'base')
        );

        // Calcolo manuale: Nuovo piano - Credito residuo
        let amountToPay = 0;
        if (!isDowngrade) {
            amountToPay = newPlanPrice - creditFromCurrentPlan;
        }
        amountToPay = Math.max(0, Math.round(amountToPay * 100) / 100);

        console.log('💰 Pricing details:', {
            currentPlanPrice: currentPlanPrice.toFixed(2),
            creditFromCurrentPlan: creditFromCurrentPlan.toFixed(2),
            newPlanPrice: newPlanPrice.toFixed(2),
            amountToPay: amountToPay.toFixed(2),
            isDowngrade
        });

        // Cerca credito affiliazione
        let affiliateCredit = 0;
        try {
            const userAffiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
            if (userAffiliateLinks.length > 0) {
                affiliateCredit = userAffiliateLinks[0].available_balance || 0;
            }
        } catch (e) {
            console.log('No affiliate credit found');
        }

        const affiliateCreditToApply = !isDowngrade ? Math.min(affiliateCredit, amountToPay) : 0;
        const finalAmountToPay = Math.max(0, amountToPay - affiliateCreditToApply);

        if (calculateOnly) {
            return Response.json({
                success: true,
                calculate: true,
                hasPaymentMethod: true,
                currentPlan,
                currentBillingPeriod,
                currentPlanPrice,
                newPlanPrice,
                creditFromCurrentPlan,
                amountToPay: finalAmountToPay,
                affiliateCredit: affiliateCredit,
                affiliateCreditApplied: affiliateCreditToApply,
                isDowngrade,
                percentageRemaining: Math.round(percentageRemaining * 100)
            });
        }

        // ========== DOWNGRADE ==========
        if (isDowngrade) {
            console.log('⬇️ Processing downgrade - no immediate charge');
            
            await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }],
                proration_behavior: 'none',
                billing_cycle_anchor: 'unchanged'
            });

            await base44.asServiceRole.entities.User.update(user.id, {
                pending_plan_change: newPlan,
                pending_billing_period: newBillingPeriod
            });

            return Response.json({
                success: true,
                isDowngrade: true,
                message: `Piano modificato. Il downgrade a ${newPlan} sarà effettivo dalla prossima fatturazione.`,
                effectiveDate: new Date(periodEnd * 1000).toLocaleDateString('it-IT')
            });
        }

        // ========== UPGRADE ==========
        console.log('⬆️ Processing upgrade - immediate charge with OUR calculated amount');
        
        // PRIMA: Addebito manuale con il NOSTRO importo calcolato
        let paidInvoice = null;
        if (finalAmountToPay > 0) {
            console.log(`💳 Creating manual charge for €${finalAmountToPay.toFixed(2)}`);
            
            // Crea invoice item
            await stripe.invoiceItems.create({
                customer: user.stripe_customer_id,
                amount: Math.round(finalAmountToPay * 100),
                currency: 'eur',
                description: `Upgrade da ${currentPlan} a ${newPlan} - Differenza prorated`
            });
            
            // Crea la fattura e finalizzala subito per l'addebito automatico
            const invoice = await stripe.invoices.create({
                customer: user.stripe_customer_id,
                collection_method: 'charge_automatically',
                auto_advance: true
            });
            
            // Finalizza la fattura - questo triggera l'addebito automatico
            paidInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
            console.log(`📄 Invoice finalized and charging: ${paidInvoice.id}, status: ${paidInvoice.status}`);
            
            // Se non è già pagata, proviamo a pagarla manualmente
            if (paidInvoice.status !== 'paid') {
                paidInvoice = await stripe.invoices.pay(paidInvoice.id);
                console.log(`✅ Invoice paid: ${paidInvoice.id}, amount: €${paidInvoice.amount_paid / 100}`);
            } else {
                console.log(`✅ Invoice already paid automatically: ${paidInvoice.id}`);
            }
            
            // Verifica che il pagamento sia andato a buon fine
            if (paidInvoice.status !== 'paid') {
                console.error('❌ Payment failed - invoice status:', paidInvoice.status);
                return Response.json({
                    success: false,
                    error: 'Il pagamento non è andato a buon fine. Riprova.'
                }, { status: 400 });
            }
        }
        
        // DOPO: Aggiorna subscription su Stripe SOLO se il pagamento è riuscito
        console.log('📦 Updating subscription on Stripe...');
        await stripe.subscriptions.update(user.stripe_subscription_id, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId
            }],
            proration_behavior: 'none'
        });

        // INFINE: Aggiorna utente nel database
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_plan: newPlan,
            subscription_status: 'active',
            trial_ends_at: null,
            pending_plan_change: null,
            pending_billing_period: null
        });

        // Crea Transaction
        if (finalAmountToPay > 0) {
            try {
                const transaction = await base44.asServiceRole.entities.Transaction.create({
                    user_id: user.id,
                    stripe_subscription_id: user.stripe_subscription_id,
                    amount: finalAmountToPay,
                    currency: 'eur',
                    status: 'succeeded',
                    type: 'subscription_payment',
                    plan: newPlan,
                    billing_period: newBillingPeriod,
                    payment_date: new Date().toISOString(),
                    description: `Upgrade prorated da ${currentPlan} a ${newPlan}`,
                    traffic_source: user.traffic_source || 'direct',
                    metadata: {
                        upgraded_from: currentPlan,
                        credit_applied: creditFromCurrentPlan.toFixed(2)
                    }
                });
                
                // Traccia commissione affiliato
                const affiliateCode = user.referred_by_affiliate_code || user.referred_by;
                if (affiliateCode && finalAmountToPay > 0) {
                    try {
                        const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                            affiliate_code: affiliateCode.toUpperCase()
                        });

                        if (affiliateLinks.length > 0) {
                            const affiliateLink = affiliateLinks[0];
                            const commissionAmount = finalAmountToPay * 0.10;
                            
                            await base44.asServiceRole.entities.AffiliateCredit.create({
                                affiliate_user_id: affiliateLink.user_id,
                                referred_user_id: user.id,
                                transaction_id: transaction.id,
                                amount_paid: finalAmountToPay,
                                commission_amount: commissionAmount,
                                commission_status: 'available',
                                payment_date: new Date().toISOString()
                            });

                            await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
                                total_referrals: (affiliateLink.total_referrals || 0) + 1,
                                total_earned: (affiliateLink.total_earned || 0) + commissionAmount,
                                available_balance: (affiliateLink.available_balance || 0) + commissionAmount
                            });
                        }
                    } catch (affiliateError) {
                        console.error('⚠️ Affiliate tracking error:', affiliateError.message);
                    }
                }
            } catch (txError) {
                console.error('⚠️ Transaction creation error:', txError.message);
            }
        }

        // Scala credito affiliazione usato
        if (affiliateCreditToApply > 0) {
            try {
                const userAffiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: user.id });
                if (userAffiliateLinks.length > 0) {
                    const userAffiliateLink = userAffiliateLinks[0];
                    const newBalance = (userAffiliateLink.available_balance || 0) - affiliateCreditToApply;
                    await base44.asServiceRole.entities.AffiliateLink.update(userAffiliateLink.id, {
                        available_balance: Math.max(0, newBalance)
                    });

                    const availableCredits = await base44.asServiceRole.entities.AffiliateCredit.filter({
                        affiliate_user_id: user.id,
                        commission_status: 'available'
                    });

                    let remainingToMark = affiliateCreditToApply;
                    for (const credit of availableCredits) {
                        if (remainingToMark <= 0) break;
                        await base44.asServiceRole.entities.AffiliateCredit.update(credit.id, {
                            commission_status: 'used_for_subscription'
                        });
                        remainingToMark -= credit.commission_amount;
                    }
                }
            } catch (affiliateErr) {
                console.error('Error updating affiliate credit:', affiliateErr.message);
            }
        }

        console.log('✅ Upgrade completed with immediate billing');

        return Response.json({
            success: true,
            isDowngrade: false,
            message: `Piano aggiornato a ${newPlan}!`,
            amountCharged: finalAmountToPay,
            affiliateCreditUsed: affiliateCreditToApply
        });

    } catch (error) {
        console.error('❌ Upgrade/Downgrade error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});