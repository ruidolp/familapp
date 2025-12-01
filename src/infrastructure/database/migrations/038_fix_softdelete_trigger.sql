-- ============================================================================
-- Migration 038: Fix Soft-Delete Trigger Duplication
-- ============================================================================
-- Issue: Both UPDATE and DELETE triggers execute on soft-delete causing double subtraction
-- Solution: Modify UPDATE trigger to skip soft-delete scenarios
-- ============================================================================

-- Drop and recreate UPDATE trigger function with fix
CREATE OR REPLACE FUNCTION actualizar_resumen_gastos_update()
RETURNS TRIGGER AS $$
DECLARE
  v_old_year INTEGER;
  v_old_month INTEGER;
  v_new_year INTEGER;
  v_new_month INTEGER;
BEGIN
  -- SKIP if this is a soft-delete (handled by dedicated trigger)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

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

COMMENT ON FUNCTION actualizar_resumen_gastos_update() IS 'Maintain aggregation table on transaction UPDATE (excludes soft-delete, handled by dedicated trigger)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 038 completed: Soft-delete trigger duplication fixed';
  RAISE NOTICE '  UPDATE trigger now skips soft-delete scenarios';
  RAISE NOTICE '  DELETE trigger handles soft-deletes exclusively';
END $$;
