
-- Add primary_group_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primary_group_id TEXT REFERENCES groups(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_primary_group ON users(primary_group_id);

-- Add comment
COMMENT ON COLUMN users.primary_group_id IS 'The user''s primary/displayed group';
;
