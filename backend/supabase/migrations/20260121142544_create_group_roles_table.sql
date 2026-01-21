-- Create group_roles table
-- This table stores custom roles for groups with granular permissions

CREATE TABLE IF NOT EXISTS group_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId" UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0 CHECK (rank >= 0 AND rank <= 255),
  description TEXT,
  
  -- Permission flags
  "canManageMembers" BOOLEAN DEFAULT FALSE,
  "canManageRoles" BOOLEAN DEFAULT FALSE,
  "canPostOnWall" BOOLEAN DEFAULT TRUE,
  "canDeleteWallPosts" BOOLEAN DEFAULT FALSE,
  "canPostShout" BOOLEAN DEFAULT FALSE,
  "canManageStore" BOOLEAN DEFAULT FALSE,
  "canManageGames" BOOLEAN DEFAULT FALSE,
  "canViewAuditLogs" BOOLEAN DEFAULT FALSE,
  "canManageAlliances" BOOLEAN DEFAULT FALSE,
  "canManageAds" BOOLEAN DEFAULT FALSE,
  "canSpendGroupFunds" BOOLEAN DEFAULT FALSE,
  "canCreateInvites" BOOLEAN DEFAULT TRUE,
  "canBanMembers" BOOLEAN DEFAULT FALSE,
  
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE("groupId", name)
);

-- Create index for faster lookups
CREATE INDEX idx_group_roles_group_id ON group_roles("groupId");
CREATE INDEX idx_group_roles_rank ON group_roles("groupId", rank DESC);

-- Add comment
COMMENT ON TABLE group_roles IS 'Custom roles for groups with granular permission system';
