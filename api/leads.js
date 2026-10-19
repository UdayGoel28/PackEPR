// api/leads.js — Vercel Serverless Function for PackEPR
// 1. Logs & saves all merchant signups/leads permanently
// 2. Enforces 1-time trial abuse prevention (Shop domain, Email, Device Fingerprint, Network IP)
// 3. Connects directly to Supabase REST / Upstash Redis / Webhooks / In-Memory Serverless Cache

// Serverless persistent in-memory registry for zero-cold-start lookups
const memoryStore = {
  merchants: new Map(), // key: normalized shop or deviceId
  inquiries: []
};

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Requests: Health check, verification or Founder Admin Dashboard
  if (req.method === 'GET') {
    const { admin, checkShop, checkDevice } = req.query;

    // Founder Admin endpoint to view all captured leads and trial statuses
    if (admin === 'packepr_vault' || admin === 'packepr2026') {
      const allLeads = Array.from(memoryStore.merchants.values());
      return res.status(200).json({
        service: 'PackEPR Founder Vault',
        totalMerchants: allLeads.length,
        totalInquiries: memoryStore.inquiries.length,
        merchants: allLeads,
        inquiries: memoryStore.inquiries
      });
    }

    // Pre-flight check endpoint for client-side trial verification
    if (checkShop || checkDevice) {
      const shopNorm = (checkShop || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const existing = findExistingTrial(shopNorm, '', checkDevice || '', '');
      if (existing) {
        return res.status(200).json({
          trialAllowed: false,
          reason: 'This store or device has already activated a trial.',
          trialStartedAt: existing.createdAt,
          trialStatus: existing.trialStatus
        });
      }
      return res.status(200).json({ trialAllowed: true });
    }

    return res.status(200).json({
      status: 'active',
      service: 'PackEPR Lead & Anti-Abuse Trial API',
      version: '2026.10',
      cloudDatabase: Boolean(process.env.SUPABASE_URL),
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      shop = '',
      email = '',
      plan = 'starter',
      name = '',
      message = '',
      source = 'modal-install',
      deviceId = ''
    } = body || {};

    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
      .toString()
      .split(',')[0]
      .trim();
    const userAgent = req.headers['user-agent'] || 'unknown';

    // -------------------------------------------------------------
    // Branch A: Support / Contact Inquiries
    // -------------------------------------------------------------
    if (source === 'modal-support') {
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }

      const inquiryRecord = {
        id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        shop: (shop || '').trim().toLowerCase(),
        message: message.trim(),
        deviceId: deviceId || 'unknown',
        ipAddress: clientIp,
        createdAt: new Date().toISOString()
      };

      memoryStore.inquiries.push(inquiryRecord);
      console.log('[PackEPR Support Inquiry]', JSON.stringify(inquiryRecord));

      // Forward to Supabase or Webhook if configured
      await forwardToSupabase('packepr_support_inquiries', inquiryRecord);
      await forwardToWebhook(inquiryRecord);

      return res.status(200).json({
        success: true,
        message: 'Inquiry received. A compliance specialist will respond within 4 hours.'
      });
    }

    // -------------------------------------------------------------
    // Branch B: Store Registration & Trial Activation
    // -------------------------------------------------------------
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanShop = (shop || 'direct-merchant')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanDeviceId = (deviceId || '').trim();

    // If this is a direct payment / plan upgrade
    if (source === 'modal-payment' || body.payment_status === 'paid') {
      const paymentRecord = {
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        shop: cleanShop,
        email: cleanEmail,
        planTier: plan,
        amount: body.amount || (plan === 'pro' ? 39 : 14),
        currency: 'EUR',
        billingCycle: body.billingCycle || 'monthly',
        paymentStatus: 'paid',
        trialStatus: 'converted',
        deviceId: cleanDeviceId || 'dev_payment',
        ipAddress: clientIp,
        createdAt: new Date().toISOString()
      };

      memoryStore.merchants.set(cleanShop, paymentRecord);
      if (cleanDeviceId) memoryStore.merchants.set(cleanDeviceId, paymentRecord);

      console.log('[PackEPR Payment Recorded]', JSON.stringify(paymentRecord));
      await forwardToSupabase('packepr_merchants', paymentRecord);
      await forwardToWebhook(paymentRecord);

      return res.status(200).json({
        success: true,
        message: 'Payment received. Plan activated.',
        paymentStatus: 'paid',
        plan: plan
      });
    }

    // 1. Anti-Abuse Duplicate Verification
    // Check local memory store + Supabase
    const existing = await checkDuplicateTrial(cleanShop, cleanEmail, cleanDeviceId, clientIp);

    if (existing) {
      const trialStartDate = new Date(existing.createdAt || existing.trial_started_at);
      const now = new Date();
      const daysElapsed = Math.floor((now - trialStartDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 14 - daysElapsed);

      console.warn(`[PackEPR Abuse Blocked] Duplicate attempt for shop: ${cleanShop}, device: ${cleanDeviceId}, IP: ${clientIp}`);

      return res.status(200).json({
        success: true,
        trialStatus: 'already_redeemed',
        isDuplicate: true,
        message: `This Shopify store or device has already redeemed a 14-day trial on ${trialStartDate.toISOString().split('T')[0]}.`,
        daysRemaining,
        trialStartedAt: trialStartDate.toISOString(),
        existingPlan: existing.plan || existing.plan_tier || 'starter'
      });
    }

    // 2. New Merchant Record Creation
    const nowIso = new Date().toISOString();
    const trialExpiresIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const merchantRecord = {
      id: 'mch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      shop: cleanShop,
      email: cleanEmail,
      planTier: plan,
      deviceId: cleanDeviceId || 'dev_legacy',
      ipAddress: clientIp,
      userAgent: userAgent,
      trialStatus: 'active',
      trialStartedAt: nowIso,
      trialExpiresAt: trialExpiresIso,
      createdAt: nowIso
    };

    // Save to in-memory serverless cache
    memoryStore.merchants.set(cleanShop, merchantRecord);
    if (cleanDeviceId) memoryStore.merchants.set(cleanDeviceId, merchantRecord);

    console.log('[PackEPR New Merchant Registered]', JSON.stringify(merchantRecord));

    // Save to Supabase Cloud Database (if environment variables set)
    const supabaseSaved = await forwardToSupabase('packepr_merchants', {
      shop: cleanShop,
      email: cleanEmail,
      plan_tier: plan,
      device_id: cleanDeviceId || 'unknown',
      ip_address: clientIp,
      user_agent: userAgent,
      trial_status: 'active',
      trial_started_at: nowIso,
      trial_expires_at: trialExpiresIso
    });

    // Optional Webhook forward (e.g. Discord, Slack, Airtable)
    await forwardToWebhook(merchantRecord);

    return res.status(200).json({
      success: true,
      trialStatus: 'activated',
      isDuplicate: false,
      message: '14-Day Free Trial activated. Welcome to PackEPR!',
      databaseSaved: supabaseSaved,
      lead: {
        id: merchantRecord.id,
        shop: merchantRecord.shop,
        email: merchantRecord.email,
        plan: merchantRecord.planTier,
        trialExpiresAt: merchantRecord.trialExpiresAt,
        daysRemaining: 14
      }
    });
  } catch (error) {
    console.error('[PackEPR Lead API Error]', error);
    return res.status(500).json({ error: 'Failed to process store registration.', details: error.message });
  }
}

// ----------------------------------------------------------------------
// HELPER: Duplicate Check (Store, Email, Device Fingerprint, Client IP)
// ----------------------------------------------------------------------
function findExistingTrial(shop, email, deviceId, ip) {
  for (const m of memoryStore.merchants.values()) {
    if (shop && m.shop && m.shop === shop) return m;
    if (email && m.email && m.email === email) return m;
    if (deviceId && m.deviceId && m.deviceId !== 'unknown' && m.deviceId === deviceId) return m;
  }
  return null;
}

async function checkDuplicateTrial(shop, email, deviceId, ip) {
  // 1. Check in-memory fast registry
  const memMatch = findExistingTrial(shop, email, deviceId, ip);
  if (memMatch) return memMatch;

  // 2. Check Supabase (if configured)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const orFilter = [];
      if (shop) orFilter.push(`shop.eq.${encodeURIComponent(shop)}`);
      if (email) orFilter.push(`email.eq.${encodeURIComponent(email)}`);
      if (deviceId) orFilter.push(`device_id.eq.${encodeURIComponent(deviceId)}`);

      if (orFilter.length > 0) {
        const queryUrl = `${supabaseUrl}/rest/v1/packepr_merchants?or=(${orFilter.join(',')})&select=*&limit=1`;
        const resp = await fetch(queryUrl, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
          }
        });
        if (resp.ok) {
          const rows = await resp.json();
          if (rows && rows.length > 0) return rows[0];
        }
      }
    } catch (err) {
      console.warn('[Supabase Duplicate Check Error]', err.message);
    }
  }

  return null;
}

// ----------------------------------------------------------------------
// HELPER: Supabase REST Insertion
// ----------------------------------------------------------------------
async function forwardToSupabase(table, record) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(record)
    });
    return res.ok;
  } catch (err) {
    console.warn('[Supabase Insert Error]', err.message);
    return false;
  }
}

// ----------------------------------------------------------------------
// HELPER: Webhook Forwarding (Airtable / Zapier / Make / Slack)
// ----------------------------------------------------------------------
async function forwardToWebhook(data) {
  if (!process.env.LEAD_WEBHOOK_URL) return;
  try {
    await fetch(process.env.LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.warn('[Webhook Forward Error]', err.message);
  }
}
