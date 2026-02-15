-- ========================================================
-- ULTIMATE ORBIT ERP MASTER FIX (EXHAUSTIVE & NUCLEAR)
-- This script FORCIBLY aligns the database with the application code.
-- It fixes the "record_id" UUID vs TEXT issue and ensures all tables exist.
-- ========================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AUDIT LOGS FIX (Fixing the TEXT vs UUID issue)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL, 
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Forcing record_id to be TEXT and module to be NULLABLE if they exist
DO $$
BEGIN
    -- Fix record_id
    BEGIN
        ALTER TABLE public.audit_logs ALTER COLUMN record_id TYPE TEXT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Fix module column constraint (The cause of "null value in column module violates not-null constraint")
    BEGIN
        ALTER TABLE public.audit_logs ALTER COLUMN module DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Safety: Ensure other common columns are nullable if they exist
    BEGIN
        ALTER TABLE public.audit_logs ALTER COLUMN ip_address DROP NOT NULL;
        ALTER TABLE public.audit_logs ALTER COLUMN user_agent DROP NOT NULL;
        ALTER TABLE public.audit_logs ALTER COLUMN changed_fields DROP NOT NULL;
        ALTER TABLE public.audit_logs ALTER COLUMN changed_fields SET DEFAULT ARRAY[]::TEXT[];
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- 3. PROFILES SYSTEM
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'Employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. CRM & SALES TABLES
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    balance DECIMAL(15,3) DEFAULT 0,
    customer_type TEXT DEFAULT 'Company',
    credit_limit DECIMAL(15,3) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    estimated_value DECIMAL(15,3) DEFAULT 0,
    expected_close_date DATE,
    industry TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_number TEXT UNIQUE,
    name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    stage TEXT DEFAULT 'Prospecting',
    probability INTEGER DEFAULT 10,
    amount DECIMAL(15,3) DEFAULT 0,
    expected_close_date DATE,
    source TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Email',
    status TEXT DEFAULT 'Planning',
    budget DECIMAL(15,3) DEFAULT 0,
    actual_cost DECIMAL(15,3) DEFAULT 0,
    expected_revenue DECIMAL(15,3) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensuring CRM columns exist (for existing tables)
DO $$
BEGIN
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mobile TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website';
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;
    
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 10;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS source TEXT;
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS notes TEXT;
    
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Email';
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
    ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. INVENTORY & WAREHOUSING
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    balance DECIMAL(15,3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    location TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    uom TEXT DEFAULT 'pcs',
    stock_quantity DECIMAL(15,3) DEFAULT 0,
    sale_price DECIMAL(15,3) DEFAULT 0,
    purchase_price DECIMAL(15,3) DEFAULT 0,
    avg_cost DECIMAL(15,3) DEFAULT 0,
    warehouse_id UUID REFERENCES public.warehouses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FINANCE & ORDERS
CREATE TABLE IF NOT EXISTS public.sale_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    status TEXT DEFAULT 'Draft',
    total DECIMAL(15,3) DEFAULT 0,
    order_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.sale_orders(id),
    customer_id UUID REFERENCES public.customers(id),
    status TEXT DEFAULT 'Unpaid',
    total DECIMAL(15,3) DEFAULT 0,
    amount_paid DECIMAL(15,3) DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.finance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    category TEXT,
    amount DECIMAL(15,3) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PROJECTS & HR
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    budget DECIMAL(15,3) DEFAULT 0,
    deadline DATE,
    customer_id UUID REFERENCES public.customers(id),
    client_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    name_ar TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) UNIQUE,
    employee_code TEXT UNIQUE,
    position TEXT,
    employment_status TEXT DEFAULT 'Full-time',
    hire_date DATE,
    salary DECIMAL(15,3) DEFAULT 0,
    department_id UUID REFERENCES public.departments(id),
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. EMAIL SYSTEM
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. AUDIT TRIGGER FUNCTION (Fixed for TEXT record_id)
CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_user_id UUID;
BEGIN
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'UPDATE') THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
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

-- 10. APPLY TRIGGERS TO ALL TABLES
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename NOT IN ('audit_logs', 'system_settings') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_%I ON public.%I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER tr_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.proc_audit_log()', tbl, tbl);
    END LOOP;
END $$;

-- 11. RLS NUCLEAR RESET & POLICIES
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users full access" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Authenticated users full access" ON public.%I FOR ALL TO authenticated USING (true)', tbl);
    END LOOP;
END $$;

-- 12. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('base_currency', 'KWD', 'Base currency'),
    ('company_name', 'Orbit ERP', 'Company Name')
ON CONFLICT (key) DO NOTHING;

COMMIT;
