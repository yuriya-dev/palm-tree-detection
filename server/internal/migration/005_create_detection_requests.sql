CREATE TABLE IF NOT EXISTS detection_requests (
    id TEXT PRIMARY KEY,
    image_name TEXT NOT NULL,
    image_path TEXT NOT NULL,
    site TEXT NOT NULL,
    model TEXT NOT NULL,
    confidence_threshold DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    requested_by TEXT,
    reviewed_by TEXT,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    -- Store ML prediction result for review
    prediction_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_detection_requests_status ON detection_requests(status);
CREATE INDEX IF NOT EXISTS idx_detection_requests_created_at ON detection_requests(created_at DESC);