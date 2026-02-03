-- Orbit ERP v2: World-Class Database Schema
-- Comprehensive ERP structure for Trading, Contracting, and Service Providers
-- Author: Orbit Foundation | Date: 2026-02-03

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1: CORE SYSTEM TABLES
-- ============================================================

-- 1.1 ROLES (Granular Permission System)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.2 PERMISSIONS (Capability Definitions)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- e.g., 'finance_view', 'inventory_edit'
    name TEXT NOT NULL,
    module TEXT NOT NULL, -- e.g., 'finance', 'inventory', 'hr'
    description TEXT
);

-- 1.3 ROLE_PERMISSIONS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 1.4 PROFILES (Enhanced User Management)
-- Alter existing profiles table to add role_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 1.5 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Optional link to related resource
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.6 SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SECTION 2: FINANCIAL MANAGEMENT (Double-Entry Accounting)
-- ============================================================

-- 2.1 CHART OF ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- e.g., '1000', '2000'
    name TEXT NOT NULL,
    name_ar TEXT, -- Arabic name
    type TEXT CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')) NOT NULL,
    parent_id UUID REFERENCES public.accounts(id),
    is_active BOOLEAN DEFAULT true,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.2 JOURNAL ENTRIES (Header)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference TEXT, -- External reference (invoice #, etc.)
    status TEXT CHECK (status IN ('Draft', 'Posted', 'Cancelled')) DEFAULT 'Draft',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    posted_at TIMESTAMP WITH TIME ZONE
);

-- 2.3 JOURNAL ITEMS (Line Items - Debits/Credits)
CREATE TABLE IF NOT EXISTS public.journal_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0.00,
    credit DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    CONSTRAINT check_debit_credit CHECK (
        (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0) OR (debit = 0 AND credit = 0)
    )
);

-- 2.4 TAXES
CREATE TABLE IF NOT EXISTS public.taxes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    rate DECIMAL(5,2) NOT NULL, -- e.g., 15.00 for 15%
    type TEXT CHECK (type IN ('Sales', 'Purchase', 'Both')) DEFAULT 'Both',
    account_id UUID REFERENCES public.accounts(id),
    is_active BOOLEAN DEFAULT true
);

-- 2.5 PAYMENT METHODS
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Cash', 'Bank', 'Credit Card', 'Check', 'Other')) NOT NULL,
    account_id UUID REFERENCES public.accounts(id),
    is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- SECTION 3: SALES & CRM
-- ============================================================

-- 3.1 CUSTOMERS (Enhanced)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_type TEXT CHECK (customer_type IN ('Individual', 'Company')) DEFAULT 'Company';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30; -- Days

-- 3.2 SALES ORDERS
CREATE TABLE IF NOT EXISTS public.sale_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    project_id UUID REFERENCES public.projects(id),
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status TEXT CHECK (status IN ('Quotation', 'Confirmed', 'Delivered', 'Invoiced', 'Cancelled')) DEFAULT 'Quotation',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3.3 SALE ORDER LINES
CREATE TABLE IF NOT EXISTS public.sale_order_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.sale_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id),
    description TEXT,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0.00,
    tax_id UUID REFERENCES public.taxes(id),
    line_total DECIMAL(15,2) DEFAULT 0.00
);

-- 3.4 INVOICES (Enhanced)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sale_order_id UUID REFERENCES public.sale_orders(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3.5 INVOICE LINES
CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id),
    description TEXT,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_id UUID REFERENCES public.taxes(id),
    line_total DECIMAL(15,2) DEFAULT 0.00
);

-- 3.6 PAYMENTS RECEIVED
CREATE TABLE IF NOT EXISTS public.payments_received (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    payment_method_id UUID REFERENCES public.payment_methods(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SECTION 4: PURCHASING
-- ============================================================

-- 4.1 VENDORS
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    payment_terms INTEGER DEFAULT 30,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4.2 PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id),
    project_id UUID REFERENCES public.projects(id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    status TEXT CHECK (status IN ('Draft', 'Sent', 'Received', 'Billed', 'Cancelled')) DEFAULT 'Draft',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4.3 PURCHASE ORDER LINES
CREATE TABLE IF NOT EXISTS public.purchase_order_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id),
    description TEXT,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_id UUID REFERENCES public.taxes(id),
    line_total DECIMAL(15,2) DEFAULT 0.00
);

-- 4.4 BILLS (Vendor Invoices)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id),
    purchase_order_id UUID REFERENCES public.purchase_orders(id),
    bill_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT CHECK (status IN ('Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled')) DEFAULT 'Draft',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4.5 PAYMENTS MADE
CREATE TABLE IF NOT EXISTS public.payments_made (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_number TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id),
    bill_id UUID REFERENCES public.bills(id),
    payment_method_id UUID REFERENCES public.payment_methods(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SECTION 5: INVENTORY & WAREHOUSE
-- ============================================================

-- 5.1 WAREHOUSES
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5.2 STOCK QUANTITIES (Per Warehouse)
CREATE TABLE IF NOT EXISTS public.stock_quantities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(12,2) DEFAULT 0.00,
    min_quantity DECIMAL(12,2) DEFAULT 0.00, -- Reorder level
    max_quantity DECIMAL(12,2) DEFAULT 0.00,
    UNIQUE(item_id, warehouse_id)
);

-- 5.3 STOCK MOVES (Transfers & Adjustments)
CREATE TABLE IF NOT EXISTS public.stock_moves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id),
    from_warehouse_id UUID REFERENCES public.warehouses(id),
    to_warehouse_id UUID REFERENCES public.warehouses(id),
    quantity DECIMAL(12,2) NOT NULL,
    move_type TEXT CHECK (move_type IN ('Transfer', 'Adjustment', 'Receipt', 'Issue')) NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5.4 ITEMS (Enhanced)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS min_stock_level DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- SECTION 6: HUMAN RESOURCES
