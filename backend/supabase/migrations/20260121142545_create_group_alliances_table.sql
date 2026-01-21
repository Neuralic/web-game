-- Create group_alliances table
-- This table stores alliance relationships between groups

CREATE TABLE IF NOT EXISTS group_alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  "alliedGroupId" UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  "requestedBy" UUID NOT NULL, -- groupId that initiated the alliance
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
COMMENT ON TABLE group_alliances IS 'Alliance relationships between groups (like Roblox group allies)';
