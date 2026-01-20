
-- Create blocked_users table for user blocking system
CREATE TABLE IF NOT EXISTS blocked_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "blockedUserId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "blockedUserId")
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_userId ON blocked_users("userId");
CREATE INDEX IF NOT EXISTS idx_blocked_users_blockedUserId ON blocked_users("blockedUserId");

-- Add RLS (Row Level Security)
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own blocks
CREATE POLICY blocked_users_select_policy ON blocked_users
  FOR SELECT USING (auth.uid()::TEXT = "userId");

CREATE POLICY blocked_users_insert_policy ON blocked_users
  FOR INSERT WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY blocked_users_delete_policy ON blocked_users
  FOR DELETE USING (auth.uid()::TEXT = "userId");

COMMENT ON TABLE blocked_users IS 'Stores blocked user relationships - users can block other users from contacting them';
;
