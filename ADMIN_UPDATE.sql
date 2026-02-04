-- ADMIN MODULE UPDATES
-- Run this in your Supabase SQL Editor to fix the Admin page issues

-- 1. Create Roles Table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Permissions Table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Role Permissions Join Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Update Profiles Table
DO $$ 
BEGIN 
    -- Add role_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
        ALTER TABLE public.profiles ADD COLUMN role_id UUID REFERENCES public.roles(id);
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 5. Seed Initial Roles
INSERT INTO public.roles (name, description, is_system)
VALUES 
    ('Admin', 'Full system access', true),
    ('Manager', 'Management access to modules', true),
    ('Staff', 'Standard operational access', true)
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Initial Permissions (Examples)
INSERT INTO public.permissions (code, name, module)
VALUES 
    ('sales_view', 'View Sales', 'sales'),
    ('sales_create', 'Create Sales', 'sales'),
    ('inventory_manage', 'Manage Inventory', 'inventory'),
    ('hr_manage', 'Manage Employees', 'hr'),
    ('admin_access', 'Access Admin Panel', 'admin')
ON CONFLICT (code) DO NOTHING;

-- 7. Enable RLS for new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 8. Basic Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.roles;
CREATE POLICY "Enable read access for authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.permissions;
CREATE POLICY "Enable read access for authenticated users" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.role_permissions;
CREATE POLICY "Enable read access for authenticated users" ON public.role_permissions FOR SELECT TO authenticated USING (true);
