-- ============================================================================
-- Migration 036: Budget Optimization - Aggregation Tables
-- ============================================================================
-- Purpose: Create pre-calculated aggregation tables for performance optimization
-- Strategy: Maintain real-time aggregated expense data per sobre/category/period
-- Author: System
-- Date: 2025-12-01
-- ============================================================================

-- RESTOREPOINT: See RESTOREPOINT_BEFORE_BUDGET_OPTIMIZATION.md for rollback

-- ============================================================================
-- TABLE 1: sobres_presupuestos
-- Configuration of budget per envelope per period
-- ============================================================================
CREATE TABLE IF NOT EXISTS sobres_presupuestos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  periodo_year INTEGER NOT NULL,
  periodo_month INTEGER NOT NULL,

  -- Budget control
  presupuesto_enabled BOOLEAN NOT NULL DEFAULT false,
  monto_global DECIMAL(15,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- One record per envelope per period
  CONSTRAINT unique_sobre_periodo UNIQUE(sobre_id, periodo_year, periodo_month)
);

CREATE INDEX idx_sobres_presupuestos_sobre ON sobres_presupuestos(sobre_id);
CREATE INDEX idx_sobres_presupuestos_periodo ON sobres_presupuestos(periodo_year, periodo_month);
CREATE INDEX idx_sobres_presupuestos_enabled ON sobres_presupuestos(presupuesto_enabled) WHERE presupuesto_enabled = true;

COMMENT ON TABLE sobres_presupuestos IS 'Budget configuration per envelope per period';
COMMENT ON COLUMN sobres_presupuestos.presupuesto_enabled IS 'Enable/disable budget tracking (soft limits)';
COMMENT ON COLUMN sobres_presupuestos.monto_global IS 'Total budget amount for the envelope in this period';

-- ============================================================================
-- TABLE 2: sobres_categorias_cuotas
-- Budget quotas per category within an envelope
-- ============================================================================
CREATE TABLE IF NOT EXISTS sobres_categorias_cuotas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  presupuesto_id TEXT NOT NULL REFERENCES sobres_presupuestos(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,

  -- Quota amount (soft limit)
  monto_cuota DECIMAL(15,2) NOT NULL,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_presupuesto_categoria UNIQUE(presupuesto_id, categoria_id)
);

CREATE INDEX idx_categorias_cuotas_presupuesto ON sobres_categorias_cuotas(presupuesto_id);
CREATE INDEX idx_categorias_cuotas_categoria ON sobres_categorias_cuotas(categoria_id);

COMMENT ON TABLE sobres_categorias_cuotas IS 'Optional budget quotas per category (soft limits for visual feedback)';
COMMENT ON COLUMN sobres_categorias_cuotas.monto_cuota IS 'Target spending limit for this category (not enforced, only visual)';

-- ============================================================================
-- TABLE 3: presupuesto_ajustes_log
-- Audit log of all budget adjustments (Option C - Full audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS presupuesto_ajustes_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  periodo_year INTEGER NOT NULL,
  periodo_month INTEGER NOT NULL,

  -- Adjustment type and target
  tipo_ajuste TEXT NOT NULL,  -- AUMENTO_GLOBAL, DISMINUCION_GLOBAL, AUMENTO_CUOTA_CATEGORIA, DISMINUCION_CUOTA_CATEGORIA, NUEVA_CUOTA, ELIMINAR_CUOTA
  campo TEXT NOT NULL,         -- 'global' or categoria_id
  categoria_id TEXT REFERENCES categorias(id) ON DELETE SET NULL,

  -- Change tracking
  valor_anterior DECIMAL(15,2),
  valor_nuevo DECIMAL(15,2),
  diferencia DECIMAL(15,2),    -- valor_nuevo - valor_anterior (positive = increase, negative = decrease)

  -- Audit fields
  usuario_id TEXT NOT NULL REFERENCES users(id),
  fecha_ajuste TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo TEXT,                  -- Optional: "Manual adjustment", "Initial configuration", etc.

  -- Validation
  CONSTRAINT valid_tipo_ajuste CHECK (tipo_ajuste IN (
    'AUMENTO_GLOBAL',
    'DISMINUCION_GLOBAL',
    'AUMENTO_CUOTA_CATEGORIA',
    'DISMINUCION_CUOTA_CATEGORIA',
    'NUEVA_CUOTA',
    'ELIMINAR_CUOTA'
  ))
);

CREATE INDEX idx_presupuesto_ajustes_sobre_periodo ON presupuesto_ajustes_log(sobre_id, periodo_year, periodo_month);
CREATE INDEX idx_presupuesto_ajustes_fecha ON presupuesto_ajustes_log(fecha_ajuste DESC);
CREATE INDEX idx_presupuesto_ajustes_categoria ON presupuesto_ajustes_log(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX idx_presupuesto_ajustes_tipo ON presupuesto_ajustes_log(tipo_ajuste);

COMMENT ON TABLE presupuesto_ajustes_log IS 'Complete audit log of budget adjustments for analytics and stats';
COMMENT ON COLUMN presupuesto_ajustes_log.diferencia IS 'Positive values = increase, negative values = decrease';

-- ============================================================================
-- TABLE 4: sobres_gastos_resumen (OPTIMIZATION)
-- Pre-calculated expense aggregations per envelope/category/period
-- ============================================================================
CREATE TABLE IF NOT EXISTS sobres_gastos_resumen (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id) ON DELETE CASCADE,
  categoria_id TEXT REFERENCES categorias(id) ON DELETE CASCADE,
  periodo_year INTEGER NOT NULL,
  periodo_month INTEGER NOT NULL,

  -- Aggregated data (maintained by triggers)
  total_gastado DECIMAL(15,2) NOT NULL DEFAULT 0,
  cantidad_transacciones INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- One record per envelope per category per period
  -- NULL categoria_id = totals without category
  CONSTRAINT unique_sobre_cat_periodo UNIQUE(sobre_id, categoria_id, periodo_year, periodo_month)
);

CREATE INDEX idx_gastos_resumen_sobre ON sobres_gastos_resumen(sobre_id);
CREATE INDEX idx_gastos_resumen_periodo ON sobres_gastos_resumen(periodo_year, periodo_month);
CREATE INDEX idx_gastos_resumen_categoria ON sobres_gastos_resumen(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX idx_gastos_resumen_sobre_periodo ON sobres_gastos_resumen(sobre_id, periodo_year, periodo_month);

COMMENT ON TABLE sobres_gastos_resumen IS 'Pre-calculated expense aggregations - updated by triggers on transacciones';
COMMENT ON COLUMN sobres_gastos_resumen.total_gastado IS 'Sum of all expense transactions (maintained automatically)';
COMMENT ON COLUMN sobres_gastos_resumen.cantidad_transacciones IS 'Count of transactions (maintained automatically)';

-- ============================================================================
-- Trigger for updated_at on new tables
-- ============================================================================
CREATE TRIGGER update_sobres_presupuestos_updated_at
  BEFORE UPDATE ON sobres_presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sobres_categorias_cuotas_updated_at
  BEFORE UPDATE ON sobres_categorias_cuotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sobres_gastos_resumen_updated_at
  BEFORE UPDATE ON sobres_gastos_resumen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 036 completed successfully';
  RAISE NOTICE '✓ Created tables: sobres_presupuestos, sobres_categorias_cuotas, presupuesto_ajustes_log, sobres_gastos_resumen';
  RAISE NOTICE '⚠ Next step: Run migration 037 to create aggregation triggers';
END $$;
