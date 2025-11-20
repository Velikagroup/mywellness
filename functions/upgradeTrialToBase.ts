import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verifica che sia in trial
        if (user.subscription_plan !== 'trial') {
            return Response.json({ 
                error: 'Non sei in periodo trial' 
            }, { status: 400 });
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16',
        });

        // Cancella la subscription trial corrente
        if (user.stripe_subscription_id) {
            await stripe.subscriptions.cancel(user.stripe_subscription_id);
        }

        // Cancella lo schedule futuro
        if (user.stripe_subscription_schedule_id) {
            await stripe.subscriptionSchedules.cancel(user.stripe_subscription_schedule_id);
        }

        // Crea immediatamente la subscription Base
        const targetPlan = user.target_plan_after_trial || 'base';
        const priceId = 'price_1SNDMW2OXBs6ZYwlp5UgCO8Y'; // Base monthly

        const subscription = await stripe.subscriptions.create({
            customer: user.stripe_customer_id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                user_id: user.id,
                plan_type: targetPlan,
                upgraded_from_trial: 'true'
            }
        });

        // Aggiorna user
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: 'active',
            subscription_plan: targetPlan,
            stripe_subscription_id: subscription.id,
            stripe_subscription_schedule_id: null,
            trial_ends_at: null
        });

        return Response.json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});