import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Invia email di benvenuto per piani a pagamento (Base, Pro, Premium)
 */

Deno.serve(async (req) => {
    console.log('📧 sendPlanWelcome - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userId, userEmail, userName, plan, invoiceUrl, paymentAmount } = body;

        if (!userEmail) {
            return Response.json({ error: 'Missing userEmail' }, { status: 400 });
        }

        if (!plan) {
            return Response.json({ error: 'Missing plan' }, { status: 400 });
        }

        // Ottieni lingua dell'utente
        let userLanguage = 'it';
        if (userId) {
            try {
                const user = await base44.asServiceRole.entities.User.get(userId);
                userLanguage = user.preferred_language || 'it';
                console.log(`🌍 User language detected: ${userLanguage}`);
            } catch (error) {
                console.warn('⚠️ Could not load user language, defaulting to it');
            }
        }

        // Usa sempre il template "benvenuto" indipendentemente dal piano
        const templateId = `benvenuto_${userLanguage}`;

        console.log(`📬 Sending ${plan} welcome to ${userEmail} (${templateId})`);

        // Verifica che il template esista
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            console.error(`❌ Template ${templateId} not found`);
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        // Carica dati utente per subscription_period_end
        let subscriptionPeriodEnd = 'N/A';
        let stripePortalUrl = 'https://billing.stripe.com/p/login/bSI14OdOL1n79f5144';
        if (userId) {
            try {
                const user = await base44.asServiceRole.entities.User.get(userId);
                if (user.subscription_period_end) {
                    const date = new Date(user.subscription_period_end);
                    subscriptionPeriodEnd = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                }
                if (user.stripe_customer_id) {
                    stripePortalUrl = `https://billing.stripe.com/p/login/bSI14OdOL1n79f5144?prefilled_email=${encodeURIComponent(userEmail)}`;
                }
            } catch (error) {
                console.warn('⚠️ Could not load user subscription details');
            }
        }

        // Invia email tramite funzione unificata (service role perché non c'è utente autenticato)
        const response = await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: templateId,
            variables: {
                user_name: userName || 'Utente',
                plan: plan.toUpperCase() || 'BASE',
                plan_name: plan.charAt(0).toUpperCase() + plan.slice(1),
                subscription_period_end: subscriptionPeriodEnd,
                stripe_portal_url: stripePortalUrl,
                invoice_url: invoiceUrl || '#',
                payment_amount: paymentAmount || '0'
            },
            language: userLanguage,
            triggerSource: 'sendPlanWelcome'
        });

        console.log(`✅ ${plan} welcome sent to ${userEmail}`);

        return Response.json({ 
            success: true,
            message: `${plan} welcome email sent`,
            plan: plan
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});