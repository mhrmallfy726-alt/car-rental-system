-- Notification channel preferences.
-- WhatsApp replaces the old SMS preference without changing existing reservation flows.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notifications_whatsapp BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN users.notifications_email IS 'User preference for non-security email notifications.';
COMMENT ON COLUMN users.notifications_whatsapp IS 'User preference for WhatsApp notifications. Requires the account phone to be reachable on WhatsApp.';
