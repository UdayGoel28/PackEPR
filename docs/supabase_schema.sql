-- ====================================================================
-- PackEPR — Supabase / PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ====================================================================

-- 1. Table: packepr_merchants (Lead Capture, Store Config & Trial Abuse Guard)
CREATE TABLE IF NOT EXISTS public.packepr_merchants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL UNIQUE,                     -- e.g. "nordic-atelier-de.myshopify.com"
  email TEXT NOT NULL,                           -- merchant email
  plan_tier TEXT DEFAULT 'starter',             -- 'free', 'starter', 'pro'
  device_id TEXT NOT NULL,                       -- hardware/canvas device fingerprint
  ip_address TEXT,                               -- client IP address
  user_agent TEXT,                               -- browser user agent
  trial_status TEXT DEFAULT 'active',            -- 'active', 'expired', 'converted', 'blocked'
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  exports_count INT DEFAULT 0,
  lucid_number TEXT DEFAULT '',
  dual_system_code TEXT DEFAULT 'INTERSEROH',
  citeo_idu TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance & Unique Constraint Indexes for Abuse Prevention
CREATE INDEX IF NOT EXISTS idx_packepr_merchants_shop ON public.packepr_merchants (lower(shop));
CREATE INDEX IF NOT EXISTS idx_packepr_merchants_email ON public.packepr_merchants (lower(email));
CREATE INDEX IF NOT EXISTS idx_packepr_merchants_device ON public.packepr_merchants (device_id);
CREATE INDEX IF NOT EXISTS idx_packepr_merchants_ip ON public.packepr_merchants (ip_address);

-- 3. Table: packepr_support_inquiries (Contact Support Inquiries)
CREATE TABLE IF NOT EXISTS public.packepr_support_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  shop TEXT,
  message TEXT NOT NULL,
  device_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) & Public API Access for Serverless
ALTER TABLE public.packepr_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packepr_support_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anon key to insert and select for trial verification
CREATE POLICY "Allow anon insert to packepr_merchants" 
  ON public.packepr_merchants FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select on packepr_merchants" 
  ON public.packepr_merchants FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert to packepr_support_inquiries" 
  ON public.packepr_support_inquiries FOR INSERT TO anon WITH CHECK (true);

-- Done! Tables ready for PackEPR Vercel Serverless integration.
