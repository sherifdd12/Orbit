-- Update Customers Table Structure
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0.00;

-- Ensure Invoices Table Exists
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    project_id UUID REFERENCES public.projects(id),
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'Draft',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure Projects have Customer link
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
