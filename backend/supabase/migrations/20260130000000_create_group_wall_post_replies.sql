-- Create group_wall_post_replies table for wall post comments/replies
CREATE TABLE IF NOT EXISTS group_wall_post_replies (
  id TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL REFERENCES group_wall_posts(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_wall_post_replies_post_id ON group_wall_post_replies("postId");
CREATE INDEX idx_wall_post_replies_author_id ON group_wall_post_replies("authorId");
CREATE INDEX idx_wall_post_replies_created_at ON group_wall_post_replies("createdAt" DESC);

-- Add reply_count column to group_wall_posts for caching
ALTER TABLE group_wall_posts ADD COLUMN IF NOT EXISTS "replyCount" INTEGER DEFAULT 0;

-- Create function to update reply count
CREATE OR REPLACE FUNCTION update_wall_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_wall_posts 
    SET "replyCount" = "replyCount" + 1 
    WHERE id = NEW."postId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_wall_posts 
    SET "replyCount" = GREATEST("replyCount" - 1, 0)
    WHERE id = OLD."postId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reply count
CREATE TRIGGER trigger_update_wall_post_reply_count
AFTER INSERT OR DELETE ON group_wall_post_replies
FOR EACH ROW
EXECUTE FUNCTION update_wall_post_reply_count();

-- Enable Row Level Security
ALTER TABLE group_wall_post_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_wall_post_replies
CREATE POLICY "Wall post replies are viewable by everyone"
  ON group_wall_post_replies FOR SELECT
  USING (true);

CREATE POLICY "Group members can create replies"
  ON group_wall_post_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_wall_posts gwp
      INNER JOIN group_members gm ON gwp."groupId" = gm."groupId"
      WHERE gwp.id = group_wall_post_replies."postId"
      AND gm."userId" = auth.uid()::TEXT
    )
  );

CREATE POLICY "Reply authors can delete their replies"
  ON group_wall_post_replies FOR DELETE
  USING (auth.uid()::TEXT = "authorId");

-- Create trigger for updatedAt
CREATE TRIGGER update_wall_post_replies_updated_at
BEFORE UPDATE ON group_wall_post_replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
