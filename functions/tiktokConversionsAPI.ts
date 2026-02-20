import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * TikTok Conversions API - Server-side event tracking
 * Pixel ID: D66VEQJC77U5P7UM15F0 (BLU ADV Corporate)
 */

Deno.serve(async (req) => {
    console.log('🎯 TikTok Conversions API - Start');

    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        const {
            event_name,
            user_data = {},
            custom_data = {}
        } = payload;

        if (!event_name) {
            return Response.json({ 
                success: false, 
                error: 'event_name is required' 
            }, { status: 400 });
        }

        const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
        const pixelId = 'D6C2I83C77UA95KIJQQ0';

        if (!accessToken) {
            console.error('❌ TIKTOK_ACCESS_TOKEN not configured');
            return Response.json({ 
                success: false, 
                error: 'TikTok access token not configured' 
            }, { status: 500 });
        }

        // Build TikTok event payload
        const eventData = {
            pixel_code: pixelId,
            event: event_name,
            timestamp: new Date().toISOString(),
            context: {
                user_agent: req.headers.get('user-agent') || 'MyWellness-Server',
                ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0'
            },
            properties: {
                ...custom_data,
                contents: [{
                    content_type: 'product',
                    content_id: custom_data.content_category || 'subscription',
                    content_name: event_name
                }]
            }
        };

        // Add user data if provided
        if (user_data.email) {
            eventData.context.user = {
                email: user_data.email,
                external_id: user_data.external_id
            };
        }

        console.log('📊 Sending TikTok event:', event_name);
        console.log('📋 Event data:', JSON.stringify(eventData, null, 2));

        // Send to TikTok Events API
        const tiktokResponse = await fetch(`https://business-api.tiktok.com/open_api/v1.3/event/track/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Token': accessToken
            },
            body: JSON.stringify({
                event_source: 'web',
                event_source_id: pixelId,
                data: [eventData]
            })
        });

        const responseData = await tiktokResponse.json();

        if (!tiktokResponse.ok) {
            console.error('❌ TikTok API error:', responseData);
            return Response.json({
                success: false,
                error: 'TikTok API request failed',
                details: responseData
            }, { status: tiktokResponse.status });
        }

        console.log('✅ TikTok event sent successfully');
        console.log('📊 Response:', responseData);

        return Response.json({
            success: true,
            event_name,
            tiktok_response: responseData
        });

    } catch (error) {
        console.error('❌ TikTok Conversions API error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});