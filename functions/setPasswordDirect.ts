import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

        // Hash della password con bcrypt
        const hashedPassword = await bcrypt.hash(newPassword);

        // Salva la password hashata nell'entità User
        await base44.asServiceRole.entities.User.update(user.id, {
            password_hash: hashedPassword
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