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

        // Genera un token di reset password
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti

        // Salva il token
        await base44.asServiceRole.entities.User.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: expiresAt.toISOString(),
            sso_provider: null // Rimuovi Google OAuth
        });

        // Usa l'endpoint di reset password di Base44 per impostare la password
        const resetResponse = await fetch(`https://base44.app/api/apps/${Deno.env.get('BASE44_APP_ID')}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                new_password: newPassword
            })
        });

        if (!resetResponse.ok) {
            const error = await resetResponse.text();
            throw new Error(`Password reset failed: ${error}`);
        }

        return Response.json({ 
            success: true,
            message: 'Password set successfully'
        });

    } catch (error) {
        console.error('Error in setPasswordDirect:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});