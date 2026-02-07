-- Stock Movements Table Migration
-- This creates the stock_movements table for tracking inventory movements

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    movement_number VARCHAR(50) NOT NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Completed', 'Cancelled')),
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    reference_type VARCHAR(50), -- 'purchase_order', 'sales_order', 'invoice', etc.
    reference_id UUID,
    reference_number VARCHAR(100),
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    created_by UUID REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    completed_by UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_status ON stock_movements(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_warehouse ON stock_movements(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_warehouse ON stock_movements(to_warehouse_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_movements_number_org ON stock_movements(organization_id, movement_number);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stock movements in their organization"
    ON stock_movements FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert stock movements in their organization"
    ON stock_movements FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update stock movements in their organization"
    ON stock_movements FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_stock_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_movements_updated_at
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_movements_updated_at();

-- Add stock_quantity tracking trigger (when movement is completed)
CREATE OR REPLACE FUNCTION update_inventory_on_movement_complete()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    item_data JSONB;
BEGIN
    -- Only trigger when status changes to 'Completed'
    IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
        -- Loop through items in the movement
        FOR item_data IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            -- Update inventory based on movement type
            IF NEW.movement_type = 'IN' THEN
                -- Increase stock for goods receipt
                UPDATE inventory_items 
                SET stock_quantity = stock_quantity + (item_data->>'quantity')::numeric,
                    updated_at = NOW()
                WHERE id = (item_data->>'item_id')::uuid;
                
            ELSIF NEW.movement_type = 'OUT' THEN
                -- Decrease stock for goods issue
                UPDATE inventory_items 
                SET stock_quantity = stock_quantity - (item_data->>'quantity')::numeric,
                    updated_at = NOW()
                WHERE id = (item_data->>'item_id')::uuid;
                
            ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
                -- Direct set for physical count adjustment (positive or negative)
                -- The quantity in adjustment represents the difference, not absolute value
                UPDATE inventory_items 
                SET stock_quantity = stock_quantity + (item_data->>'quantity')::numeric,
                    updated_at = NOW()
                WHERE id = (item_data->>'item_id')::uuid;
            END IF;
            -- Note: TRANSFER doesn't change total inventory, just moves between warehouses
            -- For warehouse-level tracking, additional warehouse_stock table may be needed
        END LOOP;
        
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_movement
    BEFORE UPDATE ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_movement_complete();

-- Comments
COMMENT ON TABLE stock_movements IS 'Tracks all inventory movements including goods receipts, issues, transfers, and adjustments';
COMMENT ON COLUMN stock_movements.movement_type IS 'IN=Goods Receipt, OUT=Goods Issue, TRANSFER=Inter-warehouse transfer, ADJUSTMENT=Physical count adjustment';
COMMENT ON COLUMN stock_movements.items IS 'JSONB array of items: [{item_id, item_name, quantity, unit, unit_cost, notes}]';
