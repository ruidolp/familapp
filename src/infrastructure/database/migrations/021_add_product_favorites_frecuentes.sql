-- ============================================
-- MIGRATION 021: Add Product Favorites and Frequency Tracking
-- ============================================
-- Permite cachear favoritos y productos frecuentes en IndexedDB

-- ============================================
-- FAVORITOS DE PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,  -- DEPRECATED: No usar
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false,  -- DEPRECATED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT product_favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_favorites_custom_fk FOREIGN KEY (product_custom_id) REFERENCES product_user_custom(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_favorites_user_id ON product_favorites(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_product_favorites_unique_custom ON product_favorites(user_id, product_custom_id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN product_favorites.product_id IS 'DEPRECATED: No usar. Mantener solo para migración de datos legacy.';
COMMENT ON COLUMN product_favorites.is_catalog IS 'DEPRECATED: Siempre false. Mantener solo para migración.';

-- ============================================
-- FRECUENCIA DE PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_frequency (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,  -- DEPRECATED: No usar
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false,  -- DEPRECATED
  count_purchases INTEGER NOT NULL DEFAULT 1,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_frequency_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_frequency_custom_fk FOREIGN KEY (product_custom_id) REFERENCES product_user_custom(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_frequency_user_id ON product_frequency(user_id);
CREATE INDEX idx_product_frequency_last_purchase ON product_frequency(user_id, last_purchase_date DESC);
CREATE INDEX idx_product_frequency_count ON product_frequency(user_id, count_purchases DESC);

-- ============================================
-- HISTORIAL DE PRECIOS
-- ============================================
CREATE TABLE IF NOT EXISTS product_prices_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,  -- DEPRECATED: No usar
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false,  -- DEPRECATED
  store_name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_prices_history_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_custom_fk FOREIGN KEY (product_custom_id) REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_currency_fk FOREIGN KEY (currency_id) REFERENCES monedas(id) ON DELETE SET NULL
);

CREATE INDEX idx_product_prices_history_user ON product_prices_history(user_id);
CREATE INDEX idx_product_prices_history_custom ON product_prices_history(product_custom_id);
CREATE INDEX idx_product_prices_history_store ON product_prices_history(store_name);
CREATE INDEX idx_product_prices_history_recorded ON product_prices_history(recorded_at DESC);
