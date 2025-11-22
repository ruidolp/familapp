-- Seed: Initial Subscription Data
-- Description: Datos iniciales para el módulo de suscripciones
-- Date: 2025-11-06
-- IMPORTANTE: Ejecutar después de 001_create_subscriptions_tables.sql

-- =====================================================
-- PLANES DE SUSCRIPCIÓN
-- =====================================================

INSERT INTO subscription_plans (slug, name, description, trial_days, max_linked_users, active)
VALUES
  (
    'free',
    'Free',
    'Plan gratuito con funcionalidad básica. Perfecto para probar la aplicación.',
    0,  -- Sin trial
    0,  -- Sin usuarios vinculados
    true
  ),
  (
    'premium',
    'Premium',
    'Plan individual o para parejas. Incluye todas las funcionalidades premium y puedes compartir con una persona más.',
    7,  -- 7 días de trial
    1,  -- Puede vincular 1 usuario (pareja)
    true
  ),
  (
    'familiar',
    'Familiar',
    'Plan para toda la familia. Incluye funcionalidades avanzadas y puedes compartir con hasta 4 personas.',
    7,  -- 7 días de trial
    3,  -- Puede vincular 3 usuarios (4 en total contando al owner)
    true
  );

-- =====================================================
-- CAPACIDADES POR PLAN (Features on/off)
-- =====================================================

