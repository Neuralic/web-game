
-- Create user_accounts table for multi-account feature
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "primaryUserId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "accountUserId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT false,
  "addedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("primaryUserId", "accountUserId")
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own accounts
CREATE POLICY "Users can view their own accounts"
  ON user_accounts FOR SELECT
  USING ("primaryUserId" = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own accounts"
  ON user_accounts FOR INSERT
  WITH CHECK ("primaryUserId" = auth.uid()::TEXT);

CREATE POLICY "Users can update their own accounts"
  ON user_accounts FOR UPDATE
  USING ("primaryUserId" = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own accounts"
  ON user_accounts FOR DELETE
  USING ("primaryUserId" = auth.uid()::TEXT);

-- Create index for faster lookups
CREATE INDEX idx_user_accounts_primary_user ON user_accounts("primaryUserId");
CREATE INDEX idx_user_accounts_active ON user_accounts("primaryUserId", "isActive");
;
