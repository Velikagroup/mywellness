import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIKTOK_ACCESS_TOKEN = Deno.env.get('TIKTOK_ACCESS_TOKEN');

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user info from TikTok API
        const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,bio_description,avatar_url,follower_count,following_count,likes_count,video_count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userInfoResponse.ok) {
            const errorText = await userInfoResponse.text();
            console.error('TikTok API error:', errorText);
            return Response.json({ 
                error: 'Failed to fetch TikTok stats',
                details: errorText 
            }, { status: userInfoResponse.status });
        }

        const data = await userInfoResponse.json();

        return Response.json({
            success: true,
            stats: data.data?.user || data.data
        });

    } catch (error) {
        console.error('Error fetching TikTok stats:', error);
        return Response.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
});