-- Shopping Lists Module Migration
-- Tables for managing shopping lists, products, and purchases

-- ============================================
-- PRODUCT CATALOG (Global Products)
-- ============================================
CREATE TABLE IF NOT EXISTS product_catalog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(255) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es',
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_catalog_unique_lang UNIQUE (nombre, idioma, deleted_at)
);

CREATE INDEX idx_product_catalog_idioma ON product_catalog(idioma) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_catalog_nombre ON product_catalog(nombre) WHERE deleted_at IS NULL;

-- ============================================
-- USER CUSTOM PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS product_user_custom (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_user_custom_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_user_custom_unique UNIQUE (user_id, nombre, deleted_at)
);

CREATE INDEX idx_product_user_custom_user_id ON product_user_custom(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- PRODUCT CATEGORIES (User Personal Categories)
-- ============================================
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
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_categories_user_unique UNIQUE (user_id, nombre, deleted_at)
);

CREATE INDEX idx_product_categories_user_id ON product_categories_user(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- PRODUCT FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS product_favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT product_favorites_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_favorites_catalog_fk FOREIGN KEY (product_id)
    REFERENCES product_catalog(id) ON DELETE CASCADE,
  CONSTRAINT product_favorites_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT product_favorites_product_check CHECK (
    (is_catalog AND product_id IS NOT NULL AND product_custom_id IS NULL) OR
    (NOT is_catalog AND product_id IS NULL AND product_custom_id IS NOT NULL)
  )
);

CREATE INDEX idx_product_favorites_user_id ON product_favorites(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_product_favorites_unique_catalog ON product_favorites(user_id, product_id)
  WHERE is_catalog = true AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_product_favorites_unique_custom ON product_favorites(user_id, product_custom_id)
  WHERE is_catalog = false AND deleted_at IS NULL;

-- ============================================
-- PRODUCT FREQUENCY (Usage Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS product_frequency (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT true,
  count_purchases INTEGER NOT NULL DEFAULT 1,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT product_frequency_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_frequency_catalog_fk FOREIGN KEY (product_id)
    REFERENCES product_catalog(id) ON DELETE CASCADE,
  CONSTRAINT product_frequency_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT product_frequency_product_check CHECK (
    (is_catalog AND product_id IS NOT NULL AND product_custom_id IS NULL) OR
    (NOT is_catalog AND product_id IS NULL AND product_custom_id IS NOT NULL)
  )
);

CREATE INDEX idx_product_frequency_user_id ON product_frequency(user_id);
CREATE INDEX idx_product_frequency_last_purchase ON product_frequency(user_id, last_purchase_date DESC);

-- ============================================
-- PRODUCT PRICES HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS product_prices_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  product_id TEXT,
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT true,
  store_name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT product_prices_history_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_catalog_fk FOREIGN KEY (product_id)
    REFERENCES product_catalog(id) ON DELETE SET NULL,
  CONSTRAINT product_prices_history_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT product_prices_history_currency_fk FOREIGN KEY (currency_id)
    REFERENCES monedas(id) ON DELETE SET NULL
);

CREATE INDEX idx_product_prices_history_user ON product_prices_history(user_id);
CREATE INDEX idx_product_prices_history_product ON product_prices_history(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_product_prices_history_custom ON product_prices_history(product_custom_id);
CREATE INDEX idx_product_prices_history_store ON product_prices_history(store_name);

-- ============================================
-- SHOPPING LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  list_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT shopping_lists_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_lists_updated_at ON shopping_lists(updated_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- SHOPPING LIST ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_list_id TEXT NOT NULL,
  product_id TEXT,
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT true,
  cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unidad_medida VARCHAR(50),
  categoria_producto_id TEXT,
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
  CONSTRAINT shopping_list_items_catalog_fk FOREIGN KEY (product_id)
    REFERENCES product_catalog(id) ON DELETE SET NULL,
  CONSTRAINT shopping_list_items_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE CASCADE,
  CONSTRAINT shopping_list_items_category_fk FOREIGN KEY (categoria_producto_id)
    REFERENCES product_categories_user(id) ON DELETE SET NULL,
  CONSTRAINT shopping_list_items_user_fk FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_list_items_type_check CHECK (item_type IN ('NORMAL', 'COMPRA_AGREGADO')),
  CONSTRAINT shopping_list_items_product_check CHECK (
    (is_catalog AND product_id IS NOT NULL AND product_custom_id IS NULL) OR
    (NOT is_catalog AND product_id IS NULL AND product_custom_id IS NOT NULL)
  )
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_list_items_order ON shopping_list_items(shopping_list_id, item_order) WHERE deleted_at IS NULL;

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

CREATE INDEX idx_shopping_list_collaborators_list_id ON shopping_list_collaborators(shopping_list_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_list_collaborators_user_id ON shopping_list_collaborators(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- SHOPPING EXECUTIONS (Purchase Records)
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_executions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_list_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
  store_name VARCHAR(255) NOT NULL,
  sobre_id TEXT,
  categoria_sobre_id TEXT,
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
    REFERENCES shopping_lists(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_executions_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_executions_sobre_fk FOREIGN KEY (sobre_id)
    REFERENCES sobres(id) ON DELETE RESTRICT,
  CONSTRAINT shopping_executions_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT shopping_executions_total_check CHECK (
    total_estimado IS NULL OR total_estimado >= 0
  )
);

CREATE INDEX idx_shopping_executions_list_id ON shopping_executions(shopping_list_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_executions_user_id ON shopping_executions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_executions_status ON shopping_executions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shopping_executions_started_at ON shopping_executions(started_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- SHOPPING EXECUTION ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_execution_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  shopping_execution_id TEXT NOT NULL,
  shopping_list_item_id TEXT,
  product_id TEXT,
  product_custom_id TEXT,
  is_catalog BOOLEAN NOT NULL DEFAULT true,
  cantidad_comprada DECIMAL(10, 2),
  unidad_medida VARCHAR(50),
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
  CONSTRAINT shopping_execution_items_catalog_fk FOREIGN KEY (product_id)
    REFERENCES product_catalog(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_custom_fk FOREIGN KEY (product_custom_id)
    REFERENCES product_user_custom(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_agregado_por_fk FOREIGN KEY (agregado_por)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT shopping_execution_items_razon_check CHECK (razon_no_comprado IN ('SIN_STOCK', 'NO_DISPONIBLE', NULL)),
  CONSTRAINT shopping_execution_items_product_check CHECK (
    (is_catalog AND product_id IS NOT NULL AND product_custom_id IS NULL) OR
    (NOT is_catalog AND product_id IS NULL AND product_custom_id IS NOT NULL)
  )
);

CREATE INDEX idx_shopping_execution_items_execution_id ON shopping_execution_items(shopping_execution_id);
CREATE INDEX idx_shopping_execution_items_comprado ON shopping_execution_items(es_comprado);

-- ============================================
-- ENUMS (for reference)
-- ============================================
-- Unidades de medida soportadas:
-- 'unidad', 'kg', 'g', 'L', 'mL', 'paquete', 'caja', 'frasco', 'bolsa'

-- Razones de no comprado:
-- 'SIN_STOCK', 'NO_DISPONIBLE'

-- Estados de ejecución:
-- 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'

-- Niveles de permiso:
-- 'FULL_ACCESS', 'EXECUTION_ONLY'

-- Tipos de items:
-- 'NORMAL', 'COMPRA_AGREGADO'
