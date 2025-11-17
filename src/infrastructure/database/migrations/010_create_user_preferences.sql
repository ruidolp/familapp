-- Migration 010: Create user_preferences table
-- Stores user-specific preferences for shopping lists interface

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,

  -- Shopping list preferences
  show_inline_qty BOOLEAN NOT NULL DEFAULT true,
  group_by_category BOOLEAN NOT NULL DEFAULT false,
  quick_list_mode BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT user_preferences_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_preferences_unique UNIQUE (user_id)
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences(user_id);

-- Comments
COMMENT ON TABLE user_preferences IS 'User-specific preferences for shopping lists and other features';
COMMENT ON COLUMN user_preferences.show_inline_qty IS 'Whether to show inline quantity editing in shopping lists';
COMMENT ON COLUMN user_preferences.group_by_category IS 'Whether to group shopping list items by category';
COMMENT ON COLUMN user_preferences.quick_list_mode IS 'Whether to use quick list mode (text-based entry)';
