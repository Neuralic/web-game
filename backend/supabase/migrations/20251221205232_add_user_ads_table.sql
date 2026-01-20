
-- Create user_ads table for user advertisements
CREATE TABLE IF NOT EXISTS user_ads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "targetUrl" TEXT,
  budget INTEGER DEFAULT 0,
  spent INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, active, paused, completed, rejected
  "startDate" TIMESTAMP,
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ads_userId ON user_ads("userId");
CREATE INDEX IF NOT EXISTS idx_user_ads_status ON user_ads(status);
CREATE INDEX IF NOT EXISTS idx_user_ads_dates ON user_ads("startDate", "endDate");

-- Add RLS
ALTER TABLE user_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_ads_select_policy ON user_ads
  FOR SELECT USING (true); -- Everyone can see active ads

CREATE POLICY user_ads_insert_policy ON user_ads
  FOR INSERT WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY user_ads_update_policy ON user_ads
  FOR UPDATE USING (auth.uid()::TEXT = "userId");

CREATE POLICY user_ads_delete_policy ON user_ads
  FOR DELETE USING (auth.uid()::TEXT = "userId");

COMMENT ON TABLE user_ads IS 'User-created advertisements shown on the platform';
;
