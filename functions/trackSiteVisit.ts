import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Map paths to language
function detectLanguageFromPath(pathname) {
  const p = pathname.toLowerCase();
  
  // Language-prefixed paths like /it, /es, /en, /pt, /de, /fr
  const langPrefixes = ['it', 'en', 'es', 'pt', 'de', 'fr'];
  for (const lang of langPrefixes) {
    if (p === `/${lang}` || p.startsWith(`/${lang}/`)) return lang;
  }

  // Specific page patterns
  if (p.includes('itquiz') || p.includes('itpricing') || p.includes('itblog') || p.includes('itcheckout') || p.includes('itpostquiz')) return 'it';
  if (p.includes('enquiz') || p.includes('encheckout') || p.includes('enpostquiz') || p.includes('/blog') || p.includes('/pricing')) return 'en';
  if (p.includes('esquiz') || p.includes('espricing') || p.includes('esblog') || p.includes('escheckout') || p.includes('espostquiz')) return 'es';
  if (p.includes('ptquiz') || p.includes('ptpricing') || p.includes('ptblog') || p.includes('ptcheckout') || p.includes('ptpostquiz')) return 'pt';
  if (p.includes('dequiz') || p.includes('depricing') || p.includes('deblog') || p.includes('decheckout') || p.includes('deposquiz')) return 'de';
  if (p.includes('frquiz') || p.includes('frpricing') || p.includes('frblog') || p.includes('frcheckout') || p.includes('frpostquiz')) return 'fr';

  return 'unknown';
}

function categorizePageType(pathname) {
  const p = pathname.toLowerCase();
  if (p.includes('quiz')) return 'quiz';
  if (p.includes('pricing')) return 'pricing';
  if (p.includes('blog')) return 'blog';
  if (p.includes('checkout')) return 'checkout';
  if (p.includes('postquiz') || p.includes('subscription')) return 'subscription';
  if (p === '/it' || p === '/en' || p === '/es' || p === '/pt' || p === '/de' || p === '/fr' || p === '/' || p.includes('home') || p.includes('landing')) return 'homepage';
  return 'other';
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const { pathname, visitor_id } = body;

        if (!pathname) {
            return Response.json({ error: 'pathname is required' }, { status: 400 });
        }

        const language = detectLanguageFromPath(pathname);
        const page_type = categorizePageType(pathname);

        await base44.asServiceRole.entities.UserActivity.create({
            user_id: visitor_id || 'anonymous',
            event_type: 'pricing_visited', // reuse existing enum closest to "page view"
            event_data: { 
                language,
                page_type,
                pathname,
                event_category: 'site_visit'
            },
            completed: false
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error tracking site visit:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});