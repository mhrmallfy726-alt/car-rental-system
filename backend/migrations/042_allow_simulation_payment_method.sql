-- Existing installations inherited the original payments constraint, which did
-- not include the local simulation gateway used by the checkout flow.
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('card', 'cash', 'wallet', 'bank_transfer', 'simulation'));
