import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 🌍 SAVE USER LANGUAGE PREFERENCE
 * 
 * Salva la lingua preferita dell'utente quando entra in checkout/trial
 * Viene chiamato dalle pagine di checkout per salvare la lingua
 */

Deno.serve(async (req) => {
    console.log('🌍 saveUserLanguagePreference - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ 
                success: false, 
                error: 'User not authenticated' 
            }, { status: 401 });
        }
        
        const body = await req.json();
        const { language } = body;
        
        if (!language || !['it', 'en', 'es', 'pt', 'de', 'fr'].includes(language)) {
            return Response.json({ 
                success: false, 
                error: 'Invalid language code' 
            }, { status: 400 });
        }
        
        console.log(`💾 Saving language preference for user ${user.id}: ${language}`);
        
        // Salva la lingua sull'utente
        await base44.auth.updateMe({
            preferred_language: language
        });
        
        console.log(`✅ Language preference saved: ${language}`);
        
        return Response.json({ 
            success: true,
            message: 'Language preference saved',
            language: language
        });
        
    } catch (error) {
        console.error('❌ Error saving language:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});