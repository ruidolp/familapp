-- Migration 024: Upgrade DECIMAL precision for multi-currency support
-- Description: Change monetary fields from DECIMAL(15,2) to DECIMAL(20,8) to support currencies with more decimals
-- Examples:
--   - Kuwait Dinar (KWD): 3 decimals
--   - Bahrain Dinar (BHD): 3 decimals
--   - Bitcoin (BTC): 8 decimals
--   - Ethereum (ETH): 18 decimals (will use 8 as reasonable max)
--
-- Why DECIMAL(20,8)?
--   - 20 total digits: supports amounts up to 999,999,999,999.99999999
--   - 8 decimal places: supports Bitcoin and most cryptocurrencies
--   - Backwards compatible: existing 2-decimal currencies work perfectly
--
-- Performance impact: Minimal (2 bytes more per field)
-- Data safety: PostgreSQL automatically preserves existing values

-- ============================================================================
-- CORE TABLES: Billeteras, Sobres, Transacciones
-- ============================================================================

-- Billeteras (Wallets)
ALTER TABLE billeteras
  ALTER COLUMN saldo_real TYPE DECIMAL(20,8),
  ALTER COLUMN saldo_proyectado TYPE DECIMAL(20,8);

-- Sobres (Envelopes/Budgets)
ALTER TABLE sobres
  ALTER COLUMN presupuesto_asignado TYPE DECIMAL(20,8),
  ALTER COLUMN gastado TYPE DECIMAL(20,8),
  ALTER COLUMN meta_objetivo TYPE DECIMAL(20,8),
  ALTER COLUMN ahorrado_actual TYPE DECIMAL(20,8);

-- Sobres_Usuarios (Envelope participants tracking)
ALTER TABLE sobres_usuarios
  ALTER COLUMN presupuesto_asignado TYPE DECIMAL(20,8),
  ALTER COLUMN gastado TYPE DECIMAL(20,8);

-- Transacciones (Transactions)
ALTER TABLE transacciones
  ALTER COLUMN monto TYPE DECIMAL(20,8);

-- Asignaciones_Presupuesto (Budget assignments)
ALTER TABLE asignaciones_presupuesto
  ALTER COLUMN monto TYPE DECIMAL(20,8);

-- Ingresos_Recurrentes (Recurring income)
ALTER TABLE ingresos_recurrentes
  ALTER COLUMN monto TYPE DECIMAL(20,8);

-- ============================================================================
-- BILLETERAS TRANSACCIONES: Wallet transaction history
-- ============================================================================

-- Billeteras_Transacciones (Wallet operations history)
ALTER TABLE billeteras_transacciones
  ALTER COLUMN monto TYPE DECIMAL(20,8),
  ALTER COLUMN saldo_real_post TYPE DECIMAL(20,8);

-- ============================================================================
-- SHOPPING: Lists and executions
-- ============================================================================

-- Shopping_Executions (Shopping execution totals)
ALTER TABLE shopping_executions
  ALTER COLUMN total_estimado TYPE DECIMAL(20,8),
  ALTER COLUMN total_calculated TYPE DECIMAL(20,8),
  ALTER COLUMN total_manual TYPE DECIMAL(20,8);

-- Shopping_Execution_Items (Item prices in execution)
ALTER TABLE shopping_execution_items
  ALTER COLUMN precio_unitario TYPE DECIMAL(20,8),
  ALTER COLUMN precio_total TYPE DECIMAL(20,8);

-- ============================================================================
-- PRODUCTS: Price history
-- ============================================================================

-- Product_Prices_History (Product price history)
ALTER TABLE product_prices_history
  ALTER COLUMN price TYPE DECIMAL(20,8);

-- Note: product_catalog does NOT have a price column (prices are tracked in product_prices_history)
-- Note: subscription_plans does NOT have a price column (pricing handled separately)

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify changes applied correctly
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count how many monetary columns were updated
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name IN (
      'saldo_real', 'saldo_proyectado',
      'presupuesto_asignado', 'gastado', 'meta_objetivo', 'ahorrado_actual',
      'monto', 'price', 'precio_unitario', 'precio_total',
      'total_estimado', 'total_calculated', 'total_manual',
      'saldo_real_post'
    )
    AND numeric_precision = 20
    AND numeric_scale = 8;

  RAISE NOTICE 'Successfully upgraded % monetary columns to DECIMAL(20,8)', v_count;

  IF v_count < 19 THEN
    RAISE WARNING 'Expected at least 19 columns upgraded, but only found %. Please verify manually.', v_count;
  END IF;
END $$;
