import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Tracks coupon usage at different stages:
 * - stage: 'quiz_entered' → user entered the code in the quiz
 * - stage: 'trial_started' → user started a free trial
 * - stage: 'purchased' → user made a paid purchase
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { coupon_code, stage } = await req.json();

        if (!coupon_code || !stage) {
            return Response.json({ error: 'coupon_code e stage sono obbligatori' }, { status: 400 });
        }

        const upperCode = coupon_code.toUpperCase();

        // Find the coupon
        const coupons = await base44.asServiceRole.entities.Coupon.filter({
            code: upperCode,
            is_active: true
        });

        if (coupons.length === 0) {
            return Response.json({ success: false, error: 'Coupon non trovato' });
        }

        const coupon = coupons[0];
        const now = new Date().toISOString();

        // Build update payload based on stage
        const updateData = {};

        if (stage === 'quiz_entered') {
            // Track who entered the coupon in the quiz (don't mark as "used" yet)
            // Store email in notes if not already tracked, and a placeholder in used_by
            // We use a special prefix to know it's quiz-stage only
            if (!coupon.used_by || coupon.used_by.startsWith('quiz_')) {
                updateData.used_by = `quiz_${user.id}`;
                updateData.notes = (coupon.notes ? coupon.notes + '\n' : '') + `[quiz_entered] ${user.email} - ${now}`;
            }
        } else if (stage === 'trial_started') {
            // User started a trial with this coupon
            updateData.notes = (coupon.notes ? coupon.notes + '\n' : '') + `[trial_started] ${user.email} - ${now}`;
            // If was only quiz_entered before, keep used_by as quiz_ prefixed (trial is not a "purchase")
            if (!coupon.used_by || coupon.used_by.startsWith('quiz_')) {
                updateData.used_by = `trial_${user.id}`;
            }
        } else if (stage === 'purchased') {
            // Full purchase: mark as truly used
            updateData.used_by = user.id;
            updateData.used_at = now;
            updateData.notes = (coupon.notes ? coupon.notes + '\n' : '') + `[purchased] ${user.email} - ${now}`;
        }

        await base44.asServiceRole.entities.Coupon.update(coupon.id, updateData);

        // Also ensure user has coupon_applied set
        await base44.auth.updateMe({ coupon_applied: upperCode });

        console.log(`✅ Coupon ${upperCode} tracked: stage=${stage}, user=${user.email}`);

        return Response.json({ success: true, stage, coupon_code: upperCode });

    } catch (error) {
        console.error('Error tracking coupon usage:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});