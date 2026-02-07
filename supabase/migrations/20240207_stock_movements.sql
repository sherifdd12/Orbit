-- Stock Movements Table Migration (Corrected)
-- This creates the stock_movements table for tracking inventory movements

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- removed organization_id as it doesn't exist in other tables
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
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_status ON stock_movements(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_warehouse ON stock_movements(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_warehouse ON stock_movements(to_warehouse_id);
-- removed idx_stock_movements_number_org

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view stock movements"
    ON stock_movements FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert stock movements"
    ON stock_movements FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update stock movements"
    ON stock_movements FOR UPDATE
    USING (auth.uid() IS NOT NULL);

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
                UPDATE items 
                SET stock_quantity = COALESCE(stock_quantity, 0) + (item_data->>'quantity')::numeric
                WHERE id = (item_data->>'item_id')::uuid;
                
            ELSIF NEW.movement_type = 'OUT' THEN
                -- Decrease stock for goods issue
                UPDATE items 
                SET stock_quantity = COALESCE(stock_quantity, 0) - (item_data->>'quantity')::numeric
                WHERE id = (item_data->>'item_id')::uuid;
                
            ELSIF NEW.movement_type = 'ADJUSTMENT' THEN
                -- Add the quantity (which can be negative) to existing stock
                -- Adjustment here works as "Add specific quantity"
                -- If we want "Set to specific quantity", we need different logic. 
                -- Assuming Adjustment means adding/removing a discrepancy amount.
                UPDATE items 
                SET stock_quantity = COALESCE(stock_quantity, 0) + (item_data->>'quantity')::numeric
                WHERE id = (item_data->>'item_id')::uuid;
            END IF;
            -- Note: TRANSFER doesn't change total inventory of 'items' table as 'items' is global?
            -- Unless 'items' table has 'warehouse_id' (it does NOT in the file I read).
            -- If 'items' is global stock, TRANSFER doesn't change global stock.
            -- If proper warehouse tracking is needed, we need a 'warehouse_stock' table.
            -- For now, `items.stock_quantity` is presumably the global stock or main warehouse stock.
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
