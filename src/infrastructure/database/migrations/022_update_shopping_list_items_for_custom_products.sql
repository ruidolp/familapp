-- ============================================
-- MIGRATION 022: Update Shopping List Items for Custom Products
-- ============================================
-- Modifica shopping_list_items para usar SIEMPRE product_custom_id (con FK)
-- y marcar product_id como DEPRECATED (sin FK)

-- ============================================
-- SHOPPING LIST ITEMS
-- ============================================

-- Remove old FK from product_catalog if exists (to make catalog independent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_list_items_product_fk'
  ) THEN
    ALTER TABLE shopping_list_items DROP CONSTRAINT shopping_list_items_product_fk;
  END IF;
END $$;

-- Remove old FK from product_catalog in favorites if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_favorites_catalog_fk'
  ) THEN
    ALTER TABLE product_favorites DROP CONSTRAINT product_favorites_catalog_fk;
  END IF;
END $$;

-- Add FK to product_user_custom in shopping_list_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_list_items_custom_fk'
  ) THEN
    ALTER TABLE shopping_list_items
      ADD CONSTRAINT shopping_list_items_custom_fk
      FOREIGN KEY (product_custom_id)
      REFERENCES product_user_custom(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK to product_categories_user in shopping_list_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_list_items_category_fk'
  ) THEN
    ALTER TABLE shopping_list_items
      ADD CONSTRAINT shopping_list_items_category_fk
      FOREIGN KEY (categoria_producto_id)
      REFERENCES product_categories_user(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_custom_id
  ON shopping_list_items(product_custom_id) WHERE deleted_at IS NULL;

-- Update comments
COMMENT ON COLUMN shopping_list_items.product_id IS 'DEPRECATED: No usar. Mantener solo para migración de datos legacy. Usar product_custom_id.';
COMMENT ON COLUMN shopping_list_items.product_custom_id IS 'SIEMPRE usar este campo. FK a product_user_custom.';
COMMENT ON COLUMN shopping_list_items.is_catalog IS 'DEPRECATED: Siempre false. Usar product_custom_id.';

-- ============================================
-- SHOPPING EXECUTION ITEMS
-- ============================================

-- Remove old FK from product_catalog if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_execution_items_product_fk'
  ) THEN
    ALTER TABLE shopping_execution_items DROP CONSTRAINT shopping_execution_items_product_fk;
  END IF;
END $$;

-- Add FK to product_user_custom in shopping_execution_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_execution_items_custom_fk'
  ) THEN
    ALTER TABLE shopping_execution_items
      ADD CONSTRAINT shopping_execution_items_custom_fk
      FOREIGN KEY (product_custom_id)
      REFERENCES product_user_custom(id)
      ON DELETE SET NULL;  -- SET NULL para preservar historial
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shopping_execution_items_custom_id
  ON shopping_execution_items(product_custom_id);

COMMENT ON COLUMN shopping_execution_items.product_id IS 'DEPRECATED: No usar. Mantener solo para historial legacy.';
COMMENT ON COLUMN shopping_execution_items.product_custom_id IS 'FK a product_user_custom. Puede ser NULL si el producto fue eliminado.';
