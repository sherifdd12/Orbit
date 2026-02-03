-- Orbit ERP: Migration Fix Script
-- Run this AFTER supabase_migration_complete.sql if you get column errors
-- This script safely adds missing columns to existing tables

BEGIN;

-- Fix warehouses table
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);

-- Fix projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_progress_check'
    ) THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_progress_check CHECK (progress >= 0 AND progress <= 100);
    END IF;
END $$;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);

-- Fix items table (if it exists without new columns)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS min_stock_level DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_type TEXT;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customers_customer_type_check'
    ) THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_customer_type_check 
            CHECK (customer_type IN ('Individual', 'Company'));
    END IF;
END $$;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS balance DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix invoices table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sale_order_id UUID REFERENCES public.sale_orders(id);
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0.00;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0.00;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0.00;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total DECIMAL(15,2) DEFAULT 0.00;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0.00;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
    END IF;
END $$;

COMMIT;
