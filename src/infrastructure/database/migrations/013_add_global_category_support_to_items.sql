-- Add Global Category Support to Shopping List Items
-- Allows items to be categorized by both user-created and global categories

-- ============================================
-- ADD GLOBAL CATEGORY FIELD
-- ============================================
ALTER TABLE shopping_list_items
  ADD COLUMN IF NOT EXISTS categoria_global_id TEXT;

-- Add foreign key constraint for global categories
ALTER TABLE shopping_list_items
  ADD CONSTRAINT shopping_list_items_categoria_global_fk
    FOREIGN KEY (categoria_global_id)
    REFERENCES product_categories_global(id)
    ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_categoria_global_id
  ON shopping_list_items(categoria_global_id)
  WHERE deleted_at IS NULL;

-- ============================================
-- IMPORTANT NOTES
-- ============================================
--
-- Now shopping_list_items can use EITHER:
-- 1. categoria_producto_id (user-created category) - FK to product_categories_user
-- 2. categoria_global_id (admin/global category) - FK to product_categories_global
--
-- Priority when both are set: user category takes precedence
-- Use final_category_id in SELECT queries to get the effective category
--
-- In queries, use COALESCE logic:
--   COALESCE(categoria_producto_id, categoria_global_id) as effective_category_id
