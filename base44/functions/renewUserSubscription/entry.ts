import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const admin = await base44.auth.me();

        if (!admin || admin.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (!users || users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Rinnova per 30 giorni
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 30);

        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: 'active',
            subscription_period_end: newEndDate.toISOString(),
            cancellation_at_period_end: false
        });

        console.log(`✅ User ${user.email} subscription renewed until ${newEndDate.toISOString()}`);

        // Opzionale: riattiva anche subscription Stripe se esiste
        if (user.stripe_subscription_id) {
            const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
            if (stripeSecretKey) {
                const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
                try {
                    await stripe.subscriptions.update(user.stripe_subscription_id, {
                        cancel_at_period_end: false
                    });
                    console.log(`✅ Stripe subscription ${user.stripe_subscription_id} reactivated`);
                } catch (stripeError) {
                    console.error('Stripe reactivation error:', stripeError.message);
                }
            }
        }

        return Response.json({
            success: true,
            message: 'Subscription renewed successfully',
            new_end_date: newEndDate.toISOString()
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});