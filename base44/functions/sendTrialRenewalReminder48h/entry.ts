import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('⏰ Starting 48h trial renewal reminder job...');

    // Calcola 48 ore fa
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
    const targetDate = fortyEightHoursAgo.toISOString();

    console.log(`📅 Looking for users who started trial around: ${targetDate}`);

    // Ottieni tutti gli utenti in trial
    const allUsers = await base44.asServiceRole.entities.User.filter({
      subscription_status: 'trial'
    });

    console.log(`👥 Found ${allUsers.length} users in trial status`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      if (!user.email || !user.trial_ends_at) {
        skippedCount++;
        continue;
      }

      // Calcola quando è iniziato il trial (trial_ends_at - 7 giorni)
      const trialEnd = new Date(user.trial_ends_at);
      const trialStart = new Date(trialEnd);
      trialStart.setDate(trialStart.getDate() - 7); // Trial dura 7 giorni

      // Calcola ore dall'inizio del trial
      const now = new Date();
      const hoursSinceTrialStart = (now - trialStart) / (1000 * 60 * 60);

      // Invia solo se sono passate tra 47 e 49 ore (finestra di 2 ore per compensare delay scheduling)
      if (hoursSinceTrialStart < 47 || hoursSinceTrialStart > 49) {
        continue;
      }

      console.log(`📧 Sending renewal reminder to ${user.email} (trial started ${hoursSinceTrialStart.toFixed(1)}h ago)`);

      try {
        // Invia email con template Resend "Plan Renewal Reminder"
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MyWellness <info@projectmywellness.com>',
            to: [user.email],
            subject: 'Il tuo piano sta per rinnovarsi',
            html: `
              <h1>Ciao ${user.full_name || 'Utente'},</h1>
              <p>Il tuo periodo di prova gratuito di 7 giorni sta per terminare tra 5 giorni.</p>
              <p>Per continuare ad utilizzare tutte le funzionalità di MyWellness, il tuo piano si rinnoverà automaticamente.</p>
              <p>Se desideri modificare o annullare il tuo piano, puoi farlo in qualsiasi momento dalle impostazioni del tuo account.</p>
              <p>Grazie per aver scelto MyWellness!</p>
            `
          })
        });

        const data = await response.json();

        if (response.ok) {
          sentCount++;
          console.log(`✅ Email sent to ${user.email} - ID: ${data.id}`);
        } else {
          console.error(`❌ Failed to send to ${user.email}:`, data);
        }

      } catch (emailError) {
        console.error(`❌ Error sending to ${user.email}:`, emailError.message);
      }
    }

    console.log(`✅ Job complete: ${sentCount} emails sent, ${skippedCount} skipped`);

    return Response.json({
      success: true,
      sent: sentCount,
      skipped: skippedCount,
      total: allUsers.length
    });

  } catch (error) {
    console.error('❌ Job error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});