-- Migration 006: Create billeteras_transacciones table
-- Description: Track all wallet operations with historical saldo records
-- Supports: CREACION, DEPOSITO, RETIRO, TRANSFERENCIA, AJUSTE

CREATE TABLE IF NOT EXISTS billeteras_transacciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,

  -- Billetera afectada
  billetera_id TEXT NOT NULL REFERENCES billeteras(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Operation type
  tipo TEXT NOT NULL, -- CREACION, DEPOSITO, RETIRO, TRANSFERENCIA, AJUSTE

  -- Amount and currency
  monto DECIMAL(15,2) NOT NULL,
  moneda_id TEXT NOT NULL REFERENCES monedas(id),

  -- Context for transfers (optional)
  billetera_origen_id TEXT REFERENCES billeteras(id) ON DELETE SET NULL,
  billetera_destino_id TEXT REFERENCES billeteras(id) ON DELETE SET NULL,

  -- Historical saldo for charts/graphs
  saldo_real_post DECIMAL(15,2) NOT NULL,

  -- Optional description
  descripcion TEXT,

  -- Metadata
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_billeteras_transacciones_billetera ON billeteras_transacciones(billetera_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_transacciones_usuario ON billeteras_transacciones(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_transacciones_tipo ON billeteras_transacciones(tipo) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_transacciones_fecha ON billeteras_transacciones(fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_transacciones_origen ON billeteras_transacciones(billetera_origen_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_transacciones_destino ON billeteras_transacciones(billetera_destino_id) WHERE deleted_at IS NULL;
