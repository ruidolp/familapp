-- Migration: Add owner_registration_status to shopping_executions
-- Purpose: Allow OWNER to register purchases made by invited users in their budgets
-- Date: 2025-11-24

-- Add owner_registration_status column
-- null = Not applicable (user is owner or used shared envelope)
-- pending = Pending owner decision
-- registered = Owner registered in their budgets
-- dismissed = Owner decided not to register

ALTER TABLE shopping_executions
ADD COLUMN IF NOT EXISTS owner_registration_status VARCHAR(20) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN shopping_executions.owner_registration_status IS
'Status of owner registration for purchases made by invited users. Values: null (not applicable), pending, registered, dismissed';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_shopping_executions_owner_registration_status
ON shopping_executions(owner_registration_status)
WHERE owner_registration_status IS NOT NULL;

-- Add owner_sobre_id, owner_categoria_id, owner_subcategoria_id for owner's registration
ALTER TABLE shopping_executions
ADD COLUMN IF NOT EXISTS owner_sobre_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS owner_categoria_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS owner_subcategoria_id TEXT DEFAULT NULL;

-- Add foreign keys (using DO block to handle IF NOT EXISTS)
DO $$
BEGIN
  -- Add owner_sobre_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_executions_owner_sobre_fk'
  ) THEN
    ALTER TABLE shopping_executions
    ADD CONSTRAINT shopping_executions_owner_sobre_fk
    FOREIGN KEY (owner_sobre_id) REFERENCES sobres(id) ON DELETE SET NULL;
  END IF;

  -- Add owner_categoria_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_executions_owner_categoria_fk'
  ) THEN
    ALTER TABLE shopping_executions
    ADD CONSTRAINT shopping_executions_owner_categoria_fk
    FOREIGN KEY (owner_categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;
  END IF;

  -- Add owner_subcategoria_fk if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shopping_executions_owner_subcategoria_fk'
  ) THEN
    ALTER TABLE shopping_executions
    ADD CONSTRAINT shopping_executions_owner_subcategoria_fk
    FOREIGN KEY (owner_subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN shopping_executions.owner_sobre_id IS
'Sobre selected by list owner when registering a purchase made by invited user';

COMMENT ON COLUMN shopping_executions.owner_categoria_id IS
'Category selected by list owner when registering a purchase made by invited user';

COMMENT ON COLUMN shopping_executions.owner_subcategoria_id IS
'Subcategory/brand selected by list owner when registering a purchase made by invited user';
