import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUER = ['https://accounts.google.com', 'accounts.google.com'];
const IOS_CLIENT_ID = '51803361930-81bkvaup5t65f97si4vfoeflhsk7dgr5.apps.googleusercontent.com';

// Decode JWT without verification (to extract header)
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  
  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  
  return { header, payload, signature: parts[2] };
}

// Convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Verify JWT signature with Google's JWKs
async function verifyGoogleJWT(idToken) {
  const { header, payload } = decodeJWT(idToken);
  
  // Fetch Google's public keys
  const jwksResponse = await fetch(GOOGLE_JWKS_URL);
  const jwks = await jwksResponse.json();
  
  // Find the key matching the kid in JWT header
  const key = jwks.keys.find(k => k.kid === header.kid);
  if (!key) throw new Error('Key not found in Google JWKS');
  
  // Import the public key
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  // Verify signature
  const [headerB64, payloadB64, signatureB64] = idToken.split('.');
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToArrayBuffer(signatureB64);
  
  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signature,
    data
  );
  
  if (!isValid) throw new Error('Invalid JWT signature');
  
  // Verify issuer
  if (!GOOGLE_ISSUER.includes(payload.iss)) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }
  
  // Verify audience
  if (payload.aud !== IOS_CLIENT_ID) {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token expired');
  }
  
  return payload;
}

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { id_token } = await req.json();
    
    if (!id_token) {
      return new Response(JSON.stringify({ error: 'id_token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify and decode the JWT
    const payload = await verifyGoogleJWT(id_token);
    
    const { email, sub, name, picture } = payload;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email not found in token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Base44 client with service role
    const base44 = createClientFromRequest(req);
    
    // Check if user exists
    let user;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      user = users[0];
    } catch (error) {
      console.log('Error fetching user:', error);
    }

    // If user doesn't exist, create them
    if (!user) {
      try {
        user = await base44.asServiceRole.entities.User.create({
          email,
          full_name: name || email.split('@')[0],
          role: 'user',
          google_id: sub,
          profile_picture: picture
        });
      } catch (error) {
        console.error('Error creating user:', error);
        return new Response(JSON.stringify({ error: 'Failed to create user' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate session token using Base44's auth system
    // This creates a session cookie that works with the dashboard
    const sessionResponse = await fetch(`https://app.base44.com/api/apps/${Deno.env.get('BASE44_APP_ID')}/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email
      })
    });

    if (!sessionResponse.ok) {
      console.error('Session creation failed:', await sessionResponse.text());
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the session cookie from Base44's response
    const setCookieHeader = sessionResponse.headers.get('set-cookie');
    
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'capacitor://localhost',
      'Access-Control-Allow-Credentials': 'true'
    };
    
    // Forward the session cookie
    if (setCookieHeader) {
      headers['Set-Cookie'] = setCookieHeader;
    }

    return new Response(
      JSON.stringify({ 
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name
        }
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Mobile auth error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        details: error.message 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});