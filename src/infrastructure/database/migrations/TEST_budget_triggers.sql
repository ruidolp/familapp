-- ============================================================================
-- TEST Script: Budget Optimization Triggers
-- ============================================================================
-- Purpose: Verify triggers work correctly for INSERT, UPDATE, DELETE
-- Usage: psql $DATABASE_URL -f src/infrastructure/database/migrations/TEST_budget_triggers.sql
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_test_user_id TEXT;
  v_test_billetera_id TEXT;
  v_test_sobre_id TEXT;
  v_test_categoria_id TEXT;
  v_test_transaccion_id TEXT;
  v_count INTEGER;
  v_total NUMERIC;
  v_cantidad INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING: Budget Optimization Triggers';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- SETUP: Create test data
  -- ============================================================================
  RAISE NOTICE '1. Setup: Creating test data...';

  -- Get or create test user
  SELECT id INTO v_test_user_id FROM users WHERE email = 'test_triggers@example.com' LIMIT 1;

  IF v_test_user_id IS NULL THEN
    INSERT INTO users (name, email, password, account_type)
    VALUES ('Test User Triggers', 'test_triggers@example.com', 'dummy', 'EMAIL')
    RETURNING id INTO v_test_user_id;
    RAISE NOTICE '  ✓ Created test user: %', v_test_user_id;
  ELSE
    RAISE NOTICE '  ✓ Using existing test user: %', v_test_user_id;
  END IF;

  -- Create test billetera
  INSERT INTO billeteras (nombre, tipo, usuario_id, moneda_principal_id, saldo_real)
  VALUES ('Test Wallet Triggers', 'CUENTA_BANCO', v_test_user_id, 'CLP', 1000000)
  RETURNING id INTO v_test_billetera_id;
  RAISE NOTICE '  ✓ Created test wallet: %', v_test_billetera_id;

  -- Create test sobre
  INSERT INTO sobres (nombre, tipo, usuario_id, moneda_principal_id)
  VALUES ('Test Sobre Triggers', 'GASTO', v_test_user_id, 'CLP')
  RETURNING id INTO v_test_sobre_id;
  RAISE NOTICE '  ✓ Created test sobre: %', v_test_sobre_id;

  -- Create test categoria
  INSERT INTO categorias (nombre, usuario_id)
  VALUES ('Test Categoria Triggers', v_test_user_id)
  RETURNING id INTO v_test_categoria_id;
  RAISE NOTICE '  ✓ Created test categoria: %', v_test_categoria_id;

  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 1: INSERT trigger
  -- ============================================================================
  RAISE NOTICE '2. TEST 1: INSERT transaction (trigger should create aggregation)';

  -- Insert test transaction
  INSERT INTO transacciones (
    monto, moneda_id, billetera_id, tipo, usuario_id,
    sobre_id, categoria_id, fecha
  )
  VALUES (
    50000, 'CLP', v_test_billetera_id, 'GASTO', v_test_user_id,
    v_test_sobre_id, v_test_categoria_id, NOW()
  )
  RETURNING id INTO v_test_transaccion_id;
  RAISE NOTICE '  ✓ Inserted transaction: % (monto: 50000)', v_test_transaccion_id;

  -- Verify aggregation was created
  SELECT COUNT(*), COALESCE(SUM(total_gastado), 0), COALESCE(SUM(cantidad_transacciones), 0)
  INTO v_count, v_total, v_cantidad
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW())
    AND periodo_month = EXTRACT(MONTH FROM NOW());

  IF v_count = 1 AND v_total = 50000 AND v_cantidad = 1 THEN
    RAISE NOTICE '  ✅ PASS: Aggregation created correctly';
    RAISE NOTICE '     total_gastado: %, cantidad: %', v_total, v_cantidad;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected 1 record with total=50000, cantidad=1. Got: count=%, total=%, cantidad=%', v_count, v_total, v_cantidad;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 2: UPDATE trigger (change monto)
  -- ============================================================================
  RAISE NOTICE '3. TEST 2: UPDATE transaction monto (trigger should recalculate)';

  -- Update transaction monto
  UPDATE transacciones
  SET monto = 75000
  WHERE id = v_test_transaccion_id;
  RAISE NOTICE '  ✓ Updated transaction monto: 50000 → 75000';

  -- Verify aggregation was updated
  SELECT COALESCE(SUM(total_gastado), 0), COALESCE(SUM(cantidad_transacciones), 0)
  INTO v_total, v_cantidad
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW())
    AND periodo_month = EXTRACT(MONTH FROM NOW());

  IF v_total = 75000 AND v_cantidad = 1 THEN
    RAISE NOTICE '  ✅ PASS: Aggregation updated correctly';
    RAISE NOTICE '     total_gastado: %, cantidad: %', v_total, v_cantidad;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected total=75000, cantidad=1. Got: total=%, cantidad=%', v_total, v_cantidad;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 3: INSERT another transaction (same category)
  -- ============================================================================
  RAISE NOTICE '4. TEST 3: INSERT second transaction (should accumulate)';

  -- Insert another transaction
  INSERT INTO transacciones (
    monto, moneda_id, billetera_id, tipo, usuario_id,
    sobre_id, categoria_id, fecha
  )
  VALUES (
    25000, 'CLP', v_test_billetera_id, 'GASTO', v_test_user_id,
    v_test_sobre_id, v_test_categoria_id, NOW()
  );
  RAISE NOTICE '  ✓ Inserted second transaction (monto: 25000)';

  -- Verify aggregation accumulated
  SELECT COALESCE(SUM(total_gastado), 0), COALESCE(SUM(cantidad_transacciones), 0)
  INTO v_total, v_cantidad
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW())
    AND periodo_month = EXTRACT(MONTH FROM NOW());

  IF v_total = 100000 AND v_cantidad = 2 THEN
    RAISE NOTICE '  ✅ PASS: Aggregation accumulated correctly';
    RAISE NOTICE '     total_gastado: % (75000 + 25000), cantidad: %', v_total, v_cantidad;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected total=100000, cantidad=2. Got: total=%, cantidad=%', v_total, v_cantidad;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 4: SOFT DELETE trigger
  -- ============================================================================
  RAISE NOTICE '5. TEST 4: SOFT DELETE transaction (trigger should subtract)';

  -- Soft delete first transaction
  UPDATE transacciones
  SET deleted_at = NOW()
  WHERE id = v_test_transaccion_id;
  RAISE NOTICE '  ✓ Soft-deleted transaction (monto: 75000)';

  -- Verify aggregation was updated
  SELECT COALESCE(SUM(total_gastado), 0), COALESCE(SUM(cantidad_transacciones), 0)
  INTO v_total, v_cantidad
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW())
    AND periodo_month = EXTRACT(MONTH FROM NOW());

  IF v_total = 25000 AND v_cantidad = 1 THEN
    RAISE NOTICE '  ✅ PASS: Aggregation subtracted correctly';
    RAISE NOTICE '     total_gastado: % (100000 - 75000), cantidad: %', v_total, v_cantidad;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected total=25000, cantidad=1. Got: total=%, cantidad=%', v_total, v_cantidad;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- TEST 5: UPDATE fecha to different month
  -- ============================================================================
  RAISE NOTICE '6. TEST 5: UPDATE fecha to different month (should move aggregation)';

  -- Get current aggregation count
  SELECT COUNT(*) INTO v_count
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id;
  RAISE NOTICE '  Current aggregation records: %', v_count;

  -- Update fecha to previous month
  UPDATE transacciones
  SET fecha = NOW() - INTERVAL '1 month'
  WHERE sobre_id = v_test_sobre_id AND deleted_at IS NULL;
  RAISE NOTICE '  ✓ Updated fecha to previous month';

  -- Verify old period is empty or reduced
  SELECT COALESCE(SUM(total_gastado), 0)
  INTO v_total
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW())
    AND periodo_month = EXTRACT(MONTH FROM NOW());

  -- Verify new period has the transaction
  SELECT COALESCE(SUM(total_gastado), 0)
  INTO v_cantidad
  FROM sobres_gastos_resumen
  WHERE sobre_id = v_test_sobre_id
    AND categoria_id = v_test_categoria_id
    AND periodo_year = EXTRACT(YEAR FROM NOW() - INTERVAL '1 month')
    AND periodo_month = EXTRACT(MONTH FROM NOW() - INTERVAL '1 month');

  IF v_total = 0 AND v_cantidad = 25000 THEN
    RAISE NOTICE '  ✅ PASS: Aggregation moved to correct period';
    RAISE NOTICE '     Current month: %, Previous month: %', v_total, v_cantidad;
  ELSE
    RAISE EXCEPTION '  ❌ FAIL: Expected current=0, previous=25000. Got: current=%, previous=%', v_total, v_cantidad;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- CLEANUP
  -- ============================================================================
  RAISE NOTICE '7. Cleanup: Removing test data...';

  -- Delete test data (cascades will handle related records)
  DELETE FROM transacciones WHERE billetera_id = v_test_billetera_id;
  DELETE FROM sobres_gastos_resumen WHERE sobre_id = v_test_sobre_id;
  DELETE FROM categorias WHERE id = v_test_categoria_id;
  DELETE FROM sobres WHERE id = v_test_sobre_id;
  DELETE FROM billeteras WHERE id = v_test_billetera_id;
  -- Keep user for future tests: DELETE FROM users WHERE id = v_test_user_id;

  RAISE NOTICE '  ✓ Test data cleaned up';
  RAISE NOTICE '';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL TESTS PASSED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tested scenarios:';
  RAISE NOTICE '  ✓ INSERT transaction → aggregation created';
  RAISE NOTICE '  ✓ UPDATE monto → aggregation recalculated';
  RAISE NOTICE '  ✓ INSERT second → aggregation accumulated';
  RAISE NOTICE '  ✓ SOFT DELETE → aggregation subtracted';
  RAISE NOTICE '  ✓ UPDATE fecha → aggregation moved to correct period';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers are working correctly! 🎉';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ TEST FAILED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE '';

    -- Cleanup on error
    IF v_test_billetera_id IS NOT NULL THEN
      DELETE FROM transacciones WHERE billetera_id = v_test_billetera_id;
    END IF;
    IF v_test_sobre_id IS NOT NULL THEN
      DELETE FROM sobres_gastos_resumen WHERE sobre_id = v_test_sobre_id;
      DELETE FROM sobres WHERE id = v_test_sobre_id;
    END IF;
    IF v_test_categoria_id IS NOT NULL THEN
      DELETE FROM categorias WHERE id = v_test_categoria_id;
    END IF;
    IF v_test_billetera_id IS NOT NULL THEN
      DELETE FROM billeteras WHERE id = v_test_billetera_id;
    END IF;

    RAISE;
END $$;

ROLLBACK; -- Always rollback test transactions
