import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    console.log('📧 unsubscribeEmail - Start');
    
    try {
        const base44 = createClientFromRequest(req);
        
        const url = new URL(req.url);
        const email = url.searchParams.get('email');
        const reason = url.searchParams.get('reason') || 'user_request';
        const source = url.searchParams.get('source') || 'broadcast';
        
        if (!email) {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Errore - MyWellness</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fafafa; }
                        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                        h1 { color: #ef4444; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Errore</h1>
                        <p>Email non valida.</p>
                    </div>
                </body>
                </html>
            `, {
                status: 400,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Verifica se già presente
        const existing = await base44.asServiceRole.entities.UnsubscribedEmail.filter({ email });
        
        if (existing.length === 0) {
            // Crea nuovo record
            await base44.asServiceRole.entities.UnsubscribedEmail.create({
                email,
                reason,
                source
            });
            console.log(`✅ Email ${email} unsubscribed`);
        } else {
            console.log(`ℹ️ Email ${email} already unsubscribed`);
        }
        
        // Pagina di conferma
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Disiscrizione Confermata - MyWellness</title>
                <style>
                    body {
                        font-family: 'Inter', -apple-system, sans-serif;
                        text-align: center;
                        padding: 20px;
                        background: linear-gradient(135deg, #e9f6f5 0%, #d4f1ed 100%);
                        margin: 0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        max-width: 500px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    }
                    .logo {
                        height: 48px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #26847F;
                        font-size: 28px;
                        margin: 20px 0 15px;
                    }
                    p {
                        color: #6b7280;
                        line-height: 1.6;
                        margin: 15px 0;
                    }
                    .icon {
                        font-size: 64px;
                        margin: 20px 0;
                    }
                    .btn {
                        display: inline-block;
                        background: #26847F;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        margin-top: 20px;
                        font-weight: 600;
                    }
                    .btn:hover {
                        background: #1f6b66;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d44c626cc2c19cca9c750d/2e82f3cae_IconaMyWellness.png" alt="MyWellness" class="logo">
                    <div class="icon">✅</div>
                    <h1>Disiscrizione Confermata</h1>
                    <p><strong>${email}</strong> è stato rimosso dalla nostra mailing list.</p>
                    <p>Non riceverai più email di marketing da MyWellness.</p>
                    <p style="font-size: 14px; margin-top: 30px;">Continuerai a ricevere email importanti relative al tuo account (conferme, ricevute, etc).</p>
                    <a href="https://projectmywellness.com" class="btn">Torna al Sito</a>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
        
    } catch (error) {
        console.error('❌ Error in unsubscribeEmail:', error);
        
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Errore - MyWellness</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fafafa; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                    h1 { color: #ef4444; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Errore</h1>
                    <p>Si è verificato un errore. Riprova più tardi.</p>
                </div>
            </body>
            </html>
        `, {
            status: 500,
            headers: { 'Content-Type': 'text/html' }
        });
    }
});