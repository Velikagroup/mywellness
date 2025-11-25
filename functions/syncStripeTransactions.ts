import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.10.0';

Deno.serve(async (req) => {
    console.log('🔄 syncStripeTransactions - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Solo admin può sincronizzare tutte le transazioni
        if (user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin only' }, { status: 403 });
        }

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        // Ottieni tutti gli utenti con stripe_customer_id
        const allUsers = await base44.asServiceRole.entities.User.filter({});
        const usersWithStripe = allUsers.filter(u => u.stripe_customer_id);
        
        console.log(`👥 Found ${usersWithStripe.length} users with Stripe customer ID`);

        let totalCreated = 0;
        let totalSkipped = 0;
        const errors = [];

        for (const appUser of usersWithStripe) {
            try {
                console.log(`\n📦 Processing user: ${appUser.email} (${appUser.stripe_customer_id})`);

                // Recupera tutti i PaymentIntents del customer
                const paymentIntents = await stripe.paymentIntents.list({
                    customer: appUser.stripe_customer_id,
                    limit: 100
                });

                console.log(`💳 Found ${paymentIntents.data.length} payment intents`);

                for (const pi of paymentIntents.data) {
                    if (pi.status !== 'succeeded') {
                        console.log(`⏭️ Skipping PI ${pi.id} - status: ${pi.status}`);
                        continue;
                    }

                    // Controlla se esiste già
                    const existing = await base44.asServiceRole.entities.Transaction.filter({
                        stripe_payment_intent_id: pi.id
                    });

                    if (existing.length > 0) {
                        console.log(`⏭️ Transaction already exists for PI ${pi.id}`);
                        totalSkipped++;
                        continue;
                    }

                    const amount = pi.amount / 100;
                    const metadata = pi.metadata || {};

                    // Determina il piano e tipo
                    let plan = metadata.plan || metadata.plan_type || appUser.subscription_plan || 'base';
                    let type = 'subscription_payment';
                    let billingPeriod = metadata.billing_period || 'monthly';
                    let description = pi.description || `Pagamento ${plan}`;

                    // Se è un upgrade prorated
                    if (metadata.type === 'upgrade_proration' || metadata.upgrade_from) {
                        description = `Upgrade prorated da ${metadata.upgrade_from || 'base'} a ${metadata.upgrade_to || plan}`;
                    }

                    // Crea la transazione
                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: appUser.id,
                        stripe_payment_intent_id: pi.id,
                        stripe_subscription_id: appUser.stripe_subscription_id || null,
                        amount: amount,
                        currency: pi.currency || 'eur',
                        status: 'succeeded',
                        type: type,
                        plan: plan,
                        billing_period: billingPeriod,
                        payment_date: new Date(pi.created * 1000).toISOString(),
                        description: description,
                        traffic_source: metadata.traffic_source || appUser.traffic_source || 'direct',
                        metadata: metadata
                    });

                    console.log(`✅ Created transaction ${transaction.id} for €${amount}`);
                    totalCreated++;
                }

                // Recupera anche le Invoice pagate
                const invoices = await stripe.invoices.list({
                    customer: appUser.stripe_customer_id,
                    status: 'paid',
                    limit: 100
                });

                console.log(`📄 Found ${invoices.data.length} paid invoices`);

                for (const invoice of invoices.data) {
                    const invoicePI = invoice.payment_intent;
                    
                    if (!invoicePI) {
                        console.log(`⏭️ Invoice ${invoice.id} has no payment intent`);
                        continue;
                    }

                    // Controlla se esiste già (per payment_intent)
                    const existingByPI = await base44.asServiceRole.entities.Transaction.filter({
                        stripe_payment_intent_id: invoicePI
                    });

                    if (existingByPI.length > 0) {
                        console.log(`⏭️ Transaction already exists for invoice PI ${invoicePI}`);
                        totalSkipped++;
                        continue;
                    }

                    // Controlla anche per invoice_id
                    const existingByInvoice = await base44.asServiceRole.entities.Transaction.filter({
                        stripe_invoice_id: invoice.id
                    });

                    if (existingByInvoice.length > 0) {
                        console.log(`⏭️ Transaction already exists for invoice ${invoice.id}`);
                        totalSkipped++;
                        continue;
                    }

                    const amount = invoice.amount_paid / 100;
                    if (amount <= 0) continue;

                    const billingPeriod = invoice.lines?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

                    const transaction = await base44.asServiceRole.entities.Transaction.create({
                        user_id: appUser.id,
                        stripe_payment_intent_id: invoicePI,
                        stripe_invoice_id: invoice.id,
                        stripe_subscription_id: invoice.subscription || null,
                        amount: amount,
                        currency: invoice.currency || 'eur',
                        status: 'succeeded',
                        type: 'subscription_payment',
                        plan: appUser.subscription_plan || 'base',
                        billing_period: billingPeriod,
                        payment_date: new Date(invoice.created * 1000).toISOString(),
                        description: `Pagamento ${appUser.subscription_plan || 'subscription'}`,
                        traffic_source: appUser.traffic_source || 'direct',
                        metadata: invoice.metadata || {}
                    });

                    console.log(`✅ Created transaction from invoice ${transaction.id} for €${amount}`);
                    totalCreated++;
                }

            } catch (userError) {
                console.error(`❌ Error processing user ${appUser.email}:`, userError.message);
                errors.push({ user: appUser.email, error: userError.message });
            }
        }

        console.log(`\n✅ Sync completed: ${totalCreated} created, ${totalSkipped} skipped`);

        return Response.json({
            success: true,
            totalCreated,
            totalSkipped,
            usersProcessed: usersWithStripe.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ Sync error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});