import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚫 cancelMySubscription - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log(`✅ User ${user.email} requesting to cancel own subscription`);

        if (!user.stripe_subscription_id) {
            return Response.json({ 
                success: false, 
                error: 'No active subscription found' 
            }, { status: 400 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            return Response.json({ 
                success: false, 
                error: 'Stripe not configured' 
            }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        console.log(`🔄 Updating Stripe subscription to cancel at period end...`);
        const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
            cancel_at_period_end: true
        });

        console.log(`✅ Stripe subscription will cancel at: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

        console.log('💾 Updating user record...');
        await base44.asServiceRole.entities.User.update(user.id, {
            cancellation_at_period_end: true
        });

        // Invia email di conferma cancellazione
        try {
            await base44.asServiceRole.functions.invoke('sendCancellationConfirmation', {
                userId: user.id
            });
            console.log('✅ Cancellation confirmation email sent');
        } catch (emailError) {
            console.error('⚠️ Email error (non-critical):', emailError.message);
        }

        console.log(`✅ User ${user.email} subscription cancelled successfully`);

        return Response.json({
            success: true,
            message: 'Subscription will be cancelled at period end',
            period_end: subscription.current_period_end
        });

    } catch (error) {
        console.error('❌ Cancel subscription error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});