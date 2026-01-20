
-- Create events table for platform events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "backgroundColor" TEXT DEFAULT '#6366f1',
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "isFeatured" BOOLEAN DEFAULT false,
  link TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_active ON events("isActive");
CREATE INDEX IF NOT EXISTS idx_events_featured ON events("isFeatured");
CREATE INDEX IF NOT EXISTS idx_events_dates ON events("startDate", "endDate");

-- Add RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view events
CREATE POLICY events_select_policy ON events
  FOR SELECT USING (true);

COMMENT ON TABLE events IS 'Platform events like iHeart LAND, MORE TYCOON, ANIME MARATHON';
;
