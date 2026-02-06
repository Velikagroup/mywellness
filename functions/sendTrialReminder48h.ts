import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('🔔 Checking for users at 48h trial mark...');

    // Calcola il timestamp di 48 ore fa
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);

    // Trova utenti in trial che hanno iniziato tra 48 e 49 ore fa
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    const eligibleUsers = allUsers.filter(user => {
      if (user.subscription_status !== 'trial') return false;
      if (!user.trial_start_date) return false;
      
      const trialStartDate = new Date(user.trial_start_date);
      return trialStartDate >= fortyNineHoursAgo && trialStartDate <= fortyEightHoursAgo;
    });

    console.log(`📊 Found ${eligibleUsers.length} users eligible for 48h reminder`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of eligibleUsers) {
      try {
        const userLanguage = user.preferred_language || 'it';
        
        // Invia email tramite Resend usando il template
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MyWellness <info@projectmywellness.com>',
            to: [user.email],
            subject: userLanguage === 'it' ? '⏰ Ancora 5 giorni per il tuo Trial' : '⏰ 5 Days Left in Your Trial',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #26847F;">${userLanguage === 'it' ? '⏰ Il tuo Trial sta per scadere' : '⏰ Your Trial is Expiring Soon'}</h2>
                <p>${userLanguage === 'it' ? 'Ciao' : 'Hi'} ${user.full_name || 'User'},</p>
                <p>${userLanguage === 'it' 
                  ? 'Ti restano solo 5 giorni per completare il tuo trial gratuito di MyWellness!' 
                  : 'You only have 5 days left to complete your free MyWellness trial!'}</p>
                <p>${userLanguage === 'it'
                  ? 'Non perdere l\'opportunità di continuare il tuo percorso di trasformazione. Passa al piano completo per mantenere tutti i tuoi progressi e risultati.'
                  : 'Don\'t miss the opportunity to continue your transformation journey. Upgrade to the full plan to keep all your progress and results.'}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://projectmywellness.com/dashboard" 
                     style="background-color: #26847F; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    ${userLanguage === 'it' ? '🚀 Continua il Tuo Percorso' : '🚀 Continue Your Journey'}
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  ${userLanguage === 'it' 
                    ? 'A presto,<br>Il Team MyWellness' 
                    : 'See you soon,<br>The MyWellness Team'}
                </p>
              </div>
            `
          })
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ Sent 48h reminder to ${user.email}`);
          
          // Log email
          await base44.asServiceRole.entities.EmailLog.create({
            user_id: user.id,
            email_type: 'trial_reminder_48h',
            recipient_email: user.email,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
        } else {
          errorCount++;
          const errorData = await response.json();
          console.error(`❌ Failed to send to ${user.email}:`, errorData);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error sending to ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Complete: ${successCount} sent, ${errorCount} errors`);

    return Response.json({
      success: true,
      eligible: eligibleUsers.length,
      sent: successCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});