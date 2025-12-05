-- Add Global Product Categories
-- Separates global categories (admin-managed) from user categories

-- ============================================
-- PRODUCT CATEGORIES GLOBAL
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories_global (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  color VARCHAR(7),
  emoji VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_product_categories_global_nombre ON product_categories_global(nombre) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_categories_global_deleted ON product_categories_global(deleted_at);

-- ============================================
-- ADD CATEGORY TO PRODUCT CATALOG
-- ============================================
ALTER TABLE product_catalog
  ADD COLUMN IF NOT EXISTS category_id TEXT;

ALTER TABLE product_catalog
  ADD CONSTRAINT product_catalog_category_fk
    FOREIGN KEY (category_id)
    REFERENCES product_categories_global(id)
    ON DELETE SET NULL;

CREATE INDEX idx_product_catalog_category_id ON product_catalog(category_id) WHERE deleted_at IS NULL;

-- ============================================
-- SEED INITIAL GLOBAL CATEGORIES
-- ============================================
INSERT INTO product_categories_global (nombre, idioma, color, emoji, descripcion)
VALUES
  ('Frutas', 'es', '#FF6B6B', '🍎', 'Frutas frescas'),
  ('Verduras', 'es', '#4ECDC4', '🥦', 'Verduras y hortalizas'),
  ('Carnes', 'es', '#FF8C42', '🥩', 'Carnes rojas y aves'),
  ('Pescado', 'es', '#95A8D1', '🐟', 'Pescados y mariscos'),
  ('Lácteos', 'es', '#FFF59D', '🥛', 'Leche, queso, yogur'),
  ('Granos', 'es', '#D4A574', '🌾', 'Arroz, pasta, pan'),
  ('Bebidas', 'es', '#A8E6CF', '🧃', 'Refrescos, jugos, agua'),
  ('Productos Congelados', 'es', '#B8CCE4', '❄️', 'Alimentos congelados'),
  ('Condimentos', 'es', '#FFD699', '🧂', 'Especias, condimentos, salsas'),
  ('Snacks', 'es', '#FFA07A', '🥨', 'Bocadillos y aperitivos'),
  ('Higiene Personal', 'es', '#E6D5E8', '🧼', 'Jabón, champú, pasta dientes'),
  ('Limpieza', 'es', '#C5D9F1', '🧹', 'Productos de limpieza'),
  ('Otros', 'es', '#D3D3D3', '📦', 'Otros productos')
ON CONFLICT (nombre, idioma) DO NOTHING;
