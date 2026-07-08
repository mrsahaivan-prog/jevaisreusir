-- MZ+ Elite Landing Page Analytics SQL Schema
-- Copy and paste this script directly into your Supabase SQL Editor (https://supabase.com) and run it.

-- 1. Table for leads (prospects who completed the subscription modal form)
CREATE TABLE IF NOT EXISTS public.mz_leads (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    country VARCHAR(100),
    country_code VARCHAR(10),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for tracking page visits
CREATE TABLE IF NOT EXISTS public.mz_visits (
    id VARCHAR(255) PRIMARY KEY,
    visitor_id VARCHAR(255) NOT NULL,
    ip VARCHAR(100),
    path VARCHAR(255) DEFAULT '/',
    referrer VARCHAR(255) DEFAULT 'direct',
    country_code VARCHAR(10),
    country VARCHAR(100),
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
    user_agent TEXT,
    duration_seconds INT DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table for tracking checkout CTA clicks
CREATE TABLE IF NOT EXISTS public.mz_clicks (
    id VARCHAR(255) PRIMARY KEY,
    visitor_id VARCHAR(255),
    email VARCHAR(255) DEFAULT 'anonymous',
    phone VARCHAR(100) DEFAULT 'anonymous',
    source VARCHAR(255) DEFAULT 'sales_page',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table for tracking dynamic events (video play, progress, etc.)
CREATE TABLE IF NOT EXISTS public.mz_events (
    id VARCHAR(255) PRIMARY KEY,
    visitor_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'click_watch_video', 'play_video', 'video_progress', 'cta_join_mz_click'
    event_value NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXING for lightning-fast querying on the dashboard
CREATE INDEX IF NOT EXISTS idx_mz_visits_visitor_id ON public.mz_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_mz_visits_timestamp ON public.mz_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_mz_events_visitor_id ON public.mz_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_mz_events_event_type ON public.mz_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mz_leads_timestamp ON public.mz_leads(timestamp);
CREATE INDEX IF NOT EXISTS idx_mz_clicks_timestamp ON public.mz_clicks(timestamp);

-- Enable Row-Level Security (RLS) to secure your analytics data
ALTER TABLE public.mz_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mz_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mz_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mz_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent collision during setup
DROP POLICY IF EXISTS "Allow public inserts" ON public.mz_leads;
DROP POLICY IF EXISTS "Allow public inserts" ON public.mz_visits;
DROP POLICY IF EXISTS "Allow public inserts" ON public.mz_clicks;
DROP POLICY IF EXISTS "Allow public inserts" ON public.mz_events;

DROP POLICY IF EXISTS "Allow service_role full access" ON public.mz_leads;
DROP POLICY IF EXISTS "Allow service_role full access" ON public.mz_visits;
DROP POLICY IF EXISTS "Allow service_role full access" ON public.mz_clicks;
DROP POLICY IF EXISTS "Allow service_role full access" ON public.mz_events;

-- Create Public Insert policies so the landing page can log visits/clicks/events anonymously
CREATE POLICY "Allow public inserts" ON public.mz_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts" ON public.mz_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts" ON public.mz_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts" ON public.mz_events FOR INSERT WITH CHECK (true);

-- Create Admin Policies using service_role bypass for secure backend queries
CREATE POLICY "Allow service_role full access" ON public.mz_leads FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role full access" ON public.mz_visits FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role full access" ON public.mz_clicks FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role full access" ON public.mz_events FOR ALL TO service_role USING (true);
