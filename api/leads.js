// api/leads.js — Vercel Serverless Function for PackEPR Lead Persistence
// Handles install requests, waiting list, and support inquiries

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'PackEPR Lead & Store Registration API',
      version: '2026.10',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { shop, email, plan = 'starter', name = '', message = '', source = 'modal-install' } = body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanShop = (shop || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const leadRecord = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      shop: cleanShop || 'direct-merchant',
      email: email.trim().toLowerCase(),
      name: name.trim(),
      message: message.trim(),
      plan,
      source,
      userAgent: req.headers['user-agent'] || 'unknown',
      createdAt: new Date().toISOString()
    };

    // Structured server log for observability in Vercel runtime logs
    console.log('[PackEPR Lead Captured]', JSON.stringify(leadRecord));

    // Optional webhook forwarding (e.g., to Slack, Discord, Supabase, or Formspree if env configured)
    if (process.env.LEAD_WEBHOOK_URL) {
      try {
        await fetch(process.env.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadRecord)
        });
      } catch (err) {
        console.warn('[PackEPR Webhook Forward Error]', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Store registration logged successfully. Our compliance team will review your shop.',
      lead: {
        id: leadRecord.id,
        shop: leadRecord.shop,
        email: leadRecord.email,
        plan: leadRecord.plan,
        createdAt: leadRecord.createdAt
      }
    });
  } catch (error) {
    console.error('[PackEPR Lead API Error]', error);
    return res.status(500).json({ error: 'Failed to process lead registration.', details: error.message });
  }
}
