
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
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 30px 20px !important; }
            .outer-wrapper { padding: 0 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0;">
    <table class="outer-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fafafa; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: white; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: white; padding: 24px 30px;">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" style="height: 48px; width: auto; display: block;">
                            <h1 style="color: #26847F; margin: 20px 0 10px 0; font-size: 28px;">🎉 Benvenuto in MyWellness!</h1>
                            <p style="color: #6b7280; margin: 0; font-size: 16px;">La tua prova gratuita di 3 giorni inizia ora</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <div style="margin-bottom: 30px;">
                                <h2 style="margin: 0 0 10px 0; color: #26847F; font-size: 20px;">👋 Ciao ${user.full_name || 'Utente'}!</h2>
                                <p style="margin: 0; color: #1a5753; line-height: 1.6;">
                                    Grazie per aver scelto MyWellness! Sei a un passo dal trasformare il tuo corpo e la tua vita con l'intelligenza artificiale.
                                </p>
                            </div>

                            <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0 30px 0;">
                                <p style="margin: 0 0 8px 0; color: #78350f; font-size: 14px;">⏰ Il tuo periodo di prova termina tra:</p>
                                <strong style="color: #d97706; font-size: 24px; display: block; margin-bottom: 5px;">3 GIORNI</strong>
                                <p style="margin: 8px 0 0 0; color: #78350f; font-size: 13px;">Dopo la prova: €39/mese (puoi cancellare quando vuoi)</p>
                            </div>

                            <h2 style="color: #111827; margin: 30px 0 20px 0;">🚀 Cosa ti aspetta:</h2>
                            
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">🍽️</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Piano Nutrizionale AI Personalizzato</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Ricette create su misura per te con foto e macro precisi</p>
                                    </td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">💪</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Allenamenti Scientifici</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Programmi adattivi basati sul tuo livello e obiettivi</p>
                                    </td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">📸</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Analisi Foto con AI</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Scatta foto ai pasti e l'AI calcola le calorie automaticamente</p>
                                    </td>
                                </tr>
                            </table>

                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td valign="top" style="font-size: 24px; padding-right: 15px; background: #ecfdf5; padding: 10px; border-radius: 8px; width: 60px;">📊</td>
                                    <td valign="top">
                                        <h3 style="margin: 0 0 5px 0; color: #111827; font-size: 18px;">Tracciamento Progressi</h3>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">Dashboard dettagliata con grafici e proiezioni scientifiche</p>
                                    </td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #26847F 0%, #1f6b66 100%); color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                                    🎯 Vai alla Dashboard
                                </a>
                            </div>

                            <div style="margin-top: 30px;">
                                <h3 style="margin: 0 0 15px 0; color: #111827;">📝 I tuoi prossimi passi:</h3>
                                
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                    <tr>
                                        <td valign="top" style="background: #d1fae5; color: #065f46; border-radius: 50%; width: 28px; height: 28px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; line-height: 28px;">1</td>
                                        <td valign="top" style="padding-left: 15px;">
                                            <strong style="color: #111827;">Completa il Quiz</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Rispondi alle domande per creare il tuo profilo perfetto</p>
                                        </td>
                                    </tr>
                                </table>

                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                    <tr>
                                        <td valign="top" style="background: #d1fae5; color: #065f46; border-radius: 50%; width: 28px; height: 28px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; line-height: 28px;">2</td>
                                        <td valign="top" style="padding-left: 15px;">
                                            <strong style="color: #111827;">Genera il tuo Piano</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">L'AI creerà un piano nutrizionale e di allenamento personalizzato</p>
                                        </td>
                                    </tr>
                                </table>

                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                    <tr>
                                        <td valign="top" style="background: #d1fae5; color: #065f46; border-radius: 50%; width: 28px; height: 28px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; line-height: 28px;">3</td>
                                        <td valign="top" style="padding-left: 15px;">
                                            <strong style="color: #111827;">Inizia Subito</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Segui il piano e traccia i tuoi progressi ogni giorno</p>
                                        </td>
                                    </tr>
                                </table>

                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                    <tr>
                                        <td valign="top" style="background: #d1fae5; color: #065f46; border-radius: 50%; width: 28px; height: 28px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; line-height: 28px;">4</td>
                                        <td valign="top" style="padding-left: 15px;">
                                            <strong style="color: #111827;">Analizza i Risultati</strong>
                                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Usa le foto AI per vedere i tuoi progressi</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                    <strong>💡 Consiglio Pro:</strong> I primi 3 giorni sono cruciali! Dedica 10 minuti oggi per completare il quiz e generare il tuo piano. Gli utenti che iniziano subito hanno <span style="color: #d97706; font-weight: 700;">3x più probabilità</span> di raggiungere i loro obiettivi.
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
                                    <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Privacy" style="color: #26847F; text-decoration: none;">Privacy Policy</a> &middot; 
                                    <a href="${Deno.env.get('APP_URL') || 'https://app.mywellness.it'}/Terms" style="color: #26847F; text-decoration: none;">Termini di Servizio</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 20px;">
                    <tr>
                        <td align="center" style="padding: 20px; color: #999999;">
                            <p style="margin: 5px 0; font-size: 12px; font-weight: 600;">&copy; VELIKA GROUP LLC. All Rights Reserved.</p>
                            <p style="margin: 5px 0; font-size: 11px;">30 N Gould St 32651 Sheridan, WY 82801, United States</p>
                            <p style="margin: 5px 0; font-size: 11px;">EIN: 36-5141800 - velika.03@outlook.it</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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
