import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Ottieni tutti gli esercizi
    const exercises = await base44.asServiceRole.entities.Exercise.list();
    
    console.log(`📚 Generando dettagli per ${exercises.length} esercizi...`);

    const exerciseDetails = {};
    
    // Genera dettagli per ogni esercizio in batch
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const exerciseName = exercise.name;
      
      console.log(`⏳ [${i + 1}/${exercises.length}] Generando dettagli per: ${exerciseName}...`);

      try {
        const prompt = `You are a world-class certified personal trainer and kinesiologist expert. 
Provide detailed exercise information for: "${exerciseName}"

Muscle groups involved: ${exercise.muscle_groups?.join(', ') || 'unknown'}
Equipment: ${exercise.equipment || 'bodyweight'}
Difficulty: ${exercise.difficulty || 'beginner'}

Generate ALL content in ITALIAN language.

Return a JSON object with:
1. "description": A detailed explanation (2-3 sentences) of what the exercise is and why it's important (IN ITALIAN)
2. "form_tips": An array of 6-8 specific, actionable form tips in Italian (e.g., "Mantieni la schiena neutra durante tutto il movimento")
3. "muscles": An array of the primary muscles worked, in Italian (e.g., ["quadricipiti", "glutei", "femorali", "core"])

Be specific, professional, and focus on safety and effectiveness.`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              form_tips: {
                type: "array",
                items: { type: "string" },
                minItems: 6,
                maxItems: 8
              },
              muscles: {
                type: "array",
                items: { type: "string" },
                minItems: 2
              }
            },
            required: ["description", "form_tips", "muscles"]
          }
        });

        exerciseDetails[exerciseName.toLowerCase()] = {
          description: llmResponse.description,
          form_tips: llmResponse.form_tips,
          muscles: llmResponse.muscles,
          muscle_image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png'
        };

        console.log(`✅ [${i + 1}/${exercises.length}] Completato: ${exerciseName}`);
      } catch (error) {
        console.error(`❌ Errore per ${exerciseName}:`, error.message);
        exerciseDetails[exerciseName.toLowerCase()] = {
          description: exercise.description || 'Descrizione non disponibile',
          form_tips: ['Consultare un personal trainer per l\'esecuzione corretta'],
          muscles: exercise.muscle_groups || ['vari gruppi muscolari'],
          muscle_image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png'
        };
      }
    }

    console.log(`🎉 Generazione completata! ${Object.keys(exerciseDetails).length} esercizi processati.`);

    return Response.json({
      success: true,
      total_exercises: exercises.length,
      exercise_details: exerciseDetails
    });

  } catch (error) {
    console.error('Error generating exercise details:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});