-- Obtener IDs de planes para las inserciones
DO $$
DECLARE
  free_plan_id UUID;
  premium_plan_id UUID;
  familiar_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM subscription_plans WHERE slug = 'free';
  SELECT id INTO premium_plan_id FROM subscription_plans WHERE slug = 'premium';
  SELECT id INTO familiar_plan_id FROM subscription_plans WHERE slug = 'familiar';

  -- ============== PLAN FREE ==============
  -- Solo capacidades básicas
  INSERT INTO plan_capabilities (plan_id, capability_key, enabled) VALUES
    (free_plan_id, 'view_dashboard', true),
    (free_plan_id, 'create_basic_items', true),
    (free_plan_id, 'export_data', false),
    (free_plan_id, 'advanced_reports', false),
    (free_plan_id, 'invite_users', false),
    (free_plan_id, 'shared_resources', false),
    (free_plan_id, 'priority_support', false),
    (free_plan_id, 'api_access', false);

  -- ============== PLAN PREMIUM ==============
  -- Todas las capacidades excepto las de admin
  INSERT INTO plan_capabilities (plan_id, capability_key, enabled) VALUES
    (premium_plan_id, 'view_dashboard', true),
    (premium_plan_id, 'create_basic_items', true),
    (premium_plan_id, 'export_data', true),
    (premium_plan_id, 'advanced_reports', true),
    (premium_plan_id, 'invite_users', true),
    (premium_plan_id, 'shared_resources', true),
    (premium_plan_id, 'priority_support', true),
    (premium_plan_id, 'api_access', true);

  -- ============== PLAN FAMILIAR ==============
  -- Todas las capacidades incluyendo admin
  INSERT INTO plan_capabilities (plan_id, capability_key, enabled) VALUES
    (familiar_plan_id, 'view_dashboard', true),
    (familiar_plan_id, 'create_basic_items', true),
    (familiar_plan_id, 'export_data', true),
    (familiar_plan_id, 'advanced_reports', true),
    (familiar_plan_id, 'invite_users', true),
    (familiar_plan_id, 'shared_resources', true),
    (familiar_plan_id, 'priority_support', true),
    (familiar_plan_id, 'api_access', true),
    (familiar_plan_id, 'admin_controls', true),
    (familiar_plan_id, 'bulk_operations', true);

  -- =====================================================
  -- LÍMITES DE RECURSOS POR PLAN
  -- =====================================================

  -- ============== PLAN FREE ==============
  INSERT INTO plan_limits (plan_id, resource_key, max_quantity) VALUES
    (free_plan_id, 'projects', 1),              -- 1 proyecto
    (free_plan_id, 'storage_mb', 100),          -- 100MB de almacenamiento
    (free_plan_id, 'items_per_project', 10),    -- 10 items por proyecto
    (free_plan_id, 'api_calls_per_month', 100); -- 100 llamadas API/mes

  -- ============== PLAN PREMIUM ==============
  INSERT INTO plan_limits (plan_id, resource_key, max_quantity) VALUES
    (premium_plan_id, 'projects', 10),              -- 10 proyectos
    (premium_plan_id, 'storage_mb', 5000),          -- 5GB de almacenamiento
    (premium_plan_id, 'items_per_project', 100),    -- 100 items por proyecto
    (premium_plan_id, 'api_calls_per_month', 10000); -- 10k llamadas API/mes

  -- ============== PLAN FAMILIAR ==============
  INSERT INTO plan_limits (plan_id, resource_key, max_quantity) VALUES
    (familiar_plan_id, 'projects', NULL),            -- Proyectos ilimitados
    (familiar_plan_id, 'storage_mb', 50000),         -- 50GB de almacenamiento
    (familiar_plan_id, 'items_per_project', NULL),   -- Items ilimitados
    (familiar_plan_id, 'api_calls_per_month', NULL); -- Llamadas API ilimitadas

  -- =====================================================
  -- PRODUCTOS DE PAGO (Precios por plan/plataforma/moneda)
  -- =====================================================

  -- ============== PLAN PREMIUM - WEB ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    -- USD
    (premium_plan_id, 'web', 'monthly', 'USD', 4.99, 'premium_monthly_usd'),
    (premium_plan_id, 'web', 'yearly', 'USD', 49.00, 'premium_yearly_usd'),
    -- EUR
    (premium_plan_id, 'web', 'monthly', 'EUR', 4.49, 'premium_monthly_eur'),
    (premium_plan_id, 'web', 'yearly', 'EUR', 44.00, 'premium_yearly_eur'),
    -- CLP
    (premium_plan_id, 'web', 'monthly', 'CLP', 4500, 'premium_monthly_clp'),
    (premium_plan_id, 'web', 'yearly', 'CLP', 45000, 'premium_yearly_clp');

  -- ============== PLAN PREMIUM - iOS ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    (premium_plan_id, 'ios', 'monthly', 'USD', 4.99, 'com.yourapp.premium.monthly'),
    (premium_plan_id, 'ios', 'yearly', 'USD', 49.00, 'com.yourapp.premium.yearly');

  -- ============== PLAN PREMIUM - Android ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    (premium_plan_id, 'android', 'monthly', 'USD', 4.99, 'premium_monthly'),
    (premium_plan_id, 'android', 'yearly', 'USD', 49.00, 'premium_yearly');

  -- ============== PLAN FAMILIAR - WEB ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    -- USD
    (familiar_plan_id, 'web', 'monthly', 'USD', 7.99, 'familiar_monthly_usd'),
    (familiar_plan_id, 'web', 'yearly', 'USD', 79.00, 'familiar_yearly_usd'),
    -- EUR
    (familiar_plan_id, 'web', 'monthly', 'EUR', 7.49, 'familiar_monthly_eur'),
    (familiar_plan_id, 'web', 'yearly', 'EUR', 74.00, 'familiar_yearly_eur'),
    -- CLP
    (familiar_plan_id, 'web', 'monthly', 'CLP', 7200, 'familiar_monthly_clp'),
    (familiar_plan_id, 'web', 'yearly', 'CLP', 72000, 'familiar_yearly_clp');

  -- ============== PLAN FAMILIAR - iOS ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    (familiar_plan_id, 'ios', 'monthly', 'USD', 7.99, 'com.yourapp.familiar.monthly'),
    (familiar_plan_id, 'ios', 'yearly', 'USD', 79.00, 'com.yourapp.familiar.yearly');

  -- ============== PLAN FAMILIAR - Android ==============
  INSERT INTO payment_products (plan_id, platform, period, currency, price, platform_product_id) VALUES
    (familiar_plan_id, 'android', 'monthly', 'USD', 7.99, 'familiar_monthly'),
    (familiar_plan_id, 'android', 'yearly', 'USD', 79.00, 'familiar_yearly');

END $$;

-- =====================================================
-- NOTA SOBRE USUARIOS DE PRUEBA
-- =====================================================
-- Los usuarios de prueba se crearán mediante un script TypeScript separado
-- que usa el servicio de autenticación para generar usuarios reales con
-- contraseñas hasheadas correctamente.
--
-- Ver: src/infrastructure/database/scripts/seed-test-users.ts
