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

        console.log('Step 1: Removing sso_provider for user:', user.email);
        
        // STEP 1: Prima rimuovi sso_provider
        await base44.asServiceRole.entities.User.update(user.id, {
            sso_provider: null
        });
        
        console.log('Step 2: Setting password (Base44 will hash it)');
        
        // STEP 2: Setta la password - Base44 la hasherà automaticamente
        // Uso una seconda chiamata separata per assicurarmi che sso_provider sia già null
        await new Promise(resolve => setTimeout(resolve, 100)); // Piccolo delay
        
        await base44.asServiceRole.entities.User.update(user.id, {
            password: newPassword
        });

        console.log('Step 3: Verifying changes');
        
        // STEP 3: Verifica
        const updatedUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('Final sso_provider:', updatedUser[0]?.sso_provider);
        console.log('Has password_hash:', !!updatedUser[0]?.password_hash);
        console.log('Password hash (first 20 chars):', updatedUser[0]?.password_hash?.substring(0, 20));

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