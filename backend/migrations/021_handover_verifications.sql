BEGIN;

CREATE TABLE IF NOT EXISTS handover_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  handover_log_id UUID NOT NULL REFERENCES handover_logs(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  stage VARCHAR(20) NOT NULL CHECK (stage IN ('before', 'after')),
  result VARCHAR(20) NOT NULL CHECK (result IN ('matched', 'discrepancy')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reservation_id, handover_log_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_handover_verifications_reservation
  ON handover_verifications(reservation_id, stage, created_at DESC);

CREATE TABLE IF NOT EXISTS handover_verification_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES handover_verifications(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handover_verification_images_verification
  ON handover_verification_images(verification_id);

COMMIT;
