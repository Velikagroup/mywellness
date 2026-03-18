import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🚀 ========================================');
    console.log('🚀 stripeSetupProducts - SETUP INIZIALE');
    console.log('🚀 ========================================');
    
    try {
        // Autenticazione
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ 
                error: 'Unauthorized - Admin only' 
            }, { status: 401 });
        }

        // Inizializza Stripe
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
        console.log('📦 Creating products and prices...');

        // ========================================
        // 1. MyWellness Base
        // ========================================
        console.log('🔵 Creating MyWellness Base...');
        const productBase = await stripe.products.create({
            name: 'MyWellness Base',
            description: 'Piano nutrizionale personalizzato con dashboard scientifica',
            metadata: {
                plan_id: 'base',
                app: 'mywellness'
            }
        });
        console.log('✅ Product Base created:', productBase.id);

        // Prezzo Mensile
        const priceBaseMonthly = await stripe.prices.create({
            product: productBase.id,
            unit_amount: 1900, // €19.00
            currency: 'eur',
            recurring: {
                interval: 'month',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'base',
                billing_period: 'monthly'
            }
        });
        console.log('✅ Price Base Monthly created:', priceBaseMonthly.id, '→ €19/mese con 3 giorni trial');

        // Prezzo Annuale (€182.4/anno = €15.2/mese, -20%)
        const priceBaseYearly = await stripe.prices.create({
            product: productBase.id,
            unit_amount: 18240, // €182.40
            currency: 'eur',
            recurring: {
                interval: 'year',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'base',
                billing_period: 'yearly'
            }
        });
        console.log('✅ Price Base Yearly created:', priceBaseYearly.id, '→ €182.4/anno (€15.2/mese) con 3 giorni trial');

        // ========================================
        // 2. MyWellness Pro
        // ========================================
        console.log('🟢 Creating MyWellness Pro...');
        const productPro = await stripe.products.create({
            name: 'MyWellness Pro',
            description: 'Piano completo con allenamenti personalizzati e analisi AI',
            metadata: {
                plan_id: 'pro',
                app: 'mywellness'
            }
        });
        console.log('✅ Product Pro created:', productPro.id);

        // Prezzo Mensile
        const priceProMonthly = await stripe.prices.create({
            product: productPro.id,
            unit_amount: 2900, // €29.00
            currency: 'eur',
            recurring: {
                interval: 'month',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'pro',
                billing_period: 'monthly'
            }
        });
        console.log('✅ Price Pro Monthly created:', priceProMonthly.id, '→ €29/mese con 3 giorni trial');

        // Prezzo Annuale (€278.4/anno = €23.2/mese, -20%)
        const priceProYearly = await stripe.prices.create({
            product: productPro.id,
            unit_amount: 27840, // €278.40
            currency: 'eur',
            recurring: {
                interval: 'year',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'pro',
                billing_period: 'yearly'
            }
        });
        console.log('✅ Price Pro Yearly created:', priceProYearly.id, '→ €278.4/anno (€23.2/mese) con 3 giorni trial');

        // ========================================
        // 3. MyWellness Premium
        // ========================================
        console.log('🟣 Creating MyWellness Premium...');
        const productPremium = await stripe.products.create({
            name: 'MyWellness Premium',
            description: 'Piano AI avanzato con tutte le funzionalità e supporto prioritario',
            metadata: {
                plan_id: 'premium',
                app: 'mywellness'
            }
        });
        console.log('✅ Product Premium created:', productPremium.id);

        // Prezzo Mensile
        const pricePremiumMonthly = await stripe.prices.create({
            product: productPremium.id,
            unit_amount: 3900, // €39.00
            currency: 'eur',
            recurring: {
                interval: 'month',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'premium',
                billing_period: 'monthly'
            }
        });
        console.log('✅ Price Premium Monthly created:', pricePremiumMonthly.id, '→ €39/mese con 3 giorni trial');

        // Prezzo Annuale (€374.4/anno = €31.2/mese, -20%)
        const pricePremiumYearly = await stripe.prices.create({
            product: productPremium.id,
            unit_amount: 37440, // €374.40
            currency: 'eur',
            recurring: {
                interval: 'year',
                trial_period_days: 3
            },
            metadata: {
                plan_id: 'premium',
                billing_period: 'yearly'
            }
        });
        console.log('✅ Price Premium Yearly created:', pricePremiumYearly.id, '→ €374.4/anno (€31.2/mese) con 3 giorni trial');

        // ========================================
        // 4. MyWellness Landing Offer (€67 per 3 mesi)
        // ========================================
        console.log('🎁 Creating MyWellness Landing Offer...');
        const productLandingOffer = await stripe.products.create({
            name: 'MyWellness Landing Offer',
            description: 'Offerta speciale: 3 mesi Premium a €67 (poi si rinnova a €39/mese)',
            metadata: {
                plan_id: 'landing_offer',
                app: 'mywellness',
                converts_to_plan: 'premium',
                converts_to_price_id: pricePremiumMonthly.id,
                duration_months: '3'
            }
        });
        console.log('✅ Product Landing Offer created:', productLandingOffer.id);

        // Prezzo One-Time €67
        const priceLandingOffer = await stripe.prices.create({
            product: productLandingOffer.id,
            unit_amount: 6700, // €67.00
            currency: 'eur',
            metadata: {
                plan_id: 'landing_offer',
                type: 'one_time',
                duration_months: '3',
                converts_to_plan: 'premium',
                converts_to_price_id: pricePremiumMonthly.id
            }
        });
        console.log('✅ Price Landing Offer created:', priceLandingOffer.id, '→ €67 una tantum (3 mesi Premium)');

        // ========================================
        // Risultato Finale
        // ========================================
        const result = {
            success: true,
            products: {
                base: {
                    product_id: productBase.id,
                    monthly: {
                        price_id: priceBaseMonthly.id,
                        amount: '€19/mese',
                        trial: '3 giorni'
                    },
                    yearly: {
                        price_id: priceBaseYearly.id,
                        amount: '€182.4/anno (€15.2/mese)',
                        trial: '3 giorni',
                        savings: '€45.6/anno (-20%)'
                    }
                },
                pro: {
                    product_id: productPro.id,
                    monthly: {
                        price_id: priceProMonthly.id,
                        amount: '€29/mese',
                        trial: '3 giorni'
                    },
                    yearly: {
                        price_id: priceProYearly.id,
                        amount: '€278.4/anno (€23.2/mese)',
                        trial: '3 giorni',
                        savings: '€69.6/anno (-20%)'
                    }
                },
                premium: {
                    product_id: productPremium.id,
                    monthly: {
                        price_id: pricePremiumMonthly.id,
                        amount: '€39/mese',
                        trial: '3 giorni'
                    },
                    yearly: {
                        price_id: pricePremiumYearly.id,
                        amount: '€374.4/anno (€31.2/mese)',
                        trial: '3 giorni',
                        savings: '€93.6/anno (-20%)'
                    }
                },
                landing_offer: {
                    product_id: productLandingOffer.id,
                    price_id: priceLandingOffer.id,
                    amount: '€67 una tantum',
                    duration: '3 mesi Premium',
                    then_converts_to: 'Premium €39/mese',
                    converts_to_price_id: pricePremiumMonthly.id
                }
            },
            message: '✅ Tutti i prodotti e prezzi (mensili + annuali + landing offer) sono stati creati con successo!'
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