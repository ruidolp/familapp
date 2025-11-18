-- Migration 012: Add subcategoria_id to shopping_executions
-- Purpose: Link shopping executions to specific brands/stores (subcategorias)
-- This enables tracking which store was used for each purchase

-- Add subcategoria_id column to shopping_executions table
ALTER TABLE shopping_executions
ADD COLUMN subcategoria_id TEXT REFERENCES subcategorias(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_shopping_executions_subcategoria ON shopping_executions(subcategoria_id);

-- Add comment to document the field
COMMENT ON COLUMN shopping_executions.subcategoria_id IS 'Reference to the brand/store where the purchase was made (e.g., Jumbo, Costco)';
