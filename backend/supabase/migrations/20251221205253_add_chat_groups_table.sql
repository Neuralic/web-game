
-- Create chat_groups table for group chats (max 10 people)
CREATE TABLE IF NOT EXISTS chat_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  "creatorId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "iconUrl" TEXT,
  "maxMembers" INTEGER DEFAULT 10,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_group_members table
CREATE TABLE IF NOT EXISTS chat_group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "groupId" TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "isAdmin" BOOLEAN DEFAULT false,
  "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("groupId", "userId")
);

-- Create chat_group_messages table
CREATE TABLE IF NOT EXISTS chat_group_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "groupId" TEXT NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_groups_creatorId ON chat_groups("creatorId");
CREATE INDEX IF NOT EXISTS idx_chat_group_members_groupId ON chat_group_members("groupId");
CREATE INDEX IF NOT EXISTS idx_chat_group_members_userId ON chat_group_members("userId");
CREATE INDEX IF NOT EXISTS idx_chat_group_messages_groupId ON chat_group_messages("groupId");
CREATE INDEX IF NOT EXISTS idx_chat_group_messages_createdAt ON chat_group_messages("createdAt");

-- Add RLS
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_groups
CREATE POLICY chat_groups_select_policy ON chat_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_group_members 
      WHERE "groupId" = chat_groups.id 
      AND "userId" = auth.uid()::TEXT
    )
  );

CREATE POLICY chat_groups_insert_policy ON chat_groups
  FOR INSERT WITH CHECK (auth.uid()::TEXT = "creatorId");

-- RLS Policies for chat_group_members
CREATE POLICY chat_group_members_select_policy ON chat_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_group_members cgm
      WHERE cgm."groupId" = chat_group_members."groupId"
      AND cgm."userId" = auth.uid()::TEXT
    )
  );

-- RLS Policies for chat_group_messages
CREATE POLICY chat_group_messages_select_policy ON chat_group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE "groupId" = chat_group_messages."groupId"
      AND "userId" = auth.uid()::TEXT
    )
  );

CREATE POLICY chat_group_messages_insert_policy ON chat_group_messages
  FOR INSERT WITH CHECK (
    auth.uid()::TEXT = "senderId" AND
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE "groupId" = chat_group_messages."groupId"
      AND "userId" = auth.uid()::TEXT
    )
  );

COMMENT ON TABLE chat_groups IS 'Group chats with max 10 members per group';
COMMENT ON TABLE chat_group_members IS 'Members of group chats';
COMMENT ON TABLE chat_group_messages IS 'Messages in group chats';
;
