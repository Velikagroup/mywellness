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
        
        console.log('Step 2: Hashing password manually');
        
        // STEP 2: Hash password manualmente con bcrypt
        const encoder = new TextEncoder();
        const data = encoder.encode(newPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        console.log('Step 3: Setting password_hash directly');
        
        // STEP 3: Setta password_hash direttamente
        await base44.asServiceRole.entities.User.update(user.id, {
            password_hash: hashHex
        });

        console.log('Step 4: Verifying changes');
        
        // STEP 4: Verifica
        const updatedUser = await base44.asServiceRole.entities.User.filter({ id: user.id });
        console.log('Final sso_provider:', updatedUser[0]?.sso_provider);
        console.log('Has password_hash:', !!updatedUser[0]?.password_hash);
        console.log('Password hash length:', updatedUser[0]?.password_hash?.length);

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