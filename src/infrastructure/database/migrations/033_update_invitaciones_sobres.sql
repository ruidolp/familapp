-- Migration 033: Update invitaciones_sobres for link-based invitations
-- Description: Add fields for email/phone, unique codes, and expiration

-- ============================================================================
-- STEP 1: Add new columns
-- ============================================================================

-- Column for storing email or phone of invitee
ALTER TABLE invitaciones_sobres
  ADD COLUMN IF NOT EXISTS invitado_email_o_telefono TEXT;

-- Unique invitation code for links (when user doesn't exist yet)
ALTER TABLE invitaciones_sobres
  ADD COLUMN IF NOT EXISTS codigo_invitacion TEXT UNIQUE;

-- Expiration date (default 7 days from creation)
ALTER TABLE invitaciones_sobres
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- ============================================================================
-- STEP 2: Make invitado_user_id nullable (for users who don't exist yet)
-- ============================================================================

ALTER TABLE invitaciones_sobres
  ALTER COLUMN invitado_user_id DROP NOT NULL;

-- ============================================================================
-- STEP 3: Add indexes for performance
-- ============================================================================

-- Index for searching by invitation code
CREATE INDEX IF NOT EXISTS idx_invitaciones_sobres_codigo
  ON invitaciones_sobres(codigo_invitacion)
  WHERE codigo_invitacion IS NOT NULL;

-- Index for searching by email/phone
CREATE INDEX IF NOT EXISTS idx_invitaciones_sobres_contacto
  ON invitaciones_sobres(invitado_email_o_telefono)
  WHERE invitado_email_o_telefono IS NOT NULL;

-- Index for expired invitations cleanup
CREATE INDEX IF NOT EXISTS idx_invitaciones_sobres_expires
  ON invitaciones_sobres(expires_at)
  WHERE estado = 'PENDIENTE';

-- ============================================================================
-- STEP 4: Update existing records with default expiration
-- ============================================================================

-- Set default expiration for existing pending invitations (7 days from now)
UPDATE invitaciones_sobres
  SET expires_at = NOW() + INTERVAL '7 days'
  WHERE expires_at IS NULL AND estado = 'PENDIENTE';

-- Set far future expiration for already accepted/rejected (doesn't matter)
UPDATE invitaciones_sobres
  SET expires_at = NOW() + INTERVAL '365 days'
  WHERE expires_at IS NULL AND estado != 'PENDIENTE';

-- ============================================================================
-- NOTES
-- ============================================================================
-- invitado_user_id: NULL if user doesn't exist, UUID if exists
-- invitado_email_o_telefono: Always stored for reference
-- codigo_invitacion: Only set if user doesn't exist (for link sharing)
-- expires_at: Default 7 days, can be customized
