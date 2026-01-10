import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Se l'utente ha già una password, non può usare questa funzione
        if (user.password_hash) {
            return Response.json({ 
                error: 'You already have a password. Use the change password form instead.' 
            }, { status: 400 });
        }

        const { newPassword } = await req.json();

        if (!newPassword || newPassword.length < 8) {
            return Response.json({ 
                error: 'Password must be at least 8 characters' 
            }, { status: 400 });
        }

        // Rimuovi sso_provider e imposta la password
        // Questo fa sì che l'utente possa fare login con email/password
        await base44.asServiceRole.entities.User.update(user.id, {
            password: newPassword,
            sso_provider: null
        });

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