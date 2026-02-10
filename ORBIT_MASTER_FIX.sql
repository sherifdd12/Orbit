-- ========================================================
-- ORBIT ERP MASTER DATABASE FIX (V2)
-- This script fixes missing tables, columns, and naming
-- inconsistencies causing 404 and 400 errors.
-- ========================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FOUNDATION: SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure description column exists
DO $$
BEGIN
    ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('base_currency', 'KWD', 'Base currency for the system'),
    ('company_name', 'Orbit ERP', 'Registered company name'),
    ('fiscal_year_start', '01-01', 'Start of fiscal year (MM-DD)')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 3. INVENTORY & WAREHOUSING
-- Ensure items table has all expected columns
DO $$
BEGIN
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS cost DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS selling_price DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(15,3) DEFAULT 0;
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS uom TEXT; -- Link for consistency
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS avg_cost DECIMAL(15,3) DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create inventory_items VIEW for pages that expect it
CREATE OR REPLACE VIEW public.inventory_items AS 
SELECT 
    id, 
    name, 
    sku, 
    COALESCE(selling_price, price) as unit_price, 
    COALESCE(stock_quantity, 0) as quantity, 
    COALESCE(unit, uom, 'pcs') as unit,
    COALESCE(unit, uom, 'pcs') as uom,
    COALESCE(avg_cost, cost, 0) as avg_cost,
    category,
    is_active,
    created_at
FROM public.items;

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.warehouses (name, code)
VALUES ('Main Warehouse', 'WH01')
ON CONFLICT (code) DO NOTHING;

-- Stock Movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_number TEXT UNIQUE NOT NULL,
    movement_type TEXT CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    movement_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Completed', 'Cancelled')),
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    reference_type TEXT,
    reference_id UUID,
    reference_number TEXT,
    notes TEXT,
    items JSONB, -- Storing items as JSONB for simpler movement logs (per page logic)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SALES & PROCUREMENT
-- Sale Orders
CREATE TABLE IF NOT EXISTS public.sale_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    project_id UUID,
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status TEXT DEFAULT 'Quotation' CHECK (status IN ('Quotation', 'Confirmed', 'Delivered', 'Invoiced', 'Cancelled')),
    subtotal DECIMAL(15,3) DEFAULT 0,
    discount DECIMAL(15,3) DEFAULT 0,
    tax_rate DECIMAL(15,3) DEFAULT 0,
    tax_amount DECIMAL(15,3) DEFAULT 0,
    total DECIMAL(15,3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Order Items
CREATE TABLE IF NOT EXISTS public.sale_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_order_id UUID REFERENCES sale_orders(id) ON DELETE CASCADE,
    description TEXT,
    quantity DECIMAL(15,3) DEFAULT 1,
    unit TEXT,
    unit_price DECIMAL(15,3) DEFAULT 0,
    discount DECIMAL(15,3) DEFAULT 0,
    total DECIMAL(15,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FINANCE & BANKING
-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    currency TEXT DEFAULT 'KWD',
    current_balance DECIMAL(15,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID, -- For filtering in some versions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Reconciliations
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    statement_date DATE NOT NULL,
    statement_ending_balance DECIMAL(15,3) DEFAULT 0,
    book_balance DECIMAL(15,3) DEFAULT 0,
    reconciled_balance DECIMAL(15,3) DEFAULT 0,
    difference DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'InProgress', 'Completed', 'Discrepancy')),
    notes TEXT,
    user_id UUID,
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Statement Lines
CREATE TABLE IF NOT EXISTS public.bank_statement_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference TEXT,
    debit_amount DECIMAL(15,3) DEFAULT 0,
    credit_amount DECIMAL(15,3) DEFAULT 0,
    transaction_type TEXT,
    is_matched BOOLEAN DEFAULT false,
    matched_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BUDGETING & FORECASTING
-- Ensure fiscal_years table exists
CREATE TABLE IF NOT EXISTS public.fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'Active'
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_code TEXT UNIQUE NOT NULL,
    name TEXT,
    fiscal_year INTEGER NOT NULL,
    department_id UUID,
    total_amount DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    period_type TEXT DEFAULT 'Annual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Lines
CREATE TABLE IF NOT EXISTS public.budget_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    category TEXT,
    description TEXT,
    budgeted_amount DECIMAL(15,3) DEFAULT 0,
    planned_amount DECIMAL(15,3) DEFAULT 0,
    actual_amount DECIMAL(15,3) DEFAULT 0,
    variance DECIMAL(15,3),
    variance_percentage DECIMAL(15,3),
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecasts
CREATE TABLE IF NOT EXISTS public.forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    forecast_type TEXT NOT NULL,
    status TEXT DEFAULT 'Draft',
    total_projected_amount DECIMAL(15,3) DEFAULT 0,
    actual_amount DECIMAL(15,3) DEFAULT 0,
    variance DECIMAL(15,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMPLOYEES (Dashboard Summary expects this)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    department_id UUID REFERENCES departments(id),
    job_title TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RLS & PERMISSIONS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users full access" ON system_settings;
    DROP POLICY IF EXISTS "Authenticated users full access" ON warehouses;
    DROP POLICY IF EXISTS "Authenticated users full access" ON stock_movements;
    DROP POLICY IF EXISTS "Authenticated users full access" ON sale_orders;
    DROP POLICY IF EXISTS "Authenticated users full access" ON sale_order_items;
    DROP POLICY IF EXISTS "Authenticated users full access" ON bank_accounts;
    DROP POLICY IF EXISTS "Authenticated users full access" ON bank_reconciliations;
    DROP POLICY IF EXISTS "Authenticated users full access" ON bank_statement_lines;
    DROP POLICY IF EXISTS "Authenticated users full access" ON budgets;
    DROP POLICY IF EXISTS "Authenticated users full access" ON budget_lines;
    DROP POLICY IF EXISTS "Authenticated users full access" ON forecasts;
    DROP POLICY IF EXISTS "Authenticated users full access" ON departments;
    DROP POLICY IF EXISTS "Authenticated users full access" ON employees;
END $$;

CREATE POLICY "Authenticated users full access" ON system_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON warehouses FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON sale_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON sale_order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON bank_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON bank_reconciliations FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON bank_statement_lines FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON budgets FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON budget_lines FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON forecasts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON departments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access" ON employees FOR ALL TO authenticated USING (true);

COMMIT;
