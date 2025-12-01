-- ============================================================================
-- RECONCILIATION Script: sobres_gastos_resumen
-- ============================================================================
-- Purpose: Recalculate aggregation table from scratch if data becomes inconsistent
-- Usage: psql $DATABASE_URL -f src/infrastructure/database/migrations/RECONCILE_sobres_gastos_resumen.sql
-- When to use:
--   - After bulk data imports
--   - If aggregation data appears incorrect
--   - After restoring from backup
--   - Periodically as maintenance (e.g., monthly)
-- Date: 2025-12-01
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_deleted_count INTEGER;
  v_inserted_count INTEGER;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  v_start_time := clock_timestamp();

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting reconciliation of sobres_gastos_resumen';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Step 1: Truncate existing data
  RAISE NOTICE 'Step 1/3: Clearing existing aggregation data...';
  TRUNCATE sobres_gastos_resumen;
  RAISE NOTICE '✓ Table truncated';
  RAISE NOTICE '';

  -- Step 2: Recalculate from transacciones
  RAISE NOTICE 'Step 2/3: Recalculating aggregations from transacciones...';

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
  GROUP BY sobre_id, categoria_id, EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha);

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  RAISE NOTICE '✓ Inserted % aggregation records', v_inserted_count;
  RAISE NOTICE '';

  -- Step 3: Verify results
  RAISE NOTICE 'Step 3/3: Verification...';

  -- Show summary by year
  RAISE NOTICE '';
  RAISE NOTICE 'Summary by year:';
  FOR v_deleted_count IN (
    SELECT DISTINCT periodo_year
    FROM sobres_gastos_resumen
    ORDER BY periodo_year
  ) LOOP
    SELECT COUNT(*) INTO v_inserted_count
    FROM sobres_gastos_resumen
    WHERE periodo_year = v_deleted_count;

    RAISE NOTICE '  Year %: % records', v_deleted_count, v_inserted_count;
  END LOOP;

  v_end_time := clock_timestamp();

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ RECONCILIATION COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Duration: % seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time));
  RAISE NOTICE 'Total records: %', v_inserted_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers will maintain this data automatically going forward.';
  RAISE NOTICE '';
END $$;

COMMIT;
