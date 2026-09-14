-- Reporting performance indexes.
-- CONCURRENTLY keeps production tables available while Railway deploys.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_created_at ON cars (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cars_supplier_id ON cars (supplier_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_created_at ON reservations (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status_created_at ON reservations (status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_supplier_created_at ON reservations (supplier_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_car_created_at ON reservations (car_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created_at ON payments (status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_created_at ON reviews (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_created_at ON complaints (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_status_created_at ON complaints (status, created_at);
