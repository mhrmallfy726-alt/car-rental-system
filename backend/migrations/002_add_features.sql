-- -- =====================================================
-- -- 🚗 Car Rental System - Migration 002
-- -- Add Favorites and Saved Cards
-- -- =====================================================

-- -- 1. Favorite Cars Table
-- CREATE TABLE IF NOT EXISTS favorite_cars (
--     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     PRIMARY KEY (user_id, car_id)
-- );

-- -- 2. Saved Cards Table (For Internal Payment Gateway)
-- CREATE TABLE IF NOT EXISTS saved_cards (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     card_holder_name VARCHAR(150) NOT NULL,
--     card_number_masked VARCHAR(20) NOT NULL,
--     card_token VARCHAR(255) NOT NULL, -- Simulated encrypted token
--     expiry_month VARCHAR(2) NOT NULL,
--     expiry_year VARCHAR(4) NOT NULL,
--     brand VARCHAR(50),
--     is_default BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- Create Indexes
-- CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON saved_cards(user_id);
