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

        // Carica template
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({ 
            template_id: 'standard_free_welcome',
            is_active: true 
        });
        
        if (templates.length === 0) {
            console.error('❌ Template standard_free_welcome not found');
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        const template = templates[0];
        
        // Invia email tramite funzione unificata
        const response = await base44.functions.invoke('sendEmailUnified', {
            userId: userId,
            userEmail: userEmail,
            templateId: 'standard_free_welcome',
            variables: {
                user_name: userName || 'Utente'
            },
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