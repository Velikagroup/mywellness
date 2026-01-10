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
        console.log('Current sso_provider:', user.sso_provider);

        // Imposta la password E rimuovi sso_provider per permettere login con password
        await base44.asServiceRole.entities.User.update(user.id, {
            password: newPassword,
            sso_provider: null,
            password_hash: undefined // Forza Base44 a ricalcolare l'hash
        });

        console.log('Password set successfully for:', user.email);
        
        // Verifica che sia stato salvato correttamente
        const updatedUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('Updated user sso_provider:', updatedUser[0]?.sso_provider);
        console.log('Updated user has password_hash:', !!updatedUser[0]?.password_hash);

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