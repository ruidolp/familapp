-- Add Category Support to Shopping Execution Items
-- Allows tracking of product categories in execution (purchase) records

-- ============================================
-- ADD CATEGORY FIELDS
-- ============================================
ALTER TABLE shopping_execution_items
  ADD COLUMN IF NOT EXISTS categoria_producto_id TEXT;

ALTER TABLE shopping_execution_items
  ADD COLUMN IF NOT EXISTS categoria_global_id TEXT;

-- Add foreign key constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shopping_execution_items_categoria_producto_fk'
  ) THEN
    ALTER TABLE shopping_execution_items
      ADD CONSTRAINT shopping_execution_items_categoria_producto_fk
        FOREIGN KEY (categoria_producto_id)
        REFERENCES product_categories_user(id)
        ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'shopping_execution_items_categoria_global_fk'
  ) THEN
    ALTER TABLE shopping_execution_items
      ADD CONSTRAINT shopping_execution_items_categoria_global_fk
        FOREIGN KEY (categoria_global_id)
        REFERENCES product_categories_global(id)
        ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopping_execution_items_categoria_producto_id
  ON shopping_execution_items(categoria_producto_id);

CREATE INDEX IF NOT EXISTS idx_shopping_execution_items_categoria_global_id
  ON shopping_execution_items(categoria_global_id);

-- ============================================
-- NOTES
-- ============================================
--
-- Shopping execution items now store the categories that were assigned
-- to the items at the time of purchase execution.
--
-- This allows:
-- 1. Historical tracking of category assignments
-- 2. Grouping execution items by category
-- 3. Analytics on purchase patterns by category
--
-- Priority when both are set: user category (categoria_producto_id) takes precedence
--
