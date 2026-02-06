import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica che sia admin
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('🔄 Starting bulk sync of all users to Resend...');

    // Ottieni tutti gli utenti
    const allUsers = await base44.asServiceRole.entities.User.list();
    console.log(`📊 Found ${allUsers.length} users to sync`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of allUsers) {
      if (!user.email) {
        console.log(`⚠️ Skipping user ${user.id} - no email`);
        continue;
      }

      try {
        // Sync to Resend
        const response = await fetch('https://api.resend.com/audiences/' + RESEND_AUDIENCE_ID + '/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            first_name: user.full_name || 'User',
            unsubscribed: false
          })
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          console.log(`✅ ${successCount}/${allUsers.length}: Synced ${user.email}`);
        } else if (response.status === 400 && data.message?.includes('already exists')) {
          successCount++;
          console.log(`✅ ${successCount}/${allUsers.length}: ${user.email} already exists in Resend`);
        } else {
          errorCount++;
          errors.push({ email: user.email, error: data.message });
          console.error(`❌ Failed to sync ${user.email}:`, data.message);
        }

        // Rate limiting: 100ms delay tra chiamate
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errorCount++;
        errors.push({ email: user.email, error: error.message });
        console.error(`❌ Error syncing ${user.email}:`, error.message);
      }
    }

    console.log(`\n✅ Sync complete: ${successCount} success, ${errorCount} errors`);

    return Response.json({
      success: true,
      total: allUsers.length,
      synced: successCount,
      errors: errorCount,
      errorDetails: errors
    });

  } catch (error) {
    console.error('❌ Bulk sync error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});