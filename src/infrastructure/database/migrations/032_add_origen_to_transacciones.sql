-- Migration 032: Add origen field to transacciones
-- Description: Adds origen field to track source of transactions (MANUAL, SHOPPING_LIST, etc.)
-- This allows us to differentiate between regular envelope transactions and shopping list purchases

-- Add origen column with default value
ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'MANUAL';

-- Add check constraint for valid origen values
ALTER TABLE transacciones
ADD CONSTRAINT transacciones_origen_check
CHECK (origen IN ('MANUAL', 'SHOPPING_LIST', 'INGRESO_RECURRENTE', 'TRANSFERENCIA'));

-- Update all existing transactions to have origen = 'MANUAL'
UPDATE transacciones
SET origen = 'MANUAL'
WHERE origen IS NULL OR origen = 'MANUAL';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_transacciones_origen ON transacciones(origen) WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN transacciones.origen IS 'Source of the transaction: MANUAL (regular envelope transactions), SHOPPING_LIST (from shopping executions), INGRESO_RECURRENTE (recurring income), TRANSFERENCIA (transfers)';
