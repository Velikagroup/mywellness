import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Endpoint pubblico per sincronizzazione HealthKit da iOS
 * Usa remember_me_token per autenticazione
 * 
 * URL: POST https://app.base44.com/api/68d44c626cc2c19cca9c750d/functions/mobileSync
 * 
 * Headers:
 * - Content-Type: application/json
 * - Authorization: Bearer <remember_me_token>
 * 
 * Body:
 * {
 *   "date": "2026-01-20",
 *   "timezone": "Europe/Rome",
 *   "activeEnergyBurned_kcal": 450.0,
 *   "stepCount": 8542,
 *   "source": "ios.healthkit"
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

  console.log(`🍎 mobileSync - Method: ${req.method}`);

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
    
    // Estrai token dall'header Authorization
    const authHeader = req.headers.get('Authorization');
    let remember_me_token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      remember_me_token = authHeader.substring(7);
    }

    if (!remember_me_token) {
      return Response.json({ 
        success: false,
        error: 'Missing Authorization header with Bearer token' 
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('🔑 Validating token...');

    // Valida il token
    const tokens = await base44.asServiceRole.entities.RememberMeToken.filter({
      token: remember_me_token
    });

    if (tokens.length === 0) {
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

    // Verifica scadenza
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
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

    const userId = tokenRecord.user_id;
    console.log(`✅ Token valid for user: ${userId}`);

    // Parse payload HealthKit
    const payload = await req.json();
    const { 
      date, 
      timezone, 
      activeEnergyBurned_kcal, 
      stepCount, 
      source = 'ios.healthkit'
    } = payload;

    // Validazione
    if (!date || !activeEnergyBurned_kcal) {
      return Response.json({ 
        success: false,
        error: 'Missing required fields: date, activeEnergyBurned_kcal' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`📅 Syncing HealthKit data for ${date}: ${activeEnergyBurned_kcal} kcal`);

    // Verifica se esiste già un record per questa data (idempotenza)
    const existing = await base44.asServiceRole.entities.HealthKitSync.filter({
      user_id: userId,
      date: date
    });

    const syncData = {
      user_id: userId,
      date: date,
      timezone: timezone || 'UTC',
      active_energy_burned_kcal: activeEnergyBurned_kcal,
      step_count: stepCount || null,
      source: source,
      last_sync_at: new Date().toISOString()
    };

    let result;
    if (existing.length > 0) {
      // UPSERT: aggiorna il record esistente
      result = await base44.asServiceRole.entities.HealthKitSync.update(existing[0].id, syncData);
      console.log(`🔄 Updated existing sync for ${date}`);
    } else {
      // INSERT: crea nuovo record
      result = await base44.asServiceRole.entities.HealthKitSync.create(syncData);
      console.log(`✅ Created new sync for ${date}`);
    }

    // Aggiorna il flag sull'utente
    await base44.asServiceRole.entities.User.update(userId, {
      healthkit_connected: true,
      healthkit_last_sync: new Date().toISOString()
    });

    // Aggiorna last_used del token
    await base44.asServiceRole.entities.RememberMeToken.update(tokenRecord.id, {
      last_used_at: new Date().toISOString()
    });

    console.log('✅ HealthKit sync completed successfully');

    return Response.json({
      success: true,
      data: result,
      message: 'HealthKit data synced successfully',
      upserted: existing.length > 0
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error syncing HealthKit data:', error);
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