-- ============================================================
-- ORBIT ERP - Role-Based Access Control & RLS Policies
-- ============================================================
-- This migration sets up fine-grained Row Level Security policies
-- based on user roles (Admin, Manager, Employee)
-- ============================================================

-- Ensure core metadata tables exist first
-- system_settings is already defined in SYSTEM_SETTINGS_MIGRATION.sql, but we ensure it's here too for RLS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    module TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- First, ensure we have a function to get the current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'Employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a Manager or Admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
    role TEXT := get_user_role();
BEGIN
    RETURN role IN ('Admin', 'Manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- Everyone can see profiles (for dropdown lists, etc.)
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT TO authenticated USING (true);

-- Users can update their own profile, Admins can update any
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR is_admin())
    WITH CHECK (id = auth.uid() OR is_admin());

-- Only Admins can create new profiles (via admin panel)
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Only Admins can delete profiles
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- EMPLOYEES TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

-- Everyone can see employees (for task assignments, etc.)
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT TO authenticated USING (true);

-- Only Managers and Admins can modify employees
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

-- Everyone can see departments
CREATE POLICY "departments_select_policy" ON departments
    FOR SELECT TO authenticated USING (true);

-- Only Admins can manage departments
CREATE POLICY "departments_update_policy" ON departments
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "departments_insert_policy" ON departments
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "departments_delete_policy" ON departments
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- PROJECTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Everyone can see all projects (visibility for reporting)
CREATE POLICY "projects_select_policy" ON projects
    FOR SELECT TO authenticated USING (true);

-- Managers and Admins can create/update projects
CREATE POLICY "projects_update_policy" ON projects
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "projects_insert_policy" ON projects
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

-- Only Admins can delete projects
CREATE POLICY "projects_delete_policy" ON projects
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- TASKS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Users can see all tasks (for coordination)
CREATE POLICY "tasks_select_policy" ON tasks
    FOR SELECT TO authenticated USING (true);

-- Users can update tasks assigned to them, Managers/Admins can update any
CREATE POLICY "tasks_update_policy" ON tasks
    FOR UPDATE TO authenticated
    USING (assignee_id = auth.uid() OR is_manager_or_admin())
    WITH CHECK (assignee_id = auth.uid() OR is_manager_or_admin());

-- Anyone can create tasks
CREATE POLICY "tasks_insert_policy" ON tasks
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only Managers/Admins can delete tasks
CREATE POLICY "tasks_delete_policy" ON tasks
    FOR DELETE TO authenticated USING (is_manager_or_admin());

-- ============================================================
-- CUSTOMERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- Everyone can see customers (for order dropdown)
CREATE POLICY "customers_select_policy" ON customers
    FOR SELECT TO authenticated USING (true);

-- Managers/Admins can manage customers
CREATE POLICY "customers_update_policy" ON customers
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "customers_insert_policy" ON customers
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "customers_delete_policy" ON customers
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- VENDORS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "vendors_select_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_insert_policy" ON vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON vendors;

-- Everyone can see vendors
CREATE POLICY "vendors_select_policy" ON vendors
    FOR SELECT TO authenticated USING (true);

-- Managers/Admins can manage vendors
CREATE POLICY "vendors_update_policy" ON vendors
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "vendors_insert_policy" ON vendors
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "vendors_delete_policy" ON vendors
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- ITEMS (INVENTORY) TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;

-- Everyone can see inventory items
CREATE POLICY "items_select_policy" ON items
    FOR SELECT TO authenticated USING (true);

-- Managers/Admins can manage items
CREATE POLICY "items_update_policy" ON items
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "items_insert_policy" ON items
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "items_delete_policy" ON items
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- SALE_ORDERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "sale_orders_select_policy" ON sale_orders;
DROP POLICY IF EXISTS "sale_orders_update_policy" ON sale_orders;
DROP POLICY IF EXISTS "sale_orders_insert_policy" ON sale_orders;
DROP POLICY IF EXISTS "sale_orders_delete_policy" ON sale_orders;

-- All authenticated users can view sales orders
CREATE POLICY "sale_orders_select_policy" ON sale_orders
    FOR SELECT TO authenticated USING (true);

-- Managers/Admins can modify sales orders
CREATE POLICY "sale_orders_update_policy" ON sale_orders
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "sale_orders_insert_policy" ON sale_orders
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "sale_orders_delete_policy" ON sale_orders
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- PURCHASE_ORDERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "purchase_orders_select_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_policy" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_policy" ON purchase_orders;

-- All authenticated users can view purchase orders
CREATE POLICY "purchase_orders_select_policy" ON purchase_orders
    FOR SELECT TO authenticated USING (true);

-- Managers/Admins can modify purchase orders
CREATE POLICY "purchase_orders_update_policy" ON purchase_orders
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "purchase_orders_insert_policy" ON purchase_orders
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "purchase_orders_delete_policy" ON purchase_orders
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- INVOICES TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;

CREATE POLICY "invoices_select_policy" ON invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "invoices_update_policy" ON invoices
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "invoices_insert_policy" ON invoices
    FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

CREATE POLICY "invoices_delete_policy" ON invoices
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- SYSTEM_SETTINGS TABLE POLICIES (Admin Only)
-- ============================================================
DROP POLICY IF EXISTS "system_settings_select_policy" ON system_settings;
DROP POLICY IF EXISTS "system_settings_update_policy" ON system_settings;

CREATE POLICY "system_settings_select_policy" ON system_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_settings_update_policy" ON system_settings
    FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- ROLES TABLE POLICIES (Admin Only)
-- ============================================================
DROP POLICY IF EXISTS "roles_select_policy" ON roles;
DROP POLICY IF EXISTS "roles_update_policy" ON roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON roles;

CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "roles_update_policy" ON roles
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "roles_insert_policy" ON roles
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "roles_delete_policy" ON roles
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- PERMISSIONS TABLE POLICIES (Admin Only)
-- ============================================================
DROP POLICY IF EXISTS "permissions_select_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_update_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_insert_policy" ON permissions;
DROP POLICY IF EXISTS "permissions_delete_policy" ON permissions;

CREATE POLICY "permissions_select_policy" ON permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "permissions_update_policy" ON permissions
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "permissions_insert_policy" ON permissions
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "permissions_delete_policy" ON permissions
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- ROLE_PERMISSIONS TABLE POLICIES (Admin Only)
-- ============================================================
DROP POLICY IF EXISTS "role_permissions_select_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_update_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_insert_policy" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_delete_policy" ON role_permissions;

CREATE POLICY "role_permissions_select_policy" ON role_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_update_policy" ON role_permissions
    FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "role_permissions_insert_policy" ON role_permissions
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "role_permissions_delete_policy" ON role_permissions
    FOR DELETE TO authenticated USING (is_admin());

-- ============================================================
-- ATTENDANCE TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "attendance_select_policy" ON attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON attendance;

-- Users can see their own attendance, Managers/Admins see all
CREATE POLICY "attendance_select_policy" ON attendance
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() OR is_manager_or_admin()
    );

-- Users can record their own attendance
CREATE POLICY "attendance_insert_policy" ON attendance
    FOR INSERT TO authenticated
    WITH CHECK (profile_id = auth.uid() OR is_manager_or_admin());

-- Only Managers/Admins can modify attendance
CREATE POLICY "attendance_update_policy" ON attendance
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

-- ============================================================
-- SUMMARY
-- ============================================================
-- Admin: Full access to all tables and settings
-- Manager: Read all, Write to operational tables (orders, projects, inventory)
-- Employee: Read all, Write only to personal data (attendance, assigned tasks)
-- ============================================================
