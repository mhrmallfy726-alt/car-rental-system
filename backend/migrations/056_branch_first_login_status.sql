-- Support the branch first-login onboarding state.
-- pending = email not verified yet; active = verified and usable; suspended = disabled.
ALTER TABLE branch_accounts
  DROP CONSTRAINT IF EXISTS branch_accounts_status_check;

ALTER TABLE branch_accounts
  ADD CONSTRAINT branch_accounts_status_check
  CHECK (status IN ('pending', 'active', 'suspended'));
