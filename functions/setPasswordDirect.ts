import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { newPassword } = await req.json();

        if (!newPassword || newPassword.length < 8) {
            return Response.json({ 
                error: 'Password must be at least 8 characters' 
            }, { status: 400 });
        }

        // STRATEGIA: Usa l'API reset password di Base44 che gestisce tutto correttamente
        console.log('Using Base44 reset password API for:', user.email);
        
        // Genera un token temporaneo
        const resetToken = crypto.randomUUID();
        
        // Salva il token (valido solo 5 minuti)
        await base44.asServiceRole.entities.User.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            sso_provider: null // Rimuovi Google OAuth
        });
        
        console.log('Token generated, calling reset password API');
        
        // Usa l'API di reset password di Base44
        const resetResponse = await fetch(`https://base44.app/api/apps/${Deno.env.get('BASE44_APP_ID')}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                newPassword: newPassword
            })
        });
        
        if (!resetResponse.ok) {
            const errorText = await resetResponse.text();
            console.error('Reset password API error:', errorText);
            return Response.json({ 
                error: 'Failed to set password via Base44 API',
                details: errorText
            }, { status: 500 });
        }
        
        console.log('Password set successfully via Base44 API');
        
        // Verifica finale
        const updatedUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('Final sso_provider:', updatedUser[0]?.sso_provider);
        console.log('Has password_hash:', !!updatedUser[0]?.password_hash);

        return Response.json({ 
            success: true,
            message: 'Password set successfully. You can now login with email and password.'
        });

    } catch (error) {
        console.error('Error in setPasswordDirect:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});