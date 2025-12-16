import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHash } from 'node:crypto';

const TIKTOK_PIXEL_ID = 'D50ASNBC77UDC9ALLB2G';
const TIKTOK_API_ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

// Hash sensitive data for TikTok
function hashData(data) {
  if (!data) return null;
  return createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const payload = await req.json();
    console.log('📥 Received payload:', JSON.stringify(payload, null, 2));
    
    const {
      event,
      email,
      phone,
      external_id,
      user_agent,
      value,
      currency = 'EUR',
      content_id,
      content_type,
      content_name,
      url,
      ttclid,
      ttp,
      first_name,
      last_name,
      city,
      state,
      country,
      zip,
      test_event_code
    } = payload;

    // Extract IP from request headers
    const ip = req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               null;

    if (!event) {
      return Response.json({ error: 'Event name required' }, { status: 400 });
    }

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `${external_id || 'anonymous'}_${event}_${eventTime}`;

    // Build properties based on event type
    const properties = {
      currency: currency,
      value: value || null
    };

    // For Purchase events, TikTok requires "contents" array format
    if (event === 'Purchase' || event === 'CompletePayment') {
      properties.contents = [{
        content_id: content_id || 'default',
        content_type: content_type || 'product',
        content_name: content_name || 'Subscription'
      }];
    } else {
      // For other events, use flat structure
      properties.content_id = content_id || null;
      properties.content_type = content_type || null;
      properties.content_name = content_name || null;
    }

    const tiktokPayload = {
      pixel_code: TIKTOK_PIXEL_ID,
      event,
      event_time: eventTime,
      event_id: eventId,
      test_event_code: test_event_code || undefined,
      context: {
        user: {
          email: email ? hashData(email) : null,
          phone: phone ? hashData(phone) : null,
          external_id: external_id || null,
          ttclid: ttclid || null,
          ttp: ttp || null,
          first_name: first_name ? hashData(first_name) : null,
          last_name: last_name ? hashData(last_name) : null,
          city: city ? hashData(city) : null,
          state: state ? hashData(state) : null,
          country: country ? hashData(country) : null,
          zip_code: zip ? hashData(zip) : null
        },
        ad: {},
        page: {
          url: url || null
        },
        user_agent: user_agent || null,
        ip: ip || null
      },
      properties
    };

    // Remove null values
    Object.keys(tiktokPayload.context.user).forEach(key => {
      if (tiktokPayload.context.user[key] === null) {
        delete tiktokPayload.context.user[key];
      }
    });
    Object.keys(tiktokPayload.properties).forEach(key => {
      if (tiktokPayload.properties[key] === null) {
        delete tiktokPayload.properties[key];
      }
    });

    const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('TIKTOK_ACCESS_TOKEN not configured');
    }

    console.log('📤 Sending to TikTok:', JSON.stringify({ data: [tiktokPayload] }, null, 2));

    const response = await fetch(TIKTOK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken
      },
      body: JSON.stringify({ data: [tiktokPayload] })
    });

    const result = await response.json();
    
    console.log('📬 TikTok Response:', {
      status: response.status,
      ok: response.ok,
      result: JSON.stringify(result, null, 2)
    });
    
    if (!response.ok) {
      console.error('❌ TikTok API Error:', result);
      return Response.json({ 
        success: false, 
        error: result.message || 'TikTok API error',
        details: result,
        sentPayload: tiktokPayload
      }, { status: response.status });
    }

    console.log('✅ TikTok Event Sent:', event, eventId);
    return Response.json({ 
      success: true, 
      event_id: eventId,
      response: result,
      sentPayload: tiktokPayload
    });

  } catch (error) {
    console.error('TikTok Event Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});