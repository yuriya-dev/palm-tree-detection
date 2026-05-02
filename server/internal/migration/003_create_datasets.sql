CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    site TEXT NOT NULL,
    image_count INTEGER NOT NULL,
    annotations INTEGER NOT NULL,
    format TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
