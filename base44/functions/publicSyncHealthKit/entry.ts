import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Public endpoint per sincronizzare dati HealthKit da iOS
 * Non richiede autenticazione Base44 - usa remember_me_token
 * 
 * URL: https://app.base44.com/api/[APP_ID]/functions/publicSyncHealthKit
 * Metodo: POST
 * 
 * Payload:
 * {
 *   "auth_token": "remember_me_token_here",
 *   "date": "2026-01-20",
 *   "timezone": "Europe/Rome",
 *   "activeEnergyBurned_kcal": 450.0,
 *   "stepCount": 8500
 * }
 */

Deno.serve(async (req) => {
    console.log('🍎 publicSyncHealthKit - Start');
    
    try {
        // Parse payload
        const payload = await req.json();
        const { 
            auth_token,
            date, 
            timezone, 
            activeEnergyBurned_kcal, 
            stepCount, 
            source = 'ios.healthkit'
        } = payload;

        // Validazione base
        if (!auth_token) {
            return Response.json({ 
                success: false,
                error: 'Missing auth_token' 
            }, { status: 400 });
        }

        if (!date || !activeEnergyBurned_kcal) {
            return Response.json({ 
                success: false,
                error: 'Missing required fields: date, activeEnergyBurned_kcal' 
            }, { status: 400 });
        }

        // Usa service role per validare il token
        const base44 = createClientFromRequest(req);

        // Valida remember_me_token
        const tokens = await base44.asServiceRole.entities.RememberMeToken.filter({
            token: auth_token
        });

        if (tokens.length === 0) {
            console.error('❌ Invalid token');
            return Response.json({ 
                success: false,
                error: 'Invalid authentication token' 
            }, { status: 401 });
        }

        const tokenRecord = tokens[0];

        // Verifica scadenza
        if (new Date(tokenRecord.expires_at) < new Date()) {
            console.error('❌ Token expired');
            return Response.json({ 
                success: false,
                error: 'Authentication token expired' 
            }, { status: 401 });
        }

        const userId = tokenRecord.user_id;
        console.log(`👤 User authenticated via token: ${userId}`);

        // Aggiorna last_used_at
        await base44.asServiceRole.entities.RememberMeToken.update(tokenRecord.id, {
            last_used_at: new Date().toISOString()
        });

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
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length > 0) {
            await base44.asServiceRole.entities.User.update(userId, {
                healthkit_connected: true,
                healthkit_last_sync: new Date().toISOString()
            });
        }

        console.log('✅ HealthKit sync completed successfully');

        return Response.json({
            success: true,
            data: result,
            message: 'HealthKit data synced successfully',
            upserted: existing.length > 0
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error syncing HealthKit data:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});