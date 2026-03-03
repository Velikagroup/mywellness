import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 SEND WELCOME EMAIL ON PURCHASE
 * 
 * Triggered quando:
 * - L'utente completa un pagamento (Transaction creata con status=succeeded)
 * - L'utente inizia il trial (UserOnboarding creato)
 */

Deno.serve(async (req) => {
    console.log('🎉 sendWelcomeEmailOnPurchase - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // Payload da entity automation
        const { event, data } = body;
        
        if (!event) {
            return Response.json({ success: false, message: 'No event' });
        }
        
        if (event.type !== 'create') {
            return Response.json({ success: false, message: 'Not a create event' });
        }
        
        let userId, userEmail;
        
        // Caso 1: Transaction (pagamento)
        if (event.entity_name === 'Transaction') {
            const transaction = data;
            userId = transaction.user_id;
            const status = transaction.status;
            
            console.log(`💳 New transaction for user ${userId}, status: ${status}`);
            
            // Solo invia se il pagamento è riuscito
            if (status !== 'succeeded') {
                console.log('⏭️ Transaction not succeeded, skipping welcome email');
                return Response.json({ success: true, message: 'Payment not succeeded' });
            }
        } 
        // Caso 2: UserOnboarding (trial)
        else if (event.entity_name === 'UserOnboarding') {
            const onboarding = data;
            userId = onboarding.user_id;
            console.log(`🎯 UserOnboarding created for user ${userId}`);
        }
        else {
            return Response.json({ success: false, message: 'Unknown entity type' });
        }
        
        // Ottieni dati utente
        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user) {
            console.log('❌ User not found');
            return Response.json({ success: false, message: 'User not found' });
        }
        
        userEmail = user.email;
        
        // Recupera lingua preferita (da User o fallback it)
        let userLang = user.preferred_language || 'it';
        
        // Se non c'è lingua salvata, prova a estrarla dall'URL referrer o dai dati evento
        if (!user.preferred_language && body.metadata?.referrer) {
            const langMatch = body.metadata.referrer.match(/\/(it|en|es|pt|de|fr)(postquizsubscription|checkout|pricing)?/);
            if (langMatch) {
                userLang = langMatch[1];
                // Salva la lingua per futuri riferimenti
                try {
                    await base44.asServiceRole.entities.User.update(userId, { preferred_language: userLang });
                } catch (updateError) {
                    console.warn('⚠️ Could not save preferred_language:', updateError);
                }
            }
        }
        
        const templateId = `welcome_${userLang}`;
        
        console.log(`📧 Sending welcome email to ${userEmail} (${templateId})`);
        
        // Invia email tramite Resend
        await base44.asServiceRole.functions.invoke('sendResendEmail', {
            to: userEmail,
            resendTemplateId: templateId,
            variables: {
                NAME: user.full_name || 'Utente'
            },
            language: userLang
        });
        
        console.log(`✅ Welcome email sent to ${userEmail}`);
        
        return Response.json({ 
            success: true,
            message: 'Welcome email sent',
            email: userEmail
        });
        
    } catch (error) {
        console.error('❌ Error in sendWelcomeEmailOnPurchase:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});