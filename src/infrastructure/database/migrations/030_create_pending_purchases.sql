/**
 * Migración: Tabla de compras pendientes
 *
 * Almacena el mapping entre transactionId (Apple/Google) y userId
 * cuando un usuario inicia una compra desde la app móvil.
 *
 * Esto permite que los webhooks puedan encontrar al usuario correcto
 * cuando Apple/Google notifican la compra.
 */

-- Crear tabla de compras pendientes
CREATE TABLE IF NOT EXISTS pending_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google', 'sandbox')),
  transaction_id TEXT NOT NULL, -- originalTransactionId (Apple) o purchaseToken (Google)
  product_id TEXT NOT NULL, -- premium_monthly, premium_yearly, etc
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP DEFAULT NULL
);

-- Índices para performance
CREATE INDEX idx_pending_purchases_user ON pending_purchases(user_id);
CREATE INDEX idx_pending_purchases_transaction ON pending_purchases(platform, transaction_id);
CREATE INDEX idx_pending_purchases_status ON pending_purchases(status);

-- Índice compuesto para búsqueda rápida en webhooks
CREATE UNIQUE INDEX idx_pending_purchases_platform_transaction ON pending_purchases(platform, transaction_id) WHERE status = 'pending';

-- Comentarios
COMMENT ON TABLE pending_purchases IS 'Mapea transactionIds de App Stores a userIds durante el proceso de compra';
COMMENT ON COLUMN pending_purchases.transaction_id IS 'originalTransactionId (Apple) o purchaseToken (Google)';
COMMENT ON COLUMN pending_purchases.status IS 'pending: esperando webhook, completed: procesado, failed: error';
