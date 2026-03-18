import { Base44 } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    console.log('🔍 Checking and blocking failed subscriptions...');

    try {
        const base44 = new Base44({
            appId: Deno.env.get('BASE44_APP_ID'),
            serviceRole: true
        });

        // Trova tutti gli utenti con subscription attiva o in trial nel database
        const activeUsers = await base44.asServiceRole.entities.User.filter({
            subscription_status: { $in: ['active', 'trial', 'payment_failed'] }
        });

        console.log(`📊 Found ${activeUsers.length} users with active/trial/payment_failed status`);

        let blockedCount = 0;
        let alreadyCancelledCount = 0;

        for (const user of activeUsers) {
            if (!user.stripe_subscription_id) {
                // Se non ha subscription_id ma è marcato come attivo, è un problema
                if (user.subscription_status !== 'payment_failed') {
                    console.log(`⚠️ User ${user.email} has no stripe_subscription_id but status is ${user.subscription_status}`);
                    
                    // BLOCCO
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_plan: 'free',
                        subscription_status: 'cancelled',
                        subscription_period_end: null,
                        trial_ends_at: null
                    });
                    blockedCount++;
                    console.log(`🚫 User ${user.email} BLOCKED (no subscription ID)`);
                }
                continue;
            }

            try {
                // Verifica lo stato della subscription su Stripe
                const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
                
                console.log(`📋 User ${user.email}: Stripe status = ${subscription.status}, DB status = ${user.subscription_status}`);

                // Se su Stripe è cancelled, incomplete_expired, unpaid, past_due → BLOCCO
                if (['canceled', 'incomplete_expired', 'unpaid', 'past_due'].includes(subscription.status)) {
                    console.log(`🚫 User ${user.email} has cancelled/failed subscription on Stripe: ${subscription.status}`);
                    
                    // BLOCCO TOTALE
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_plan: 'free',
                        subscription_status: 'cancelled',
                        stripe_subscription_id: null,
                        subscription_period_end: null,
                        trial_ends_at: null
                    });
                    
                    blockedCount++;
                    console.log(`✅ User ${user.email} BLOCKED`);
                }
                // Se su Stripe è attivo ma nel DB è payment_failed, aggiorna DB
                else if (subscription.status === 'active' && user.subscription_status === 'payment_failed') {
                    console.log(`✅ User ${user.email} payment recovered - updating DB status to active`);
                    
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_status: 'active'
                    });
                }
                // Se su Stripe è trialing ma è scaduto → BLOCCO
                else if (subscription.status === 'trialing' && subscription.trial_end) {
                    const trialEndDate = new Date(subscription.trial_end * 1000);
                    if (trialEndDate < new Date()) {
                        console.log(`🚫 User ${user.email} trial expired but still marked as trialing`);
                        
                        // Stripe dovrebbe aver già tentato il pagamento e fallito
                        // BLOCCO
                        await base44.asServiceRole.entities.User.update(user.id, {
                            subscription_plan: 'free',
                            subscription_status: 'cancelled',
                            stripe_subscription_id: null,
                            subscription_period_end: null,
                            trial_ends_at: null
                        });
                        
                        blockedCount++;
                        console.log(`✅ User ${user.email} BLOCKED (expired trial)`);
                    }
                }

            } catch (stripeError) {
                // Se Stripe restituisce errore "No such subscription" → la subscription è stata cancellata
                if (stripeError.code === 'resource_missing') {
                    console.log(`🚫 User ${user.email} subscription not found on Stripe (deleted)`);
                    
                    // BLOCCO
                    await base44.asServiceRole.entities.User.update(user.id, {
                        subscription_plan: 'free',
                        subscription_status: 'cancelled',
                        stripe_subscription_id: null,
                        subscription_period_end: null,
                        trial_ends_at: null
                    });
                    
                    blockedCount++;
                    alreadyCancelledCount++;
                    console.log(`✅ User ${user.email} BLOCKED (subscription missing on Stripe)`);
                } else {
                    console.error(`⚠️ Error checking subscription for ${user.email}:`, stripeError.message);
                }
            }
        }

        console.log(`✅ Check completed: ${blockedCount} users blocked (${alreadyCancelledCount} already cancelled on Stripe)`);

        return Response.json({
            success: true,
            checked: activeUsers.length,
            blocked: blockedCount,
            already_cancelled: alreadyCancelledCount
        });

    } catch (error) {
        console.error('❌ Error checking subscriptions:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});