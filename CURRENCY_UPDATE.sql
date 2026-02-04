-- SETTINGS AND CURRENCY UPDATES
-- Run this in your Supabase SQL Editor

-- 1. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Insert Default Currency
INSERT INTO public.system_settings (key, value)
VALUES ('base_currency', '"SAR"')
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 4. Basic Policy (Read for authenticated, Update for Admin role - keeping it simple for now)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.system_settings;
CREATE POLICY "Enable read access for authenticated users" ON public.system_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.system_settings;
CREATE POLICY "Enable update access for authenticated users" ON public.system_settings FOR UPDATE TO authenticated USING (true);
