-- Orbit ERP v3: Enterprise-Grade Database Schema
-- Complete ERP structure with all professional features
-- This script can run independently or after supabase_schema_v2.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PREREQUISITE TABLES (if not already exist)
-- =============================================

-- Chart of Accounts (base accounting table)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_ar TEXT,
    type TEXT CHECK (type IN ('Asset', 'Liability', 'Equity', 'Income', 'Expense')) NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    balance DECIMAL(15,3) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Warehouses table (needed for shipments)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Kuwait',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Departments table (needed for budgets)
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    code TEXT UNIQUE,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Journal Entries (needed for asset depreciation)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference TEXT,
    status TEXT CHECK (status IN ('Draft', 'Posted', 'Cancelled')) DEFAULT 'Draft',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    posted_at TIMESTAMP WITH TIME ZONE
);

-- Vendors table (needed for assets)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bills table (needed for asset purchases)
CREATE TABLE IF NOT EXISTS bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    total DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Employees table (needed for payroll)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_code TEXT UNIQUE NOT NULL,
    profile_id UUID,
    position TEXT,
    department_id UUID REFERENCES departments(id),
    hire_date DATE,
    salary DECIMAL(15,3) DEFAULT 0,
    employment_status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- customers table (needed for CRM)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- items table (needed for shipments)
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    unit TEXT DEFAULT 'piece',
    cost DECIMAL(15,3) DEFAULT 0,
    price DECIMAL(15,3) DEFAULT 0,
    stock_quantity DECIMAL(15,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sale Orders table (needed for shipments)
CREATE TABLE IF NOT EXISTS sale_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Purchase Orders table (needed for shipments)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Invoices table (needed for recurring invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    total DECIMAL(15,3) DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Roles table (needed for permissions)
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissions table (needed for module permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT
);

-- Role Permissions (linking table)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Insert default Admin role if not exists
INSERT INTO roles (name, description, is_system) 
VALUES ('Admin', 'Full system access', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SHIPMENT & LOGISTICS MODULE
-- =============================================


-- Carriers/Shipping Companies
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    tracking_url_template VARCHAR(500), -- e.g., https://carrier.com/track/{tracking_number}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    sale_order_id UUID REFERENCES sale_orders(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    shipment_type VARCHAR(20) CHECK (shipment_type IN ('Outbound', 'Inbound', 'Transfer')),
    carrier_id UUID REFERENCES carriers(id),
    tracking_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Picked', 'Packed', 'Shipped', 'InTransit', 'Delivered', 'Returned', 'Cancelled')),
    ship_date DATE,
    expected_delivery DATE,
    actual_delivery DATE,
    origin_warehouse_id UUID REFERENCES warehouses(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    ship_to_name VARCHAR(255),
    ship_to_address TEXT,
    ship_to_city VARCHAR(100),
    ship_to_country VARCHAR(100),
    ship_to_phone VARCHAR(50),
    weight_kg DECIMAL(10,3),
    dimensions_cm VARCHAR(50), -- LxWxH format
    shipping_cost DECIMAL(15,3) DEFAULT 0,
    insurance_amount DECIMAL(15,3) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Items
CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    quantity DECIMAL(15,3) NOT NULL,
    serial_numbers TEXT[], -- Array of serial numbers if applicable
    batch_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Notes
CREATE TABLE IF NOT EXISTS delivery_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_number VARCHAR(50) UNIQUE NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    delivery_date DATE NOT NULL,
    received_by VARCHAR(255),
    signature_url VARCHAR(500),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Delivered', 'PartiallyDelivered', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADVANCED INVOICING MODULE
-- =============================================

-- Invoice Templates
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    template_code VARCHAR(50) UNIQUE,
    html_content TEXT,
    css_styles TEXT,
    header_image_url VARCHAR(500),
    footer_text TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Invoice Schedules
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    template_invoice_id UUID REFERENCES invoices(id),
    frequency VARCHAR(20) CHECK (frequency IN ('Weekly', 'BiWeekly', 'Monthly', 'Quarterly', 'Annually')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_invoice_date DATE,
    auto_send BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    total_generated INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    issue_date DATE NOT NULL,
    reason VARCHAR(50) CHECK (reason IN ('Return', 'Discount', 'Overcharge', 'Damaged', 'Other')),
    reason_details TEXT,
    subtotal DECIMAL(15,3) DEFAULT 0,
    tax_amount DECIMAL(15,3) DEFAULT 0,
    total DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Applied', 'Cancelled')),
    applied_to_invoice_id UUID REFERENCES invoices(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Note Items
CREATE TABLE IF NOT EXISTS credit_note_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_note_id UUID REFERENCES credit_notes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,3) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    line_total DECIMAL(15,3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CRM MODULE (Enhanced)
-- =============================================

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_number VARCHAR(50) UNIQUE,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    source VARCHAR(50) CHECK (source IN ('Website', 'Referral', 'SocialMedia', 'Exhibition', 'Advertising', 'ColdCall', 'Other')),
    status VARCHAR(30) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    estimated_value DECIMAL(15,3),
    expected_close_date DATE,
    industry VARCHAR(100),
    notes TEXT,
    assigned_to UUID REFERENCES profiles(id),
    converted_to_customer_id UUID REFERENCES customers(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_number VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    lead_id UUID REFERENCES leads(id),
    stage VARCHAR(30) DEFAULT 'Prospecting' CHECK (stage IN ('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'ClosedWon', 'ClosedLost')),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    amount DECIMAL(15,3),
    expected_close_date DATE,
    actual_close_date DATE,
    source VARCHAR(50),
    competitor_info TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    campaign_code VARCHAR(50) UNIQUE,
    type VARCHAR(50) CHECK (type IN ('Email', 'Social', 'Event', 'Webinar', 'Print', 'Radio', 'TV', 'Other')),
    status VARCHAR(30) DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Paused', 'Completed', 'Cancelled')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,3),
    actual_cost DECIMAL(15,3) DEFAULT 0,
    expected_revenue DECIMAL(15,3),
    actual_revenue DECIMAL(15,3) DEFAULT 0,
    target_audience TEXT,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Responses
CREATE TABLE IF NOT EXISTS campaign_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    customer_id UUID REFERENCES customers(id),
    response_type VARCHAR(30) CHECK (response_type IN ('Clicked', 'Opened', 'Registered', 'Attended', 'Purchased', 'Unsubscribed')),
    response_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- =============================================
-- BUDGETING & FORECASTING MODULE
-- =============================================

-- Fiscal Years
CREATE TABLE IF NOT EXISTS fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fiscal_year INTEGER NOT NULL,
    period_type VARCHAR(20) DEFAULT 'Annual' CHECK (period_type IN ('Annual', 'Quarterly', 'Monthly')),
    total_amount DECIMAL(15,3) NOT NULL,
    spent_amount DECIMAL(15,3) DEFAULT 0,
    remaining_amount DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Active', 'Closed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Line Items (Monthly breakdown)
CREATE TABLE IF NOT EXISTS budget_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    planned_amount DECIMAL(15,3) NOT NULL,
    actual_amount DECIMAL(15,3) DEFAULT 0,
    variance DECIMAL(15,3) GENERATED ALWAYS AS (planned_amount - actual_amount) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecasts
CREATE TABLE IF NOT EXISTS forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    forecast_type VARCHAR(30) CHECK (forecast_type IN ('Sales', 'Revenue', 'Expense', 'CashFlow')),
    period_type VARCHAR(20) DEFAULT 'Monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    methodology VARCHAR(50), -- e.g., 'Historical Average', 'Trend Analysis', 'Manual'
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecast Lines
CREATE TABLE IF NOT EXISTS forecast_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_id UUID REFERENCES forecasts(id) ON DELETE CASCADE,
    period_date DATE NOT NULL,
    predicted_amount DECIMAL(15,3) NOT NULL,
    actual_amount DECIMAL(15,3),
    confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MULTI-WAREHOUSE & TRANSFERS MODULE
-- =============================================

-- Warehouse Locations (Bins/Zones)
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    location_code VARCHAR(50) NOT NULL,
    zone VARCHAR(50),
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    location_type VARCHAR(30) CHECK (location_type IN ('Storage', 'Picking', 'Staging', 'Receiving', 'Shipping', 'Returns')),
    max_capacity DECIMAL(15,3),
    current_capacity DECIMAL(15,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, location_code)
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    source_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    destination_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    transfer_date DATE NOT NULL,
    expected_arrival DATE,
    actual_arrival DATE,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'InTransit', 'Received', 'PartiallyReceived', 'Cancelled')),
    reason VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) NOT NULL,
    quantity_requested DECIMAL(15,3) NOT NULL,
    quantity_sent DECIMAL(15,3) DEFAULT 0,
    quantity_received DECIMAL(15,3) DEFAULT 0,
    source_location_id UUID REFERENCES warehouse_locations(id),
    destination_location_id UUID REFERENCES warehouse_locations(id),
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FIXED ASSET MANAGEMENT MODULE
-- =============================================

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    depreciation_method VARCHAR(30) CHECK (depreciation_method IN ('StraightLine', 'DecliningBalance', 'UnitsOfProduction', 'SumOfYearsDigits')),
    default_useful_life_years INTEGER,
    default_salvage_percentage DECIMAL(5,2) DEFAULT 0,
    asset_account_id UUID,
    depreciation_account_id UUID,
    accumulated_depreciation_account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES asset_categories(id),
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(15,3) NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    purchase_invoice_id UUID REFERENCES bills(id),
    warranty_expiry DATE,
    useful_life_years INTEGER NOT NULL,
    salvage_value DECIMAL(15,3) DEFAULT 0,
    depreciation_method VARCHAR(30) DEFAULT 'StraightLine',
    depreciation_start_date DATE,
    current_value DECIMAL(15,3),
    accumulated_depreciation DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'UnderMaintenance', 'Disposed', 'Sold', 'WrittenOff')),
    location VARCHAR(255),
    assigned_to UUID REFERENCES profiles(id),
    department_id UUID REFERENCES departments(id),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Depreciation Schedule
CREATE TABLE IF NOT EXISTS asset_depreciation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES fixed_assets(id) ON DELETE CASCADE,
    depreciation_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    depreciation_amount DECIMAL(15,3) NOT NULL,
    accumulated_amount DECIMAL(15,3) NOT NULL,
    book_value DECIMAL(15,3) NOT NULL,
    journal_entry_id UUID REFERENCES journal_entries(id),
    is_posted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Maintenance
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES fixed_assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('Preventive', 'Repair', 'Upgrade', 'Inspection')),
    maintenance_date DATE NOT NULL,
    description TEXT,
    cost DECIMAL(15,3) DEFAULT 0,
    vendor_id UUID REFERENCES vendors(id),
    performed_by VARCHAR(255),
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYROLL MODULE
-- =============================================

-- Salary Structures
CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Components (Basic, Allowances, Deductions)
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    component_type VARCHAR(20) CHECK (component_type IN ('Earning', 'Deduction', 'Contribution')),
    calculation_type VARCHAR(30) CHECK (calculation_type IN ('Fixed', 'Percentage', 'Formula')),
    percentage_of VARCHAR(50), -- e.g., 'basic_salary'
    percentage_value DECIMAL(5,2),
    is_taxable BOOLEAN DEFAULT true,
    is_statutory BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structure Components
CREATE TABLE IF NOT EXISTS salary_structure_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    structure_id UUID REFERENCES salary_structures(id) ON DELETE CASCADE,
    component_id UUID REFERENCES salary_components(id),
    default_amount DECIMAL(15,3),
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Salary Assignments
CREATE TABLE IF NOT EXISTS employee_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    salary_structure_id UUID REFERENCES salary_structures(id),
    basic_salary DECIMAL(15,3) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN DEFAULT true,
    payment_mode VARCHAR(30) CHECK (payment_mode IN ('BankTransfer', 'Cash', 'Cheque')),
    bank_name VARCHAR(255),
    bank_account VARCHAR(100),
    iban VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pay Periods
CREATE TABLE IF NOT EXISTS pay_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) CHECK (period_type IN ('Weekly', 'BiWeekly', 'Monthly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Processing', 'Closed', 'Paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Runs
-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_code VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processing', 'Approved', 'Paid', 'Cancelled')),
    total_gross DECIMAL(15,3) DEFAULT 0,
    total_deductions DECIMAL(15,3) DEFAULT 0,
    total_net DECIMAL(15,3) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Items (Payslips)
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    basic_salary DECIMAL(15,3) NOT NULL,
    total_earnings DECIMAL(15,3) NOT NULL,
    total_deductions DECIMAL(15,3) DEFAULT 0,
    net_pay DECIMAL(15,3) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'OnHold')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BANK RECONCILIATION MODULE
-- =============================================

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban VARCHAR(50),
    swift_code VARCHAR(20),
    branch VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'KWD',
    account_type VARCHAR(30) CHECK (account_type IN ('Checking', 'Savings', 'Current', 'Fixed')),
    opening_balance DECIMAL(15,3) DEFAULT 0,
    current_balance DECIMAL(15,3) DEFAULT 0,
    gl_account_id UUID,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_reconciled_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Reconciliations (matches code usage)
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID REFERENCES bank_accounts(id),
    statement_date DATE NOT NULL,
    statement_ending_balance DECIMAL(15,3) DEFAULT 0,
    book_balance DECIMAL(15,3) DEFAULT 0,
    difference DECIMAL(15,3) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Reconciled', 'Archived')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Statement Lines (matches code usage)
CREATE TABLE IF NOT EXISTS bank_statement_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_id UUID REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(255),
    debit_amount DECIMAL(15,3) DEFAULT 0,
    credit_amount DECIMAL(15,3) DEFAULT 0,
    transaction_type VARCHAR(50), -- Deposit, Withdrawal, etc.
    is_matched BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- =============================================
-- PAYMENT GATEWAY CONFIGURATION
-- =============================================

-- Payment Gateways
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) CHECK (provider IN ('Stripe', 'PayPal', 'Square', 'Tap', 'MyFatoorah', 'PayTabs', 'Manual')),
    is_active BOOLEAN DEFAULT false,
    is_test_mode BOOLEAN DEFAULT true,
    api_key_encrypted TEXT,
    secret_key_encrypted TEXT,
    webhook_secret TEXT,
    merchant_id VARCHAR(255),
    supported_currencies TEXT[],
    configuration JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Online Payments
CREATE TABLE IF NOT EXISTS online_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    gateway_id UUID REFERENCES payment_gateways(id),
    gateway_transaction_id VARCHAR(255),
    invoice_id UUID REFERENCES invoices(id),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(15,3) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KWD',
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Failed', 'Refunded', 'Cancelled')),
    payment_method VARCHAR(50), -- 'card', 'wallet', 'bank'
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    payer_email VARCHAR(255),
    payer_name VARCHAR(255),
    failure_reason TEXT,
    refund_amount DECIMAL(15,3),
    refund_reference VARCHAR(100),
    gateway_response JSONB,
    payment_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can access all data" ON carriers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON shipment_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON delivery_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON invoice_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON recurring_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON credit_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON credit_note_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON opportunities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON campaign_responses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON fiscal_years FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON budgets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON budget_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON forecasts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON forecast_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON warehouse_locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON stock_transfers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON stock_transfer_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON asset_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON fixed_assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON asset_depreciation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON asset_maintenance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON salary_structures FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON salary_components FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON salary_structure_components FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON employee_salaries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON pay_periods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON payroll_runs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON payslips FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON payslip_details FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON bank_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON bank_statements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON bank_statement_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON reconciliations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON payment_gateways FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can access all data" ON online_payments FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- ADDITIONAL PERMISSIONS FOR NEW MODULES
-- =============================================

INSERT INTO permissions (code, name, module) VALUES
-- Shipments
('shipments.view', 'View Shipments', 'logistics'),
('shipments.create', 'Create Shipments', 'logistics'),
('shipments.edit', 'Edit Shipments', 'logistics'),
('shipments.delete', 'Delete Shipments', 'logistics'),
-- CRM
('leads.view', 'View Leads', 'crm'),
('leads.create', 'Create Leads', 'crm'),
('leads.edit', 'Edit Leads', 'crm'),
('leads.delete', 'Delete Leads', 'crm'),
('opportunities.view', 'View Opportunities', 'crm'),
('opportunities.create', 'Create Opportunities', 'crm'),
('campaigns.view', 'View Campaigns', 'crm'),
('campaigns.manage', 'Manage Campaigns', 'crm'),
-- Budgeting
('budgets.view', 'View Budgets', 'finance'),
('budgets.create', 'Create Budgets', 'finance'),
('budgets.approve', 'Approve Budgets', 'finance'),
('forecasts.view', 'View Forecasts', 'finance'),
('forecasts.manage', 'Manage Forecasts', 'finance'),
-- Assets
('assets.view', 'View Assets', 'assets'),
('assets.create', 'Create Assets', 'assets'),
('assets.edit', 'Edit Assets', 'assets'),
('assets.dispose', 'Dispose Assets', 'assets'),
('depreciation.run', 'Run Depreciation', 'assets'),
-- Payroll
('payroll.view', 'View Payroll', 'payroll'),
('payroll.process', 'Process Payroll', 'payroll'),
('payroll.approve', 'Approve Payroll', 'payroll'),
('payslips.view', 'View Payslips', 'payroll'),
('salary.manage', 'Manage Salaries', 'payroll'),
-- Banking
('banking.view', 'View Bank Accounts', 'banking'),
('banking.manage', 'Manage Bank Accounts', 'banking'),
('reconciliation.perform', 'Perform Reconciliation', 'banking'),
-- Audit
('audit.view', 'View Audit Logs', 'admin'),
('audit.export', 'Export Audit Logs', 'admin')
ON CONFLICT (code) DO NOTHING;

-- Grant all new permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Admin'
AND p.code IN (
    'shipments.view', 'shipments.create', 'shipments.edit', 'shipments.delete',
    'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
    'opportunities.view', 'opportunities.create', 'campaigns.view', 'campaigns.manage',
    'budgets.view', 'budgets.create', 'budgets.approve', 'forecasts.view', 'forecasts.manage',
    'assets.view', 'assets.create', 'assets.edit', 'assets.dispose', 'depreciation.run',
    'payroll.view', 'payroll.process', 'payroll.approve', 'payslips.view', 'salary.manage',
    'banking.view', 'banking.manage', 'reconciliation.perform',
    'audit.view', 'audit.export'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA FOR NEW MODULES
-- =============================================

-- Default Carriers
INSERT INTO carriers (name, code, tracking_url_template) VALUES
('DHL Express', 'DHL', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}'),
('FedEx', 'FEDEX', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}'),
('UPS', 'UPS', 'https://www.ups.com/track?tracknum={tracking_number}'),
('Aramex', 'ARAMEX', 'https://www.aramex.com/track/results?ShipmentNumber={tracking_number}'),
('Local Delivery', 'LOCAL', NULL)
ON CONFLICT (code) DO NOTHING;

-- Default Asset Categories
INSERT INTO asset_categories (name, code, depreciation_method, default_useful_life_years) VALUES
('Buildings', 'BUILDING', 'StraightLine', 25),
('Vehicles', 'VEHICLE', 'StraightLine', 5),
('Machinery & Equipment', 'MACHINE', 'StraightLine', 10),
('Furniture & Fixtures', 'FURNITURE', 'StraightLine', 7),
('Computer Equipment', 'COMPUTER', 'StraightLine', 3),
('Office Equipment', 'OFFICE', 'StraightLine', 5),
('Land', 'LAND', 'StraightLine', 0) -- Land is not depreciated
ON CONFLICT (code) DO NOTHING;

-- Default Salary Components
INSERT INTO salary_components (name, code, component_type, calculation_type, is_taxable) VALUES
('Basic Salary', 'BASIC', 'Earning', 'Fixed', true),
('Housing Allowance', 'HOUSING', 'Earning', 'Percentage', false),
('Transport Allowance', 'TRANSPORT', 'Earning', 'Fixed', false),
('Mobile Allowance', 'MOBILE', 'Earning', 'Fixed', false),
('Overtime', 'OVERTIME', 'Earning', 'Fixed', true),
('Bonus', 'BONUS', 'Earning', 'Fixed', true),
('Social Insurance', 'SOCIAL_INS', 'Deduction', 'Percentage', false),
('Health Insurance', 'HEALTH_INS', 'Deduction', 'Fixed', false),
('Loan Deduction', 'LOAN', 'Deduction', 'Fixed', false),
('Advance Salary', 'ADVANCE', 'Deduction', 'Fixed', false)
ON CONFLICT (code) DO NOTHING;

-- Default Invoice Template
INSERT INTO invoice_templates (name, template_code, is_default, html_content) VALUES
('Standard Template', 'STANDARD', true, '<div class="invoice-template"><!-- Default template --></div>'),
('Modern Template', 'MODERN', false, '<div class="invoice-modern"><!-- Modern template --></div>'),
('Minimal Template', 'MINIMAL', false, '<div class="invoice-minimal"><!-- Minimal template --></div>')
ON CONFLICT (template_code) DO NOTHING;

COMMIT;

-- =============================================
-- SYSTEM & AUDIT LOGS
-- =============================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'VIEW')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES profiles(id),
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
