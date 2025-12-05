-- Migration 039: Create notificaciones table
-- Tabla para notificaciones del sistema (pérdida de acceso, eventos, etc.)

CREATE TABLE IF NOT EXISTS notificaciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'PERDIDA_ACCESO_SOBRE', 'PERDIDA_ACCESO_LISTA', etc.
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  metadata JSONB, -- Datos adicionales (sobre_id, sobre_historico_id, etc.)
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notificaciones_updated_at
  BEFORE UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE notificaciones IS 'Notificaciones del sistema para usuarios';
COMMENT ON COLUMN notificaciones.tipo IS 'Tipo de notificación: PERDIDA_ACCESO_SOBRE, PERDIDA_ACCESO_LISTA, etc.';
COMMENT ON COLUMN notificaciones.metadata IS 'Datos adicionales en formato JSON (sobre_id, sobre_historico_id, lista_id, etc.)';
COMMENT ON COLUMN notificaciones.leida IS 'Indica si el usuario ya leyó la notificación';
