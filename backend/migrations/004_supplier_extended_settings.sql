-- -- =====================================================
-- -- 🚗 Car Rental System - Migration 004
-- -- Add Extended Supplier Settings (IBAN, Bank Name, Auto-Accept)
-- -- =====================================================

-- -- 1. Add banking and automation fields to users
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS iban VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT FALSE;
