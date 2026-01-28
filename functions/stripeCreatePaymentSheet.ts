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
        
        if (stripeCustomerId) {
            try {
                // Verifica che il customer esista
                await stripe.customers.retrieve(stripeCustomerId);
                console.log(`✅ Customer found: ${stripeCustomerId}`);
            } catch (error) {
                console.warn(`⚠️ Customer ${stripeCustomerId} not found, creating new one...`);
                stripeCustomerId = null;
            }
        }
        
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

        // Crea SetupIntent per salvare il metodo di pagamento
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            usage: 'off_session',
            metadata: {
                user_id: user.id
            }
        });

        console.log(`✅ Setup Intent created: ${setupIntent.id}, clientSecret: ${setupIntent.client_secret}`);

        return Response.json({
            success: true,
            clientSecret: setupIntent.client_secret,
            customer: stripeCustomerId,
            priceId: priceId,
            hasTrial: hasTrial,
            trialDays: trialDays
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