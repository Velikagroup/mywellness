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

        console.log('Setting password for OAuth user:', user.email);
        
        // Rimuovi sso_provider e imposta password in una sola operazione
        // Base44 dovrebbe hashare automaticamente
        await base44.asServiceRole.entities.User.update(user.id, {
            sso_provider: null,
            password: newPassword
        });
        
        console.log('Password updated, verifying...');
        
        // Verifica
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