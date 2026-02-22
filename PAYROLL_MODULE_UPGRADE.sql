-- =========================================================================================
-- ORBIT ERP - PAYROLL ENGINE UPGRADE
-- =========================================================================================

-- 1. Create `payroll_runs` table (Batch of salaries for a specific month)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Approved', 'Paid'
    total_basic DECIMAL(15,3) DEFAULT 0,
    total_allowances DECIMAL(15,3) DEFAULT 0,
    total_deductions DECIMAL(15,3) DEFAULT 0,
    total_net_pay DECIMAL(15,3) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create `payroll_slips` table (Individual salary slip for an employee)
CREATE TABLE IF NOT EXISTS public.payroll_slips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    basic_salary DECIMAL(15,3) DEFAULT 0,
    working_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    total_allowances DECIMAL(15,3) DEFAULT 0,
    total_deductions DECIMAL(15,3) DEFAULT 0,
    net_pay DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Approved', 'Paid'
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer', -- 'Cash', 'Bank Transfer', 'Cheque'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create `slip_details` (Breakdown of allowances/deductions)
CREATE TABLE IF NOT EXISTS public.slip_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slip_id UUID REFERENCES public.payroll_slips(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'Allowance', 'Deduction'
    name VARCHAR(255) NOT NULL, -- e.g. 'Housing', 'Transportation', 'Absence Penalty'
    amount DECIMAL(15,3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slip_details ENABLE ROW LEVEL SECURITY;

-- 5. Universal RLS policies for rapid development
DROP POLICY IF EXISTS "Enable all access for all authenticated users" ON public.payroll_runs;
CREATE POLICY "Enable all access for all authenticated users" ON public.payroll_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all authenticated users" ON public.payroll_slips;
CREATE POLICY "Enable all access for all authenticated users" ON public.payroll_slips FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all authenticated users" ON public.slip_details;
CREATE POLICY "Enable all access for all authenticated users" ON public.slip_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
