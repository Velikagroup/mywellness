import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exercises } = await req.json();

    if (!exercises || !Array.isArray(exercises)) {
      return Response.json({ error: 'Invalid exercises data' }, { status: 400 });
    }

    // Fetch existing workout plans for this user
    const allPlans = await base44.entities.WorkoutPlan.list();
    const userPlans = allPlans.filter(p => p.user_id === user.id);

    // Delete existing plans
    for (const plan of userPlans) {
      try {
        await base44.entities.WorkoutPlan.delete(plan.id);
      } catch (deleteError) {
        console.warn(`Could not delete plan ${plan.id}:`, deleteError);
      }
    }

    // Distribute exercises across 7 days (or user's preferred days)
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const exercisesPerDay = Math.ceil(exercises.length / 7);
    
    let exerciseIndex = 0;

    for (const day of days) {
      const dayExercises = [];
      
      // Collect exercises for this day
      for (let i = 0; i < exercisesPerDay && exerciseIndex < exercises.length; i++) {
        dayExercises.push(exercises[exerciseIndex++]);
      }

      // Create workout plan for this day
      if (dayExercises.length > 0) {
        const totalCalories = dayExercises.length * 150; // Approximate
        const totalDuration = dayExercises.length * 5; // 5 min per exercise

        await base44.entities.WorkoutPlan.create({
          user_id: user.id,
          day_of_week: day,
          plan_name: `Allenamento - ${day.charAt(0).toUpperCase() + day.slice(1)}`,
          workout_type: 'strength',
          exercises: dayExercises.map(ex => ({
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || '10-12 ripetizioni',
            rest: ex.rest || '60 secondi',
            description: `Esercizio per ${(ex.muscle_groups || []).join(', ')}`,
            muscle_groups: ex.muscle_groups || [],
            difficulty: ex.difficulty || 'intermediate',
            intensity_tips: [
              '💪 Scegli un carico che renda le ultime reps dure',
              '📊 RPE 7-8: dovresti poter fare ancora 2-3 reps',
              '✅ Riduci il carico se la forma peggiora'
            ],
            detailed_description: `Esegui ${ex.name} con movimento controllato. Mantieni la postura corretta durante tutta l'esecuzione.`,
            form_tips: [
              'Mantieni la schiena dritta durante tutto il movimento',
              'Contrai il core per stabilizzare il corpo',
              'Esegui il movimento in modo lento e controllato',
              'Respira in modo regolare'
            ],
            target_muscles: ex.muscle_groups || ['Muscoli principali']
          })),
          warm_up: [
            { name: 'Corsa sul posto', duration: '3 minuti', description: 'Riscaldamento cardio' }
          ],
          cool_down: [
            { name: 'Stretching', duration: '5 minuti', description: 'Defaticamento' }
          ],
          total_duration: totalDuration,
          calories_burned: totalCalories,
          difficulty_level: 'intermediate'
        });
      } else {
        // Rest day
        await base44.entities.WorkoutPlan.create({
          user_id: user.id,
          day_of_week: day,
          plan_name: `Riposo - ${day.charAt(0).toUpperCase() + day.slice(1)}`,
          workout_type: 'rest',
          exercises: [],
          warm_up: [],
          cool_down: [],
          total_duration: 0,
          calories_burned: 0,
          difficulty_level: 'easy'
        });
      }
    }

    // Register plan generation
    const currentMonth = new Date().toISOString().slice(0, 7);
    await base44.entities.PlanGeneration.create({
      user_id: user.id,
      plan_type: 'workout',
      generation_month: currentMonth,
      subscription_plan: user.subscription_plan
    });

    return Response.json({
      success: true,
      exercisesImported: exercises.length,
      message: `Successfully imported ${exercises.length} exercises to workout plan`
    });
  } catch (error) {
    console.error('Error importing workout plan:', error);
    return Response.json({ 
      error: error.message || 'Failed to import workout plan' 
    }, { status: 500 });
  }
});