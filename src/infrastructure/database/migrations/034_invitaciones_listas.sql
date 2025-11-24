-- ============================================
-- INVITACIONES DE LISTAS DE COMPRAS
-- ============================================

-- Crear tabla de invitaciones para listas
CREATE TABLE IF NOT EXISTS invitaciones_listas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  lista_id TEXT NOT NULL,
  invitado_por_id TEXT NOT NULL,
  invitado_user_id TEXT,
  invitado_email_o_telefono TEXT NOT NULL,
  codigo_invitacion TEXT UNIQUE,
  rol VARCHAR(50) NOT NULL DEFAULT 'EDITOR',
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT invitaciones_listas_lista_fk FOREIGN KEY (lista_id)
    REFERENCES shopping_lists(id) ON DELETE CASCADE,
  CONSTRAINT invitaciones_listas_invitado_por_fk FOREIGN KEY (invitado_por_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT invitaciones_listas_invitado_user_fk FOREIGN KEY (invitado_user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT invitaciones_listas_rol_check CHECK (rol IN ('EDITOR', 'EXECUTION_ONLY')),
  CONSTRAINT invitaciones_listas_estado_check CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'))
);

CREATE INDEX idx_invitaciones_listas_lista_id ON invitaciones_listas(lista_id);
CREATE INDEX idx_invitaciones_listas_invitado_user ON invitaciones_listas(invitado_user_id) WHERE invitado_user_id IS NOT NULL;
CREATE INDEX idx_invitaciones_listas_codigo ON invitaciones_listas(codigo_invitacion) WHERE codigo_invitacion IS NOT NULL;
CREATE INDEX idx_invitaciones_listas_estado ON invitaciones_listas(estado);

-- ============================================
-- ACTUALIZAR COLABORADORES PARA INCLUIR OWNER
-- ============================================

-- Eliminar constraint anterior
ALTER TABLE shopping_list_collaborators
  DROP CONSTRAINT IF EXISTS shopping_list_collaborators_permission_check;

-- Agregar nuevo constraint con OWNER
ALTER TABLE shopping_list_collaborators
  ADD CONSTRAINT shopping_list_collaborators_permission_check
  CHECK (permission_level IN ('OWNER', 'EDITOR', 'EXECUTION_ONLY'));

-- ============================================
-- MIGRACIÓN DE DATOS: Agregar OWNER a listas existentes
-- ============================================

-- Para cada lista existente, agregar al creador como OWNER en la tabla de colaboradores
INSERT INTO shopping_list_collaborators (
  shopping_list_id,
  user_id,
  permission_level,
  added_by,
  created_at
)
SELECT
  sl.id as shopping_list_id,
  sl.user_id as user_id,
  'OWNER' as permission_level,
  sl.user_id as added_by,
  sl.created_at as created_at
FROM shopping_lists sl
WHERE sl.deleted_at IS NULL
  AND NOT EXISTS (
    -- Solo agregar si no existe ya un registro para este usuario en esta lista
    SELECT 1
    FROM shopping_list_collaborators slc
    WHERE slc.shopping_list_id = sl.id
      AND slc.user_id = sl.user_id
      AND slc.deleted_at IS NULL
  );

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE invitaciones_listas IS 'Invitaciones para compartir listas de compras entre usuarios';
COMMENT ON COLUMN invitaciones_listas.codigo_invitacion IS 'Código único para aceptar la invitación vía link';
COMMENT ON COLUMN invitaciones_listas.rol IS 'Rol que tendrá el usuario: EDITOR (editar items) o EXECUTION_ONLY (solo comprar)';
COMMENT ON COLUMN invitaciones_listas.estado IS 'Estado de la invitación: PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA';
