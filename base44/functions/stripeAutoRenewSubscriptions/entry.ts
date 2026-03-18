import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('CRON START - stripeAutoRenewSubscriptions');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!stripeSecretKey) {
        console.error('STRIPE_SECRET_KEY not configured');
        return Response.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey);
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Verifica autenticazione cron
        const authHeader = req.headers.get('Authorization');
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron call');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔍 Searching for Landing Offer users to renew...');

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        console.log(`📅 Today: ${today.toISOString()}`);
        console.log(`📅 Tomorrow: ${tomorrow.toISOString()}`);

        // Ottieni tutti gli utenti
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        // 🎯 FILTRA SOLO UTENTI CHE HANNO COMPRATO LANDING OFFER
        const usersToRenew = allUsers.filter(user => {
            // 🚨 CONDIZIONE PRINCIPALE: Ha comprato Landing Offer?
            if (!user.purchased_landing_offer) {
                return false;
            }
            
            // Solo utenti attivi
            if (user.subscription_status !== 'active') {
                console.log(`⏭️ Skipping ${user.email}: status = ${user.subscription_status}`);
                return false;
            }
            
            // Solo se hanno una data di scadenza fissa
            if (!user.subscription_expires_at) {
                console.log(`⏭️ Skipping ${user.email}: no subscription_expires_at`);
                return false;
            }
            
            // Solo se hanno carta salvata
            if (!user.payment_method_id || !user.stripe_customer_id) {
                console.log(`⏭️ Skipping ${user.email}: no payment method saved`);
                return false;
            }
            
            // ESCLUDI chi ha già una subscription ricorrente
            if (user.stripe_subscription_id) {
                console.log(`⏭️ Skipping ${user.email}: already has recurring subscription`);
                return false;
            }
            
            // Controlla scadenza
            const expiresAt = new Date(user.subscription_expires_at);
            const shouldRenew = expiresAt <= tomorrow;
            
            if (!shouldRenew) {
                console.log(`⏭️ Skipping ${user.email}: expires ${user.subscription_expires_at} (not yet)`);
                return false;
            }
            
            console.log(`✅ User ${user.email} qualifies for renewal! Expires: ${user.subscription_expires_at}`);
            return true;
        });

        console.log(`📊 Found ${usersToRenew.length} Landing Offer users to renew`);

        if (usersToRenew.length === 0) {
            return Response.json({
                success: true,
                message: 'No Landing Offer users to renew',
                renewed_count: 0
            });
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        // 🎯 PRICE IDS per ogni piano (mensile)
        const PRICE_IDS = {
            base: 'price_1SNDMW2OXBs6ZYwlp5UgCO8Y',      // €19/mese
            pro: 'price_1SNDMX2OXBs6ZYwlx6jXOgFf',       // €29/mese
            premium: 'price_1SNDMX2OXBs6ZYwlKR7FIudX'    // €39/mese
        };

        for (const user of usersToRenew) {
            console.log(`\n🔄 Processing: ${user.email}`);
            console.log(`   Current Plan: ${user.subscription_plan}`);
            console.log(`   Renewal Plan: ${user.renewal_plan || 'not set (will use current)'}`);
            console.log(`   Expiring: ${user.subscription_expires_at}`);

            try {
                // 🎯 USA renewal_plan se impostato, altrimenti usa subscription_plan
                const selectedPlan = user.renewal_plan || user.subscription_plan || 'premium';
                const priceId = PRICE_IDS[selectedPlan];
                
                if (!priceId) {
                    throw new Error(`Invalid plan: ${selectedPlan}`);
                }
                
                console.log(`   📦 Renewing to: ${selectedPlan.toUpperCase()} (${priceId})`);

                // Verifica payment method
                const paymentMethod = await stripe.paymentMethods.retrieve(user.payment_method_id);
                
                if (paymentMethod.customer !== user.stripe_customer_id) {
                    await stripe.paymentMethods.attach(user.payment_method_id, {
                        customer: user.stripe_customer_id,
                    });
                }

                console.log(`   💳 Payment Method: ${paymentMethod.card.brand} **** ${paymentMethod.card.last4}`);

                // Crea subscription ricorrente al piano SCELTO dall'utente
                const subscription = await stripe.subscriptions.create({
                    customer: user.stripe_customer_id,
                    items: [{ price: priceId }],
                    default_payment_method: user.payment_method_id,
                    payment_behavior: 'default_incomplete',
                    payment_settings: { 
                        save_default_payment_method: 'on_subscription',
                        payment_method_types: ['card']
                    },
                    expand: ['latest_invoice.payment_intent'],
                    metadata: {
                        user_id: user.id,
                        plan_type: selectedPlan,
                        billing_period: 'monthly',
                        renewal_type: 'auto_from_landing_offer'
                    }
                });

                console.log(`   ✅ Subscription created: ${subscription.id}`);
                console.log(`   📊 Status: ${subscription.status}`);

                // Aggiorna utente
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: 'active',
                    subscription_plan: selectedPlan, // ORA cambia al piano scelto
                    renewal_plan: null, // Resetta renewal_plan
                    stripe_subscription_id: subscription.id,
                    subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    subscription_expires_at: null, // Rimuovi data fissa
                    purchased_landing_offer: false // Reset flag, ora è subscription normale
                });

                console.log(`   ✅ User updated successfully!`);

                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'success',
                    plan_renewed_to: selectedPlan,
                    subscription_id: subscription.id,
                    previous_expires_at: user.subscription_expires_at
                });

                successCount++;

            } catch (error) {
                console.error(`   ❌ Renewal failed: ${error.message}`);
                
                await base44.asServiceRole.entities.User.update(user.id, {
                    subscription_status: 'payment_failed'
                });

                results.push({
                    user_id: user.id,
                    email: user.email,
                    status: 'failed',
                    error: error.message
                });

                failCount++;
            }
        }

        console.log('\n🎉 ========================================');
        console.log('🎉 CRON COMPLETED');
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log('🎉 ========================================');

        return Response.json({
            success: true,
            message: `Processed ${usersToRenew.length} Landing Offer users`,
            renewed_count: successCount,
            failed_count: failCount,
            results: results
        });

    } catch (error) {
        console.error('\n❌ ========================================');
        console.error('❌ CRON ERROR');
        console.error('❌ ========================================');
        console.error('❌ Error:', error.message);
        console.error('❌ Stack:', error.stack);
        
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});