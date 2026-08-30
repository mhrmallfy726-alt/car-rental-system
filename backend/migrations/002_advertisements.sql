-- =====================================================
-- 18. ADVERTISEMENT REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS advertisement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    ad_type VARCHAR(30) NOT NULL DEFAULT 'featured' CHECK (ad_type IN ('featured', 'discount', 'main', 'urgent')),
    placement VARCHAR(30) NOT NULL DEFAULT 'cars' CHECK (placement IN ('home', 'cars', 'car_detail', 'all_public')),
    requested_budget NUMERIC(12, 2) DEFAULT 0 CHECK (requested_budget >= 0),
    duration_days INTEGER NOT NULL DEFAULT 7 CHECK (duration_days > 0),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_note TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT advertisement_request_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- =====================================================
-- 19. ADVERTISEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES advertisement_requests(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    ad_type VARCHAR(30) NOT NULL DEFAULT 'featured' CHECK (ad_type IN ('featured', 'discount', 'main', 'urgent')),
    placement VARCHAR(30) NOT NULL DEFAULT 'cars' CHECK (placement IN ('home', 'cars', 'car_detail', 'all_public')),
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    price NUMERIC(12, 2) DEFAULT 0 CHECK (price >= 0),
    budget NUMERIC(12, 2) DEFAULT 0 CHECK (budget >= 0),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'paused', 'rejected', 'expired')),
    featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT advertisement_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_ad_requests_supplier ON advertisement_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_status ON advertisement_requests(status);
CREATE INDEX IF NOT EXISTS idx_ad_requests_created ON advertisement_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_status_placement ON advertisements(status, placement);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON advertisements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_car ON advertisements(car_id);

CREATE OR REPLACE TRIGGER update_advertisement_requests_updated_at
    BEFORE UPDATE ON advertisement_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS impressions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS clicks INTEGER NOT NULL DEFAULT 0;

ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2) DEFAULT 0 CHECK (budget >= 0);

ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS image_url INTEGER NOT NULL DEFAULT 0;

ALTER TABLE advertisements
ALTER COLUMN image_url TYPE TEXT
USING image_url::TEXT;


ALTER TABLE advertisements
ADD COLUMN IF NOT EXISTS placement VARCHAR(50);

UPDATE advertisements
SET placement = 'cars'
WHERE placement IS NULL;

ALTER TABLE advertisements
ALTER COLUMN placement SET DEFAULT 'cars';

ALTER TABLE advertisements
ALTER COLUMN placement SET NOT NULL;

ALTER TABLE advertisement_requests
ADD COLUMN IF NOT EXISTS placement VARCHAR(50);

UPDATE advertisement_requests
SET placement = 'cars'
WHERE placement IS NULL;

ALTER TABLE advertisement_requests
ALTER COLUMN placement SET DEFAULT 'cars';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advertisements_placement_check'
  ) THEN
    ALTER TABLE advertisements
    ADD CONSTRAINT advertisements_placement_check
    CHECK (
      placement IN (
        'all_public',
        'homepage',
        'cars',
        'search_results',
        'car_details'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'advertisement_requests_placement_check'
  ) THEN
    ALTER TABLE advertisement_requests
    ADD CONSTRAINT advertisement_requests_placement_check
    CHECK (
      placement IN (
        'all_public',
        'homepage',
        'cars',
        'search_results',
        'car_details'
      )
    );
  END IF;
END $$;
