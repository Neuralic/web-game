-- Create group_social_links table
CREATE TABLE IF NOT EXISTS group_social_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "groupId" TEXT NOT NULL UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Social Links
  discord TEXT,
  twitter TEXT,
  youtube TEXT,
  twitch TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  website TEXT,
  
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_group_social_links_group_id ON group_social_links("groupId");

-- Enable RLS
ALTER TABLE group_social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Group social links are viewable by everyone"
  ON group_social_links FOR SELECT
  USING (true);

CREATE POLICY "Group owners can update social links"
  ON group_social_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_social_links."groupId"
      AND groups."ownerId" = auth.uid()::TEXT
    )
  );

CREATE POLICY "Group owners can insert social links"
  ON group_social_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_social_links."groupId"
      AND groups."ownerId" = auth.uid()::TEXT
    )
  );
