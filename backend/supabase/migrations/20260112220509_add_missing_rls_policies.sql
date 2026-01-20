-- Add RLS policies for critical tables

-- ============================================
-- USERS TABLE
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::TEXT = id);

-- ============================================
-- PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (
    "profileVisibility" = 'public' OR
    auth.uid()::TEXT = "userId"
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- ============================================
-- MESSAGES TABLE
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (
    auth.uid()::TEXT = "senderId" OR
    auth.uid()::TEXT = "receiverId"
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "senderId");

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::TEXT = "userId");

-- ============================================
-- GROUPS TABLE
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid()::TEXT = "ownerId");

CREATE POLICY "Group owners can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid()::TEXT = "ownerId");

-- ============================================
-- GROUP_MEMBERS TABLE
-- ============================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members are viewable by everyone"
  ON group_members FOR SELECT
  USING (true);

-- ============================================
-- GROUP_ROLES TABLE
-- ============================================
ALTER TABLE group_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group roles are viewable by everyone"
  ON group_roles FOR SELECT
  USING (true);

CREATE POLICY "Group owners can manage roles"
  ON group_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_roles."groupId"
      AND groups."ownerId" = auth.uid()::TEXT
    )
  );

-- ============================================
-- GROUP_WALL_POSTS TABLE
-- ============================================
ALTER TABLE group_wall_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group wall posts are viewable by everyone"
  ON group_wall_posts FOR SELECT
  USING (true);

CREATE POLICY "Group members can create wall posts"
  ON group_wall_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE "groupId" = group_wall_posts."groupId"
      AND "userId" = auth.uid()::TEXT
    )
  );

CREATE POLICY "Post authors can delete their posts"
  ON group_wall_posts FOR DELETE
  USING (auth.uid()::TEXT = "authorId");

-- ============================================
-- INVENTORY_ITEMS TABLE
-- ============================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inventory"
  ON inventory_items FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Users can update their own inventory"
  ON inventory_items FOR UPDATE
  USING (auth.uid()::TEXT = "userId");

-- ============================================
-- ITEMS TABLE
-- ============================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

-- ============================================
-- PREMIUM_SUBSCRIPTIONS TABLE
-- ============================================
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON premium_subscriptions FOR SELECT
  USING (auth.uid()::TEXT = "userId");

-- ============================================
-- USER_BADGES TABLE
-- ============================================
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- ============================================
-- REPORTS TABLE
-- ============================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid()::TEXT = "reporterId");

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid()::TEXT = "reporterId");

-- ============================================
-- GROUP_ALLIANCES TABLE
-- ============================================
ALTER TABLE group_alliances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group alliances are viewable by everyone"
  ON group_alliances FOR SELECT
  USING (true);
