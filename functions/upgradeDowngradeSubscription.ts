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

        const isUpgradeFromFree = !user.stripe_subscription_id || user.subscription_plan === 'trial' || user.subscription_plan === 'standard';
        
        if (isUpgradeFromFree) {
            console.log('🆕 Upgrade from free plan - redirect to pricing page for checkout');
            // Per upgrade da piano gratuito, reindirizza alla pagina pricing
            return Response.json({ 
                success: true,
                requiresCheckout: true,
                redirectUrl: '/pricing',
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

        const PLAN_PRICES = {
            base: { monthly: 19, yearly: 182.4 },
            pro: { monthly: 29, yearly: 278.4 },
            premium: { monthly: 39, yearly: 374.4 }
        };

        const newPriceId = PRICE_IDS[newPlan]?.[newBillingPeriod];
        
        if (!newPriceId) {
            return Response.json({ 
                success: false, 
                error: 'Invalid plan or billing period' 
            }, { status: 400 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

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
            
            // Per upgrade, addebita immediatamente la differenza
            await stripe.subscriptions.update(user.stripe_subscription_id, {
                items: [{
                    id: subscription.items.data[0].id,
                    price: newPriceId
                }],
                proration_behavior: 'always_invoice',
                billing_cycle_anchor: 'now',
                trial_end: 'now'
            });

            await base44.asServiceRole.entities.User.update(user.id, {
                subscription_plan: newPlan,
                subscription_status: 'active',
                trial_ends_at: null,
                pending_plan_change: null,
                pending_billing_period: null
            });

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