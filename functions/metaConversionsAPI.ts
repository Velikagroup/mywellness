import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

/**
 * 📊 META CONVERSIONS API (Server-Side Events)
 * Sends conversion events to Facebook for improved tracking and attribution
 */

async function sha256Hash(text) {
  const msgUint8 = new TextEncoder().encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  console.log('📊 Meta Conversions API - Start');
  
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const {
      event_name,
      event_time,
      event_source_url,
      user_data = {},
      custom_data = {},
      action_source = 'website'
    } = body;

    if (!event_name) {
      return Response.json({ 
        success: false, 
        error: 'event_name is required' 
      }, { status: 400 });
    }

    const accessToken = Deno.env.get('META_CAPI_TOKEN');
    if (!accessToken) {
      throw new Error('META_CAPI_TOKEN not configured');
    }

    // Hash email if provided
    let hashedEmail = null;
    if (user_data.email) {
      hashedEmail = await sha256Hash(user_data.email);
    }

    // Build event data
    const eventData = {
      event_name: event_name,
      event_time: event_time || Math.floor(Date.now() / 1000),
      event_source_url: event_source_url || 'https://projectmywellness.com',
      action_source: action_source,
      user_data: {
        ...(hashedEmail && { em: hashedEmail }),
        ...(user_data.ip && { client_ip_address: user_data.ip }),
        ...(user_data.user_agent && { client_user_agent: user_data.user_agent }),
        ...(user_data.fbc && { fbc: user_data.fbc }),
        ...(user_data.fbp && { fbp: user_data.fbp }),
        ...(user_data.external_id && { external_id: user_data.external_id })
      },
      ...(Object.keys(custom_data).length > 0 && { custom_data: custom_data })
    };

    console.log('📤 Sending event to Meta CAPI:', event_name);

    // Send to Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/3810520152412779/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventData]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Meta CAPI error:', result);
      throw new Error(`Meta CAPI failed: ${JSON.stringify(result)}`);
    }

    console.log('✅ Meta CAPI event sent:', event_name, result);

    return Response.json({ 
      success: true,
      events_received: result.events_received || 1,
      fbtrace_id: result.fbtrace_id
    });

  } catch (error) {
    console.error('❌ Meta Conversions API error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});