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

    let successCount = 0;
    let errorCount = 0;
    
    // Genera dettagli per ogni esercizio e salvali nel database
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const exerciseName = exercise.name;
      
      // Salta se ha già i dettagli
      if (exercise.detailed_description && exercise.form_tips && exercise.target_muscles) {
        console.log(`⏭️ [${i + 1}/${exercises.length}] Già presente: ${exerciseName}`);
        successCount++;
        continue;
      }
      
      console.log(`⏳ [${i + 1}/${exercises.length}] Generando dettagli per: ${exerciseName}...`);

      try {
        const prompt = `You are a world-class certified personal trainer and kinesiologist expert. 
Provide detailed exercise information for: "${exerciseName}"

Muscle groups involved: ${exercise.muscle_groups?.join(', ') || 'unknown'}
Equipment: ${exercise.equipment || 'bodyweight'}
Difficulty: ${exercise.difficulty || 'beginner'}
Primary goals: ${exercise.primary_goals?.join(', ') || 'general fitness'}

Generate ALL content in ITALIAN language.

Return a JSON object with:
1. "detailed_description": A detailed explanation (2-3 sentences) of what the exercise is, why it's important, and which goals it helps achieve (IN ITALIAN)
2. "form_tips": An array of 6-8 specific, actionable form tips in Italian. Include:
   - Body positioning
   - Movement execution
   - Breathing patterns
   - Common mistakes to avoid
   - Safety considerations
3. "target_muscles": An array of the primary and secondary muscles worked, in Italian (e.g., ["quadricipiti", "glutei", "femorali", "core", "lombari"])

Be specific, professional, and focus on safety and effectiveness.`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              detailed_description: { type: "string" },
              form_tips: {
                type: "array",
                items: { type: "string" },
                minItems: 6,
                maxItems: 8
              },
              target_muscles: {
                type: "array",
                items: { type: "string" },
                minItems: 2
              }
            },
            required: ["detailed_description", "form_tips", "target_muscles"]
          }
        });

        // Aggiorna l'esercizio nel database
        await base44.asServiceRole.entities.Exercise.update(exercise.id, {
          detailed_description: llmResponse.detailed_description,
          form_tips: llmResponse.form_tips,
          target_muscles: llmResponse.target_muscles,
          muscle_image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png'
        });

        successCount++;
        console.log(`✅ [${i + 1}/${exercises.length}] Salvato: ${exerciseName}`);
        
        // Piccola pausa per non sovraccaricare l'API
        if (i < exercises.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ [${i + 1}/${exercises.length}] Errore per ${exerciseName}:`, error.message);
        
        // Salva comunque con dati base
        try {
          await base44.asServiceRole.entities.Exercise.update(exercise.id, {
            detailed_description: exercise.description || 'Descrizione dettagliata non disponibile. Consultare un personal trainer.',
            form_tips: ['Consultare un personal trainer per l\'esecuzione corretta di questo esercizio'],
            target_muscles: exercise.muscle_groups || ['vari gruppi muscolari'],
            muscle_image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/body_muscles_generic.png'
          });
        } catch (updateError) {
          console.error(`❌ Impossibile salvare dati base per ${exerciseName}`);
        }
      }
    }

    console.log(`🎉 Generazione completata!`);
    console.log(`✅ Successi: ${successCount}/${exercises.length}`);
    console.log(`❌ Errori: ${errorCount}/${exercises.length}`);

    return Response.json({
      success: true,
      total_exercises: exercises.length,
      successful: successCount,
      errors: errorCount,
      message: `Dettagli generati e salvati per ${successCount} esercizi su ${exercises.length}`
    });

  } catch (error) {
    console.error('Error generating exercise details:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});