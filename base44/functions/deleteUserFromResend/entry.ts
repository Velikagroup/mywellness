import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
      return Response.json({ error: 'Resend not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const userEmail = payload.event?.entity_id || payload.user_email;

    if (!userEmail) {
      console.error('No email found in payload');
      return Response.json({ error: 'No email found' }, { status: 400 });
    }

    console.log(`Deleting contact from Resend: ${userEmail}`);

    // Get all contacts to find the one with this email
    const listResponse = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        }
      }
    );

    if (!listResponse.ok) {
      console.error('Failed to list Resend contacts');
      return Response.json({ error: 'Failed to list contacts' }, { status: 500 });
    }

    const { data: contacts } = await listResponse.json();
    const contact = contacts?.find(c => c.email === userEmail);

    if (!contact) {
      console.log(`Contact ${userEmail} not found in Resend`);
      return Response.json({ success: true, message: 'Contact not found' });
    }

    // Delete the contact
    const deleteResponse = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contact.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        }
      }
    );

    if (!deleteResponse.ok) {
      console.error('Failed to delete contact from Resend');
      return Response.json({ error: 'Failed to delete contact' }, { status: 500 });
    }

    console.log(`Successfully deleted ${userEmail} from Resend`);
    
    return Response.json({ 
      success: true, 
      message: 'Contact deleted from Resend',
      email: userEmail
    });

  } catch (error) {
    console.error('Error deleting contact from Resend:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});