import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 💪 Genera piano allenamento personalizzato basato su body scan
 */

Deno.serve(async (req) => {
    console.log('💪 generatePersonalizedWorkoutPlan - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { daysPerWeek = 4, location = 'gym', equipment = true } = body;

        console.log(`💪 Generating workout plan for user ${user.id}`);

        // Carica ultimo body scan
        const bodyScans = await base44.entities.BodyScanResult.filter({
            user_id: user.id,
            is_active: true
        });

        if (bodyScans.length === 0) {
            return Response.json({ 
                error: 'No active body scan found. Complete body scan first.' 
            }, { status: 400 });
        }

        const bodyScan = bodyScans[0];

        // Prompt per generare piano allenamento personalizzato
        const prompt = `Crea un piano allenamento settimanale DETTAGLIATO e PERSONALIZZATO basato su questi dati corporei:

PROFILO UTENTE:
- Somatotipo: ${bodyScan.somatotype}
- Percentuale Massa Grassa: ${bodyScan.body_fat_percentage}%
- Età del Corpo: ${bodyScan.body_age_estimate} anni
- Score Definizione Muscolare: ${bodyScan.muscle_definition_score}/100
- Valutazione Postura: ${bodyScan.posture_assessment}
- Aree Problematiche: ${bodyScan.problem_areas.join(', ')}
- Aree Forti: ${bodyScan.strong_areas.join(', ')}
- Focus Allenamento Consigliati: ${bodyScan.recommended_workout_focus.join(', ')}

PREFERENZE:
- Giorni di Allenamento: ${daysPerWeek}/settimana
- Luogo: ${location} (gym/home/outdoors)
- Con Attrezzature: ${equipment}

REQUISITI:
1. Crea un programma di ${daysPerWeek} giorni per la settimana
2. Ogni giorno includi:
   - Tipo allenamento (strength/cardio/flexibility/HIIT)
   - Warm-up (2-3 esercizi, 5-10 min)
   - Esercizi principali con: nome, serie, ripetizioni, peso consigliato, tempo riposo
   - Cool-down e stretching
   - Durata totale
3. PRIORITIZZA le aree problematiche per trasformazione
4. SFRUTTI le aree forti come base
5. Considera il somatotipo per volume e intensità (ectomorph = meno volume, mesomorph = massimo volume, endomorph = cardio)
6. Includi modifiche per prevenire infortuni e migliorare postura
7. Fornisci progressione per 4 settimane

Rispondi in JSON con struttura chiara e dettagli specifici per ogni esercizio.`;

        console.log('🤖 Generating workout plan with AI...');

        const workoutPlanResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    weekly_schedule: { type: "string" },
                    total_weekly_volume: { type: "number" },
                    estimated_weekly_calories_burned: { type: "number" },
                    focus_areas: { type: "array", items: { type: "string" } },
                    posture_corrections: { type: "array", items: { type: "string" } },
                    injury_prevention_notes: { type: "array", items: { type: "string" } },
                    progression_plan: { type: "string" },
                    recovery_recommendations: { type: "string" },
                    supplement_stack: { type: "array", items: { type: "string" } }
                }
            }
        });

        console.log('✅ Workout plan generated');

        return Response.json({
            success: true,
            workoutPlan: workoutPlanResult,
            bodyScan: {
                somatotype: bodyScan.somatotype,
                body_fat_percentage: bodyScan.body_fat_percentage,
                body_age_estimate: bodyScan.body_age_estimate
            }
        });

    } catch (error) {
        console.error('❌ Error generating workout plan:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});