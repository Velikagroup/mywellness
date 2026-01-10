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

        console.log('Using Base44 change password API for OAuth user:', user.email);
        
        // Prima rimuovi Google OAuth
        await base44.asServiceRole.entities.User.update(user.id, {
            sso_provider: null
        });
        
        // Usa l'endpoint di cambio password di Base44 che hasha correttamente
        const appId = Deno.env.get('BASE44_APP_ID');
        const changePasswordUrl = `https://base44.app/api/apps/${appId}/auth/change-password`;
        
        const changeResponse = await fetch(changePasswordUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.headers.get('Authorization')?.replace('Bearer ', '')}`
            },
            body: JSON.stringify({
                userId: user.id,
                newPassword: newPassword
            })
        });
        
        if (!changeResponse.ok) {
            const errorText = await changeResponse.text();
            console.error('Change password error:', changeResponse.status, errorText);
            
            // Fallback: hasha manualmente con Deno crypto
            console.log('Fallback: manual bcrypt hash');
            const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
            const hashedPassword = await bcrypt.hash(newPassword);
            
            await base44.asServiceRole.entities.User.update(user.id, {
                password_hash: hashedPassword
            });
        }
        
        console.log('Password set, verifying...');
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