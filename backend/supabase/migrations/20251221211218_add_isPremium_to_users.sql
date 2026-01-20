
-- Add isPremium column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;

-- Create index for premium users
CREATE INDEX IF NOT EXISTS idx_users_isPremium ON users("isPremium");

COMMENT ON COLUMN users."isPremium" IS 'Whether user has active premium subscription';
;