-- ============================================================

-- 6.1 DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    manager_id UUID REFERENCES public.profiles(id),
    parent_id UUID REFERENCES public.departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6.2 EMPLOYEES (Extended Profile Data)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    employee_number TEXT UNIQUE,
    department_id UUID REFERENCES public.departments(id),
    position TEXT,
    hire_date DATE,
    contract_type TEXT CHECK (contract_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
    salary DECIMAL(15,2) DEFAULT 0.00,
    bank_account TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6.3 ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Leave', 'Holiday')) DEFAULT 'Present',
    notes TEXT,
    UNIQUE(employee_id, date)
);

-- 6.4 LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT CHECK (leave_type IN ('Annual', 'Sick', 'Unpaid', 'Maternity', 'Other')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL,
    reason TEXT,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')) DEFAULT 'Pending',
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SECTION 7: PROJECTS (Enhanced)
-- ============================================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2) DEFAULT 0.00;

-- 7.1 PROJECT MILESTONES
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    due_date DATE,
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7.2 TIMESHEETS
CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id),
    project_id UUID REFERENCES public.projects(id),
    task_id UUID REFERENCES public.tasks(id),
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    description TEXT,
    billable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- SECTION 8: SEED DATA
-- ============================================================

-- Default Roles
INSERT INTO public.roles (name, description, is_system) VALUES
    ('Super Admin', 'Full system access', true),
    ('Admin', 'Administrative access', true),
    ('Manager', 'Department manager access', true),
    ('Accountant', 'Financial module access', true),
    ('Sales', 'Sales and CRM access', true),
    ('Warehouse', 'Inventory and warehouse access', true),
    ('HR', 'Human resources access', true),
    ('Employee', 'Basic employee access', true)
ON CONFLICT (name) DO NOTHING;

-- Default Permissions
INSERT INTO public.permissions (code, name, module) VALUES
    ('dashboard_view', 'View Dashboard', 'dashboard'),
    ('finance_view', 'View Finance', 'finance'),
    ('finance_edit', 'Edit Finance', 'finance'),
    ('finance_delete', 'Delete Finance Records', 'finance'),
    ('inventory_view', 'View Inventory', 'inventory'),
    ('inventory_edit', 'Edit Inventory', 'inventory'),
    ('inventory_delete', 'Delete Inventory', 'inventory'),
    ('projects_view', 'View Projects', 'projects'),
    ('projects_edit', 'Edit Projects', 'projects'),
    ('projects_delete', 'Delete Projects', 'projects'),
    ('customers_view', 'View Customers', 'customers'),
    ('customers_edit', 'Edit Customers', 'customers'),
    ('hr_view', 'View HR', 'hr'),
    ('hr_edit', 'Edit HR', 'hr'),
    ('admin_view', 'View Admin Panel', 'admin'),
    ('admin_edit', 'Manage System Settings', 'admin'),
    ('admin_users', 'Manage Users', 'admin')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Default Chart of Accounts
INSERT INTO public.accounts (code, name, name_ar, type) VALUES
    ('1000', 'Cash', 'النقدية', 'Asset'),
    ('1100', 'Bank', 'البنك', 'Asset'),
    ('1200', 'Accounts Receivable', 'المدينون', 'Asset'),
    ('1300', 'Inventory', 'المخزون', 'Asset'),
    ('2000', 'Accounts Payable', 'الدائنون', 'Liability'),
    ('2100', 'VAT Payable', 'ضريبة القيمة المضافة المستحقة', 'Liability'),
    ('3000', 'Owner Equity', 'رأس المال', 'Equity'),
    ('3100', 'Retained Earnings', 'الأرباح المحتجزة', 'Equity'),
    ('4000', 'Sales Revenue', 'إيرادات المبيعات', 'Income'),
    ('4100', 'Service Revenue', 'إيرادات الخدمات', 'Income'),
    ('5000', 'Cost of Goods Sold', 'تكلفة البضاعة المباعة', 'Expense'),
    ('5100', 'Salaries Expense', 'مصروف الرواتب', 'Expense'),
    ('5200', 'Rent Expense', 'مصروف الإيجار', 'Expense'),
    ('5300', 'Utilities Expense', 'مصروف المرافق', 'Expense'),
    ('5400', 'Office Supplies', 'مستلزمات المكتب', 'Expense')
ON CONFLICT (code) DO NOTHING;

-- Default Tax
INSERT INTO public.taxes (name, rate, type) VALUES
    ('VAT 15%', 15.00, 'Both')
ON CONFLICT DO NOTHING;

-- Default Warehouse
INSERT INTO public.warehouses (code, name) VALUES
    ('MAIN', 'Main Warehouse')
ON CONFLICT (code) DO NOTHING;

-- Default Payment Methods
INSERT INTO public.payment_methods (name, type) VALUES
    ('Cash', 'Cash'),
    ('Bank Transfer', 'Bank'),
    ('Credit Card', 'Credit Card'),
    ('Check', 'Check')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 9: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (authenticated users can read, admins can write)
CREATE POLICY "Authenticated can view roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view permissions" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view accounts" ON public.accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can view taxes" ON public.taxes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view warehouses" ON public.warehouses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can view departments" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');

-- Admin/Manager policies for write operations
CREATE POLICY "Admin can manage roles" ON public.roles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin'))
);
CREATE POLICY "Admin can manage accounts" ON public.accounts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Accountant'))
);

COMMIT;
