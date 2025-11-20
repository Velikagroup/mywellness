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

        // I prezzi Stripe non possono essere modificati dopo la creazione
        // Devi creare NUOVI prezzi senza trial_period_days e sostituirli
        
        const results = {
            message: "I prezzi Stripe sono immutabili. Devi creare nuovi prezzi senza trial_period_days.",
            existing_prices: [
                'price_1SNDMW2OXBs6ZYwlp5UgCO8Y', // base monthly - ha trial_period_days: 3
                'price_1SNDMW2OXBs6ZYwlUfiZP4Su', // base yearly - ha trial_period_days: 3
                'price_1SNDMX2OXBs6ZYwlx6jXOgFf', // pro monthly - ha trial_period_days: 3
                'price_1SNDMX2OXBs6ZYwlvGtzkQKA', // pro yearly - ha trial_period_days: 3
                'price_1SNDMX2OXBs6ZYwlKR7FIudX', // premium monthly - ha trial_period_days: 3
                'price_1SNDMY2OXBs6ZYwlcZzmNSnk'  // premium yearly - ha trial_period_days: 3
            ],
            action_required: "Dato che ora usiamo il Trial separato, puoi disattivare questi prezzi e crearne di nuovi senza trial, oppure lasciarli così (tanto ora si usa il trial separato)"
        };

        return Response.json(results);

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});