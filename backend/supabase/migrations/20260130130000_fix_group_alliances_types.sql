-- Fix group_alliances table data types from UUID to TEXT
-- Drop and recreate the table with correct types

DROP TABLE IF EXISTS group_alliances CASCADE;

CREATE TABLE group_alliances (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "groupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  "alliedGroupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  "requestedBy" TEXT NOT NULL,
  "requestedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "respondedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a group can't ally with itself
  CHECK ("groupId" != "alliedGroupId"),
  
  -- Ensure unique alliance (prevent duplicates in either direction)
  UNIQUE("groupId", "alliedGroupId")
);

-- Create indexes for faster lookups
CREATE INDEX idx_group_alliances_group_id ON group_alliances("groupId");
CREATE INDEX idx_group_alliances_allied_group_id ON group_alliances("alliedGroupId");
CREATE INDEX idx_group_alliances_status ON group_alliances(status);

-- Add comment
COMMENT ON TABLE group_alliances IS 'Alliance relationships between groups';
