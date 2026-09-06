-- Canonical, unique phone numbers for WhatsApp and account identity.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20);

-- Normalize existing values before enforcing uniqueness.
UPDATE users
SET phone_normalized = CASE
  WHEN phone IS NULL OR btrim(phone) = '' THEN NULL
  WHEN regexp_replace(phone, '[^0-9]', '', 'g') LIKE '00967%'
    THEN '+' || substring(regexp_replace(phone, '[^0-9]', '', 'g') FROM 3)
  WHEN regexp_replace(phone, '[^0-9]', '', 'g') LIKE '0%'
       AND length(regexp_replace(phone, '[^0-9]', '', 'g')) = 10
    THEN '+967' || substring(regexp_replace(phone, '[^0-9]', '', 'g') FROM 2)
  WHEN regexp_replace(phone, '[^0-9]', '', 'g') LIKE '967%'
    THEN '+' || regexp_replace(phone, '[^0-9]', '', 'g')
  ELSE '+' || regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE phone_normalized IS NULL;

CREATE OR REPLACE FUNCTION normalize_user_phone_before_write()
RETURNS TRIGGER AS $$
DECLARE
  digits TEXT;
BEGIN
  IF NEW.phone IS NULL OR btrim(NEW.phone) = '' THEN
    NEW.phone_normalized = NULL;
    RETURN NEW;
  END IF;

  digits := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  IF digits LIKE '00967%' THEN
    digits := substring(digits FROM 3);
  ELSIF digits LIKE '0%' AND length(digits) = 10 THEN
    digits := '967' || substring(digits FROM 2);
  END IF;
  NEW.phone_normalized := '+' || digits;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_normalize_phone_trigger ON users;
CREATE TRIGGER users_normalize_phone_trigger
BEFORE INSERT OR UPDATE OF phone ON users
FOR EACH ROW EXECUTE FUNCTION normalize_user_phone_before_write();

-- A duplicate here means existing records need manual reconciliation before retrying.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_normalized
  ON users(phone_normalized)
  WHERE phone_normalized IS NOT NULL;

-- Keep the legacy field canonical for existing and future API consumers.
UPDATE users
SET phone = phone_normalized
WHERE phone_normalized IS NOT NULL;
