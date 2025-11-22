/**
 * Migración: Tabla de sesiones invalidadas
 *
 * Esta tabla permite invalidar sesiones JWT sin necesidad de logout manual.
 * Cuando un webhook actualiza la subscription, se marca la sesión como invalidada
 * y el siguiente request del usuario recargará la subscription automáticamente.
 */

-- Crear tabla de sesiones invalidadas
CREATE TABLE IF NOT EXISTS invalidated_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invalidated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason TEXT DEFAULT NULL, -- 'subscription_updated', 'webhook_apple', 'webhook_google', etc
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_invalidated_sessions_user ON invalidated_sessions(user_id);
CREATE INDEX idx_invalidated_sessions_invalidated_at ON invalidated_sessions(invalidated_at);

-- Índice compuesto para query principal (verificar invalidación)
CREATE INDEX idx_invalidated_sessions_user_date ON invalidated_sessions(user_id, invalidated_at DESC);

-- Comentarios
COMMENT ON TABLE invalidated_sessions IS 'Registra cuando una sesión JWT debe ser refrescada (ej: después de webhook de subscription)';
COMMENT ON COLUMN invalidated_sessions.user_id IS 'Usuario cuya sesión fue invalidada';
COMMENT ON COLUMN invalidated_sessions.invalidated_at IS 'Timestamp de invalidación - tokens emitidos antes de esta fecha deben refrescarse';
COMMENT ON COLUMN invalidated_sessions.reason IS 'Motivo de invalidación (para debugging)';
