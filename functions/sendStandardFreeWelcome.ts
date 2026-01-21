import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Invia email di benvenuto per utenti Standard Free
 */

Deno.serve(async (req) => {
    console.log('📧 sendStandardFreeWelcome - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const body = await req.json();
        const { userId, userEmail, userName } = body;

        if (!userEmail) {
            return Response.json({ error: 'Missing userEmail' }, { status: 400 });
        }

        console.log(`📬 Sending Standard Free welcome to ${userEmail}`);

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

        // Template ID con lingua
        const templateId = `standard_free_welcome_${userLanguage}`;

        // Carica template
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: templateId,
            is_active: true 
        });
        
        if (templates.length === 0) {
            console.error(`❌ Template ${templateId} not found`);
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        const template = templates[0];
        
        // Invia email tramite funzione unificata (service role perché non c'è utente autenticato)
        const response = await base44.asServiceRole.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: templateId,
            variables: {
                user_name: userName || 'Utente'
            },
            language: userLanguage,
            triggerSource: 'sendStandardFreeWelcome'
        });

        console.log(`✅ Standard Free welcome sent to ${userEmail}`);

        return Response.json({ 
            success: true,
            message: 'Welcome email sent'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});