-- =========================================================================================
-- ORBIT ERP - CRM MODULE UPGRADE (KANBAN & PIPELINE)
-- =========================================================================================

-- 1. Ensure the `leads` table exists and has necessary fields for Kanban
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number VARCHAR(50) UNIQUE,
    contact_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    source VARCHAR(100) DEFAULT 'Website',
    status VARCHAR(50) DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'
    priority VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    estimated_value DECIMAL(15,3) DEFAULT 0,
    expected_close_date DATE,
    industry VARCHAR(100),
    notes TEXT,
    converted_to_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure `opportunities` table exists and has necessary fields for Kanban
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    stage VARCHAR(50) DEFAULT 'Prospecting', -- 'Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost'
    probability INT DEFAULT 10,
    amount DECIMAL(15,3) DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(100),
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure `campaigns` table exists
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Email',
    status VARCHAR(50) DEFAULT 'Planning', -- 'Planning', 'Active', 'Completed', 'Cancelled'
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,3) DEFAULT 0,
    actual_cost DECIMAL(15,3) DEFAULT 0,
    expected_revenue DECIMAL(15,3) DEFAULT 0,
    actual_revenue DECIMAL(15,3) DEFAULT 0,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In older setups, `uuid_generate_v4()` might need `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

-- 4. Ensure `crm_activities` table exists for call logs and follow-ups
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'Call', -- 'Call', 'Email', 'Meeting', 'Note', 'Task'
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Completed', 'Cancelled'
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- 6. Add universal RLS policies (for brevity and simplicity during development)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.leads;
CREATE POLICY "Enable read access for all authenticated users" ON public.leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.leads;
CREATE POLICY "Enable insert access for all authenticated users" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.leads;
CREATE POLICY "Enable update access for all authenticated users" ON public.leads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.leads;
CREATE POLICY "Enable delete access for all authenticated users" ON public.leads FOR DELETE TO authenticated USING (true);


DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.opportunities;
CREATE POLICY "Enable read access for all authenticated users" ON public.opportunities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.opportunities;
CREATE POLICY "Enable insert access for all authenticated users" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.opportunities;
CREATE POLICY "Enable update access for all authenticated users" ON public.opportunities FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.opportunities;
CREATE POLICY "Enable delete access for all authenticated users" ON public.opportunities FOR DELETE TO authenticated USING (true);


DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.campaigns;
CREATE POLICY "Enable read access for all authenticated users" ON public.campaigns FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.campaigns;
CREATE POLICY "Enable insert access for all authenticated users" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.campaigns;
CREATE POLICY "Enable update access for all authenticated users" ON public.campaigns FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.campaigns;
CREATE POLICY "Enable delete access for all authenticated users" ON public.campaigns FOR DELETE TO authenticated USING (true);


DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.crm_activities;
CREATE POLICY "Enable read access for all authenticated users" ON public.crm_activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON public.crm_activities;
CREATE POLICY "Enable insert access for all authenticated users" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON public.crm_activities;
CREATE POLICY "Enable update access for all authenticated users" ON public.crm_activities FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON public.crm_activities;
CREATE POLICY "Enable delete access for all authenticated users" ON public.crm_activities FOR DELETE TO authenticated USING (true);
