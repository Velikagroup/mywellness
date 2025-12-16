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

    // Build user object with only non-null values
    const userObj = {};
    if (email) userObj.email = hashData(email);
    if (phone) userObj.phone = hashData(phone);
    if (external_id) userObj.external_id = external_id;
    if (ttclid) userObj.ttclid = ttclid;
    if (ttp) userObj.ttp = ttp;
    if (first_name) userObj.first_name = hashData(first_name);
    if (last_name) userObj.last_name = hashData(last_name);
    if (city) userObj.city = hashData(city);
    if (state) userObj.state = hashData(state);
    if (country) userObj.country = hashData(country);
    if (zip) userObj.zip_code = hashData(zip);

    // Build page object
    const pageObj = {};
    if (url) pageObj.url = url;

    // Build properties based on event type
    const properties = {};
    
    // For Purchase events, TikTok has specific requirements
    if (event === 'Purchase' || event === 'CompletePayment') {
      // Required fields for Purchase
      properties.contents = [{
        content_id: content_id || 'mywellness_subscription',
        content_name: content_name || 'MyWellness Subscription',
        quantity: 1,
        price: value ? parseFloat(value) : 0
      }];
      properties.value = value ? parseFloat(value) : 0;
      properties.currency = currency || 'EUR';
    } else {
      // For other events, use standard structure
      if (value !== undefined && value !== null) properties.value = parseFloat(value);
      if (currency) properties.currency = currency;
      if (content_id) properties.content_id = content_id;
      if (content_type) properties.content_type = content_type;
      if (content_name) properties.content_name = content_name;
    }

    // Build context object
    const contextObj = {
      user: userObj,
      ad: {},
      page: pageObj
    };
    if (user_agent) contextObj.user_agent = user_agent;
    if (ip) contextObj.ip = ip;

    // Build base payload
    const tiktokPayload = {
      pixel_code: TIKTOK_PIXEL_ID,
      event,
      event_time: eventTime,
      event_id: eventId,
      context: contextObj,
      properties
    };

    // Only add test_event_code if provided
    if (test_event_code) {
      tiktokPayload.test_event_code = test_event_code;
    }

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