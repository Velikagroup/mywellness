import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * 🍽️ Genera piano nutrizionale personalizzato basato su body scan
 */

Deno.serve(async (req) => {
    console.log('🍽️ generatePersonalizedMealPlan - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { dietType = 'balanced', mealsPerDay = 3, cheatMealsPerWeek = 1 } = body;

        console.log(`🍽️ Generating meal plan for user ${user.id}`);

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

        // Prompt per generare piano personalizzato
        const prompt = `Crea un piano nutrizionale settimanale DETTAGLIATO e PERSONALIZZATO basato su questi dati corporei:

PROFILO UTENTE:
- Somatotipo: ${bodyScan.somatotype}
- Percentuale Massa Grassa: ${bodyScan.body_fat_percentage}%
- Età del Corpo: ${bodyScan.body_age_estimate} anni
- Score Definizione Muscolare: ${bodyScan.muscle_definition_score}/100
- Gonfiore: ${bodyScan.swelling_percentage}%
- Aree Problematiche: ${bodyScan.problem_areas.join(', ')}
- Aree Forti: ${bodyScan.strong_areas.join(', ')}
- Focus Nutrizionali Consigliati: ${bodyScan.recommended_diet_focus.join(', ')}

PREFERENZE:
- Tipo Dieta: ${dietType}
- Pasti al Giorno: ${mealsPerDay}
- Cheat Meals a Settimana: ${cheatMealsPerWeek}

REQUISITI:
1. Crea 7 giorni di piani pasto (lunedì-domenica)
2. Per ogni giorno includi ${mealsPerDay} pasti + snack consigliati
3. Ogni pasto deve avere: nome, ingredienti (con quantità), calorie, proteine, carboidrati, grassi, tempo di preparazione
4. Bilancia le macros SPECIFICAMENTE per il somatotipo e gli obiettivi identificati
5. Includi almeno ${cheatMealsPerWeek} cheat meal/pasto libero a settimana
6. Suggerisci integratori utili basati sul profilo corporeo
7. Fornisci consigli su timing dei pasti e idratazione

Rispondi in JSON con struttura chiara e valori numerici precisi.`;

        console.log('🤖 Generating meal plan with AI...');

        const mealPlanResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    weekly_plan: { type: "string" },
                    daily_calories_target: { type: "number" },
                    protein_grams: { type: "number" },
                    carbs_grams: { type: "number" },
                    fat_grams: { type: "number" },
                    supplement_recommendations: { type: "array", items: { type: "string" } },
                    hydration_plan: { type: "string" },
                    meal_timing_notes: { type: "string" },
                    special_considerations: { type: "array", items: { type: "string" } }
                }
            }
        });

        console.log('✅ Meal plan generated');

        // Qui potremmo anche invocare la funzione per creare i MealPlan nel database
        // per ora ritorniamo il risultato grezzo per il frontend

        return Response.json({
            success: true,
            mealPlan: mealPlanResult,
            bodyScan: {
                somatotype: bodyScan.somatotype,
                body_fat_percentage: bodyScan.body_fat_percentage,
                body_age_estimate: bodyScan.body_age_estimate
            }
        });

    } catch (error) {
        console.error('❌ Error generating meal plan:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});