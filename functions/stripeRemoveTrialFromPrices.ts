import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 stripeRemoveTrialFromPrices - Start');
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
        return Response.json({ success: false, error: 'Stripe not configured' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        console.log('✅ Admin authenticated:', user.email);

        // Prezzi vecchi con trial da sostituire
        const oldPrices = [
            // Base
            { oldId: 'price_1SNDMW2OXBs6ZYwlp5UgCO8Y', product: 'prod_TJr4u4iETzhMsy', amount: 1900, interval: 'month', metadata: { billing_period: 'monthly', plan_id: 'base' } },
            { oldId: 'price_1SNDMW2OXBs6ZYwlUfiZP4Su', product: 'prod_TJr4u4iETzhMsy', amount: 18240, interval: 'year', metadata: { billing_period: 'yearly', plan_id: 'base' } },
            // Pro
            { oldId: 'price_1SNDMX2OXBs6ZYwlx6jXOgFf', product: 'prod_TJr4ZojeVfZdZY', amount: 2900, interval: 'month', metadata: { billing_period: 'monthly', plan_id: 'pro' } },
            { oldId: 'price_1SNDMX2OXBs6ZYwlvGtzkQKA', product: 'prod_TJr4ZojeVfZdZY', amount: 27840, interval: 'year', metadata: { billing_period: 'yearly', plan_id: 'pro' } },
            // Premium
            { oldId: 'price_1SNDMX2OXBs6ZYwlKR7FIudX', product: 'prod_TJr4vSwe5zDhPS', amount: 3900, interval: 'month', metadata: { billing_period: 'monthly', plan_id: 'premium' } },
            { oldId: 'price_1SNDMY2OXBs6ZYwlcZzmNSnk', product: 'prod_TJr4vSwe5zDhPS', amount: 37440, interval: 'year', metadata: { billing_period: 'yearly', plan_id: 'premium' } },
        ];

        const results = [];

        for (const priceConfig of oldPrices) {
            try {
                console.log(`📦 Processing ${priceConfig.metadata.plan_id} ${priceConfig.metadata.billing_period}...`);
                
                // 1. Crea nuovo prezzo SENZA trial
                const newPrice = await stripe.prices.create({
                    product: priceConfig.product,
                    unit_amount: priceConfig.amount,
                    currency: 'eur',
                    recurring: {
                        interval: priceConfig.interval,
                        interval_count: 1
                        // NO trial_period_days!
                    },
                    metadata: priceConfig.metadata
                });

                console.log(`✅ New price created: ${newPrice.id}`);

                // 2. Archivia il vecchio prezzo (non si può eliminare se ha subscription attive)
                await stripe.prices.update(priceConfig.oldId, {
                    active: false
                });

                console.log(`🗄️ Old price archived: ${priceConfig.oldId}`);

                results.push({
                    plan: priceConfig.metadata.plan_id,
                    period: priceConfig.metadata.billing_period,
                    oldPriceId: priceConfig.oldId,
                    newPriceId: newPrice.id,
                    status: 'success'
                });

            } catch (error) {
                console.error(`❌ Error for ${priceConfig.metadata.plan_id} ${priceConfig.metadata.billing_period}:`, error.message);
                results.push({
                    plan: priceConfig.metadata.plan_id,
                    period: priceConfig.metadata.billing_period,
                    oldPriceId: priceConfig.oldId,
                    error: error.message,
                    status: 'error'
                });
            }
        }

        console.log('✅ Migration completed');
        console.log('📋 Results:', JSON.stringify(results, null, 2));

        return Response.json({
            success: true,
            message: 'Prezzi migrati con successo! Aggiorna i PRICE_IDS nel codice con i nuovi ID.',
            results: results
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});