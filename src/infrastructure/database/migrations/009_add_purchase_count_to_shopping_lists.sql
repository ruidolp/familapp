-- Migration 009: Add purchase_count to shopping_lists
-- This tracks how many times a shopping list has been used for purchases

ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS purchase_count INTEGER NOT NULL DEFAULT 0;

-- Add index for sorting lists by usage
CREATE INDEX IF NOT EXISTS idx_shopping_lists_purchase_count
ON shopping_lists(purchase_count DESC)
WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN shopping_lists.purchase_count IS 'Number of times this list has been used for shopping executions';
