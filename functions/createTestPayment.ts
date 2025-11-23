import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ✅ SECURITY: Only admins can create test payments
        if (user.role !== 'admin') {
            console.error('❌ Non-admin user trying to create test payment');
            return Response.json({ 
                error: 'Forbidden: Only admins can create test payments' 
            }, { status: 403 });
        }

        console.log('🧪 Creating test payment for user:', user.email);

        // Get or create Stripe customer
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name || user.billing_name,
                metadata: {
                    user_id: user.id,
                    app: 'mywellness'
                }
            });
            customerId = customer.id;

            await base44.asServiceRole.entities.User.update(user.id, {
                stripe_customer_id: customerId
            });

            console.log('✅ Customer created:', customerId);
        }

        // Get origin from request
        const origin = req.headers.get('origin') || 'https://mywellness24x7.base44.app';

        // Create checkout session for €0.50 (50 cents)
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: '🧪 Test Webhook - Verifica Fattura',
                            description: 'Pagamento di test per verificare webhook e generazione fatture automatiche',
                        },
                        unit_amount: 50, // 50 cents = €0.50
                    },
                    quantity: 1,
                },
            ],
            success_url: `${origin}/dashboard?payment=success`,
            cancel_url: `${origin}/dashboard?payment=cancelled`,
            metadata: {
                user_id: user.id,
                plan_type: 'test',
                type: 'test_payment',
                traffic_source: user.traffic_source || 'direct'
            }
        });

        console.log('✅ Test payment checkout created:', session.url);

        return Response.json({
            success: true,
            checkout_url: session.url,
            session_id: session.id,
            amount: '€0.50'
        });

    } catch (error) {
        console.error('❌ Test payment error:', error);
        return Response.json({
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});