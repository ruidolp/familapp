-- Migration 005: Add tasa_interes column to billeteras
-- Description: Support interest rates for savings/investment wallets

ALTER TABLE billeteras
ADD COLUMN IF NOT EXISTS tasa_interes DECIMAL(5,2) DEFAULT NULL;

-- No index needed for this field as it's primarily used for display/calculation
-- not for filtering queries frequently
