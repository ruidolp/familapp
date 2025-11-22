-- Migration 003: CORE Financial System Tables
-- Description: Billeteras, Sobres, Categorías, Transacciones, Monedas, User Config
-- Phase 1: Single currency per entity + JSONB for future multi-currency support

-- ============================================================================
-- MONEDAS (Currencies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monedas (
  id TEXT PRIMARY KEY, -- 'CLP', 'USD', 'EUR', 'UF'
  nombre TEXT NOT NULL,
  simbolo TEXT NOT NULL,
  decimales INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL, -- 'FIAT', 'INDICE', 'CRYPTO'
  activa BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pre-cargar monedas iniciales
INSERT INTO monedas (id, nombre, simbolo, decimales, tipo, orden) VALUES
  ('CLP', 'Peso Chileno', '$', 0, 'FIAT', 1),
  ('USD', 'Dólar Estadounidense', 'US$', 2, 'FIAT', 2),
  ('EUR', 'Euro', '€', 2, 'FIAT', 3),
  ('UF', 'Unidad de Fomento', 'UF', 2, 'INDICE', 4)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TIPOS DE CAMBIO (Exchange Rates) - Skeleton para futuro
-- ============================================================================

CREATE TABLE IF NOT EXISTS tipos_cambio (
  moneda_origen TEXT NOT NULL REFERENCES monedas(id),
  moneda_destino TEXT NOT NULL REFERENCES monedas(id),
  tasa DECIMAL(15,6) NOT NULL,
  fecha DATE NOT NULL,
  fuente TEXT, -- API source name
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (moneda_origen, moneda_destino, fecha)
);

CREATE INDEX idx_tipos_cambio_fecha ON tipos_cambio(fecha DESC);

-- ============================================================================
-- USER CONFIG (Configuración de usuario)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_config (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Monedas
  moneda_principal_id TEXT NOT NULL REFERENCES monedas(id) DEFAULT 'CLP',
  monedas_habilitadas TEXT[] NOT NULL DEFAULT ARRAY['CLP'],

  -- Regional
  timezone TEXT NOT NULL DEFAULT 'America/Santiago',
  locale TEXT NOT NULL DEFAULT 'es-CL',
  primer_dia_semana INTEGER NOT NULL DEFAULT 1, -- 0=Domingo, 1=Lunes

  -- Períodos (futuro - skeleton)
  tipo_periodo TEXT NOT NULL DEFAULT 'MENSUAL', -- SEMANAL, QUINCENAL, MENSUAL, CUSTOM
  dia_inicio_periodo INTEGER NOT NULL DEFAULT 1, -- Día del mes/semana

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Crear config por defecto para usuarios existentes
INSERT INTO user_config (user_id)
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM user_config)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- BILLETERAS (Wallets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS billeteras (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- DEBITO, TARJETA_CREDITO, EFECTIVO, etc.

  -- FASE 1: Moneda principal
  moneda_principal_id TEXT NOT NULL REFERENCES monedas(id) DEFAULT 'CLP',
  saldo_real DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_proyectado DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- FASE 2: Monedas adicionales (futuro)
  saldos_multimoneda JSONB, -- {"USD": {"real": 1000, "proyectado": 800}, "EUR": {...}}

  -- Personalización
  color TEXT, -- Hex color: #FF0000
  emoji TEXT, -- Emoji: 💳

  -- Compartir
  is_compartida BOOLEAN NOT NULL DEFAULT false,

  -- Owner
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_billeteras_usuario ON billeteras(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_compartidas ON billeteras(is_compartida) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_moneda ON billeteras(moneda_principal_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- SOBRES (Envelopes/Budgets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sobres (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'GASTO', -- GASTO, AHORRO, DEUDA

  -- FASE 1: Moneda principal
  moneda_principal_id TEXT NOT NULL REFERENCES monedas(id) DEFAULT 'CLP',
  presupuesto_asignado DECIMAL(15,2) DEFAULT 0,
  gastado DECIMAL(15,2) DEFAULT 0,

  -- Para tipo AHORRO (futuro)
  meta_objetivo DECIMAL(15,2),
  ahorrado_actual DECIMAL(15,2),

  -- FASE 2: Monedas adicionales (futuro)
  presupuestos_multimoneda JSONB, -- {"CLP": {"presupuesto": 500000, "gastado": 200000}, "USD": {...}}

  -- Personalización
  color TEXT,
  emoji TEXT,

  -- Compartir
  is_compartido BOOLEAN NOT NULL DEFAULT false,
  max_participantes INTEGER NOT NULL DEFAULT 10,

  -- Owner
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_sobres_usuario ON sobres(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sobres_compartidos ON sobres(is_compartido) WHERE deleted_at IS NULL;
CREATE INDEX idx_sobres_tipo ON sobres(tipo) WHERE deleted_at IS NULL;

-- ============================================================================
-- SOBRES_USUARIOS (Shared envelope participants with tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sobres_usuarios (
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  presupuesto_asignado DECIMAL(15,2) NOT NULL DEFAULT 0,
  gastado DECIMAL(15,2) NOT NULL DEFAULT 0,
  rol TEXT NOT NULL DEFAULT 'CONTRIBUTOR', -- OWNER, ADMIN, CONTRIBUTOR, VIEWER
  permisos JSONB, -- Futuro: {"puede_invitar": true, "solo_lectura": false}
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sobre_id, usuario_id)
);

CREATE INDEX idx_sobres_usuarios_sobre ON sobres_usuarios(sobre_id);
CREATE INDEX idx_sobres_usuarios_usuario ON sobres_usuarios(usuario_id);

-- ============================================================================
-- INVITACIONES_SOBRES (Envelope invitations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invitaciones_sobres (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  invitado_por_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitado_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'CONTRIBUTOR',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitaciones_sobres_sobre ON invitaciones_sobres(sobre_id);
CREATE INDEX idx_invitaciones_sobres_invitado ON invitaciones_sobres(invitado_user_id);
CREATE INDEX idx_invitaciones_sobres_estado ON invitaciones_sobres(estado);

-- ============================================================================
-- CATEGORÍAS (Categories - Global catalog per user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Personalización
  color TEXT,
  emoji TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_categorias_usuario ON categorias(usuario_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_categorias_usuario_nombre_unique ON categorias(usuario_id, LOWER(nombre)) WHERE deleted_at IS NULL;

-- ============================================================================
-- SOBRES_CATEGORIAS (Envelope-Category relationship N:N)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sobres_categorias (
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sobre_id, categoria_id)
);

CREATE INDEX idx_sobres_categorias_sobre ON sobres_categorias(sobre_id);
CREATE INDEX idx_sobres_categorias_categoria ON sobres_categorias(categoria_id);

-- ============================================================================
-- SUBCATEGORÍAS (Subcategories - Brands/Companies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subcategorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Personalización
  color TEXT,
  emoji TEXT,
  imagen_url TEXT, -- Para logos de marcas (futuro)

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subcategorias_usuario ON subcategorias(usuario_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_subcategorias_usuario_categoria_nombre_unique ON subcategorias(usuario_id, categoria_id, LOWER(nombre)) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRANSACCIONES (Transactions - Serializable, flexible)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transacciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  -- OBLIGATORIOS
  monto DECIMAL(15,2) NOT NULL,
  moneda_id TEXT NOT NULL REFERENCES monedas(id),
  billetera_id TEXT NOT NULL REFERENCES billeteras(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- GASTO, INGRESO, TRANSFERENCIA, DEPOSITO, PAGO_TC, AJUSTE
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OPCIONALES (flexibles)
  sobre_id TEXT REFERENCES sobres(id) ON DELETE SET NULL,
  categoria_id TEXT REFERENCES categorias(id) ON DELETE SET NULL,
  subcategoria_id TEXT REFERENCES subcategorias(id) ON DELETE SET NULL,
  descripcion TEXT,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Para transferencias
  billetera_destino_id TEXT REFERENCES billeteras(id) ON DELETE SET NULL,

  -- Para pagos de TC
  pago_tc JSONB, -- {"monto_pagado": 110, "monto_usado": 100, "interes": 10}

  -- Para conversiones de moneda (futuro)
  conversion_info JSONB, -- {"tasa": 950, "monto_destino": 950000, "moneda_destino": "CLP"}

  -- Auto-aumentos de sobre
  auto_aumento_sobre JSONB, -- {"sobre_id": "...", "monto_aumentado": 20, "razon": "EXCESO_PRESUPUESTO"}

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_transacciones_usuario ON transacciones(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_billetera ON transacciones(billetera_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_sobre ON transacciones(sobre_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_categoria ON transacciones(categoria_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_moneda ON transacciones(moneda_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- ASIGNACIONES_PRESUPUESTO (Budget assignments tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS asignaciones_presupuesto (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  billetera_id TEXT NOT NULL REFERENCES billeteras(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  monto DECIMAL(15,2) NOT NULL,
  moneda_id TEXT NOT NULL REFERENCES monedas(id),
  tipo TEXT NOT NULL, -- INICIAL, AUMENTO, DISMINUCION, TRANSFERENCIA
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asignaciones_sobre ON asignaciones_presupuesto(sobre_id);
CREATE INDEX idx_asignaciones_billetera ON asignaciones_presupuesto(billetera_id);
CREATE INDEX idx_asignaciones_usuario ON asignaciones_presupuesto(usuario_id);
CREATE INDEX idx_asignaciones_fecha ON asignaciones_presupuesto(created_at DESC);

-- ============================================================================
-- INGRESOS_RECURRENTES (Recurring income)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingresos_recurrentes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  monto DECIMAL(15,2) NOT NULL,
  moneda_id TEXT NOT NULL REFERENCES monedas(id),
  frecuencia TEXT NOT NULL, -- SEMANAL, QUINCENAL, MENSUAL, ANUAL
  dia INTEGER NOT NULL, -- Día del mes/semana
  billetera_id TEXT NOT NULL REFERENCES billeteras(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Auto-distribución a sobres
  auto_distribuir BOOLEAN NOT NULL DEFAULT false,
  distribucion JSONB, -- [{"sobre_id": "...", "monto": 400}, ...]

  -- Estado
  estado TEXT NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, PAUSADO, ELIMINADO
  proxima_ejecucion TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_ingresos_recurrentes_usuario ON ingresos_recurrentes(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ingresos_recurrentes_estado ON ingresos_recurrentes(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_ingresos_recurrentes_proxima ON ingresos_recurrentes(proxima_ejecucion) WHERE estado = 'ACTIVO';

-- ============================================================================
-- PERIODOS (Budget periods - Skeleton para futuro)
-- ============================================================================

CREATE TABLE IF NOT EXISTS periodos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- SEMANAL, QUINCENAL, MENSUAL, CUSTOM
  dia_inicio INTEGER,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_periodos_usuario ON periodos(user_id);
CREATE INDEX idx_periodos_fechas ON periodos(fecha_inicio, fecha_fin);
CREATE INDEX idx_periodos_activo ON periodos(activo) WHERE activo = true;

-- ============================================================================
-- TRIGGERS para updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monedas_updated_at BEFORE UPDATE ON monedas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_config_updated_at BEFORE UPDATE ON user_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billeteras_updated_at BEFORE UPDATE ON billeteras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sobres_updated_at BEFORE UPDATE ON sobres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategorias_updated_at BEFORE UPDATE ON subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacciones_updated_at BEFORE UPDATE ON transacciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingresos_recurrentes_updated_at BEFORE UPDATE ON ingresos_recurrentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitaciones_sobres_updated_at BEFORE UPDATE ON invitaciones_sobres
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
