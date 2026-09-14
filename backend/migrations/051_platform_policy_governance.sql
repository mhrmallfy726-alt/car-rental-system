BEGIN;

CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(250) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'ar',
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'effective' CHECK (status IN ('draft', 'effective', 'retired')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  account_type VARCHAR(30) NOT NULL,
  context_type VARCHAR(30) NOT NULL CHECK (context_type IN ('account', 'reservation', 'payment')),
  context_id UUID,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_context ON policy_acceptances(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_user ON policy_acceptances(user_id, accepted_at DESC);

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS policy_version VARCHAR(30),
  ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delay_grace_minutes INTEGER NOT NULL DEFAULT 0 CHECK (delay_grace_minutes >= 0),
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS response_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appeal_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financial_claim DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS evidence_summary TEXT,
  ADD COLUMN IF NOT EXISTS decision_type VARCHAR(30) CHECK (decision_type IN ('accepted', 'partially_accepted', 'rejected', 'more_information', 'administratively_closed')),
  ADD COLUMN IF NOT EXISTS decision_reason TEXT,
  ADD COLUMN IF NOT EXISTS decision_evidence TEXT,
  ADD COLUMN IF NOT EXISTS financial_effect DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS decision_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appealed_at TIMESTAMPTZ;

INSERT INTO policy_versions (version, title, language, body, status)
VALUES ('1.0', 'سياسة الحجوزات والتسليم والاستلام والشكاوى والنزاعات', 'ar',
'تطبق هذه السياسة على الحجز والتسليم والاستلام والإلغاء والشكاوى والنزاعات. يجب توثيق حالة السيارة بالصور والعداد والوقود قبل التسليم وبعد الإعادة. مهلة الرد على النزاع 48 ساعة، ومهلة الاعتراض 72 ساعة، والإبلاغ عن ضرر الإعادة خلال 24 ساعة. لا يخصم أي مبلغ قبل قرار إداري مسبب وموثق.',
'effective')
ON CONFLICT (version) DO NOTHING;

COMMIT;

COMMENT ON TABLE policy_acceptances IS 'نسخة السياسة التي وافق عليها المستخدم وسياق الموافقة';
COMMENT ON TABLE policy_versions IS 'إصدارات السياسة المعتمدة أو المسودة';
