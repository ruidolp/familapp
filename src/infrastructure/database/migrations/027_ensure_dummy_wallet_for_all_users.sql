-- Migration 027: Ensure all users have a 'dummy' wallet
-- Description: Creates or renames the first wallet to 'dummy' for transaction compatibility
-- Date: 2025-11-21

-- ============================================================================
-- ENSURE DUMMY WALLET EXISTS
-- ============================================================================

-- For users who don't have a wallet named 'dummy', rename their first wallet to 'dummy'
-- This ensures backward compatibility with the transaction creation logic

DO $$
DECLARE
  user_record RECORD;
  first_wallet_id TEXT;
  has_dummy BOOLEAN;
BEGIN
  -- Loop through all users
  FOR user_record IN
    SELECT id FROM users
  LOOP
    -- Check if user already has a 'dummy' wallet
    SELECT EXISTS(
      SELECT 1 FROM billeteras
      WHERE usuario_id = user_record.id
      AND nombre = 'dummy'
      AND deleted_at IS NULL
    ) INTO has_dummy;

    -- If user doesn't have a 'dummy' wallet
    IF NOT has_dummy THEN
      -- Get user's first wallet (oldest)
      SELECT id INTO first_wallet_id
      FROM billeteras
      WHERE usuario_id = user_record.id AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1;

      -- If user has at least one wallet, rename it to 'dummy'
      IF first_wallet_id IS NOT NULL THEN
        UPDATE billeteras
        SET nombre = 'dummy', updated_at = NOW()
        WHERE id = first_wallet_id;

        RAISE NOTICE 'Renamed wallet % to dummy for user %', first_wallet_id, user_record.id;
      ELSE
        -- If user has NO wallets, create a 'dummy' wallet
        -- Get user's currency from config (default to CLP)
        DECLARE
          user_currency TEXT;
        BEGIN
          SELECT moneda_principal_id INTO user_currency
          FROM user_config
          WHERE user_id = user_record.id;

          IF user_currency IS NULL THEN
            user_currency := 'CLP';
          END IF;

          INSERT INTO billeteras (
            nombre,
            tipo,
            moneda_principal_id,
            saldo_real,
            saldo_proyectado,
            is_compartida,
            usuario_id,
            created_at,
            updated_at
          ) VALUES (
            'dummy',
            'DEBITO',
            user_currency,
            0,
            0,
            false,
            user_record.id,
            NOW(),
            NOW()
          );

          RAISE NOTICE 'Created dummy wallet for user %', user_record.id;
        END;
      END IF;
    ELSE
      RAISE NOTICE 'User % already has a dummy wallet', user_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all users have a 'dummy' wallet
DO $$
DECLARE
  users_without_dummy INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_dummy
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM billeteras b
    WHERE b.usuario_id = u.id
    AND b.nombre = 'dummy'
    AND b.deleted_at IS NULL
  );

  IF users_without_dummy > 0 THEN
    RAISE EXCEPTION 'Migration failed: % users still without dummy wallet', users_without_dummy;
  ELSE
    RAISE NOTICE 'Migration successful: All users have a dummy wallet';
  END IF;
END $$;
