import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica autenticazione
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ingredients } = await req.json();
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return Response.json({ 
        error: 'Invalid input: ingredients array required' 
      }, { status: 400 });
    }

    const validatedIngredients = [];
    const newIngredients = [];

    // Per ogni ingrediente nella ricetta
    for (const ingredient of ingredients) {
      const normalizedName = ingredient.name.toLowerCase().trim();
      
      // 1. Cerca nel database se esiste già
      const existingIngredients = await base44.entities.Ingredient.filter({
        name_it: normalizedName
      });

      if (existingIngredients.length > 0) {
        // Ingrediente trovato nel database
        const dbIngredient = existingIngredients[0];
        
        // Calcola valori per la quantità specifica
        const grams = ingredient.quantity;
        const calculatedValues = {
          name: dbIngredient.name_it,
          quantity: grams,
          unit: ingredient.unit || 'g',
          calories: Math.round((dbIngredient.calories_per_100g * grams / 100)),
          protein: Math.round((dbIngredient.protein_per_100g * grams / 100) * 10) / 10,
          carbs: Math.round((dbIngredient.carbs_per_100g * grams / 100) * 10) / 10,
          fat: Math.round((dbIngredient.fat_per_100g * grams / 100) * 10) / 10,
          from_database: true
        };
        
        // Incrementa usage_count
        await base44.entities.Ingredient.update(dbIngredient.id, {
          usage_count: (dbIngredient.usage_count || 0) + 1
        });
        
        validatedIngredients.push(calculatedValues);
      } else {
        // Ingrediente NON trovato - chiedi all'AI di cercarlo
        const llmPrompt = `You are a nutritional database expert. Find VERIFIED nutritional data for this ingredient from official sources.

Ingredient: ${ingredient.name}
Quantity: ${ingredient.quantity}${ingredient.unit || 'g'}

🔬 MANDATORY: Search these verified databases:
- USDA FoodData Central
- CREA-Alimenti (Italian database)
- INRAN (Italian reference)

Return PRECISE nutritional values per 100g/100ml with:
1. Calories (kcal)
2. Protein (g) - 1 decimal
3. Carbs (g) - 1 decimal  
4. Fat (g) - 1 decimal
5. Fiber (g) - 1 decimal
6. Data sources used
7. Common portions with gram equivalents
8. Category
9. Suitable diets

Example for egg:
- USDA says: egg whole (60g) = 86kcal, 7.5g protein, 0.34g carbs, 6.0g fat
- Per 100g: 143kcal, 12.5g protein, 0.57g carbs, 10.0g fat`;

        const llmResponse = await base44.integrations.Core.InvokeLLM({
          prompt: llmPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              name_it: { type: "string" },
              name_en: { type: "string" },
              category: { 
                type: "string",
                enum: ["carne", "pesce", "latticini", "uova", "verdure", "frutta", "cereali", "legumi", "frutta_secca", "oli_grassi", "condimenti", "bevande", "altro"]
              },
              calories_per_100g: { type: "number" },
              protein_per_100g: { type: "number" },
              carbs_per_100g: { type: "number" },
              fat_per_100g: { type: "number" },
              fiber_per_100g: { type: "number" },
              data_sources: { 
                type: "array",
                items: { type: "string" }
              },
              common_portions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    grams: { type: "number" }
                  }
                }
              },
              suitable_for_diets: {
                type: "array",
                items: { 
                  type: "string",
                  enum: ["mediterranean", "low_carb", "soft_low_carb", "paleo", "keto", "carnivore", "vegetarian", "vegan"]
                }
              }
            },
            required: ["name_it", "name_en", "category", "calories_per_100g", "protein_per_100g", "carbs_per_100g", "fat_per_100g"]
          }
        });

        // Salva il nuovo ingrediente nel database
        const savedIngredient = await base44.entities.Ingredient.create({
          ...llmResponse,
          verified: true,
          usage_count: 1
        });

        // Calcola valori per la quantità specifica
        const grams = ingredient.quantity;
        const calculatedValues = {
          name: savedIngredient.name_it,
          quantity: grams,
          unit: ingredient.unit || 'g',
          calories: Math.round((savedIngredient.calories_per_100g * grams / 100)),
          protein: Math.round((savedIngredient.protein_per_100g * grams / 100) * 10) / 10,
          carbs: Math.round((savedIngredient.carbs_per_100g * grams / 100) * 10) / 10,
          fat: Math.round((savedIngredient.fat_per_100g * grams / 100) * 10) / 10,
          from_database: false,
          newly_added: true
        };

        validatedIngredients.push(calculatedValues);
        newIngredients.push(savedIngredient);
      }
    }

    return Response.json({
      success: true,
      validated_ingredients: validatedIngredients,
      new_ingredients_added: newIngredients.length,
      new_ingredients: newIngredients
    });

  } catch (error) {
    console.error('Error validating ingredients:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});