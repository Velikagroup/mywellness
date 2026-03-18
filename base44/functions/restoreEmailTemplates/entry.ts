import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Contenuti originali dei template
        const templateContents = {
            // Plan Upgrade Templates
            plan_upgrade_it: {
                main_content: 'La tua esperienza MyWellness è appena diventata ancora più completa!',
                intro_text: 'Abbiamo appena completato l\'aggiornamento del tuo piano a {new_plan}. Da questo momento hai accesso a tutte le funzionalità avanzate per raggiungere i tuoi obiettivi più velocemente.',
                second_paragraph: 'Il nuovo piano include strumenti AI più potenti, analisi dettagliate dei progressi e supporto prioritario. Preparati a vedere risultati ancora migliori!',
                closing_text: 'Esplora subito tutte le nuove funzionalità disponibili nella tua dashboard.',
                urgency_subtitle: 'Inizia a usare le nuove funzionalità premium oggi stesso!',
                footer_text: 'Hai domande sul tuo nuovo piano? Il nostro team di supporto è sempre disponibile per aiutarti.'
            },
            plan_upgrade_en: {
                main_content: 'Your MyWellness experience just got even better!',
                intro_text: 'We\'ve just completed your plan upgrade to {new_plan}. From now on, you have access to all advanced features to reach your goals faster.',
                second_paragraph: 'Your new plan includes more powerful AI tools, detailed progress analysis, and priority support. Get ready to see even better results!',
                closing_text: 'Explore all the new features available in your dashboard right now.',
                urgency_subtitle: 'Start using your premium features today!',
                footer_text: 'Have questions about your new plan? Our support team is always available to help you.'
            },
            plan_upgrade_es: {
                main_content: '¡Tu experiencia MyWellness acaba de mejorar!',
                intro_text: 'Acabamos de completar la actualización de tu plan a {new_plan}. A partir de ahora, tienes acceso a todas las funciones avanzadas para alcanzar tus objetivos más rápido.',
                second_paragraph: 'Tu nuevo plan incluye herramientas de IA más potentes, análisis detallados del progreso y soporte prioritario. ¡Prepárate para ver resultados aún mejores!',
                closing_text: 'Explora todas las nuevas funciones disponibles en tu panel de control ahora.',
                urgency_subtitle: '¡Comienza a usar tus funciones premium hoy!',
                footer_text: '¿Tienes preguntas sobre tu nuevo plan? Nuestro equipo de soporte siempre está disponible para ayudarte.'
            },
            plan_upgrade_pt: {
                main_content: 'Sua experiência MyWellness acabou de melhorar!',
                intro_text: 'Acabamos de concluir a atualização do seu plano para {new_plan}. A partir de agora, você tem acesso a todos os recursos avançados para atingir seus objetivos mais rapidamente.',
                second_paragraph: 'Seu novo plano inclui ferramentas de IA mais poderosas, análise detalhada de progresso e suporte prioritário. Prepare-se para ver resultados ainda melhores!',
                closing_text: 'Explore todos os novos recursos disponíveis no seu painel agora.',
                urgency_subtitle: 'Comece a usar seus recursos premium hoje!',
                footer_text: 'Tem dúvidas sobre seu novo plano? Nossa equipe de suporte está sempre disponível para ajudá-lo.'
            },
            plan_upgrade_de: {
                main_content: 'Ihre MyWellness-Erfahrung wurde gerade noch besser!',
                intro_text: 'Wir haben gerade Ihr Plan-Upgrade auf {new_plan} abgeschlossen. Ab jetzt haben Sie Zugriff auf alle erweiterten Funktionen, um Ihre Ziele schneller zu erreichen.',
                second_paragraph: 'Ihr neuer Plan umfasst leistungsstärkere KI-Tools, detaillierte Fortschrittsanalysen und vorrangigen Support. Machen Sie sich bereit für noch bessere Ergebnisse!',
                closing_text: 'Erkunden Sie jetzt alle neuen Funktionen in Ihrem Dashboard.',
                urgency_subtitle: 'Beginnen Sie heute mit der Nutzung Ihrer Premium-Funktionen!',
                footer_text: 'Haben Sie Fragen zu Ihrem neuen Plan? Unser Support-Team steht Ihnen jederzeit zur Verfügung.'
            },
            plan_upgrade_fr: {
                main_content: 'Votre expérience MyWellness vient de s\'améliorer!',
                intro_text: 'Nous venons de terminer la mise à niveau de votre plan vers {new_plan}. Dès maintenant, vous avez accès à toutes les fonctionnalités avancées pour atteindre vos objectifs plus rapidement.',
                second_paragraph: 'Votre nouveau plan comprend des outils d\'IA plus puissants, une analyse détaillée des progrès et un support prioritaire. Préparez-vous à voir des résultats encore meilleurs!',
                closing_text: 'Explorez dès maintenant toutes les nouvelles fonctionnalités disponibles dans votre tableau de bord.',
                urgency_subtitle: 'Commencez à utiliser vos fonctionnalités premium dès aujourd\'hui!',
                footer_text: 'Vous avez des questions sur votre nouveau plan? Notre équipe d\'assistance est toujours disponible pour vous aider.'
            },

            // Plan Downgrade Templates
            plan_downgrade_it: {
                main_content: 'Abbiamo modificato il tuo piano come richiesto.',
                intro_text: 'Il tuo piano è stato cambiato a {new_plan}. Le modifiche sono attive da questo momento.',
                second_paragraph: 'Se dovessi aver bisogno di funzionalità aggiuntive in futuro, puoi sempre fare l\'upgrade direttamente dalla dashboard.',
                closing_text: 'Continua a usare MyWellness per raggiungere i tuoi obiettivi.',
                urgency_subtitle: 'Puoi sempre fare l\'upgrade quando vuoi!',
                footer_text: 'Se hai cambiato idea o hai domande, il nostro team è qui per te.'
            },
            plan_downgrade_en: {
                main_content: 'We\'ve changed your plan as requested.',
                intro_text: 'Your plan has been changed to {new_plan}. The changes are active from now.',
                second_paragraph: 'If you need additional features in the future, you can always upgrade directly from the dashboard.',
                closing_text: 'Keep using MyWellness to reach your goals.',
                urgency_subtitle: 'You can always upgrade whenever you want!',
                footer_text: 'If you changed your mind or have questions, our team is here for you.'
            },
            plan_downgrade_es: {
                main_content: 'Hemos modificado tu plan como solicitaste.',
                intro_text: 'Tu plan ha sido cambiado a {new_plan}. Los cambios están activos desde ahora.',
                second_paragraph: 'Si necesitas funciones adicionales en el futuro, siempre puedes actualizar directamente desde el panel.',
                closing_text: 'Sigue usando MyWellness para alcanzar tus objetivos.',
                urgency_subtitle: '¡Puedes actualizar cuando quieras!',
                footer_text: 'Si cambiaste de opinión o tienes preguntas, nuestro equipo está aquí para ti.'
            },
            plan_downgrade_pt: {
                main_content: 'Modificamos seu plano conforme solicitado.',
                intro_text: 'Seu plano foi alterado para {new_plan}. As mudanças estão ativas a partir de agora.',
                second_paragraph: 'Se precisar de recursos adicionais no futuro, você sempre pode atualizar diretamente do painel.',
                closing_text: 'Continue usando MyWellness para atingir seus objetivos.',
                urgency_subtitle: 'Você sempre pode atualizar quando quiser!',
                footer_text: 'Se mudou de ideia ou tem dúvidas, nossa equipe está aqui para você.'
            },
            plan_downgrade_de: {
                main_content: 'Wir haben Ihren Plan wie gewünscht geändert.',
                intro_text: 'Ihr Plan wurde auf {new_plan} geändert. Die Änderungen sind ab sofort aktiv.',
                second_paragraph: 'Wenn Sie in Zukunft zusätzliche Funktionen benötigen, können Sie jederzeit direkt vom Dashboard aus upgraden.',
                closing_text: 'Nutzen Sie MyWellness weiterhin, um Ihre Ziele zu erreichen.',
                urgency_subtitle: 'Sie können jederzeit upgraden, wann immer Sie wollen!',
                footer_text: 'Wenn Sie Ihre Meinung geändert haben oder Fragen haben, ist unser Team für Sie da.'
            },
            plan_downgrade_fr: {
                main_content: 'Nous avons modifié votre plan comme demandé.',
                intro_text: 'Votre plan a été changé pour {new_plan}. Les modifications sont actives dès maintenant.',
                second_paragraph: 'Si vous avez besoin de fonctionnalités supplémentaires à l\'avenir, vous pouvez toujours mettre à niveau directement depuis le tableau de bord.',
                closing_text: 'Continuez à utiliser MyWellness pour atteindre vos objectifs.',
                urgency_subtitle: 'Vous pouvez toujours mettre à niveau quand vous le souhaitez!',
                footer_text: 'Si vous avez changé d\'avis ou avez des questions, notre équipe est là pour vous.'
            }
        };

        const allTemplates = await base44.asServiceRole.entities.EmailTemplate.list(null, 500);
        let fixed = 0;
        let errors = [];

        for (const template of allTemplates) {
            try {
                const templateId = template.template_id;
                const content = templateContents[templateId];
                
                if (content) {
                    await base44.asServiceRole.entities.EmailTemplate.update(template.id, {
                        main_content: content.main_content,
                        intro_text: content.intro_text,
                        second_paragraph: content.second_paragraph,
                        closing_text: content.closing_text,
                        urgency_subtitle: content.urgency_subtitle,
                        footer_text: content.footer_text
                    });
                    fixed++;
                    console.log(`✅ Fixed: ${templateId}`);
                }
            } catch (error) {
                errors.push({ template_id: template.template_id, error: error.message });
                console.error(`❌ Error fixing ${template.template_id}:`, error);
            }
        }

        return Response.json({
            success: true,
            fixed,
            total: allTemplates.length,
            errors
        });

    } catch (error) {
        console.error('Error restoring templates:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});