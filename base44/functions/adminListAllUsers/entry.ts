import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica che l'utente sia autenticato e admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.custom_role !== 'customer_support')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Legge parametri di paginazione
    let body = {};
    try { body = await req.json(); } catch {}
    const limit = body.limit || 200;
    const skip = body.skip || 0;

    // Recupera utenti con paginazione per evitare timeout
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    
    return Response.json({ users: allUsers, total: allUsers.length, skip, limit });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});