
-- Create game_favorites table
CREATE TABLE IF NOT EXISTS game_favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "gameId" TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "gameId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_favorites_userId ON game_favorites("userId");
CREATE INDEX IF NOT EXISTS idx_game_favorites_gameId ON game_favorites("gameId");

-- Add RLS
ALTER TABLE game_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY game_favorites_select_policy ON game_favorites
  FOR SELECT USING (true); -- Anyone can see favorites

CREATE POLICY game_favorites_insert_policy ON game_favorites
  FOR INSERT WITH CHECK (auth.uid()::TEXT = "userId");

CREATE POLICY game_favorites_delete_policy ON game_favorites
  FOR DELETE USING (auth.uid()::TEXT = "userId");

COMMENT ON TABLE game_favorites IS 'Stores user favorite games';
;
