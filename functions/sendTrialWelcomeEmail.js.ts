
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    console.log('📧 sendTrialWelcomeEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Recupera i dati utente
        const user = await base44.asServiceRole.entities.User.get(userId);
        
        if (!user || !user.email) {
            return Response.json({ error: 'User not found or no email' }, { status: 404 });
        }

        console.log(`📬 Sending trial welcome email to ${user.email}`);

        const fromEmail = Deno.env.get('FROM_EMAIL') || 'info@projectmywellness.com';

        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
        .header { background: white; padding: 24px 30px; }
        .header img { height: 48px; width: auto; display: block; }
        .content { padding: 40px 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; margin: 20px 0; }
        p { margin: 0 0 1em 0; }
        strong { font-weight: 700; }

        /* Existing styles that were not changed */
        .welcome-box { margin-bottom: 30px; }
        .timer { background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0 30px 0; }
        .timer strong { color: #d97706; font-size: 24px; display: block; margin-bottom: 5px; }
        .highlight { color: #d97706; font-weight: 700; }
        .feature { display: flex; align-items: flex-start; margin-bottom: 20px; }
        .feature-icon { font-size: 24px; margin-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; }
        .feature-text h3 { margin: 0 0 5px 0; color: #111827; font-size: 18px; }
        .feature-text p { margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; }
        .steps { margin-top: 30px; }
        .step { display: flex; align-items: flex-start; margin-bottom: 20px; }
        .step-number { background: #d1fae5; color: #065f46; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; font-size: 14px; flex-shrink: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness">
            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">🎉 Benvenuto in MyWellness!</h1>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">La tua prova gratuita di 3 giorni inizia ora</p>
        </div>
        
        <div class="content">
            <div class="welcome-box">
                <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">👋 Ciao ${user.full_name || 'Utente'}!</h2>
                <p style="margin: 0; color: #1a5753; line-height: 1.6;">
                    Grazie per aver scelto MyWellness! Sei a un passo dal trasformare il tuo corpo e la tua vita con l'intelligenza artificiale.
                </p>
            </div>

            <div class="timer">
                <p style="margin: 0 0 8px 0; color: #78350f; font-size: 14px;">⏰ Il tuo periodo di prova termina tra:</p>
                <strong>3 GIORNI</strong>
                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px;">Dopo la prova: €39/mese (puoi cancellare quando vuoi)</p>
            </div>

            <h2 style="color: #111827; margin: 30px 0 20px 0;">🚀 Cosa ti aspetta:</h2>
            
            <div class="feature">
                <div class="feature-icon">🍽️</div>
                <div class="feature-text">
                    <h3>Piano Nutrizionale AI Personalizzato</h3>
                    <p>Ricette create su misura per te con foto e macro precisi</p>
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">💪</div>
                <div class="feature-text">
                    <h3>Allenamenti Scientifici</h3>
                    <p>Programmi adattivi basati sul tuo livello e obiettivi</p>
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">📸</div>
                <div class="feature-text">
                    <h3>Analisi Foto con AI</h3>
                    <p>Scatta foto ai pasti e l'AI calcola le calorie automaticamente</p>
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                    <h3>Tracciamento Progressi</h3>
                    <p>Dashboard dettagliata con grafici e proiezioni scientifiche</p>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Dashboard" class="cta-button">
                    🎯 Vai alla Dashboard
                </a>
            </div>

            <div class="steps">
                <h3 style="margin: 0 0 15px 0; color: #111827;">📝 I tuoi prossimi passi:</h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong style="color: #111827;">Completa il Quiz</strong>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Rispondi alle domande per creare il tuo profilo perfetto</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong style="color: #111827;">Genera il tuo Piano</strong>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">L'AI creerà un piano nutrizionale e di allenamento personalizzato</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong style="color: #111827;">Inizia Subito</strong>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Segui il piano e traccia i tuoi progressi ogni giorno</p>
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">4</div>
                    <div>
                        <strong style="color: #111827;">Analizza i Risultati</strong>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Usa le foto AI per vedere i tuoi progressi</p>
                    </div>
                </div>
            </div>

            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                    <strong>💡 Consiglio Pro:</strong> I primi 3 giorni sono cruciali! Dedica 10 minuti oggi per completare il quiz e generare il tuo piano. Gli utenti che iniziano subito hanno <span class="highlight">3x più probabilità</span> di raggiungere i loro obiettivi.
                </p>
            </div>

            <h3 style="color: #111827; margin: 30px 0 15px 0;">❓ Hai bisogno di aiuto?</h3>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                Il nostro team è qui per te! Rispondi a questa email o scrivici a 
                <a href="mailto:velika.03@outlook.it" style="color: #26847F; text-decoration: none; font-weight: 600;">velika.03@outlook.it</a>
            </p>

            <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
                <p style="margin: 0 0 10px 0;"><strong style="color: #111827;">MyWellness</strong></p>
                <p style="margin: 0 0 10px 0;">Il tuo percorso verso il benessere inizia oggi 🌟</p>
                <p style="margin: 0; font-size: 12px;">
                    <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Privacy" style="color: #26847F; text-decoration: none;">Privacy Policy</a> · 
                    <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Terms" style="color: #26847F; text-decoration: none;">Termini di Servizio</a>
                </p>
            </div>
        </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999999;">
        <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">© VELIKA GROUP LLC. All Rights Reserved.</p>
        <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
        <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
    </div>
</body>
</html>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            from_name: `MyWellness <${fromEmail}>`,
            subject: '🎉 Benvenuto in MyWellness - I tuoi 3 giorni di prova iniziano ora!',
            body: emailBody
        });

        console.log('✅ Trial welcome email sent successfully');

        return Response.json({ 
            success: true,
            message: 'Trial welcome email sent'
        });

    } catch (error) {
        console.error('❌ Error sending trial welcome email:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});
