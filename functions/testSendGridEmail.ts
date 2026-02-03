Deno.serve(async (req) => {
    try {
        const sgMail = (await import('npm:@sendgrid/mail')).default;
        sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'));

        const body = await req.json();
        const { userEmail, userName = 'Utente' } = body;

        if (!userEmail) {
            return Response.json({ error: 'Missing userEmail' }, { status: 400 });
        }

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#fafafa;">
<div style="max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:12px;">
    <h2 style="color:#26847F;">Ciao ${userName}!</h2>
    <p style="line-height:1.6;color:#374151;">
        Questo è un test email da MyWellness.
    </p>
    <a href="https://projectmywellness.com" style="display:inline-block;background:#26847F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:20px;">
        Vai al sito
    </a>
    <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#999;">© MyWellness</p>
</div>
</body>
</html>`;

        const msg = {
            to: userEmail,
            from: 'info@projectmywellness.com',
            subject: '🧪 Test Email - MyWellness',
            html: html
        };

        const result = await sgMail.send(msg);

        console.log('✅ Email sent:', result[0].headers['x-message-id']);

        return Response.json({
            success: true,
            messageId: result[0].headers['x-message-id'],
            provider: 'sendgrid',
            to: userEmail
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});