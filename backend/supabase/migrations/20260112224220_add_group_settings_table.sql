-- Create group_settings table
CREATE TABLE IF NOT EXISTS group_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "groupId" TEXT NOT NULL UNIQUE REFERENCES groups(id) ON DELETE CASCADE,
  
  -- Join Settings
  "manualApproval" BOOLEAN DEFAULT false,
  "verificationLevel" TEXT DEFAULT 'none' CHECK ("verificationLevel" IN ('none', 'low', 'medium', 'high')),
  "accountAgeRequirement" TEXT DEFAULT 'none' CHECK ("accountAgeRequirement" IN ('none', '1day', '3days', '7days', '30days', '90days')),
  
  -- Wall Settings
  "wallEnabled" BOOLEAN DEFAULT true,
  "wallPostPermission" TEXT DEFAULT 'all' CHECK ("wallPostPermission" IN ('all', 'moderators', 'admins', 'owner')),
  
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_settings_group_id ON group_settings("groupId");

-- Enable RLS
ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Group settings are viewable by everyone"
  ON group_settings FOR SELECT
  USING (true);

CREATE POLICY "Group owners can update settings"
  ON group_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_settings."groupId"
      AND groups."ownerId" = auth.uid()::TEXT
    )
  );

CREATE POLICY "Group owners can insert settings"
  ON group_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_settings."groupId"
      AND groups."ownerId" = auth.uid()::TEXT
    )
  );
