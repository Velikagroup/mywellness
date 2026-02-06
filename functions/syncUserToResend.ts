import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    if (!RESEND_AUDIENCE_ID) {
      console.error('RESEND_AUDIENCE_ID not configured');
      return Response.json({ error: 'RESEND_AUDIENCE_ID not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Get email from payload (either direct params or automation data)
    const userEmail = payload.user_email || payload.data?.email;
    const fullName = payload.full_name || payload.data?.full_name;

    if (!userEmail) {
      console.error('No email found in payload');
      return Response.json({ error: 'No email found' }, { status: 400 });
    }

    console.log(`Syncing user to Resend: ${userEmail}`);

    // Add/Update contact in Resend audience
    const resendResponse = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail,
          first_name: userData.full_name || '',
          unsubscribed: false
        })
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      // If contact already exists, that's fine
      if (resendData.message?.includes('already exists')) {
        console.log(`Contact ${userEmail} already exists in Resend audience`);
        return Response.json({ 
          success: true, 
          message: 'Contact already exists',
          email: userEmail 
        });
      }

      console.error('Resend API error:', resendData);
      return Response.json({ 
        error: 'Failed to add contact to Resend',
        details: resendData 
      }, { status: resendResponse.status });
    }

    console.log(`Successfully synced ${userEmail} to Resend audience`);
    
    return Response.json({ 
      success: true, 
      message: 'User synced to Resend',
      email: userEmail,
      resend_id: resendData.id
    });

  } catch (error) {
    console.error('Error syncing user to Resend:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});