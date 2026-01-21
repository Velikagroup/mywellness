import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 📸 Analizza le foto del corpo dell'utente con AI
 * Estrae: somatotipo, massa grassa %, età del corpo, texture pelle, gonfiore, ecc.
 */

Deno.serve(async (req) => {
    console.log('📸 analyzeBodyImage - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { frontPhotoUrl, sidePhotoUrl, backPhotoUrl, userAge, userHeight, userWeight, userGender } = body;

        if (!frontPhotoUrl) {
            return Response.json({ error: 'Missing frontPhotoUrl' }, { status: 400 });
        }

        console.log(`📸 Analyzing body photos for user ${user.id}`);

        // Costruisci il prompt dettagliato per l'AI
        const prompt = `Analizza queste foto del corpo in modo medico-scientifico e fornisci una valutazione completa.

DATI UTENTE:
- Età: ${userAge || 'sconosciuta'}
- Altezza: ${userHeight || 'sconosciuta'} cm
- Peso: ${userWeight || 'sconosciuto'} kg
- Genere: ${userGender || 'non specificato'}

ANALISI RICHIESTA - Fornisci valori NUMERICI e SPECIFICI per:

1. SOMATOTIPO: Classifica come ectomorph, mesomorph, endomorph o mixed
2. PERCENTUALE MASSA GRASSA: Stima percentuale (0-100)
3. ETÀ DEL CORPO: Stima in anni (la "biological age" del corpo)
4. SCORE DEFINIZIONE MUSCOLARE: 0-100
5. TEXTURE PELLE: Descrizione (liscia, irregolare, acneica, disidratata, etc)
6. TONO PELLE: Classificazione (chiaro/fair, medio/medium, scuro/dark)
7. PERCENTUALE GONFIORE: Stima di ritenzione idrica e gonfiore (0-100)
8. VALUTAZIONE POSTURA: Descrizione brevissima dello stato posturale
9. AREE PROBLEMATICHE: Lista di max 3 zone che necessitano attenzione
10. AREE FORTI: Lista di max 3 zone ben sviluppate

FOCUS NUTRIZIONALI CONSIGLIATI:
Basato sulla composizione corporea osservata, suggerisci 3-4 focus dietetici specifici (es: "aumentare proteine per sviluppo muscolare", "ridurre carboidrati semplici", etc)

FOCUS ALLENAMENTO CONSIGLIATI:
Basato sulla composizione corporea, suggerisci 3-4 focus di allenamento specifici (es: "sviluppare spalle e petto", "aumentare resistenza cardiovascolare", etc)

Rispondi SOLO in formato JSON valido, senza markdown o commenti.`;

        console.log('🤖 Calling Core.InvokeLLM for body analysis...');

        // Prepara gli URL delle foto
        const fileUrls = [frontPhotoUrl];
        if (sidePhotoUrl) fileUrls.push(sidePhotoUrl);
        if (backPhotoUrl) fileUrls.push(backPhotoUrl);

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            file_urls: fileUrls,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    somatotype: { type: "string", enum: ["ectomorph", "mesomorph", "endomorph", "mixed"] },
                    body_fat_percentage: { type: "number" },
                    body_age_estimate: { type: "number" },
                    muscle_definition_score: { type: "number" },
                    skin_texture: { type: "string" },
                    skin_tone: { type: "string" },
                    swelling_percentage: { type: "number" },
                    posture_assessment: { type: "string" },
                    problem_areas: { type: "array", items: { type: "string" } },
                    strong_areas: { type: "array", items: { type: "string" } },
                    ai_analysis: { type: "string" },
                    recommended_diet_focus: { type: "array", items: { type: "string" } },
                    recommended_workout_focus: { type: "array", items: { type: "string" } }
                },
                required: ["somatotype", "body_fat_percentage", "body_age_estimate"]
            }
        });

        console.log('✅ AI Analysis completed');

        // Salva il risultato nel database
        const scanResult = await base44.entities.BodyScanResult.create({
            user_id: user.id,
            scan_date: new Date().toISOString().split('T')[0],
            front_photo_url: frontPhotoUrl,
            side_photo_url: sidePhotoUrl || null,
            back_photo_url: backPhotoUrl || null,
            somatotype: result.somatotype,
            skin_texture: result.skin_texture,
            skin_tone: result.skin_tone,
            body_fat_percentage: result.body_fat_percentage,
            muscle_definition_score: result.muscle_definition_score,
            body_age_estimate: result.body_age_estimate,
            swelling_percentage: result.swelling_percentage,
            posture_assessment: result.posture_assessment,
            problem_areas: result.problem_areas,
            strong_areas: result.strong_areas,
            ai_analysis: result.ai_analysis,
            recommended_diet_focus: result.recommended_diet_focus,
            recommended_workout_focus: result.recommended_workout_focus,
            is_active: true
        });

        // Deattiva scan precedenti
        const previousScans = await base44.entities.BodyScanResult.filter({
            user_id: user.id,
            is_active: true
        });

        for (const scan of previousScans) {
            if (scan.id !== scanResult.id) {
                await base44.entities.BodyScanResult.update(scan.id, { is_active: false });
            }
        }

        console.log(`✅ Body scan saved for user ${user.id}`);

        return Response.json({
            success: true,
            scanResult: scanResult
        });

    } catch (error) {
        console.error('❌ Error analyzing body:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});