-- ============================================================================
-- Migration 037: Budget Optimization - Aggregation Triggers
-- ============================================================================
-- Purpose: Create triggers to maintain sobres_gastos_resumen in real-time
-- Strategy: Update aggregation table on INSERT, UPDATE, DELETE of transacciones
-- Author: System
-- Date: 2025-12-01
-- ============================================================================

-- RESTOREPOINT: See RESTOREPOINT_BEFORE_BUDGET_OPTIMIZATION.md for rollback

-- ============================================================================
-- FUNCTION: Actualizar resumen al INSERTAR transacción
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_resumen_gastos_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Solo procesar gastos con sobre_id y no eliminados
  IF NEW.sobre_id IS NOT NULL AND NEW.tipo = 'GASTO' AND NEW.deleted_at IS NULL THEN
    -- Extraer año/mes de la fecha de transacción
    v_year := EXTRACT(YEAR FROM NEW.fecha)::INTEGER;
    v_month := EXTRACT(MONTH FROM NEW.fecha)::INTEGER;

    -- Upsert en tabla de resumen
    INSERT INTO sobres_gastos_resumen (
      sobre_id,
      categoria_id,
      periodo_year,
      periodo_month,
      total_gastado,
      cantidad_transacciones,
      updated_at
    )
    VALUES (
      NEW.sobre_id,
      NEW.categoria_id,
      v_year,
      v_month,
      NEW.monto,
      1,
      NOW()
    )
    ON CONFLICT (sobre_id, categoria_id, periodo_year, periodo_month)
    DO UPDATE SET
      total_gastado = sobres_gastos_resumen.total_gastado + NEW.monto,
      cantidad_transacciones = sobres_gastos_resumen.cantidad_transacciones + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_resumen_gastos_insert() IS 'Maintain aggregation table on transaction INSERT';

-- ============================================================================
-- FUNCTION: Actualizar resumen al ACTUALIZAR transacción
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_resumen_gastos_update()
RETURNS TRIGGER AS $$
DECLARE
  v_old_year INTEGER;
  v_old_month INTEGER;
  v_new_year INTEGER;
  v_new_month INTEGER;
BEGIN
  -- PASO 1: Restar valores anteriores si era un gasto válido
  IF OLD.sobre_id IS NOT NULL AND OLD.tipo = 'GASTO' AND OLD.deleted_at IS NULL THEN
    v_old_year := EXTRACT(YEAR FROM OLD.fecha)::INTEGER;
    v_old_month := EXTRACT(MONTH FROM OLD.fecha)::INTEGER;

    -- Restar del resumen anterior
    UPDATE sobres_gastos_resumen
    SET
      total_gastado = total_gastado - OLD.monto,
      cantidad_transacciones = cantidad_transacciones - 1,
      updated_at = NOW()
    WHERE sobre_id = OLD.sobre_id
      AND (
        (categoria_id IS NULL AND OLD.categoria_id IS NULL) OR
        (categoria_id = OLD.categoria_id)
      )
      AND periodo_year = v_old_year
      AND periodo_month = v_old_month;

    -- Eliminar registro si llega a 0 transacciones (limpieza)
    DELETE FROM sobres_gastos_resumen
    WHERE sobre_id = OLD.sobre_id
      AND (
        (categoria_id IS NULL AND OLD.categoria_id IS NULL) OR
        (categoria_id = OLD.categoria_id)
      )
      AND periodo_year = v_old_year
      AND periodo_month = v_old_month
      AND cantidad_transacciones <= 0;
  END IF;

  -- PASO 2: Sumar nuevos valores si sigue siendo un gasto válido
  IF NEW.sobre_id IS NOT NULL AND NEW.tipo = 'GASTO' AND NEW.deleted_at IS NULL THEN
    v_new_year := EXTRACT(YEAR FROM NEW.fecha)::INTEGER;
    v_new_month := EXTRACT(MONTH FROM NEW.fecha)::INTEGER;

    -- Upsert en tabla de resumen con nuevos valores
    INSERT INTO sobres_gastos_resumen (
      sobre_id,
      categoria_id,
      periodo_year,
      periodo_month,
      total_gastado,
      cantidad_transacciones,
      updated_at
    )
    VALUES (
      NEW.sobre_id,
      NEW.categoria_id,
      v_new_year,
      v_new_month,
      NEW.monto,
      1,
      NOW()
    )
    ON CONFLICT (sobre_id, categoria_id, periodo_year, periodo_month)
    DO UPDATE SET
      total_gastado = sobres_gastos_resumen.total_gastado + NEW.monto,
      cantidad_transacciones = sobres_gastos_resumen.cantidad_transacciones + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_resumen_gastos_update() IS 'Maintain aggregation table on transaction UPDATE (handles changes in monto, fecha, sobre, categoria)';

