import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🔄 upgradeDowngradeSubscription - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { newPlan, newBillingPeriod } = await req.json();
        
        if (!newPlan || !newBillingPeriod) {
            return Response.json({ 
                success: false, 
                error: 'Missing newPlan or newBillingPeriod' 
            }, { status: 400 });
        }

        console.log(`✅ User ${user.email} requesting change to ${newPlan}/${newBillingPeriod}`);

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

        // 💳 ADDEBITO IMMEDIATO: Crea una fattura prorata immediatamente
        console.log('💰 Creating immediate proration invoice...');
        await stripe.subscriptions.update(user.stripe_subscription_id, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPriceId
            }],
            proration_behavior: 'always_invoice',
            billing_cycle_anchor: 'now',
            trial_end: 'now'
        });

        console.log('💾 Updating user record...');
        await base44.asServiceRole.entities.User.update(user.id, {
            subscription_plan: newPlan,
            subscription_status: 'active',
            trial_ends_at: null
        });

        console.log('✅ Subscription updated successfully with immediate billing');

        return Response.json({
            success: true,
            message: 'Piano aggiornato e addebitato immediatamente'
        });

    } catch (error) {
        console.error('❌ Upgrade/Downgrade error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});