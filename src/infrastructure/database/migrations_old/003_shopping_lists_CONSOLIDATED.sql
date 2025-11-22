-- ============================================================================
-- SHOPPING LISTS MODULE - CONSOLIDATED STRUCTURE
-- ============================================================================
-- Este archivo reemplaza:
-- - 003_shopping_lists.sql
-- - 011_add_global_product_categories.sql
-- - Migraciones 019-025 (patches)
--
-- Incluye estructura completa con:
-- - Productos: catálogo global (idioma) + productos usuario (sin FKs problemáticos)
-- - Categorías: global (idioma) + usuario
-- - Listas de compras
-- - Ejecuciones de compra
-- ============================================================================

-- ============================================
-- PRODUCT CATALOG (Global Products)
-- ============================================
-- Catálogo global independiente, sin FK desde otras tablas
-- Usa idioma (es, en, pt) en lugar de país
-- Puede truncarse/recrearse sin afectar datos de usuarios

CREATE TABLE IF NOT EXISTS product_catalog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(255) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es',
  category_id TEXT, -- Referencia a product_categories_global (sin FK)
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices (sin unique constraint para permitir duplicados en diferentes idiomas)
CREATE INDEX IF NOT EXISTS idx_product_catalog_idioma
  ON product_catalog(idioma) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_catalog_nombre_idioma_unique
  ON product_catalog(LOWER(nombre), idioma) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_nombre
  ON product_catalog(LOWER(nombre)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_updated_at
  ON product_catalog(updated_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_catalog_category_id
  ON product_catalog(category_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE product_catalog IS 'Catálogo global de productos (independiente, sin FKs desde otras tablas). Puede truncarse sin afectar listas de usuarios.';
COMMENT ON COLUMN product_catalog.idioma IS 'Idioma del producto (es, en, pt). Un producto en español sirve para todos los países hispanohablantes.';
COMMENT ON COLUMN product_catalog.category_id IS 'Referencia a product_categories_global (SIN FK para independencia)';

-- ============================================
-- PRODUCT CATEGORIES GLOBAL
-- ============================================
-- Categorías globales independientes, sin FK desde otras tablas

CREATE TABLE IF NOT EXISTS product_categories_global (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(100) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es',
  descripcion TEXT,
  color VARCHAR(7),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_product_categories_global_idioma
  ON product_categories_global(idioma) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_global_nombre_idioma_unique
  ON product_categories_global(LOWER(nombre), idioma) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_global_updated_at
  ON product_categories_global(updated_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE product_categories_global IS 'Categorías globales de productos (independiente, sin FKs desde otras tablas)';
COMMENT ON COLUMN product_categories_global.idioma IS 'Idioma de la categoría (es, en, pt)';

-- ============================================
-- USER CUSTOM PRODUCTS
-- ============================================
-- Productos personalizados del usuario
-- Incluye copias de productos del catálogo global

CREATE TABLE IF NOT EXISTS product_user_custom (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_user_custom_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_user_custom_user
  ON product_user_custom(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_user_custom_nombre
  ON product_user_custom(LOWER(nombre)) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_user_custom_user_nombre_unique
  ON product_user_custom(user_id, LOWER(nombre)) WHERE deleted_at IS NULL;

COMMENT ON TABLE product_user_custom IS 'Productos personalizados del usuario. Incluye copias de productos del catálogo global.';

-- ============================================
-- PRODUCT CATEGORIES USER
-- ============================================
-- Categorías de productos del usuario
-- Incluye copias de categorías globales

CREATE TABLE IF NOT EXISTS product_categories_user (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_categories_user_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_categories_user_user
  ON product_categories_user(user_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_user_user_nombre_unique
  ON product_categories_user(user_id, LOWER(nombre)) WHERE deleted_at IS NULL;

COMMENT ON TABLE product_categories_user IS 'Categorías de productos del usuario. Incluye copias de categorías globales.';

-- ============================================
-- PRODUCT FAVORITES
-- ============================================
-- IMPORTANTE: is_catalog se mantiene pero SIEMPRE usará product_custom_id
-- product_id se depreca (no se usa más)

CREATE TABLE IF NOT EXISTS product_favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT, -- DEPRECATED: mantener por compatibilidad, no usar
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false, -- SIEMPRE false en nuevos registros
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_favorites_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_favorites_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_favorites_user_id
  ON product_favorites(user_id) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_favorites_unique_custom
  ON product_favorites(user_id, product_custom_id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN product_favorites.product_id IS 'DEPRECATED: No usar. Mantener solo para migración de datos legacy.';
COMMENT ON COLUMN product_favorites.is_catalog IS 'DEPRECATED: Mantener false siempre.';

-- ============================================
-- PRODUCT FREQUENCY (Usage Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS product_frequency (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT, -- DEPRECATED
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false, -- SIEMPRE false
  count_purchases INTEGER NOT NULL DEFAULT 1,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT product_frequency_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_frequency_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_frequency_user_id
  ON product_frequency(user_id);

CREATE INDEX IF NOT EXISTS idx_product_frequency_last_purchase
  ON product_frequency(user_id, last_purchase_date DESC);

COMMENT ON COLUMN product_frequency.product_id IS 'DEPRECATED: No usar.';

-- ============================================
-- PRODUCT PRICES HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS product_prices_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT, -- DEPRECATED
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false,
  store_name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT product_prices_history_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_currency_fk FOREIGN KEY (currency_id)
    REFERENCES monedas(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_prices_history_user
  ON product_prices_history(user_id);

CREATE INDEX IF NOT EXISTS idx_product_prices_history_custom
  ON product_prices_history(product_custom_id);

CREATE INDEX IF NOT EXISTS idx_product_prices_history_store
  ON product_prices_history(store_name);

-- ============================================
-- SHOPPING LISTS
-- ============================================

CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  list_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT shopping_lists_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id
  ON shopping_lists(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_lists_updated_at
  ON shopping_lists(updated_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- SHOPPING LIST ITEMS
-- ============================================
-- IMPORTANTE:
-- - product_id NO tiene FK (para independencia de catálogo global)
-- - product_custom_id SIEMPRE se usa (con FK)
-- - is_catalog mantener false siempre

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_list_id TEXT NOT NULL,
  product_id TEXT, -- DEPRECATED: Sin FK, mantener NULL
  product_custom_id TEXT, -- SIEMPRE usar este
  is_catalog BOOLEAN NOT NULL DEFAULT false, -- SIEMPRE false
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unidad_medida VARCHAR(50),
  categoria_producto_id TEXT,
  categoria_global_id TEXT, -- Sin FK a global
  marca VARCHAR(255),
  comentario TEXT,
  item_order INTEGER NOT NULL,
  item_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT shopping_list_items_list_fk FOREIGN KEY (shopping_list_id)
    REFERENCES shopping_lists(id) ON DELETE CASCADE,
  CONSTRAINT shopping_list_items_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT shopping_list_items_category_fk FOREIGN KEY (categoria_producto_id)
    REFERENCES product_categories_user(id) ON DELETE SET NULL,
  CONSTRAINT shopping_list_items_user_fk FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_list_items_type_check CHECK (item_type IN ('NORMAL', 'COMPRA_AGREGADO'))
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id
  ON shopping_list_items(shopping_list_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_order
  ON shopping_list_items(shopping_list_id, item_order) WHERE deleted_at IS NULL;

COMMENT ON COLUMN shopping_list_items.product_id IS 'DEPRECATED: Use product_custom_id instead. This column is kept for data migration only.';
COMMENT ON COLUMN shopping_list_items.categoria_global_id IS 'Referencia a product_categories_global (SIN FK para independencia)';

-- ============================================
-- SHOPPING LIST COLLABORATORS
-- ============================================

CREATE TABLE IF NOT EXISTS shopping_list_collaborators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_list_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission_level VARCHAR(50) NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT shopping_list_collaborators_list_fk FOREIGN KEY (shopping_list_id)
    REFERENCES shopping_lists(id) ON DELETE CASCADE,
  CONSTRAINT shopping_list_collaborators_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT shopping_list_collaborators_added_by_fk FOREIGN KEY (added_by)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_list_collaborators_permission_check CHECK (permission_level IN ('FULL_ACCESS', 'EXECUTION_ONLY')),
  CONSTRAINT shopping_list_collaborators_unique UNIQUE (shopping_list_id, user_id, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_collaborators_list_id
  ON shopping_list_collaborators(shopping_list_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_list_collaborators_user_id
  ON shopping_list_collaborators(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- SHOPPING EXECUTIONS (Purchase Records)
-- ============================================
-- CAMBIO: shopping_list_id puede ser NULL (SET NULL en delete)
-- para preservar historial incluso si se elimina la lista

CREATE TABLE IF NOT EXISTS shopping_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_list_id TEXT, -- Nullable para preservar historial
  user_id TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
  store_name VARCHAR(255),
  sobre_id TEXT,
  categoria_sobre_id TEXT,
  subcategoria_id TEXT, -- Referencia a subcategorias (marcas de sobres)
  total_estimado DECIMAL(12, 2),
  total_calculated DECIMAL(12, 2),
  total_manual DECIMAL(12, 2),
  tiempo_transcurrido INTEGER,
  gasto_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT shopping_executions_list_fk FOREIGN KEY (shopping_list_id)
    REFERENCES shopping_lists(id) ON DELETE SET NULL,
  CONSTRAINT shopping_executions_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_executions_sobre_fk FOREIGN KEY (sobre_id)
    REFERENCES sobres(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_executions_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT shopping_executions_total_check CHECK (
    total_estimado IS NULL OR total_estimado >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_shopping_executions_list_id
  ON shopping_executions(shopping_list_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_executions_user_id
  ON shopping_executions(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_executions_status
  ON shopping_executions(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_executions_started_at
  ON shopping_executions(started_at DESC) WHERE deleted_at IS NULL;

COMMENT ON COLUMN shopping_executions.shopping_list_id IS 'Referencia a la lista de compras. Puede ser NULL si la lista fue eliminada (preserva historial).';

-- ============================================
-- SHOPPING EXECUTION ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS shopping_execution_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_execution_id TEXT NOT NULL,
  shopping_list_item_id TEXT,
  product_id TEXT, -- DEPRECATED
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT false,
  producto VARCHAR(255), -- Nombre del producto al momento de compra
  cantidad_comprada DECIMAL(10, 2),
  unidad_medida VARCHAR(50),
  categoria_producto_id TEXT,
  categoria_global_id TEXT, -- Sin FK
  marca VARCHAR(255),
  precio_unitario DECIMAL(12, 2),
  precio_total DECIMAL(12, 2),
  es_comprado BOOLEAN NOT NULL DEFAULT false,
  razon_no_comprado VARCHAR(100),
  es_agregado_vuelo BOOLEAN NOT NULL DEFAULT false,
  agregado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT shopping_execution_items_execution_fk FOREIGN KEY (shopping_execution_id)
    REFERENCES shopping_executions(id) ON DELETE CASCADE,
  CONSTRAINT shopping_execution_items_list_item_fk FOREIGN KEY (shopping_list_item_id)
    REFERENCES shopping_list_items(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_category_fk FOREIGN KEY (categoria_producto_id)
    REFERENCES product_categories_user(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_added_by_fk FOREIGN KEY (agregado_por)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_reason_check CHECK (
    es_comprado = true OR razon_no_comprado IS NOT NULL OR shopping_execution_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_shopping_execution_items_execution_id
  ON shopping_execution_items(shopping_execution_id);

CREATE INDEX IF NOT EXISTS idx_shopping_execution_items_list_item_id
  ON shopping_execution_items(shopping_list_item_id);

COMMENT ON COLUMN shopping_execution_items.product_id IS 'DEPRECATED: Use product_custom_id instead. This column is kept for historical data only.';

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
    AND table_name IN (
      'product_catalog',
      'product_categories_global',
      'product_user_custom',
      'product_categories_user',
      'shopping_lists',
      'shopping_list_items',
      'shopping_executions',
      'shopping_execution_items',
      'product_frequency'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END $$;
