import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 stripeCreateSubscriptionAfterPayment - Start');
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        return Response.json({ success: false, error: 'Stripe not configured' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { customerId, priceId, paymentMethodId } = body;

        if (!customerId || !priceId || !paymentMethodId) {
            return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Associa il payment method al customer
        await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

        // Imposta come default
        await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId }
        });

        // Crea la subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            default_payment_method: paymentMethodId,
            off_session: true,
            metadata: {
                user_id: user.id
            }
        });

        console.log(`✅ Subscription created: ${subscription.id}`);

        return Response.json({
            success: true,
            subscriptionId: subscription.id
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});