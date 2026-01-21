-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- Go to: https://app.supabase.com → Your Project → SQL Editor → New Query

-- Drop all existing friend-related tables
DROP TABLE IF EXISTS best_friends CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Create friendships table with TEXT IDs
CREATE TABLE friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ("userId" != "friendId"),
  UNIQUE("userId", "friendId")
);

-- Create friend_requests table with TEXT IDs
CREATE TABLE friend_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "respondedAt" TIMESTAMP WITH TIME ZONE,
  CHECK ("senderId" != "receiverId"),
  UNIQUE("senderId", "receiverId")
);

-- Create best_friends table with TEXT IDs
CREATE TABLE best_friends (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "friendId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ("userId" != "friendId"),
  UNIQUE("userId", "friendId")
);

-- Create messages table with TEXT IDs
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000)
);

-- Create notifications table with TEXT IDs
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  "relatedId" TEXT,
  "isRead" BOOLEAN DEFAULT FALSE,
  "readAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (LENGTH(title) > 0)
);

-- Create indexes
CREATE INDEX idx_friendships_user_id ON friendships("userId");
CREATE INDEX idx_friendships_friend_id ON friendships("friendId");
CREATE INDEX idx_friend_requests_sender_id ON friend_requests("senderId");
CREATE INDEX idx_friend_requests_receiver_id ON friend_requests("receiverId");
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_best_friends_user_id ON best_friends("userId");
CREATE INDEX idx_best_friends_friend_id ON best_friends("friendId");
CREATE INDEX idx_messages_sender_id ON messages("senderId");
CREATE INDEX idx_messages_receiver_id ON messages("receiverId");
CREATE INDEX idx_messages_created_at ON messages("createdAt" DESC);
CREATE INDEX idx_notifications_user_id ON notifications("userId");
CREATE INDEX idx_notifications_is_read ON notifications("userId", "isRead");
CREATE INDEX idx_notifications_created_at ON notifications("createdAt" DESC);

-- Add comments
COMMENT ON TABLE friendships IS 'Accepted friend relationships between users';
COMMENT ON TABLE friend_requests IS 'Pending friend requests';
COMMENT ON TABLE best_friends IS 'Best friend designations (max 10 per user)';
COMMENT ON TABLE messages IS 'Direct messages between users';
COMMENT ON TABLE notifications IS 'User notifications for various events';

-- Create trigger function for updated_at
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

-- Success!
SELECT 'Friends system tables created successfully!' as status;
