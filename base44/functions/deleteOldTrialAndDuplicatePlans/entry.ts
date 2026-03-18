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

        // Prodotti da eliminare
        const productsToDelete = [
            { id: 'prod_TSJ6qkaGAOkSao', name: 'MyWellness Trial' },
            { id: 'prod_Ts8RCiVhDWXKSE', name: 'MyWellness (vecchio duplicato)' }
        ];

        const result = {
            deleted: [],
            errors: []
        };

        for (const product of productsToDelete) {
            try {
                console.log(`🗑️ Disattivando prodotto: ${product.name} (${product.id})`);
                
                // Disattiva il prodotto
                await stripe.products.update(product.id, { active: false });
                
                result.deleted.push({
                    product_id: product.id,
                    name: product.name,
                    status: '✅ Disattivato'
                });
                
                console.log(`✅ ${product.name} disattivato`);
            } catch (error) {
                result.errors.push({
                    product_id: product.id,
                    name: product.name,
                    error: error.message
                });
                console.error(`❌ Errore disattivazione ${product.name}:`, error.message);
            }
        }

        return Response.json(result);

    } catch (error) {
        console.error('❌ Errore generale:', error.message);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});