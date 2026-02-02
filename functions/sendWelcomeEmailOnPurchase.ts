import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 SEND WELCOME EMAIL ON PURCHASE
 * 
 * Triggered quando l'utente completa un pagamento (Transaction creata)
 * Invia automaticamente la mail di benvenuto con dettagli del piano
 */

Deno.serve(async (req) => {
    console.log('🎉 sendWelcomeEmailOnPurchase - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // Payload da entity automation
        const { event, data } = body;
        
        if (!event || event.type !== 'create') {
            return Response.json({ success: false, message: 'Not a create event' });
        }
        
        const transaction = data;
        const userId = transaction.user_id;
        const status = transaction.status;
        
        console.log(`💳 New transaction for user ${userId}, status: ${status}`);
        
        // Solo invia se il pagamento è riuscito
        if (status !== 'succeeded') {
            console.log('⏭️ Transaction not succeeded, skipping welcome email');
            return Response.json({ success: true, message: 'Payment not succeeded' });
        }
        
        // Ottieni dati utente
        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user) {
            console.log('❌ User not found');
            return Response.json({ success: false, message: 'User not found' });
        }
        
        // Recupera lingua preferita
        const userLang = user.preferred_language || 'it';
        const templateId = `welcome_${userLang}`;
        
        // Calcola data di fine abbonamento
        let subscriptionEndDate = 'N/A';
        if (transaction.billing_period === 'monthly') {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            subscriptionEndDate = endDate.toLocaleDateString(userLang === 'it' ? 'it-IT' : userLang === 'en' ? 'en-US' : userLang === 'es' ? 'es-ES' : 'pt-BR');
        } else if (transaction.billing_period === 'yearly') {
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            subscriptionEndDate = endDate.toLocaleDateString(userLang === 'it' ? 'it-IT' : userLang === 'en' ? 'en-US' : userLang === 'es' ? 'es-ES' : 'pt-BR');
        }
        
        console.log(`📧 Sending welcome email to ${user.email} (${templateId})`);
        
        // Invia email tramite sistema unificato
        await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: user.id,
            userEmail: user.email,
            templateId: templateId,
            variables: {
                user_name: user.full_name || 'Utente',
                subscription_plan: transaction.plan || 'Piano',
                subscription_end_date: subscriptionEndDate
            },
            language: userLang,
            triggerSource: 'sendWelcomeEmailOnPurchase'
        });
        
        console.log(`✅ Welcome email sent to ${user.email}`);
        
        return Response.json({ 
            success: true,
            message: 'Welcome email sent',
            email: user.email
        });
        
    } catch (error) {
        console.error('❌ Error in sendWelcomeEmailOnPurchase:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});