-- ============================================================================
-- FUNCTION: Actualizar resumen al SOFT-DELETE (deleted_at)
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_resumen_gastos_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Solo procesar cuando se marca como eliminado (soft-delete)
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Solo si era un gasto válido con sobre_id
    IF OLD.sobre_id IS NOT NULL AND OLD.tipo = 'GASTO' THEN
      v_year := EXTRACT(YEAR FROM OLD.fecha)::INTEGER;
      v_month := EXTRACT(MONTH FROM OLD.fecha)::INTEGER;

      -- Restar del resumen
      UPDATE sobres_gastos_resumen
      SET
        total_gastado = total_gastado - OLD.monto,
        cantidad_transacciones = cantidad_transacciones - 1,
        updated_at = NOW()
      WHERE sobre_id = OLD.sobre_id
        AND (
          (categoria_id IS NULL AND OLD.categoria_id IS NULL) OR
          (categoria_id = OLD.categoria_id)
        )
        AND periodo_year = v_year
        AND periodo_month = v_month;

      -- Eliminar registro si llega a 0 transacciones (limpieza)
      DELETE FROM sobres_gastos_resumen
      WHERE sobre_id = OLD.sobre_id
        AND (
          (categoria_id IS NULL AND OLD.categoria_id IS NULL) OR
          (categoria_id = OLD.categoria_id)
        )
        AND periodo_year = v_year
        AND periodo_month = v_month
        AND cantidad_transacciones <= 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_resumen_gastos_delete() IS 'Maintain aggregation table on transaction soft-delete (deleted_at set)';

-- ============================================================================
-- TRIGGERS: Wire up functions to transacciones table
-- ============================================================================

-- Trigger on INSERT
CREATE TRIGGER trigger_actualizar_resumen_gastos_insert
AFTER INSERT ON transacciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_resumen_gastos_insert();

-- Trigger on UPDATE (all fields)
CREATE TRIGGER trigger_actualizar_resumen_gastos_update
AFTER UPDATE ON transacciones
FOR EACH ROW
WHEN (
  OLD.monto IS DISTINCT FROM NEW.monto OR
  OLD.fecha IS DISTINCT FROM NEW.fecha OR
  OLD.sobre_id IS DISTINCT FROM NEW.sobre_id OR
  OLD.categoria_id IS DISTINCT FROM NEW.categoria_id OR
  OLD.tipo IS DISTINCT FROM NEW.tipo OR
  OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
)
EXECUTE FUNCTION actualizar_resumen_gastos_update();

-- Trigger on soft-delete (deleted_at change)
CREATE TRIGGER trigger_actualizar_resumen_gastos_delete
AFTER UPDATE OF deleted_at ON transacciones
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
EXECUTE FUNCTION actualizar_resumen_gastos_delete();

-- ============================================================================
-- Initial population of sobres_gastos_resumen (reconciliation)
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Calculate initial aggregations from existing transactions
  INSERT INTO sobres_gastos_resumen (
    sobre_id,
    categoria_id,
    periodo_year,
    periodo_month,
    total_gastado,
    cantidad_transacciones,
    updated_at
  )
  SELECT
    sobre_id,
    categoria_id,
    EXTRACT(YEAR FROM fecha)::INTEGER,
    EXTRACT(MONTH FROM fecha)::INTEGER,
    SUM(monto),
    COUNT(*),
    NOW()
  FROM transacciones
  WHERE deleted_at IS NULL
    AND tipo = 'GASTO'
    AND sobre_id IS NOT NULL
  GROUP BY sobre_id, categoria_id, EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha)
  ON CONFLICT (sobre_id, categoria_id, periodo_year, periodo_month) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE NOTICE '✓ Initial aggregation: % records created in sobres_gastos_resumen', v_count;
END $$;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 037 completed successfully';
  RAISE NOTICE '✓ Created triggers: trigger_actualizar_resumen_gastos_insert, _update, _delete';
  RAISE NOTICE '✓ Aggregation table populated with existing transaction data';
  RAISE NOTICE '⚠ Test triggers by inserting/updating/deleting a test transaction';
  RAISE NOTICE 'ℹ Reconciliation script available in RESTOREPOINT_BEFORE_BUDGET_OPTIMIZATION.md';
END $$;
