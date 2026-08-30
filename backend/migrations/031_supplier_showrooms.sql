-- =====================================================
-- 🚗 Car Rental System - Migration 031
-- Supplier can own multiple showrooms/branches
-- One supplier account (one unique email) -> many showrooms
-- Showroom names are globally unique
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_showrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    address TEXT,
    phone VARCHAR(30),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT supplier_showrooms_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_supplier_showrooms_supplier ON supplier_showrooms(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_showrooms_location ON supplier_showrooms(location_id);
CREATE INDEX IF NOT EXISTS idx_supplier_showrooms_active ON supplier_showrooms(supplier_id, is_active);

-- A car belongs to a supplier and can optionally be assigned to one of that supplier's showrooms.
-- NULL is intentional so existing cars remain valid after migration.
ALTER TABLE cars
    ADD COLUMN IF NOT EXISTS showroom_id UUID REFERENCES supplier_showrooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cars_showroom ON cars(showroom_id);

CREATE OR REPLACE TRIGGER update_supplier_showrooms_updated_at
    BEFORE UPDATE ON supplier_showrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
