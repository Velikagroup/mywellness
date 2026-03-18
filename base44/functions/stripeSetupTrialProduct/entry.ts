import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16',
        });

        // Crea prodotto Trial
        const product = await stripe.products.create({
            name: 'MyWellness Trial',
            description: 'Prova gratuita di 3 giorni con accesso limitato (lunedì-mercoledì)',
            metadata: {
                app: 'mywellness',
                plan_id: 'trial',
                converts_to_plan: 'base',
                converts_to_price_id: 'price_1SNDMW2OXBs6ZYwlp5UgCO8Y'
            }
        });

        // Crea prezzo €0 per 3 giorni
        const price = await stripe.prices.create({
            product: product.id,
            currency: 'eur',
            unit_amount: 0,
            recurring: {
                interval: 'day',
                interval_count: 3
            },
            metadata: {
                plan_id: 'trial',
                billing_period: '3_days'
            }
        });

        // Rimuovi trial_period_days dai piani esistenti
        const priceIdsToUpdate = [
            'price_1SNDMW2OXBs6ZYwlp5UgCO8Y', // base monthly
            'price_1SNDMW2OXBs6ZYwlUfiZP4Su', // base yearly
            'price_1SNDMX2OXBs6ZYwlx6jXOgFf', // pro monthly
            'price_1SNDMX2OXBs6ZYwlvGtzkQKA', // pro yearly
            'price_1SNDMX2OXBs6ZYwlKR7FIudX', // premium monthly
            'price_1SNDMY2OXBs6ZYwlcZzmNSnk'  // premium yearly
        ];

        const updateResults = [];
        for (const priceId of priceIdsToUpdate) {
            try {
                await stripe.prices.update(priceId, {
                    recurring: {
                        trial_period_days: null
                    }
                });
                updateResults.push({ priceId, status: 'updated' });
            } catch (e) {
                updateResults.push({ priceId, status: 'error', error: e.message });
            }
        }

        return Response.json({
            success: true,
            trial_product: product,
            trial_price: price,
            updates: updateResults
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});