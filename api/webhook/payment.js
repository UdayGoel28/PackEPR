// api/webhook/payment.js — Lemon Squeezy & Paddle Webhook Listener
// Automatically activates paid plan tiers and unlocks exports for paying merchants

import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'PackEPR Payment & Subscription Webhook Gateway',
      status: 'active',
      provider: 'Lemon Squeezy / Paddle (Merchant of Record)',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Optional: Signature Verification for Lemon Squeezy
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const signature = req.headers['x-signature'];

    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = hmac.update(rawBody).digest('hex');
      if (digest !== signature) {
        console.warn('[PackEPR Payment Webhook] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    // Extract Event Details
    const eventName = body.meta?.event_name || body.event_name || 'subscription_created';
    const customData = body.meta?.custom_data || body.data?.attributes?.first_order_item?.custom_data || {};
    const customerEmail = body.data?.attributes?.user_email || body.data?.attributes?.customer_email || customData.email || '';
    const shopDomain = customData.shop || customData.store || '';
    const planName = (body.data?.attributes?.product_name || body.data?.attributes?.order_number || 'Starter').toLowerCase();
    const planTier = planName.includes('pro') ? 'pro' : 'starter';

    const paymentRecord = {
      id: 'pay_' + Date.now(),
      event: eventName,
      shop: shopDomain ? shopDomain.toLowerCase().trim() : 'direct_checkout',
      email: customerEmail.toLowerCase().trim(),
      planTier,
      amount: body.data?.attributes?.total_formatted || '€14.00',
      currency: body.data?.attributes?.currency || 'EUR',
      status: 'active_subscription',
      paidAt: new Date().toISOString()
    };

    console.log('[PackEPR Payment Success Received!]', JSON.stringify(paymentRecord));

    // Update Supabase Database if connected
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && paymentRecord.shop) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/packepr_merchants?shop=eq.${encodeURIComponent(paymentRecord.shop)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            plan_tier: paymentRecord.planTier,
            trial_status: 'converted',
            updated_at: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('[Supabase Subscription Update Error]', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription logged and merchant plan upgraded successfully.',
      payment: paymentRecord
    });
  } catch (err) {
    console.error('[PackEPR Payment Webhook Error]', err);
    return res.status(500).json({ error: 'Failed to process payment webhook', details: err.message });
  }
}
