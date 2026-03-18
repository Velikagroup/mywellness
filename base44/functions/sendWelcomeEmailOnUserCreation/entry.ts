import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📧 SEND WELCOME EMAIL ON USER CREATION
 * 
 * Triggered quando un nuovo utente viene creato (signup)
 * Invia mail di benvenuto per trial e pagamenti
 */

Deno.serve(async (req) => {
    console.log('🎉 sendWelcomeEmailOnUserCreation - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        // Payload da entity automation
        const { event, data } = body;
        
        if (!event || event.type !== 'create') {
            return Response.json({ success: false, message: 'Not a create event' });
        }
        
        const user = data;
        const userId = user.id;
        const email = user.email;
        const subscriptionStatus = user.subscription_status;
        
        console.log(`👤 New user created: ${email}, status: ${subscriptionStatus}`);
        
        // Invia mail di benvenuto se è trial o active
        if (!['trial', 'active'].includes(subscriptionStatus)) {
            console.log(`⏭️ User status ${subscriptionStatus} not eligible for welcome email`);
            return Response.json({ success: true, message: 'User not eligible' });
        }
        
        // Recupera lingua preferita
        const userLang = user.preferred_language || 'it';
        const templateId = `welcome_${userLang}`;
        
        console.log(`📧 Sending welcome email to ${email} (${templateId})`);
        
        // Invia email tramite sistema unificato
        await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: user.id,
            userEmail: email,
            templateId: templateId,
            variables: {
                user_name: user.full_name || 'Utente'
            },
            language: userLang,
            triggerSource: 'sendWelcomeEmailOnUserCreation'
        });
        
        console.log(`✅ Welcome email sent to ${email}`);
        
        return Response.json({ 
            success: true,
            message: 'Welcome email sent',
            email: email
        });
        
    } catch (error) {
        console.error('❌ Error in sendWelcomeEmailOnUserCreation:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});