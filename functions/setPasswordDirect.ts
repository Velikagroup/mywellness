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

        console.log('Hashing password with bcrypt for:', user.email);
        
        // Hash password con bcrypt
        const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts');
        const hashedPassword = await bcrypt.hash(newPassword);
        
        console.log('Updating user with hashed password and removing OAuth');
        
        // Aggiorna user: rimuovi OAuth e imposta password hashata
        await base44.asServiceRole.entities.User.update(user.id, {
            sso_provider: null,
            password_hash: hashedPassword
        });
        
        console.log('Password set successfully, verifying...');
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