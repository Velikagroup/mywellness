import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verifica che l'utente sia autenticato e admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usa asServiceRole per recuperare tutti gli utenti
    const allUsers = await base44.asServiceRole.entities.User.filter({});
    
    return Response.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});