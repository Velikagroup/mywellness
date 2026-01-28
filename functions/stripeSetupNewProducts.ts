import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 ========================================');
    console.log('🚀 stripeSetupNewProducts - NEW PRICING');
    console.log('🚀 ========================================');
    
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

        console.log('✅ Stripe initialized');
        console.log('📦 Creating NEW products and prices...');

        // ========================================
        // MyWellness Subscription
        // ========================================
        console.log('🟢 Creating MyWellness Subscription Product...');
        const product = await stripe.products.create({
            name: 'MyWellness',
            description: 'Piano personalizzato con AI per nutrizione e allenamento',
            metadata: {
                plan_id: 'mywellness',
                app: 'mywellness'
            }
        });
        console.log('✅ Product created:', product.id);

        // Prezzo Mensile - €9.99 SENZA trial
        const priceMonthly = await stripe.prices.create({
            product: product.id,
            unit_amount: 999, // €9.99
            currency: 'eur',
            recurring: {
                interval: 'month'
            },
            metadata: {
                plan_id: 'mywellness',
                billing_period: 'monthly',
                has_trial: 'false'
            }
        });
        console.log('✅ Price Monthly created:', priceMonthly.id, '→ €9.99/mese SENZA trial');

        // Prezzo Annuale - €49.99 CON 3 giorni trial (€4.16/mese)
        const priceYearly = await stripe.prices.create({
            product: product.id,
            unit_amount: 4999, // €49.99
            currency: 'eur',
            recurring: {
                interval: 'year',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'mywellness',
                billing_period: 'yearly',
                has_trial: 'true',
                trial_days: '3'
            }
        });
        console.log('✅ Price Yearly created:', priceYearly.id, '→ €49.99/anno (€4.16/mese) CON 3 giorni trial');

        const result = {
            success: true,
            product: {
                product_id: product.id,
                monthly: {
                    price_id: priceMonthly.id,
                    amount: '€9.99/mese',
                    trial: 'NESSUNO'
                },
                yearly: {
                    price_id: priceYearly.id,
                    amount: '€49.99/anno (€4.16/mese)',
                    trial: '3 giorni',
                    savings: '€69.89/anno rispetto al mensile'
                }
            },
            message: '✅ Nuovi prezzi MyWellness creati: Monthly €9.99 (no trial), Yearly €49.99 (3 days trial)'
        };

        console.log('🎉 ========================================');
        console.log('🎉 SETUP COMPLETATO!');
        console.log('🎉 ========================================');
        console.log(JSON.stringify(result, null, 2));

        return Response.json(result);

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ ERRORE DURANTE SETUP');
        console.error('❌ ========================================');
        console.error('❌ Error:', error.message);
        console.error('❌ Stack:', error.stack);
        
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
});