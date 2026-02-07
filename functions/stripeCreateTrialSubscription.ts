import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { priceId, paymentMethodId } = await req.json();

        if (!priceId) {
            return Response.json({ error: 'Missing priceId' }, { status: 400 });
        }

        if (!paymentMethodId) {
            return Response.json({ error: 'Missing paymentMethodId' }, { status: 400 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            return Response.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        // Cerca o crea un customer Stripe
        let customerId = user.stripe_customer_id;

        if (customerId) {
            try {
                await stripe.customers.retrieve(customerId);
            } catch (error) {
                console.warn('⚠️ Customer non valido, ne creo uno nuovo');
                customerId = null;
            }
        }

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id,
                    full_name: user.full_name
                }
            });
            customerId = customer.id;

            // Salva il customer ID nell'utente
            await base44.asServiceRole.entities.User.update(user.id, {
                stripe_customer_id: customerId
            });
        }

        // Allega il payment method al customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId
        });

        // Imposta come default
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // Crea la subscription con 3 giorni di trial (€0 iniziale, addebito dopo trial)
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: priceId
                }
            ],
            default_payment_method: paymentMethodId,
            trial_period_days: 3,
            metadata: {
                user_id: user.id
            }
        });

        console.log('✅ Trial subscription creata:', subscription.id);

        // Aggiorna l'utente con lo stato del trial
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'trial',
            stripe_subscription_id: subscription.id,
            subscription_plan: 'premium',
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

        // Track trial_started in QuizEvent
        try {
            const existingTrialEvents = await base44.asServiceRole.entities.QuizEvent.filter({
                user_id: user.id,
                event_name: 'trial_started'
            });
            
            if (existingTrialEvents.length === 0) {
                await base44.asServiceRole.entities.QuizEvent.create({
                    user_id: user.id,
                    event_name: 'trial_started',
                    step_index: 999,
                    step_name: 'Trial Started',
                    metadata: {
                        subscription_id: subscription.id,
                        plan: 'premium_trial'
                    }
                });
                console.log('✅ trial_started tracked in QuizEvent');
            }
        } catch (eventError) {
            console.error('⚠️ Error tracking trial_started:', eventError);
        }

        // Track: Step 3 - Subscription attivata (trial o pagamento)
        if (user.influencer_id) {
            try {
                await base44.functions.invoke('trackInfluencerEvent', {
                    influencerId: user.influencer_id,
                    eventType: 'subscription_activated'
                });
                console.log(`✅ Subscription activated tracked for influencer: ${user.influencer_id}`);
            } catch (trackError) {
                console.error('❌ Error tracking subscription activation:', trackError);
            }
        }

        return Response.json({
            success: true,
            subscription_id: subscription.id,
            customer_id: customerId,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
        });

    } catch (error) {
        console.error('❌ Errore creazione trial subscription:', error.message);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});