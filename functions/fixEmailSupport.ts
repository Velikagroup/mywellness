import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ottieni tutti i template
        const templates = await base44.asServiceRole.entities.EmailTemplate.list();
        
        let fixed = 0;
        const errors = [];

        for (const template of templates) {
            try {
                const updates = {};
                let needsUpdate = false;

                // Funzione helper per sostituire support@ con info@
                const replaceSupport = (text) => {
                    if (!text || typeof text !== 'string') return text;
                    return text
                        .replace(/support@projectmywellness\.com/g, 'info@projectmywellness.com')
                        .replace(/support@mywellness\.com/g, 'info@projectmywellness.com');
                };

                // Controlla e aggiorna ogni campo
                const fieldsToCheck = [
                    'main_content', 
                    'intro_text', 
                    'second_paragraph', 
                    'closing_text', 
                    'footer_text', 
                    'urgency_subtitle'
                ];

                for (const field of fieldsToCheck) {
                    if (template[field]) {
                        const replaced = replaceSupport(template[field]);
                        if (replaced !== template[field]) {
                            updates[field] = replaced;
                            needsUpdate = true;
                        }
                    }
                }

                // Fix reply_to_email se necessario
                if (template.reply_to_email && 
                    (template.reply_to_email.includes('support@projectmywellness.com') || 
                     template.reply_to_email.includes('support@mywellness.com'))) {
                    updates.reply_to_email = 'info@projectmywellness.com';
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await base44.asServiceRole.entities.EmailTemplate.update(template.id, updates);
                    fixed++;
                }
            } catch (err) {
                errors.push({ template_id: template.template_id, error: err.message });
            }
        }

        return Response.json({ 
            success: true,
            fixed_count: fixed,
            total_templates: templates.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});