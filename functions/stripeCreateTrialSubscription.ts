import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { priceId } = await req.json();

        if (!priceId) {
            return Response.json({ error: 'Missing priceId' }, { status: 400 });
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

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id,
                    full_name: user.full_name
                }
            });
            customerId = customer.id;

            // Salva il customer ID nell'utente
            await base44.auth.updateMe({
                stripe_customer_id: customerId
            });
        }

        // Crea la subscription con 3 giorni di trial (€0 iniziale)
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: priceId
                }
            ],
            trial_period_days: 3,
            metadata: {
                user_id: user.id
            }
        });

        console.log('✅ Trial subscription creata:', subscription.id);

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