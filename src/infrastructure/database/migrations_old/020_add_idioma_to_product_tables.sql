-- ============================================
-- MIGRATION 020: Add Idioma (Language) Support to Products
-- ============================================
-- Cambia de país (CL, AR, etc.) a idioma (es, en, pt) para mejor escalabilidad
-- Un catálogo en español sirve para todos los países hispanohablantes

-- Add unique constraints with idioma
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_catalog_nombre_idioma_unique
  ON product_catalog(LOWER(nombre), idioma) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_global_nombre_idioma_unique
  ON product_categories_global(LOWER(nombre), idioma) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_user_custom_user_nombre_unique
  ON product_user_custom(user_id, LOWER(nombre)) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_user_user_nombre_unique
  ON product_categories_user(user_id, LOWER(nombre)) WHERE deleted_at IS NULL;

-- Add indexes for language-based queries
CREATE INDEX IF NOT EXISTS idx_product_catalog_idioma
  ON product_catalog(idioma) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_global_idioma
  ON product_categories_global(idioma) WHERE deleted_at IS NULL;

-- Add indexes for updated_at (for versioning)
CREATE INDEX IF NOT EXISTS idx_product_catalog_updated_at
  ON product_catalog(updated_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_global_updated_at
  ON product_categories_global(updated_at DESC) WHERE deleted_at IS NULL;

-- Add index for category lookup in catalog
CREATE INDEX IF NOT EXISTS idx_product_catalog_category_id
  ON product_catalog(category_id) WHERE deleted_at IS NULL;

COMMENT ON COLUMN product_catalog.idioma IS 'Idioma del producto (es, en, pt). Un producto en español sirve para todos los países hispanohablantes.';
COMMENT ON COLUMN product_catalog.category_id IS 'Referencia a product_categories_global (SIN FK para independencia)';
