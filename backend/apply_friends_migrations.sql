-- Apply Friends System Migrations
-- Run this SQL on your Supabase database

-- Create friendships table
-- Stores accepted friend relationships
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't be friends with themselves
  CHECK ("userId" != "friendId"),
  
  -- Ensure unique friendship (prevent duplicates in either direction)
  -- We store both directions for easier querying
  UNIQUE("userId", "friendId")
);

-- Create friend_requests table
-- Stores pending friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "respondedAt" TIMESTAMP WITH TIME ZONE,
  
  -- Ensure a user can't send request to themselves
  CHECK ("senderId" != "receiverId"),
  
  -- Ensure unique request (prevent duplicate requests)
  UNIQUE("senderId", "receiverId")
);

-- Create best_friends table
-- Stores best friend designations (max 10 per user)
CREATE TABLE IF NOT EXISTS best_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't best friend themselves
  CHECK ("userId" != "friendId"),
  
  -- Ensure unique best friend relationship
  UNIQUE("userId", "friendId")
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships("userId");
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships("friendId");
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests("senderId");
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests("receiverId");
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_best_friends_user_id ON best_friends("userId");
CREATE INDEX IF NOT EXISTS idx_best_friends_friend_id ON best_friends("friendId");

-- Add comments
COMMENT ON TABLE friendships IS 'Accepted friend relationships between users';
COMMENT ON TABLE friend_requests IS 'Pending friend requests';
COMMENT ON TABLE best_friends IS 'Best friend designations (max 10 per user)';

-- Update blocked_users table to add blockedAt if it doesn't exist
ALTER TABLE blocked_users ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create messages table
-- Stores direct messages between users
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure message has content
  CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000)
);

-- Create notifications table
-- Stores user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'friend_request',
    'friend_accepted',
    'message',
    'group_invite',
    'group_role_change',
    'group_shout',
    'badge_earned',
    'system'
  )),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  "relatedId" UUID, -- ID of related entity (friend request, message, group, etc.)
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure notification has a title
  CHECK (LENGTH(title) > 0)
);

-- Create indexes for messages and notifications
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages("receiverId");
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages("senderId", "receiverId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("userId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications("createdAt" DESC);

-- Add comments
COMMENT ON TABLE messages IS 'Direct messages between users';
COMMENT ON TABLE notifications IS 'User notifications for various events';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Friends system migrations applied successfully!';
END $$;
