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

        console.log('Setting password for user:', user.email);
        
        // Prima rimuovi Google OAuth
        await base44.asServiceRole.entities.User.update(user.id, {
            sso_provider: null
        });
        
        console.log('OAuth removed, now using Base44 password reset API');
        
        // Genera reset token
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 3600000); // 1 ora
        
        // Salva token
        await base44.asServiceRole.entities.User.update(user.id, {
            password_reset_token: resetToken,
            password_reset_expires: expiresAt.toISOString()
        });
        
        // Usa API reset password di Base44
        const appId = Deno.env.get('BASE44_APP_ID');
        const resetUrl = `https://base44.app/api/apps/${appId}/auth/reset-password`;
        
        const resetResponse = await fetch(resetUrl, {
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
            throw new Error(`Reset API failed: ${errorText}`);
        }
        
        console.log('Password set via reset API, verifying...');
        const updatedUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('sso_provider:', updatedUser[0]?.sso_provider);
        console.log('has password_hash:', !!updatedUser[0]?.password_hash);

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