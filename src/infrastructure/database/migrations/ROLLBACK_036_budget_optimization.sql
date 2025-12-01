-- ============================================================================
-- ROLLBACK Script: Budget Optimization (Migrations 036-037-038)
-- ============================================================================
-- Purpose: Completely rollback budget optimization changes
-- Usage: psql $DATABASE_URL -f src/infrastructure/database/migrations/ROLLBACK_036_budget_optimization.sql
-- Date: 2025-12-01
-- Updated: Includes fix from migration 038
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Drop triggers (must be done before dropping functions)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Step 1/4: Dropping triggers...';
END $$;

DROP TRIGGER IF EXISTS trigger_actualizar_resumen_gastos_insert ON transacciones;
DROP TRIGGER IF EXISTS trigger_actualizar_resumen_gastos_update ON transacciones;
DROP TRIGGER IF EXISTS trigger_actualizar_resumen_gastos_delete ON transacciones;

DROP TRIGGER IF EXISTS update_sobres_presupuestos_updated_at ON sobres_presupuestos;
DROP TRIGGER IF EXISTS update_sobres_categorias_cuotas_updated_at ON sobres_categorias_cuotas;
DROP TRIGGER IF EXISTS update_sobres_gastos_resumen_updated_at ON sobres_gastos_resumen;

-- ============================================================================
-- STEP 2: Drop functions
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Step 2/4: Dropping functions...';
END $$;

DROP FUNCTION IF EXISTS actualizar_resumen_gastos_insert();
DROP FUNCTION IF EXISTS actualizar_resumen_gastos_update();
DROP FUNCTION IF EXISTS actualizar_resumen_gastos_delete();

-- ============================================================================
-- STEP 3: Drop tables (in reverse dependency order)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Step 3/4: Dropping tables...';
END $$;

-- Drop tables with foreign keys first
DROP TABLE IF EXISTS sobres_categorias_cuotas CASCADE;
DROP TABLE IF EXISTS presupuesto_ajustes_log CASCADE;
DROP TABLE IF EXISTS sobres_gastos_resumen CASCADE;

-- Drop parent table last
DROP TABLE IF EXISTS sobres_presupuestos CASCADE;

-- ============================================================================
-- STEP 4: Verify cleanup
-- ============================================================================
DO $$
DECLARE
  v_trigger_count INTEGER;
  v_function_count INTEGER;
  v_table_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 4/4: Verifying cleanup...';

  -- Check triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname LIKE '%resumen_gastos%';

  -- Check functions
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname LIKE '%resumen_gastos%';

  -- Check tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'sobres_presupuestos',
    'sobres_categorias_cuotas',
    'presupuesto_ajustes_log',
    'sobres_gastos_resumen'
  );

  IF v_trigger_count > 0 THEN
    RAISE WARNING 'Warning: % triggers still exist', v_trigger_count;
  END IF;

  IF v_function_count > 0 THEN
    RAISE WARNING 'Warning: % functions still exist', v_function_count;
  END IF;

  IF v_table_count > 0 THEN
    RAISE WARNING 'Warning: % tables still exist', v_table_count;
  ELSE
    RAISE NOTICE '✓ All tables dropped successfully';
  END IF;

  RAISE NOTICE '✓ Rollback verification complete';
END $$;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ ROLLBACK COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Regenerate TypeScript types: npm run db:types';
  RAISE NOTICE '2. Restore backup query files if needed';
  RAISE NOTICE '3. Restart application server';
  RAISE NOTICE '';
  RAISE NOTICE 'System restored to state before migrations 036-037';
  RAISE NOTICE '';
END $$;

COMMIT;
