import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Endpoint pubblico per autenticazione mobile iOS
 * Gestisce sia validazione token che creazione sessione
 * 
 * URL: POST https://app.base44.com/api/68d44c626cc2c19cca9c750d/functions/mobileAuth
 * 
 * Body: {"remember_me_token": "..."}
 * 
 * Risposta:
 * {
 *   "success": true,
 *   "session_token": "...",
 *   "user": {...}
 * }
 */

Deno.serve(async (req) => {
  // CORS preflight
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

  console.log(`📱 mobileAuth - Method: ${req.method}, URL: ${req.url}`);

  if (req.method !== 'POST') {
    return Response.json({ 
      success: false,
      error: 'Method not allowed. Use POST.' 
    }, { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { remember_me_token } = body;

    console.log('🔑 Received remember_me_token:', remember_me_token ? 'present' : 'missing');

    if (!remember_me_token) {
      return Response.json({ 
        success: false,
        error: 'Missing remember_me_token in request body' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Valida il token
    console.log('🔍 Validating token...');
    const tokens = await base44.asServiceRole.entities.RememberMeToken.filter({
      token: remember_me_token
    });

    if (tokens.length === 0) {
      console.log('❌ Token not found in database');
      return Response.json({ 
        success: false,
        error: 'Invalid or expired token' 
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    const tokenRecord = tokens[0];
    console.log('✅ Token found, checking expiration...');

    // Verifica scadenza
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      console.log('⏰ Token expired, deleting...');
      await base44.asServiceRole.entities.RememberMeToken.delete(tokenRecord.id);
      return Response.json({ 
        success: false,
        error: 'Token expired' 
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Aggiorna last_used_at
    await base44.asServiceRole.entities.RememberMeToken.update(tokenRecord.id, {
      last_used_at: new Date().toISOString()
    });

    // Ottieni dati utente
    console.log('👤 Fetching user data...');
    const users = await base44.asServiceRole.entities.User.filter({
      id: tokenRecord.user_id
    });

    if (users.length === 0) {
      console.log('❌ User not found');
      return Response.json({ 
        success: false,
        error: 'User not found' 
      }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    const user = users[0];
    console.log(`✅ User found: ${user.email}`);

    // Crea session token - utilizziamo l'SDK per creare una sessione valida
    // In questo caso, restituiamo il remember_me_token stesso come session_token
    // perché può essere validato nelle successive chiamate API
    console.log('🎫 Creating session...');

    return Response.json({
      success: true,
      session_token: remember_me_token, // Usiamo il token stesso per autenticazione
      expires_at: tokenRecord.expires_at,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        daily_calories: user.daily_calories,
        target_weight: user.target_weight,
        current_weight: user.current_weight
      }
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error in mobileAuth:', error);
    return Response.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
});