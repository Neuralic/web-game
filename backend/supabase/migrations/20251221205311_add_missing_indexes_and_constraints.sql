
-- Add missing indexes for better performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_isBanned ON users("isBanned");
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users("createdAt");

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_userId ON profiles("userId");
CREATE INDEX IF NOT EXISTS idx_profiles_presenceStatus ON profiles("presenceStatus");

-- Friends table indexes
CREATE INDEX IF NOT EXISTS idx_friends_userId ON friends("userId");
CREATE INDEX IF NOT EXISTS idx_friends_friendId ON friends("friendId");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiverId ON messages("receiverId");
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages("createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_isRead ON messages("isRead");

-- Games table indexes
CREATE INDEX IF NOT EXISTS idx_games_creatorId ON games("creatorId");
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
CREATE INDEX IF NOT EXISTS idx_games_isPublished ON games("isPublished");
CREATE INDEX IF NOT EXISTS idx_games_visits ON games(visits DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_isRead ON notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications("createdAt" DESC);

COMMENT ON INDEX idx_users_username IS 'Fast username lookup for login';
COMMENT ON INDEX idx_messages_createdAt IS 'Ordered message retrieval';
COMMENT ON INDEX idx_games_visits IS 'Popular games sorting';
;
