import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Genera token casuale
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calcola data di scadenza (30 giorni)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Elimina token vecchi dell'utente
    const oldTokens = await base44.asServiceRole.entities.RememberMeToken.filter({ 
      user_id: user.id 
    });
    for (const oldToken of oldTokens) {
      await base44.asServiceRole.entities.RememberMeToken.delete(oldToken.id);
    }

    // Crea nuovo token
    await base44.asServiceRole.entities.RememberMeToken.create({
      user_id: user.id,
      token: token,
      expires_at: expiresAt.toISOString(),
      last_used_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      token: token,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error generating remember me token:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
});