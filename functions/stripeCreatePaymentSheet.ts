import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 stripeCreatePaymentSheet - Start');
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        console.error('❌ STRIPE_SECRET_KEY not configured!');
        return Response.json({ 
            success: false,
            error: 'Stripe configuration missing' 
        }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
    });
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            console.error('❌ User not authenticated');
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ User authenticated:', user.email);

        const body = await req.json();
        const { 
            priceId,
            hasTrial = false,
            trialDays = 0
        } = body;

        if (!priceId) {
            return Response.json({ 
                success: false,
                error: 'Missing priceId' 
            }, { status: 400 });
        }

        console.log(`💳 Creating Payment Sheet for priceId: ${priceId}, trial: ${hasTrial ? `${trialDays} days` : 'none'}`);

        // Crea o recupera customer Stripe
        let stripeCustomerId = user.stripe_customer_id;
        
        if (!stripeCustomerId) {
            console.log('🆕 Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id,
                    base44_app: 'mywellness'
                }
            });
            stripeCustomerId = customer.id;
            
            await base44.asServiceRole.entities.User.update(user.id, {
                stripe_customer_id: stripeCustomerId
            });
            
            console.log(`✅ Customer created: ${stripeCustomerId}`);
        }

        // Crea Checkout Session per Payment Sheet
        const sessionParams = {
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                }
            ],
            success_url: `https://app.projectmywellness.com/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://app.projectmywellness.com/PostQuizSubscription`,
            metadata: {
                user_id: user.id,
                has_trial: hasTrial ? 'true' : 'false'
            },
            subscription_data: {
                metadata: {
                    user_id: user.id
                }
            }
        };

        // Aggiungi trial solo se richiesto
        if (hasTrial && trialDays > 0) {
            sessionParams.subscription_data.trial_period_days = trialDays;
            sessionParams.payment_method_collection = 'if_required'; // Non richiede pagamento per trial
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        console.log(`✅ Checkout Session created: ${session.id}`);

        return Response.json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('❌ Payment Sheet error:', error);
        console.error('❌ Error message:', error.message);
        
        return Response.json({ 
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
});