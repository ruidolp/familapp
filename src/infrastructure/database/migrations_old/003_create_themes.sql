/**
 * Migration: User Themes System
 *
 * Creates table to store user theme preferences and preestablished themes.
 * All themes are fully customizable via CSS variables.
 */

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE theme_category AS ENUM ('preestablished', 'custom');

-- =====================================================
-- THEMES TABLE
-- =====================================================

CREATE TABLE themes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  -- Theme identification
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category theme_category NOT NULL DEFAULT 'preestablished',

  -- Theme colors (stored as HSL values for Tailwind)
  -- All colors are customizable
  colors JSONB NOT NULL,

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- USER THEME PREFERENCES TABLE
-- =====================================================

CREATE TABLE user_theme_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,

  -- Custom overrides (optional - if user customizes a preestablished theme)
  custom_colors JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One theme per user
  UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_category ON themes(category);
CREATE INDEX idx_user_theme_preferences_user_id ON user_theme_preferences(user_id);
CREATE INDEX idx_user_theme_preferences_theme_id ON user_theme_preferences(theme_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_theme_preferences_updated_at
  BEFORE UPDATE ON user_theme_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
