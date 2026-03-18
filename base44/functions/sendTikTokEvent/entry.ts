import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHash } from 'node:crypto';

const TIKTOK_API_ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

// PIXEL CONFIGURATION PER PRODOTTO
const PIXEL_CONFIG = {
  trial: {
    pixel_id: 'D50ASNBC77UDC9ALLB2G', // Trial Setup pixel (storico)
    access_token_key: 'TIKTOK_ACCESS_TOKEN',
    test_code_key: 'TIKTOK_TRIAL_TEST_CODE'
  },
  landing: {
    pixel_id: Deno.env.get('TIKTOK_CHECKOUT_PIXEL_ID') || null,
    access_token_key: 'TIKTOK_CHECKOUT_ACCESS_TOKEN',
    test_code_key: 'TIKTOK_CHECKOUT_TEST_CODE'
  }
};

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
      product = 'trial', // 'trial' o 'landing' - default trial per retrocompatibilità
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

    // Seleziona configurazione pixel in base al prodotto
    const config = PIXEL_CONFIG[product];
    if (!config || !config.pixel_id) {
      return Response.json({ 
        success: false, 
        error: `Pixel TikTok non configurato per il prodotto: ${product}`,
        product: product
      }, { status: 200 });
    }

    console.log(`🎯 Using pixel for product: ${product} - Pixel ID: ${config.pixel_id}`);

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
    
    if (event === 'Purchase' || event === 'CompletePayment') {
      // Purchase requires ONLY contents, value, currency - no flat fields
      properties.contents = [{
        content_id: content_id || 'mywellness_subscription',
        content_type: content_type || 'product',
        content_name: content_name || 'MyWellness Subscription',
        quantity: 1,
        price: value ? parseFloat(value) : 0
      }];
      properties.value = value ? parseFloat(value) : 0;
      properties.currency = currency || 'EUR';
    } else {
      // Other events use flat structure
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

    // Build event data in TikTok format (user at top level, not in context)
    const eventData = {
      event,
      event_time: eventTime,
      event_id: eventId,
      user: userObj,
      properties
    };

    if (user_agent) eventData.user_agent = user_agent;
    if (ip) eventData.ip = ip;
    if (url) eventData.page = { url };

    // Main payload with event_source_id specifico del prodotto
    const tiktokPayload = {
      event_source_id: config.pixel_id, // Pixel specifico del prodotto
      event_source: "web",
      data: [eventData]
    };

    // Add test_event_code - usa il test code specifico del prodotto se disponibile
    const testCode = test_event_code || Deno.env.get(config.test_code_key);
    if (testCode) {
      tiktokPayload.test_event_code = testCode;
    }

    // Access token specifico del prodotto
    const accessToken = Deno.env.get(config.access_token_key);
    if (!accessToken) {
      throw new Error(`Access token not configured for product ${product} (${config.access_token_key})`);
    }

    console.log('📤 Sending to TikTok:', JSON.stringify(tiktokPayload, null, 2));

    const response = await fetch(TIKTOK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken
      },
      body: JSON.stringify(tiktokPayload)
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
      }, { status: 200 }); // ⚠️ SEMPRE 200 per vedere i dettagli nel frontend
    }

    console.log('✅ TikTok Event Sent:', event, eventId, 'Product:', product);
    return Response.json({ 
      success: true, 
      event_id: eventId,
      product: product,
      pixel_id: config.pixel_id,
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