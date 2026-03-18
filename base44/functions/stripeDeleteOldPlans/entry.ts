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

        console.log('🗑️ Eliminazione piani vecchi...');

        // Piani da eliminare
        const plansToDelete = ['base', 'pro', 'premium', 'landing_offer'];
        const deletedProducts = [];
        const deletedPrices = [];

        // Recupera tutti i prodotti
        const allProducts = await stripe.products.list({ limit: 100 });

        // Filtra e archiva i prodotti vecchi
        for (const product of allProducts.data) {
            const planId = product.metadata?.plan_id;
            if (plansToDelete.includes(planId)) {
                console.log(`🗑️ Archiviando prodotto: ${product.name} (${product.id})`);
                await stripe.products.update(product.id, { active: false });
                deletedProducts.push({
                    id: product.id,
                    name: product.name,
                    plan_id: planId
                });

                // Archiva tutti i prezzi associati
                const prices = await stripe.prices.list({ product: product.id, limit: 100 });
                for (const price of prices.data) {
                    console.log(`🗑️ Archiviando prezzo: ${price.id}`);
                    await stripe.prices.update(price.id, { active: false });
                    deletedPrices.push({
                        id: price.id,
                        product_id: product.id,
                        amount: price.unit_amount,
                        currency: price.currency
                    });
                }
            }
        }

        const result = {
            success: true,
            message: '✅ Piani vecchi archiviati con successo',
            deleted_products: deletedProducts,
            deleted_prices: deletedPrices,
            total_products_deleted: deletedProducts.length,
            total_prices_deleted: deletedPrices.length
        };

        console.log('✅ Eliminazione completata!');
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