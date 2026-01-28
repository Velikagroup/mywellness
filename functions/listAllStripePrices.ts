import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ 
                error: 'Unauthorized - Admin only' 
            }, { status: 401 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            return Response.json({ 
                error: 'STRIPE_SECRET_KEY not configured' 
            }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        console.log('🔍 Cercando tutti i prezzi attivi su Stripe...');

        // Recupero tutti i prodotti attivi
        const allProducts = await stripe.products.list({ limit: 100, active: true });
        
        const result = {
            total_products: allProducts.data.length,
            products: []
        };

        // Per ogni prodotto, recupero i prezzi
        for (const product of allProducts.data) {
            const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });
            
            if (prices.data.length > 0) {
                result.products.push({
                    product_id: product.id,
                    product_name: product.name,
                    plan_id: product.metadata?.plan_id,
                    prices: prices.data.map(p => ({
                        price_id: p.id,
                        amount: p.unit_amount,
                        currency: p.currency,
                        type: p.type,
                        interval: p.recurring?.interval || 'one-time',
                        trial_days: p.recurring?.trial_period_days || 'none'
                    }))
                });
            }
        }

        console.log(JSON.stringify(result, null, 2));
        return Response.json(result);

    } catch (error) {
        console.error('❌ Errore:', error.message);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});