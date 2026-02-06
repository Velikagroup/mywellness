import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('Received Resend webhook:', JSON.stringify(payload));

    const eventType = payload.type;
    const contactEmail = payload.data?.email;

    if (!contactEmail) {
      console.log('No email in webhook payload');
      return Response.json({ success: true });
    }

    // Handle contact deletion/unsubscription
    if (eventType === 'contact.deleted' || eventType === 'contact.unsubscribed') {
      console.log(`Contact ${eventType}: ${contactEmail}`);

      // Find user by email
      const users = await base44.asServiceRole.entities.User.filter({ email: contactEmail });
      
      if (users.length === 0) {
        console.log(`User ${contactEmail} not found in Base44`);
        return Response.json({ success: true });
      }

      const user = users[0];

      // Delete the user from Base44
      await base44.asServiceRole.entities.User.delete(user.id);
      console.log(`Successfully deleted user ${contactEmail} from Base44`);
      
      return Response.json({ 
        success: true, 
        message: 'User deleted from Base44',
        email: contactEmail 
      });
    }

    return Response.json({ success: true, message: 'Event ignored' });

  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});