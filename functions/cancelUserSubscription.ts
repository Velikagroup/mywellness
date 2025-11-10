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

        // Cancella abbonamento Stripe se esiste
        if (user.stripe_subscription_id) {
            const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
            if (!stripeSecretKey) {
                return Response.json({ error: 'Stripe not configured' }, { status: 500 });
            }

            const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

            try {
                await stripe.subscriptions.cancel(user.stripe_subscription_id);
                console.log(`✅ Stripe subscription ${user.stripe_subscription_id} cancelled`);
            } catch (stripeError) {
                console.error('Stripe cancellation error:', stripeError.message);
                // Continue anyway to update user status
            }
        }

        // Aggiorna stato utente
        await base44.asServiceRole.entities.User.update(userId, {
            subscription_status: 'cancelled',
            cancellation_at_period_end: true
        });

        console.log(`✅ User ${user.email} subscription cancelled`);

        return Response.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});