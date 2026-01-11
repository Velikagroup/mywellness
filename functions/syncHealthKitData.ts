import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Endpoint per sincronizzare dati HealthKit da iOS
 * 
 * AUTENTICAZIONE: Cookie di sessione o Bearer token via Authorization header
 * URL: https://app.base44.com/api/[APP_ID]/functions/syncHealthKitData
 * Metodo: POST
 * 
 * Payload esempio:
 * {
 *   "date": "2026-01-11",
 *   "timezone": "Europe/Rome",
 *   "activeEnergyBurned_kcal": 612.3,
 *   "stepCount": 8542,
 *   "source": "ios.healthkit",
 *   "granularity": "daily"
 * }
 * 
 * Risposta successo (200):
 * {
 *   "success": true,
 *   "data": { ... },
 *   "message": "HealthKit data synced successfully"
 * }
 */

Deno.serve(async (req) => {
    console.log('🍎 syncHealthKitData - Start');
    
    try {
        // 1. Autenticazione - usa il cookie di sessione esistente o Bearer token
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            console.error('❌ User not authenticated');
            return Response.json({ 
                success: false,
                error: 'Unauthorized - Please login first' 
            }, { status: 401 });
        }

        console.log(`👤 User authenticated: ${user.email}`);

        // 2. Parse payload
        const payload = await req.json();
        const { 
            date, 
            timezone, 
            activeEnergyBurned_kcal, 
            stepCount, 
            source = 'ios.healthkit'
        } = payload;

        // 3. Validazione
        if (!date || !activeEnergyBurned_kcal) {
            return Response.json({ 
                success: false,
                error: 'Missing required fields: date, activeEnergyBurned_kcal' 
            }, { status: 400 });
        }

        console.log(`📅 Syncing data for ${date}: ${activeEnergyBurned_kcal} kcal`);

        // 4. Verifica se esiste già un record per questa data (idempotenza)
        const existing = await base44.entities.HealthKitSync.filter({
            user_id: user.id,
            date: date
        });

        const syncData = {
            user_id: user.id,
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
            result = await base44.entities.HealthKitSync.update(existing[0].id, syncData);
            console.log(`🔄 Updated existing sync for ${date}`);
        } else {
            // INSERT: crea nuovo record
            result = await base44.entities.HealthKitSync.create(syncData);
            console.log(`✅ Created new sync for ${date}`);
        }

        // 5. Aggiorna il flag sull'utente per indicare che ha il dispositivo connesso
        await base44.auth.updateMe({
            healthkit_connected: true,
            healthkit_last_sync: new Date().toISOString()
        });

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