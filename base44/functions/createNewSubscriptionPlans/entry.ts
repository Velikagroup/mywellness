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

        console.log('🔍 Cercando piani esistenti su Stripe...');

        // Cerco prodotto MyWellness o ne creo uno nuovo
        let product;
        const allProducts = await stripe.products.list({ limit: 100 });
        const existingProduct = allProducts.data.find(p => p.metadata?.plan_id === 'mywellness_new');

        if (existingProduct && existingProduct.active) {
            console.log('✅ Prodotto esistente trovato:', existingProduct.id);
            product = existingProduct;
        } else {
            console.log('📦 Creando nuovo prodotto...');
            product = await stripe.products.create({
                name: 'MyWellness',
                description: 'Piano di fitness e nutrizione personalizzato',
                metadata: {
                    plan_id: 'mywellness_new',
                    app: 'mywellness'
                }
            });
            console.log('✅ Prodotto creato:', product.id);
        }

        // Cerco i prezzi esistenti
        const prices = await stripe.prices.list({ product: product.id, limit: 100 });
        
        let priceMonthly = prices.data.find(p => 
            p.recurring?.interval === 'month' && 
            p.unit_amount === 999 && 
            p.active
        );
        
        let priceYearly = prices.data.find(p => 
            p.recurring?.interval === 'year' && 
            p.unit_amount === 4999 && 
            p.active
        );

        // Creo prezzo mensile se non esiste
        if (!priceMonthly) {
            console.log('💰 Creando prezzo mensile 9,99€...');
            priceMonthly = await stripe.prices.create({
                product: product.id,
                unit_amount: 999, // €9.99
                currency: 'eur',
                recurring: {
                    interval: 'month'
                },
                metadata: {
                    plan_type: 'monthly',
                    display_price: '9,99€'
                }
            });
            console.log('✅ Prezzo mensile creato:', priceMonthly.id);
        } else {
            console.log('✅ Prezzo mensile già esistente:', priceMonthly.id);
        }

        // Creo prezzo annuale con trial se non esiste
        if (!priceYearly) {
            console.log('💰 Creando prezzo annuale 49,99€ con 3 giorni trial...');
            priceYearly = await stripe.prices.create({
                product: product.id,
                unit_amount: 4999, // €49.99
                currency: 'eur',
                recurring: {
                    interval: 'year',
                    trial_period_days: 3
                },
                metadata: {
                    plan_type: 'yearly',
                    display_price: '49,99€',
                    trial_days: '3'
                }
            });
            console.log('✅ Prezzo annuale creato:', priceYearly.id);
        } else {
            console.log('✅ Prezzo annuale già esistente:', priceYearly.id);
        }

        const result = {
            success: true,
            message: '✅ Piani configurati correttamente',
            product: {
                id: product.id,
                name: product.name
            },
            pricing: {
                monthly: {
                    price_id: priceMonthly.id,
                    amount: '€9,99',
                    interval: 'mese',
                    trial: 'NESSUN TRIAL'
                },
                yearly: {
                    price_id: priceYearly.id,
                    amount: '€49,99',
                    interval: 'anno',
                    trial: '3 giorni gratuiti'
                }
            }
        };

        console.log('🎉 ========================================');
        console.log('🎉 PIANI PRONTI!');
        console.log('🎉 ========================================');
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