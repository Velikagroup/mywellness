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

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        const isUpgradeFromFree = !user.stripe_subscription_id || user.subscription_plan === 'trial' || user.subscription_plan === 'standard';
        
        if (isUpgradeFromFree) {
            console.log('🆕 Upgrade from free/trial plan');
            
            // Calcola il prezzo del piano selezionato
            const planPrice = PLAN_PRICES[newPlan]?.[newBillingPeriod];
            
            // Verifica se l'utente ha già un metodo di pagamento salvato su Stripe
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
            
            if (calculateOnly) {
                          // Cerca credito affiliazione disponibile
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
                
                const PRICE_IDS_NEW = {
                    base: { monthly: 'price_1SXADj2OXBs6ZYwlY8id3Yhy', yearly: 'price_1SXADj2OXBs6ZYwlywQCp6oR' },
                    pro: { monthly: 'price_1SXADj2OXBs6ZYwlqdFI6aUU', yearly: 'price_1SXADk2OXBs6ZYwl0zZsxETJ' },
                    premium: { monthly: 'price_1SXADk2OXBs6ZYwlxiqqQqVA', yearly: 'price_1SXADl2OXBs6ZYwl0PlnAeX9' }
                };
                
                const newPriceId = PRICE_IDS_NEW[newPlan]?.[newBillingPeriod];
                
                // Crea la subscription con addebito immediato
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
                console.log(`💰 Invoice status: ${subscription.latest_invoice?.status}`);
                
                // Aggiorna l'utente
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: 'active',
                    subscription_plan: newPlan,
                    stripe_subscription_id: subscription.id,
                    trial_ends_at: null
                });
                
                // ✅ Crea Transaction subito (non aspettare il webhook)
                const paidAmount = subscription.latest_invoice?.amount_paid 
                    ? subscription.latest_invoice.amount_paid / 100 
                    : planPrice;
                    
                try {
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
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
                        traffic_source: user.traffic_source || 'direct',
                        metadata: {
                            upgraded_from: user.subscription_plan || 'standard',
                            payment_method: 'card'
                        }
                    });
                    console.log(`✅ Transaction created: ${transaction.id}`);
                } catch (txError) {
                    console.error('⚠️ Transaction creation error:', txError.message);
                }
                
                // 🔗 AFFILIATE: Traccia commissione
                const affiliateCode = user.referred_by_affiliate_code || user.referred_by;
                console.log('🔗 Checking affiliate for user:', user.email, 'code:', affiliateCode);
                const paymentIntent = subscription.latest_invoice?.payment_intent;
                const invoiceAmount = subscription.latest_invoice?.amount_paid;
                console.log('💰 Payment info - Intent:', paymentIntent?.id || paymentIntent, 'Amount:', invoiceAmount);
                
                if (affiliateCode && invoiceAmount > 0) {
                    try {
                        console.log(`🔗 Tracking affiliate commission for code: ${affiliateCode}`);
                        const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                            affiliate_code: affiliateCode.toUpperCase()
                        });
                        console.log('🔍 Affiliate links found:', affiliateLinks.length);

                        if (affiliateLinks.length > 0) {
                            const affiliateLink = affiliateLinks[0];
                            const affiliateLinkId = affiliateLink.id || affiliateLink._id;
                            const paidAmount = invoiceAmount / 100; // Use invoice amount, not paymentIntent
                            const commissionAmount = paidAmount * 0.10;
                            console.log(`💰 Commission calculation: ${paidAmount} * 10% = ${commissionAmount}`);
                            console.log(`📋 AffiliateLink ID: ${affiliateLinkId}, user_id: ${affiliateLink.user_id}`);

                            const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
                            
                            const affiliateCredit = await base44.asServiceRole.entities.AffiliateCredit.create({
                                affiliate_user_id: affiliateLink.user_id,
                                referred_user_id: user.id,
                                stripe_payment_intent_id: paymentIntentId,
                                amount_paid: paidAmount,
                                commission_amount: commissionAmount,
                                commission_status: 'available',
                                payment_date: new Date().toISOString()
                            });
                            console.log(`✅ AffiliateCredit created: ${affiliateCredit.id}`);

                            // Update AffiliateLink totals
                            try {
                                const currentTotalReferrals = affiliateLink.total_referrals || 0;
                                const currentTotalEarned = affiliateLink.total_earned || 0;
                                const currentAvailableBalance = affiliateLink.available_balance || 0;
                                
                                console.log(`📊 Current totals - referrals: ${currentTotalReferrals}, earned: ${currentTotalEarned}, balance: ${currentAvailableBalance}`);
                                
                                const updateResult = await base44.asServiceRole.entities.AffiliateLink.update(affiliateLinkId, {
                                    total_referrals: currentTotalReferrals + 1,
                                    total_earned: currentTotalEarned + commissionAmount,
                                    available_balance: currentAvailableBalance + commissionAmount
                                });
                                console.log(`✅ AffiliateLink update result:`, JSON.stringify(updateResult));
                            } catch (updateError) {
                                console.error(`⚠️ AffiliateLink update failed: ${updateError.message}`);
                                console.error(`Stack: ${updateError.stack}`);
                            }

                            console.log(`✅ Affiliate commission tracked: €${commissionAmount.toFixed(2)} for affiliate ${affiliateLink.user_id}`);
                        } else {
                            console.log('⚠️ No affiliate link found for code:', affiliateCode);
                        }
                    } catch (affiliateError) {
                        console.error('⚠️ Affiliate tracking error:', affiliateError.message);
                        console.error('Stack:', affiliateError.stack);
                    }
                } else {
                    console.log('⚠️ Skipping affiliate tracking - no code or no amount:', { affiliateCode, invoiceAmount });
                }
                
                return Response.json({
                    success: true,
                    isDowngrade: false,
                    message: `Piano aggiornato a ${newPlan}!`,
                    amountCharged: planPrice,
                    subscriptionId: subscription.id
                });
            }
            
            // Altrimenti richiede checkout
            return Response.json({ 
                success: true,
                requiresCheckout: true,
                redirectUrl: '/TrialSetup',
                message: 'Completa il checkout per attivare il piano'
            });
        }

        if (!user.stripe_subscription_id) {
            return Response.json({ 
                success: false, 
                error: 'No active subscription found' 
            }, { status: 400 });
        }

        const PRICE_IDS = {
            base: {
                monthly: 'price_1SXADj2OXBs6ZYwlY8id3Yhy',
                yearly: 'price_1SXADj2OXBs6ZYwlywQCp6oR'
            },
            pro: {
                monthly: 'price_1SXADj2OXBs6ZYwlqdFI6aUU',
                yearly: 'price_1SXADk2OXBs6ZYwl0zZsxETJ'
            },
            premium: {
                monthly: 'price_1SXADk2OXBs6ZYwlxiqqQqVA',
                yearly: 'price_1SXADl2OXBs6ZYwl0PlnAeX9'
            }
        };

        const newPriceId = PRICE_IDS[newPlan]?.[newBillingPeriod];
        
        if (!newPriceId) {
            return Response.json({ 
                success: false, 
                error: 'Invalid plan or billing period' 
            }, { status: 400 });
        }

        console.log('📦 Retrieving current subscription...');
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
        
        const currentPriceId = subscription.items.data[0].price.id;
        const currentPlan = user.subscription_plan || 'base';
        const currentBillingPeriod = subscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';

        // 🧮 Calcola il prorated amount
        const now = Math.floor(Date.now() / 1000);
        const periodStart = subscription.current_period_start;
        const periodEnd = subscription.current_period_end;
        const totalPeriodDuration = periodEnd - periodStart;
        const elapsedTime = now - periodStart;
        const remainingTime = periodEnd - now;
        const percentageRemaining = remainingTime / totalPeriodDuration;

        console.log('📊 Proration calculation:', {
            currentPlan,
            currentBillingPeriod,
            newPlan,
            newBillingPeriod,
            percentageRemaining: (percentageRemaining * 100).toFixed(2) + '%'
        });

        // Calcola il credito residuo dal piano attuale
        const currentPlanPrice = PLAN_PRICES[currentPlan][currentBillingPeriod];
        const creditFromCurrentPlan = currentPlanPrice * percentageRemaining;

        // Calcola il costo del nuovo piano
        const newPlanPrice = PLAN_PRICES[newPlan][newBillingPeriod];

        // Importo da pagare = Nuovo piano completo - Credito rimanente
        let amountToPay = newPlanPrice - creditFromCurrentPlan;

        // Per downgrade, il credito viene mantenuto fino alla fine del periodo
        const isDowngrade = (
            (currentPlan === 'premium' && (newPlan === 'pro' || newPlan === 'base')) ||
            (currentPlan === 'pro' && newPlan === 'base')
        );

        if (isDowngrade) {
            amountToPay = 0; // Nessun addebito per downgrade
        }

        // Arrotonda a 2 decimali
        amountToPay = Math.max(0, Math.round(amountToPay * 100) / 100);

        console.log('💰 Pricing details:', {
            currentPlanPrice: currentPlanPrice.toFixed(2),
            creditFromCurrentPlan: creditFromCurrentPlan.toFixed(2),
            newPlanPrice: newPlanPrice.toFixed(2),
            amountToPay: amountToPay.toFixed(2),
            isDowngrade
        });

        // Se è solo un calcolo, ritorna i dati
        if (calculateOnly) {
            return Response.json({
                success: true,
                calculate: true,
                hasPaymentMethod: true, // Se ha subscription attiva, ha metodo di pagamento
                currentPlan,
                currentBillingPeriod,
                currentPlanPrice,
                newPlanPrice,
                creditFromCurrentPlan,
                amountToPay,
                isDowngrade,
                percentageRemaining: Math.round(percentageRemaining * 100)
            });
        }

        // Procedi con l'upgrade/downgrade
        if (isDowngrade) {
            console.log('⬇️ Processing downgrade - no immediate charge');
            // Per il downgrade, modifica la subscription per cambiare al prossimo periodo
            await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }],
                proration_behavior: 'none',
                billing_cycle_anchor: 'unchanged'
            });

            await base44.asServiceRole.entities.User.update(user.id, {
                // Mantieni il piano attuale fino alla fine del periodo
                pending_plan_change: newPlan,
                pending_billing_period: newBillingPeriod
            });

            console.log('✅ Downgrade scheduled for end of billing period');

            return Response.json({
                success: true,
                isDowngrade: true,
                message: `Piano modificato. Il downgrade a ${newPlan} sarà effettivo dalla prossima fatturazione.`,
                effectiveDate: new Date(periodEnd * 1000).toLocaleDateString('it-IT')
            });
        } else {
            console.log('⬆️ Processing upgrade - immediate charge with proration');
            
            // Per upgrade, addebita immediatamente SOLO la differenza prorated
            // NON usare billing_cycle_anchor: 'now' che resetta il ciclo e addebita l'intero nuovo piano
            await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }],
                proration_behavior: 'always_invoice'
                // billing_cycle_anchor rimane invariato per mantenere il ciclo originale
            });

            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_plan: newPlan,
                subscription_status: 'active',
                trial_ends_at: null,
                pending_plan_change: null,
                pending_billing_period: null
            });

            // ✅ Crea Transaction per upgrade con proration
            if (amountToPay > 0) {
                try {
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: user.id,
                        stripe_subscription_id: user.stripe_subscription_id,
                        amount: amountToPay,
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
                            credit_applied: creditFromCurrentPlan.toFixed(2),
                            payment_method: 'card'
                        }
                    });
                    console.log(`✅ Transaction created: ${transaction.id}`);
                    
                    // 🔗 AFFILIATE: Traccia commissione per upgrade prorated
                    const affiliateCode = user.referred_by_affiliate_code || user.referred_by;
                    console.log('🔗 Checking affiliate for prorated upgrade:', user.email, 'code:', affiliateCode);
                    
                    if (affiliateCode && amountToPay > 0) {
                        try {
                            console.log(`🔗 Tracking affiliate commission for code: ${affiliateCode}`);
                            const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
                                affiliate_code: affiliateCode.toUpperCase()
                            });
                            console.log('🔍 Affiliate links found:', affiliateLinks.length);

                            if (affiliateLinks.length > 0) {
                                const affiliateLink = affiliateLinks[0];
                                const affiliateLinkId = affiliateLink.id || affiliateLink._id;
                                const commissionAmount = amountToPay * 0.10;
                                console.log(`💰 Commission calculation: ${amountToPay} * 10% = ${commissionAmount}`);
                                console.log(`📋 AffiliateLink ID: ${affiliateLinkId}, user_id: ${affiliateLink.user_id}`);

                                const affiliateCredit = await base44.asServiceRole.entities.AffiliateCredit.create({
                                    affiliate_user_id: affiliateLink.user_id,
                                    referred_user_id: user.id,
                                    transaction_id: transaction.id,
                                    amount_paid: amountToPay,
                                    commission_amount: commissionAmount,
                                    commission_status: 'available',
                                    payment_date: new Date().toISOString()
                                });
                                console.log(`✅ AffiliateCredit created: ${affiliateCredit.id}`);

                                // Update AffiliateLink totals
                                try {
                                    const currentTotalReferrals = affiliateLink.total_referrals || 0;
                                    const currentTotalEarned = affiliateLink.total_earned || 0;
                                    const currentAvailableBalance = affiliateLink.available_balance || 0;
                                    
                                    console.log(`📊 Current totals - referrals: ${currentTotalReferrals}, earned: ${currentTotalEarned}, balance: ${currentAvailableBalance}`);
                                    
                                    const updateResult = await base44.asServiceRole.entities.AffiliateLink.update(affiliateLinkId, {
                                        total_referrals: currentTotalReferrals + 1,
                                        total_earned: currentTotalEarned + commissionAmount,
                                        available_balance: currentAvailableBalance + commissionAmount
                                    });
                                    console.log(`✅ AffiliateLink update result:`, JSON.stringify(updateResult));
                                } catch (updateError) {
                                    console.error(`⚠️ AffiliateLink update failed: ${updateError.message}`);
                                    console.error(`Stack: ${updateError.stack}`);
                                }

                                console.log(`✅ Affiliate commission tracked: €${commissionAmount.toFixed(2)} for affiliate ${affiliateLink.user_id}`);
                            } else {
                                console.log('⚠️ No affiliate link found for code:', affiliateCode);
                            }
                        } catch (affiliateError) {
                            console.error('⚠️ Affiliate tracking error:', affiliateError.message);
                        }
                    } else {
                        console.log('⚠️ Skipping affiliate tracking - no code or no amount:', { affiliateCode, amountToPay });
                    }
                } catch (txError) {
                    console.error('⚠️ Transaction creation error:', txError.message);
                }
            }

            console.log('✅ Upgrade completed with immediate billing');

            return Response.json({
                success: true,
                isDowngrade: false,
                message: `Piano aggiornato a ${newPlan}!`,
                amountCharged: amountToPay
            });
        }

    } catch (error) {
        console.error('❌ Upgrade/Downgrade error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});