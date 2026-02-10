-- FINAL PRODUCTION READINESS SCHEMA
-- Run this in Supabase SQL Editor to ensure all features work

-- 1. Create Documents Bucket
-- Note: This might need to be done in the Supabase UI if 'storage' extension isn't fully scriptable in your environment
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRM Tables (Missing in some versions)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number TEXT UNIQUE,
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    source TEXT DEFAULT 'Website',
    status TEXT DEFAULT 'New',
    priority TEXT DEFAULT 'Medium',
    estimated_value DECIMAL(15,3) DEFAULT 0.00,
    expected_close_date DATE,
    industry TEXT,
    notes TEXT,
    converted_to_customer_id UUID REFERENCES public.customers(id),
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_number TEXT UNIQUE,
    name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    lead_id UUID REFERENCES public.leads(id),
    stage TEXT DEFAULT 'Prospecting',
    probability INTEGER DEFAULT 10,
    amount DECIMAL(15,3) DEFAULT 0.00,
    expected_close_date DATE,
    actual_close_date DATE,
    source TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_code TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'Planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,3) DEFAULT 0.00,
    actual_cost DECIMAL(15,3) DEFAULT 0.00,
    expected_revenue DECIMAL(15,3) DEFAULT 0.00,
    actual_revenue DECIMAL(15,3) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 5. Standard Policies
CREATE POLICY "Enable all for authenticated users" ON public.audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.opportunities FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.campaigns FOR ALL TO authenticated USING (true);

-- 6. Storage Policies (for documents bucket)
-- Ensure these are run after creating the bucket
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- 7. Audit Logging Trigger Function
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_user_id UUID;
BEGIN
    -- Get current user ID (if available in session)
    v_user_id := auth.uid();

    IF (TG_OP = 'UPDATE') THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Calculate changed fields
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each_text(v_old_values)
        WHERE value IS DISTINCT FROM (v_new_values ->> key);
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_values := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_values := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        v_old_values,
        v_new_values,
        v_changed_fields,
        v_user_id
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Apply triggers to key tables
-- PROJECTS
DROP TRIGGER IF EXISTS tr_audit_projects ON public.projects;
CREATE TRIGGER tr_audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE PROCEDURE public.proc_audit_log();

-- CUSTOMERS
DROP TRIGGER IF EXISTS tr_audit_customers ON public.customers;
CREATE TRIGGER tr_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE PROCEDURE public.proc_audit_log();

-- ITEMS
DROP TRIGGER IF EXISTS tr_audit_items ON public.items;
CREATE TRIGGER tr_audit_items AFTER INSERT OR UPDATE OR DELETE ON public.items FOR EACH ROW EXECUTE PROCEDURE public.proc_audit_log();
