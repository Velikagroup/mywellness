import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { filters } = body;

        console.log('🔍 Calculating recipients with filters:', JSON.stringify(filters));

        let users = await base44.entities.User.list();
        
        // Filtra per stato abbonamento
        if (filters.subscription_status && filters.subscription_status.length > 0) {
            users = users.filter(u => filters.subscription_status.includes(u.subscription_status));
        }
        
        // Filtra per piano abbonamento
        if (filters.subscription_plan && filters.subscription_plan.length > 0) {
            users = users.filter(u => filters.subscription_plan.includes(u.subscription_plan));
        }
        
        // Filtra per lingua
        if (filters.languages && filters.languages.length > 0) {
            users = users.filter(u => {
                const userLang = u.language || 'it';
                return filters.languages.includes(userLang);
            });
        }
        
        // Filtra per inattività
        if (filters.inactive_days && filters.inactive_days > 0) {
            const inactiveSince = new Date();
            inactiveSince.setDate(inactiveSince.getDate() - filters.inactive_days);
            users = users.filter(u => {
                if (!u.last_login_date) return false;
                return new Date(u.last_login_date) < inactiveSince;
            });
        }
        
        // Filtra per trial scaduti senza conversione
        if (filters.trial_expired_no_conversion === true) {
            users = users.filter(u => {
                if (!u.subscription_period_end) return false;
                const expiryDate = new Date(u.subscription_period_end);
                const didNotPurchase = !u.last_payment_amount || u.last_payment_amount === 0;
                return expiryDate < new Date() && didNotPurchase;
            });
        }
        
        // Filtra per landing offer acquistato
        if (filters.purchased_landing_offer !== undefined) {
            users = users.filter(u => u.purchased_landing_offer === filters.purchased_landing_offer);
        }
        
        // Filtra per quiz abbandonato
        if (filters.quiz_abandoned === true) {
            const quizActivities = await base44.entities.UserActivity.filter({
                event_type: 'quiz_started',
                completed: false
            });
            const quizEmails = quizActivities.map(a => a.user_id);
            users = users.filter(u => quizEmails.includes(u.email));
        }
        
        // Filtra per trial setup abbandonato
        if (filters.trial_setup_abandoned === true) {
            const trialActivities = await base44.entities.UserActivity.filter({
                event_type: 'trial_setup_opened',
                completed: false
            });
            const trialEmails = trialActivities.map(a => a.user_id);
            users = users.filter(u => trialEmails.includes(u.email));
        }
        
        // Filtra per pricing visitato
        if (filters.pricing_visited === true) {
            const pricingActivities = await base44.entities.UserActivity.filter({
                event_type: 'pricing_visited',
                completed: false
            });
            const pricingEmails = pricingActivities.map(a => a.user_id);
            users = users.filter(u => pricingEmails.includes(u.email));
        }
        
        // Filtra per checkout abbandonato
        if (filters.checkout_abandoned === true) {
            const checkoutActivities = await base44.entities.UserActivity.filter({
                event_type: 'checkout_started',
                completed: false
            });
            const checkoutEmails = checkoutActivities.map(a => a.user_id);
            users = users.filter(u => checkoutEmails.includes(u.email));
        }
        
        // Filtra per giorni al rinnovo
        if (filters.renewal_days && filters.renewal_days > 0) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + filters.renewal_days);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            users = users.filter(u => {
                if (!u.subscription_period_end) return false;
                if (!u.cancellation_at_period_end) return false;
                const endDateStr = new Date(u.subscription_period_end).toISOString().split('T')[0];
                return endDateStr === targetDateStr;
            });
        }
        
        // Filtra per milestone giorni
        if (filters.milestone_days && filters.milestone_days > 0) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - filters.milestone_days);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            users = users.filter(u => {
                if (!u.created_date) return false;
                if (u.subscription_status !== 'active') return false;
                const createdDateStr = new Date(u.created_date).toISOString().split('T')[0];
                return createdDateStr === targetDateStr;
            });
        }

        console.log(`✅ Recipients count: ${users.length}`);

        return Response.json({
            success: true,
            count: users.length
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});