import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔍 User:', user.email, 'SSO:', user.sso_provider);

        // Step 1: Rimuovi Google OAuth per permettere login con password
        if (user.sso_provider) {
            console.log('✅ Removing Google OAuth...');
            await base44.asServiceRole.entities.User.update(user.id, {
                sso_provider: null
            });
        }

        // Step 2: Usa l'API pubblica di Base44 per richiedere reset password
        const appId = Deno.env.get('BASE44_APP_ID');
        const resetUrl = `https://base44.app/api/apps/${appId}/auth/request-reset`;
        
        console.log('📧 Requesting password reset via Base44 API...');
        const resetResponse = await fetch(resetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email
            })
        });

        if (!resetResponse.ok) {
            const errorText = await resetResponse.text();
            console.error('❌ Reset API error:', errorText);
            throw new Error(`Reset API failed: ${errorText}`);
        }

        console.log('✅ Password reset email sent successfully');

        return Response.json({ 
            success: true,
            message: 'Password setup email sent. Check your inbox!'
        });

    } catch (error) {
        console.error('❌ Error in requestPasswordSetup:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});