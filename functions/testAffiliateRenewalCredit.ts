import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
        }

        const { userId, dryRun = true } = await req.json();

        if (!userId) {
            return Response.json({ error: 'userId is required' }, { status: 400 });
        }

        // Trova l'utente target
        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetUser = allUsers.find(u => u.id === userId);

        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('👤 Target user:', targetUser.email);
        console.log('💳 Stripe customer:', targetUser.stripe_customer_id);
        console.log('📦 Subscription:', targetUser.stripe_subscription_id);

        if (!targetUser.stripe_customer_id) {
            return Response.json({ 
                error: 'User has no Stripe customer ID',
                user: { email: targetUser.email, id: targetUser.id }
            }, { status: 400 });
        }

        // Cerca affiliate link dell'utente
        const userAffiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({ user_id: userId });
        
        if (userAffiliateLinks.length === 0) {
            return Response.json({ 
                error: 'User has no AffiliateLink',
                suggestion: 'Create an AffiliateLink for this user first',
                user: { email: targetUser.email, id: targetUser.id }
            }, { status: 400 });
        }

        const affiliateLink = userAffiliateLinks[0];
        const availableBalance = affiliateLink.available_balance || 0;

        console.log('🔗 Affiliate link:', affiliateLink.id);
        console.log('💰 Available balance:', availableBalance);

        if (availableBalance <= 0) {
            return Response.json({ 
                error: 'No affiliate credit available',
                affiliateLink: {
                    id: affiliateLink.id,
                    code: affiliateLink.code,
                    available_balance: availableBalance,
                    total_earned: affiliateLink.total_earned
                },
                user: { email: targetUser.email, id: targetUser.id }
            }, { status: 400 });
        }

        // Simula i dati di una fattura di rinnovo
        const simulatedInvoiceAmount = 29; // €29 Pro mensile come esempio
        const discountToApply = Math.min(availableBalance, simulatedInvoiceAmount);

        const result = {
            user: {
                id: targetUser.id,
                email: targetUser.email,
                subscription_plan: targetUser.subscription_plan,
                stripe_customer_id: targetUser.stripe_customer_id
            },
            affiliateLink: {
                id: affiliateLink.id,
                code: affiliateLink.code,
                available_balance: availableBalance,
                total_earned: affiliateLink.total_earned
            },
            simulation: {
                invoice_amount: simulatedInvoiceAmount,
                discount_to_apply: discountToApply,
                new_balance_after: availableBalance - discountToApply,
                user_pays: simulatedInvoiceAmount - discountToApply
            },
            dryRun: dryRun
        };

        if (!dryRun) {
            // ESECUZIONE REALE: Crea una fattura di test su Stripe
            console.log('🚀 Creating real test invoice...');

            try {
                // Crea una fattura draft
                const invoice = await stripe.invoices.create({
                    customer: targetUser.stripe_customer_id,
                    auto_advance: false, // Non processare automaticamente
                    collection_method: 'send_invoice',
                    days_until_due: 7,
                    metadata: {
                        test: 'true',
                        purpose: 'affiliate_credit_test'
                    }
                });

                // Aggiungi un item di test
                await stripe.invoiceItems.create({
                    customer: targetUser.stripe_customer_id,
                    invoice: invoice.id,
                    amount: simulatedInvoiceAmount * 100,
                    currency: 'eur',
                    description: 'Test renewal - MyWellness Pro'
                });

                // Applica lo sconto affiliazione
                const discountInCents = Math.round(discountToApply * 100);
                await stripe.invoiceItems.create({
                    customer: targetUser.stripe_customer_id,
                    invoice: invoice.id,
                    amount: -discountInCents,
                    currency: 'eur',
                    description: `Credito Affiliazione MyWellness (-€${discountToApply.toFixed(2)})`
                });

                console.log('✅ Test invoice created:', invoice.id);

                // Aggiorna il saldo affiliazione
                const newBalance = availableBalance - discountToApply;
                await base44.asServiceRole.entities.AffiliateLink.update(affiliateLink.id, {
                    available_balance: newBalance
                });
                console.log('✅ Affiliate balance updated:', newBalance);

                // Marca i crediti come usati
                const availableCredits = await base44.asServiceRole.entities.AffiliateCredit.filter({
                    affiliate_user_id: userId,
                    commission_status: 'available'
                });

                let remainingToMark = discountToApply;
                const markedCredits = [];
                for (const credit of availableCredits) {
                    if (remainingToMark <= 0) break;
                    
                    await base44.asServiceRole.entities.AffiliateCredit.update(credit.id, {
                        commission_status: 'used_for_subscription'
                    });
                    markedCredits.push(credit.id);
                    remainingToMark -= credit.commission_amount;
                }

                result.execution = {
                    success: true,
                    invoice_id: invoice.id,
                    invoice_url: invoice.hosted_invoice_url,
                    discount_applied: discountToApply,
                    new_balance: newBalance,
                    credits_marked_used: markedCredits.length,
                    note: 'Invoice created as DRAFT. You can view it in Stripe dashboard and delete it after testing.'
                };

            } catch (stripeError) {
                result.execution = {
                    success: false,
                    error: stripeError.message
                };
            }
        }

        return Response.json(result);

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});