-- Fix Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invoice_number TEXT,
  customer_id UUID REFERENCES customers(id),
  invoice_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'Draft',
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  notes TEXT,
  sale_order_id UUID -- We'll add FK later if sale_orders exists
);

-- Ensure columns exist if table already existed check
DO $$
BEGIN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sale_order_id UUID;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_date DATE;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Fix Sale Orders Table
CREATE TABLE IF NOT EXISTS sale_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_number TEXT,
  customer_id UUID REFERENCES customers(id),
  order_date DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'Quotation',
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT
);

DO $$
BEGIN
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS order_number TEXT;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS order_date DATE;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Quotation';
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
    ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create Sale Order Items Table
CREATE TABLE IF NOT EXISTS sale_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sale_order_id UUID REFERENCES sale_orders(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0
);

-- Fix Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  po_number TEXT,
  vendor_id UUID REFERENCES vendors(id),
  order_date DATE,
  expected_date DATE,
  status TEXT DEFAULT 'Draft',
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT
);

DO $$
BEGIN
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number TEXT;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_date DATE;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_date DATE;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create Purchase Order Items Table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0
);

-- Fix Vendor Bills Table
CREATE TABLE IF NOT EXISTS vendor_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  bill_number TEXT,
  vendor_id UUID REFERENCES vendors(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  due_date DATE
);

DO $$
BEGIN
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS bill_number TEXT;
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id);
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
    ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS due_date DATE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS and Policies (Clean up old policies if they exist to avoid conflicts)
DO $$
BEGIN
    EXECUTE 'ALTER TABLE invoices ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE sale_order_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE vendor_bills ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Auth full access invoices" ON invoices;
DROP POLICY IF EXISTS "Auth full access sale_orders" ON sale_orders;
DROP POLICY IF EXISTS "Auth full access sale_order_items" ON sale_order_items;
DROP POLICY IF EXISTS "Auth full access purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Auth full access purchase_order_items" ON purchase_order_items;
DROP POLICY IF EXISTS "Auth full access vendor_bills" ON vendor_bills;

-- Create new policies
CREATE POLICY "Auth full access invoices" ON invoices FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth full access sale_orders" ON sale_orders FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth full access sale_order_items" ON sale_order_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth full access purchase_orders" ON purchase_orders FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth full access purchase_order_items" ON purchase_order_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth full access vendor_bills" ON vendor_bills FOR ALL USING (auth.uid() IS NOT NULL);
