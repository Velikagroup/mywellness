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
        const { frontPhotoUrl, sidePhotoUrl, backPhotoUrl, userAge, userHeight, userWeight, userGender, language = 'it' } = body;

        if (!frontPhotoUrl) {
            return Response.json({ error: 'Missing frontPhotoUrl' }, { status: 400 });
        }

        console.log(`📸 Analyzing body photos for user ${user.id}`);

        const languageMap = {
            it: { instruction: 'Rispondi in ITALIANO', lang: 'Italian' },
            en: { instruction: 'Respond in ENGLISH', lang: 'English' },
            es: { instruction: 'Responde en ESPAÑOL', lang: 'Spanish' },
            pt: { instruction: 'Responda em PORTUGUÊS', lang: 'Portuguese' },
            de: { instruction: 'Antworte auf DEUTSCH', lang: 'German' },
            fr: { instruction: 'Répondez en FRANÇAIS', lang: 'French' }
        };

        const langConfig = languageMap[language] || languageMap.it;

        // Costruisci il prompt dettagliato per l'AI
        const prompt = `Analyze these body photos in a medical-scientific manner and provide a complete assessment.
${langConfig.instruction} for ALL text fields.

USER DATA:
- Age: ${userAge || 'unknown'}
- Height: ${userHeight || 'unknown'} cm
- Weight: ${userWeight || 'unknown'} kg
- Gender: ${userGender || 'not specified'}

ANALYSIS REQUIRED - Provide NUMERIC and SPECIFIC values for:

1. SOMATOTYPE: Classify as ectomorph, mesomorph, endomorph or mixed (keep in English)
2. BODY FAT PERCENTAGE: Estimate percentage (0-100)
3. BODY AGE: Estimate in years (the "biological age" of the body)
4. MUSCLE DEFINITION SCORE: 0-100
5. SKIN TEXTURE: Description in ${langConfig.lang} (e.g., smooth, rough, acne-prone, dry, elastic, healthy, etc)
6. SKIN TONE: Classification in ${langConfig.lang} (e.g., fair, medium, dark, even, uneven, healthy, etc)
7. SWELLING PERCENTAGE: Estimate water retention and swelling (0-100)
8. POSTURE ASSESSMENT: Very brief description of postural state in ${langConfig.lang}
9. PROBLEM AREAS: List of max 3 zones that need attention in ${langConfig.lang}
10. STRONG AREAS: List of max 3 well-developed zones in ${langConfig.lang}

RECOMMENDED NUTRITIONAL FOCUS in ${langConfig.lang}:
Based on observed body composition, suggest 3-4 specific dietary focuses

RECOMMENDED WORKOUT FOCUS in ${langConfig.lang}:
Based on body composition, suggest 3-4 specific training focuses

Respond ONLY in valid JSON format, without markdown or comments.
CRITICAL: All text fields (skin_texture, skin_tone, posture_assessment, problem_areas, strong_areas, recommended_diet_focus, recommended_workout_focus) MUST be in ${langConfig.lang}.`;

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