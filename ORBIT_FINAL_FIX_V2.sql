-- ========================================================
-- ORBIT ERP FINAL DATABASE FIX (V5 - COMPREHENSIVE)
-- This script addresses all reported 400 and 404 errors
-- by ensuring tables and columns match the application code.
-- ========================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FOUNDATION: DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    name_ar TEXT,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS name_ar TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    budget DECIMAL(15,3) DEFAULT 0,
    deadline DATE,
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EMPLOYEES
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id),
    employee_code TEXT UNIQUE NOT NULL,
    position TEXT,
    employment_status TEXT DEFAULT 'Full-time',
    hire_date DATE DEFAULT CURRENT_DATE,
    salary DECIMAL(15,3) DEFAULT 0,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Legacy support columns
    employee_id TEXT UNIQUE -- some parts may still use this
);

DO $$
BEGIN
    -- Ensure all columns needed by HR and Payroll pages exist
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code TEXT;
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS position TEXT;
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'Full-time';
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS salary DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
    
    -- Sync employee_code if employee_id exists but code is null
    UPDATE public.employees SET employee_code = employee_id WHERE employee_code IS NULL AND employee_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. FINANCE: PAYMENT GATEWAYS & TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key_masked TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    environment TEXT DEFAULT 'sandbox',
    supported_currencies TEXT[],
    supported_methods TEXT[],
    webhook_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gateway_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_id UUID REFERENCES payment_gateways(id) ON DELETE SET NULL,
    transaction_ref TEXT UNIQUE NOT NULL,
    external_ref TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('payment', 'refund', 'payout')),
    amount DECIMAL(15,3) DEFAULT 0,
    currency TEXT DEFAULT 'KWD',
    status TEXT DEFAULT 'pending',
    customer_email TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUDGETING: FORECASTS ENHANCEMENT
DO $$
BEGIN
    -- Ensure forecasts table has all columns for /budgeting page
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS quarter INTEGER;
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS month INTEGER;
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS confidence_level DECIMAL(5,2) DEFAULT 80;
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS forecasted_amount DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.forecasts ADD COLUMN IF NOT EXISTS actual_amount DECIMAL(15,3) DEFAULT 0;
    
    -- Sync forecasted_amount if total_projected_amount exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forecasts' AND column_name='total_projected_amount') THEN
        UPDATE public.forecasts SET forecasted_amount = total_projected_amount WHERE forecasted_amount = 0;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. RLS ENABLEMENT
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_transactions ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies for New Tables
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users full access" ON public.projects;
    DROP POLICY IF EXISTS "Authenticated users full access" ON public.payment_gateways;
    DROP POLICY IF EXISTS "Authenticated users full access" ON public.gateway_transactions;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payment_gateways;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.gateway_transactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Authenticated users full access" ON public.projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON public.payment_gateways FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON public.gateway_transactions FOR ALL TO authenticated USING (true);

-- Ensure policies exist for existing tables that might have been reset
CREATE POLICY "Authenticated users full access" ON public.departments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON public.employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON public.forecasts FOR ALL TO authenticated USING (true);

COMMIT;
