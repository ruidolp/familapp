-- ============================================
-- MIGRATION 019: Separate Global and User Products
-- ============================================
-- Crea estructura separada para productos globales (catálogo) y productos por usuario
-- Esto permite evitar constraints cuando se clonan listas entre usuarios

-- DROP existing tables (desarrollo only)
DROP TABLE IF EXISTS product_prices_history CASCADE;
DROP TABLE IF EXISTS product_frequency CASCADE;
DROP TABLE IF EXISTS product_favorites CASCADE;
DROP TABLE IF EXISTS product_categories_user CASCADE;
DROP TABLE IF EXISTS product_user_custom CASCADE;
DROP TABLE IF EXISTS product_categories_global CASCADE;
DROP TABLE IF EXISTS product_catalog CASCADE;

-- ============================================
-- CATÁLOGO GLOBAL DE PRODUCTOS (independiente)
-- ============================================
CREATE TABLE product_catalog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(255) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es',
  category_id TEXT,  -- Referencia SIN FK a product_categories_global
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_product_catalog_nombre ON product_catalog(LOWER(nombre)) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_catalog_deleted ON product_catalog(deleted_at);

COMMENT ON TABLE product_catalog IS 'Catálogo global de productos (independiente, sin FKs desde otras tablas). Puede truncarse sin afectar listas de usuarios.';

-- ============================================
-- CATEGORÍAS GLOBALES DE PRODUCTOS (independiente)
-- ============================================
CREATE TABLE product_categories_global (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(100) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es',
  descripcion TEXT,
  color VARCHAR(7),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(nombre, idioma)
);

CREATE INDEX idx_product_categories_global_nombre ON product_categories_global(LOWER(nombre)) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_categories_global_idioma ON product_categories_global(idioma) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_categories_global_deleted ON product_categories_global(deleted_at);

COMMENT ON TABLE product_categories_global IS 'Categorías globales de productos (independiente, sin FKs desde otras tablas)';

-- ============================================
-- PRODUCTOS PERSONALIZADOS DEL USUARIO
-- ============================================
CREATE TABLE product_user_custom (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT product_user_custom_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_user_custom_user ON product_user_custom(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_user_custom_nombre ON product_user_custom(LOWER(nombre)) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_user_custom_deleted ON product_user_custom(deleted_at);

COMMENT ON TABLE product_user_custom IS 'Productos personalizados del usuario. Incluye copias de productos del catálogo global.';

-- ============================================
-- CATEGORÍAS DE PRODUCTOS DEL USUARIO
-- ============================================
CREATE TABLE product_categories_user (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT product_categories_user_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_categories_user_user ON product_categories_user(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_categories_user_deleted ON product_categories_user(deleted_at);

COMMENT ON TABLE product_categories_user IS 'Categorías de productos del usuario. Incluye copias de categorías globales.';
