-- Orbit ERP: System Settings & Metadata
-- Ensures global app state like currency and company info is persisted

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default base currency (KWD) if not exists
INSERT INTO public.system_settings (key, value)
VALUES ('base_currency', '"KWD"')
ON CONFLICT (key) DO NOTHING;

-- Insert default company name
INSERT INTO public.system_settings (key, value)
VALUES ('company_name', '"Orbit Foundation"')
ON CONFLICT (key) DO NOTHING;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
