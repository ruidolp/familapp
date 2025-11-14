-- Migration: Create Subscription Management Tables
-- Description: Módulo completo de gestión de suscripciones agnóstico del dominio
-- Date: 2025-11-06
-- Important: Usa DEFAULT gen_random_uuid()::TEXT para compatibilidad con mobile

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE subscription_status AS ENUM (
  'trial',
  'active',
  'expired',
  'cancelled',
  'payment_failed',
  'free'
);

CREATE TYPE subscription_platform AS ENUM (
  'web',
  'ios',
  'android'
);

CREATE TYPE subscription_period AS ENUM (
  'monthly',
  'yearly'
);

CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

CREATE TYPE subscription_event_type AS ENUM (
  'trial_started',
  'trial_expired',
  'upgraded',
  'downgraded',
  'cancelled',
  'payment_succeeded',
  'payment_failed',
  'linked',
  'unlinked'
);

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Planes de suscripción disponibles
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  trial_days INTEGER NOT NULL DEFAULT 0,
  max_linked_users INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Planes de suscripción configurables (FREE, PREMIUM, FAMILIAR, etc.)';
COMMENT ON COLUMN subscription_plans.slug IS 'Identificador único del plan (free, premium, familiar)';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Días de trial gratuito al activar el plan (0 = sin trial)';
COMMENT ON COLUMN subscription_plans.max_linked_users IS 'Máximo de usuarios que pueden vincularse a este plan';

-- Capacidades habilitadas por plan (features on/off)
CREATE TABLE plan_capabilities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  capability_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, capability_key)
);

CREATE INDEX idx_plan_capabilities_plan_id ON plan_capabilities(plan_id);
CREATE INDEX idx_plan_capabilities_key ON plan_capabilities(capability_key);

COMMENT ON TABLE plan_capabilities IS 'Capacidades genéricas habilitadas/deshabilitadas por plan';
COMMENT ON COLUMN plan_capabilities.capability_key IS 'Clave de la capacidad (ej: export_data, advanced_reports)';

-- Límites de recursos por plan
CREATE TABLE plan_limits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  resource_key VARCHAR(100) NOT NULL,
  max_quantity INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, resource_key)
);

CREATE INDEX idx_plan_limits_plan_id ON plan_limits(plan_id);
CREATE INDEX idx_plan_limits_resource ON plan_limits(resource_key);

COMMENT ON TABLE plan_limits IS 'Límites cuantitativos de recursos por plan';
COMMENT ON COLUMN plan_limits.resource_key IS 'Clave del recurso (ej: projects, storage_mb)';
COMMENT ON COLUMN plan_limits.max_quantity IS 'Cantidad máxima permitida (NULL = ilimitado)';

-- Suscripciones activas de usuarios
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'free',
  platform subscription_platform,
  platform_subscription_id VARCHAR(255),
  period subscription_period,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_subscriptions_trial ON user_subscriptions(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE UNIQUE INDEX idx_user_subscriptions_platform_id ON user_subscriptions(platform, platform_subscription_id)
  WHERE platform_subscription_id IS NOT NULL;

COMMENT ON TABLE user_subscriptions IS 'Suscripción activa de cada usuario (puede tener solo 1 activa a la vez)';
COMMENT ON COLUMN user_subscriptions.platform_subscription_id IS 'ID de la suscripción en Stripe/Apple/Google';
COMMENT ON COLUMN user_subscriptions.trial_ends_at IS 'Fecha de fin del trial (NULL si no está en trial)';

-- Usuarios vinculados a suscripciones de otros
CREATE TABLE linked_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(owner_user_id, linked_user_id),
  CHECK (owner_user_id != linked_user_id)
);

CREATE INDEX idx_linked_users_owner ON linked_users(owner_user_id);
CREATE INDEX idx_linked_users_linked ON linked_users(linked_user_id);

COMMENT ON TABLE linked_users IS 'Relación de usuarios vinculados (compartir suscripción)';
COMMENT ON COLUMN linked_users.owner_user_id IS 'Usuario propietario que paga el plan';
COMMENT ON COLUMN linked_users.linked_user_id IS 'Usuario que recibe acceso sin pagar';

-- Códigos de invitación para vincular usuarios
CREATE TABLE invitation_codes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  code VARCHAR(20) NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX idx_invitation_codes_owner ON invitation_codes(owner_user_id);
CREATE INDEX idx_invitation_codes_status ON invitation_codes(status);
CREATE INDEX idx_invitation_codes_expires ON invitation_codes(expires_at);

COMMENT ON TABLE invitation_codes IS 'Códigos de invitación para vincular usuarios a planes pagados';
COMMENT ON COLUMN invitation_codes.code IS 'Código único compartible (ej: ABC123XYZ)';
COMMENT ON COLUMN invitation_codes.max_uses IS 'Cuántas veces puede usarse el código';

-- Historial de eventos de suscripciones (auditoría)
CREATE TABLE subscription_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type subscription_event_type NOT NULL,
  from_plan_id TEXT REFERENCES subscription_plans(id) ON DELETE SET NULL,
  to_plan_id TEXT REFERENCES subscription_plans(id) ON DELETE SET NULL,
  platform subscription_platform,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_event ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created ON subscription_history(created_at);

COMMENT ON TABLE subscription_history IS 'Registro completo de eventos de suscripciones para auditoría';
COMMENT ON COLUMN subscription_history.metadata IS 'Datos adicionales en formato JSON';

-- Productos de pago por plan/plataforma/moneda
CREATE TABLE payment_products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  platform subscription_platform NOT NULL,
  period subscription_period NOT NULL,
  currency VARCHAR(3) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  platform_product_id VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, platform, period, currency)
);

CREATE INDEX idx_payment_products_plan ON payment_products(plan_id);
CREATE INDEX idx_payment_products_platform ON payment_products(platform);
CREATE INDEX idx_payment_products_active ON payment_products(active);

COMMENT ON TABLE payment_products IS 'Productos de pago configurados para cada plan/plataforma/moneda';
COMMENT ON COLUMN payment_products.platform_product_id IS 'ID del producto en Stripe/Apple/Google';
COMMENT ON COLUMN payment_products.price IS 'Precio en la moneda especificada';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitation_codes_updated_at
  BEFORE UPDATE ON invitation_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_products_updated_at
  BEFORE UPDATE ON payment_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
