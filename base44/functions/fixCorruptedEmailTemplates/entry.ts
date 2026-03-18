import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * 🔧 FIX CORRUPTED EMAIL TEMPLATES
 * 
 * Risolve il problema dove i campi contengono oggetti {$replace: [...]} 
 * invece di stringhe normali.
 */

Deno.serve(async (req) => {
    console.log('🔧 Starting email templates repair...');
    
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ 
                success: false, 
                error: 'Unauthorized - admin only' 
            }, { status: 403 });
        }

        // Fetch tutti i template
        const templates = await base44.asServiceRole.entities.EmailTemplate.filter({});
        console.log(`📊 Found ${templates.length} templates to check`);

        let fixedCount = 0;
        const errors = [];

        for (const template of templates) {
            try {
                let needsUpdate = false;
                const fixedData = { ...template };

                // Lista di campi da controllare
                const fieldsToCheck = [
                    'main_content',
                    'intro_text', 
                    'second_paragraph',
                    'closing_text',
                    'urgency_subtitle',
                    'footer_text'
                ];

                // Controlla e ripara ogni campo
                for (const field of fieldsToCheck) {
                    if (template[field] && typeof template[field] === 'object' && template[field].$replace) {
                        console.log(`🔨 Fixing ${template.template_id}.${field}`);
                        // Prendi il secondo valore dell'array (quello corretto)
                        fixedData[field] = template[field].$replace[1] || template[field].$replace[0] || '';
                        needsUpdate = true;
                    }
                }

                // Aggiorna se necessario
                if (needsUpdate) {
                    await base44.asServiceRole.entities.EmailTemplate.update(template.id, fixedData);
                    fixedCount++;
                    console.log(`✅ Fixed template: ${template.template_id}`);
                }

            } catch (error) {
                console.error(`❌ Error fixing template ${template.template_id}:`, error.message);
                errors.push({
                    template_id: template.template_id,
                    error: error.message
                });
            }
        }

        console.log(`🎉 Repair complete: ${fixedCount} templates fixed`);

        return Response.json({
            success: true,
            message: `Successfully repaired ${fixedCount} templates`,
            fixed_count: fixedCount,
            total_templates: templates.length,
            errors: errors
        });

    } catch (error) {
        console.error('❌ Fatal error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});