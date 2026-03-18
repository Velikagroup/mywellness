import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return Response.json({ error: 'Token required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Cerca token nel database
    const tokens = await base44.asServiceRole.entities.RememberMeToken.filter({ 
      token: token 
    });

    if (tokens.length === 0) {
      return Response.json({ valid: false, error: 'Token not found' }, { status: 404 });
    }

    const tokenRecord = tokens[0];

    // Verifica scadenza
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      // Token scaduto, elimina
      await base44.asServiceRole.entities.RememberMeToken.delete(tokenRecord.id);
      return Response.json({ valid: false, error: 'Token expired' }, { status: 401 });
    }

    // Aggiorna last_used_at
    await base44.asServiceRole.entities.RememberMeToken.update(tokenRecord.id, {
      last_used_at: new Date().toISOString()
    });

    // Ottieni dati utente
    const users = await base44.asServiceRole.entities.User.filter({ 
      id: tokenRecord.user_id 
    });

    if (users.length === 0) {
      return Response.json({ valid: false, error: 'User not found' }, { status: 404 });
    }

    return Response.json({ 
      valid: true,
      user: users[0],
      token_expires_at: tokenRecord.expires_at
    });
  } catch (error) {
    console.error('Error validating remember me token:', error);
    return Response.json({ 
      valid: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});