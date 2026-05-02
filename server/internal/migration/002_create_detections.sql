CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL,
    site TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    image_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
