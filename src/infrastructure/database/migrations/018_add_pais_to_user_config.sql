-- Add País field to user_config
-- Permite guardar el país del usuario seleccionado en onboarding
-- Se usa para cargar marcas globales correctas

-- ============================================
-- AGREGAR CAMPO PAIS
-- ============================================
ALTER TABLE user_config ADD COLUMN IF NOT EXISTS pais VARCHAR(10);

-- Migrar datos existentes: extraer país del locale
-- Ejemplos: 'es-CL' -> 'CL', 'es-ES' -> 'ES', 'en-US' -> 'US'
UPDATE user_config
SET pais = UPPER(SPLIT_PART(locale, '-', 2))
WHERE pais IS NULL AND locale LIKE '%-%';

-- Para locales sin guión, usar 'CL' como fallback
UPDATE user_config
SET pais = 'CL'
WHERE pais IS NULL OR pais = '';

-- ============================================
-- ÍNDICE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_config_pais ON user_config(pais);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON COLUMN user_config.pais IS 'Código de país ISO (CL, AR, PE, MX, ES, etc.)';
