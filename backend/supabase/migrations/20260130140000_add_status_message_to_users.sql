-- Add status message field to users table for profile customization
-- Migration: add_status_message_to_users
-- Created: 2026-01-30

-- Check if statusMessage column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'statusMessage'
  ) THEN
    ALTER TABLE users ADD COLUMN "statusMessage" TEXT;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN users."statusMessage" IS 'User custom status message displayed on profile';
