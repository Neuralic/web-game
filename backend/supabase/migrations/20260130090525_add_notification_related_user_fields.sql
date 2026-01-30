-- Add missing columns to notifications table for related user information
-- Migration: add_notification_related_user_fields
-- Created: 2026-01-30

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS "relatedUserId" TEXT,
ADD COLUMN IF NOT EXISTS "relatedItemId" TEXT;

-- Update the type constraint to include our new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type::text = ANY (ARRAY[
  'friend_request'::character varying,
  'friend_request_accepted'::character varying,
  'friend_accepted'::character varying,
  'message'::character varying,
  'group_invite'::character varying,
  'group_role_change'::character varying,
  'group_shout'::character varying,
  'badge_earned'::character varying,
  'system'::character varying
]::text[]));

-- Enable Realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add comment
COMMENT ON TABLE notifications IS 'User notifications for various events with real-time support';
COMMENT ON COLUMN notifications."relatedUserId" IS 'ID of the user related to this notification (e.g., friend request sender)';
COMMENT ON COLUMN notifications."relatedItemId" IS 'ID of the related item (e.g., friend request ID)';
