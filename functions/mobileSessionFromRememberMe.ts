import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Endpoint per ottenere un session token Base44 da un Remember Me Token
 * Usato dall'app iOS nativa per autenticarsi dopo il login WebView
 */
Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { remember_me_token } = await req.json();

    if (!remember_me_token) {
      return Response.json({ 
        error: 'Missing remember_me_token' 
      }, { status: 400 });
    }

    console.log('🔑 Validating remember me token for iOS app...');

    // Valida il token
    const tokens = await base44.asServiceRole.entities.RememberMeToken.filter({
      token: remember_me_token
    });

    if (tokens.length === 0) {
      return Response.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 });
    }

    const tokenRecord = tokens[0];

    // Verifica scadenza
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      // Elimina token scaduto
      await base44.asServiceRole.entities.RememberMeToken.delete(tokenRecord.id);
      return Response.json({ 
        error: 'Token expired' 
      }, { status: 401 });
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
      return Response.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const user = users[0];

    console.log(`✅ Token valid for user: ${user.email}`);

    // Crea una sessione Base44 per l'utente
    const sessionResponse = await base44.asServiceRole.auth.signInWithEmail(
      user.email,
      null, // No password needed, we're using service role
      { skipPasswordCheck: true }
    );

    // Estrai il session token dal cookie
    const setCookieHeader = sessionResponse.headers.get('set-cookie');
    let sessionToken = null;
    
    if (setCookieHeader) {
      // Parsing del cookie per estrarre il token
      const match = setCookieHeader.match(/sb-[^=]+=([^;]+)/);
      if (match) {
        sessionToken = match[1];
      }
    }

    return Response.json({
      success: true,
      session_token: sessionToken,
      expires_at: tokenRecord.expires_at,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status
      }
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        // Forward il cookie di sessione
        'Set-Cookie': setCookieHeader || ''
      }
    });

  } catch (error) {
    console.error('❌ Error in mobileSessionFromRememberMe:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});