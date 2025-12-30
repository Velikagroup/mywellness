Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Rispondi solo se il path è esattamente /googleb7182768ce8e527a.html
  if (url.pathname === '/googleb7182768ce8e527a.html') {
    return new Response('google-site-verification: googleb7182768ce8e527a.html', {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
  
  return new Response('Not Found', { status: 404 });
});