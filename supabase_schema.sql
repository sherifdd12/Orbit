-- Orbit ERP: Foundation Database Schema
-- Generic ERP structure for Trading, Contracting, and Service Providers

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Users & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('Admin', 'Manager', 'Accountant', 'Employee')) DEFAULT 'Employee',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ITEMS (Universal Inventory Master)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    description TEXT,
    uom TEXT DEFAULT 'pcs', -- Unit of Measure
    purchase_price DECIMAL(12,2) DEFAULT 0.00,
    selling_price DECIMAL(12,2) DEFAULT 0.00,
    stock_quantity DECIMAL(12,2) DEFAULT 0.00,
    avg_cost DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROJECTS (Jobs/Projects)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')) DEFAULT 'Planning',
    budget DECIMAL(12,2) DEFAULT 0.00,
    start_date DATE,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS (Project Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('To Do', 'In Progress', 'Done', 'Blocked')) DEFAULT 'To Do',
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. FINANCE RECORDS (Simplified Accounting)
CREATE TABLE IF NOT EXISTS public.finance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT CHECK (type IN ('Income', 'Expense')) NOT NULL,
    category TEXT, -- e.g., 'Sales', 'Rent', 'Materials', 'Salary'
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. INVENTORY LOGS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    qty_change DECIMAL(12,2) NOT NULL,
    type TEXT CHECK (type IN ('In', 'Out', 'Adjustment', 'Transfer')) NOT NULL,
    reference_id UUID, -- Can link to invoice/project/etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Items are viewable by authenticated users" ON public.items;
DROP POLICY IF EXISTS "Admin/Manager can manage items" ON public.items;
DROP POLICY IF EXISTS "Projects viewable by authenticated" ON public.projects;
DROP POLICY IF EXISTS "Project management" ON public.projects;
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Tasks management" ON public.tasks;
DROP POLICY IF EXISTS "Finance viewable by Admin and Accountant" ON public.finance_records;
DROP POLICY IF EXISTS "Finance record management" ON public.finance_records;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Items: Admin/Manager can write, all can read
CREATE POLICY "Items are viewable by authenticated users" ON public.items
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin/Manager can manage items" ON public.items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
    );

-- Projects: Similar logic
CREATE POLICY "Projects viewable by authenticated" ON public.projects
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Project management" ON public.projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
    );

-- Tasks: Assignees and Managers
CREATE POLICY "Tasks viewable by authenticated" ON public.tasks
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tasks management" ON public.tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
        OR assignee_id = auth.uid()
    );

-- Finance: Admin and Accountant
CREATE POLICY "Finance viewable by Admin and Accountant" ON public.finance_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Accountant'))
    );
CREATE POLICY "Finance record management" ON public.finance_records
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Accountant'))
    );


-- AUTOMATION: HANDLE NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'Employee' -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger security
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
