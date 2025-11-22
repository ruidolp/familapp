-- Migration 007: Add Sobres transaction types to billeteras_transacciones
-- Description: Extend transaction types to support envelope/budget operations
-- New types: GASTO, ASIGNACION_SOBRE, DEVOLUCION_SOBRE

-- Update the tipo column to allow new types
-- Note: We don't have CHECK constraint in original migration, so we document the valid types here

-- Valid tipos for billeteras_transacciones:
-- CREACION - Initial creation of wallet
-- DEPOSITO - Deposit from external source
-- RETIRO - Withdrawal to external source
-- TRANSFERENCIA - Transfer between wallets
-- GASTO - Expense made from an envelope/sobre
-- ASIGNACION_SOBRE - Budget allocated from wallet to an envelope
-- DEVOLUCION_SOBRE - Budget returned from envelope to wallet
-- AJUSTE - Manual adjustment

-- No schema changes needed - tipo is TEXT, already flexible
-- This migration serves as documentation and validation layer

-- Drop existing type if it exists (safe to run multiple times)
DROP TYPE IF EXISTS billetera_transaccion_tipo CASCADE;

-- Create enum type for reference (PostgreSQL best practice)
CREATE TYPE billetera_transaccion_tipo AS ENUM (
  'CREACION',
  'DEPOSITO',
  'RETIRO',
  'TRANSFERENCIA',
  'GASTO',
  'ASIGNACION_SOBRE',
  'DEVOLUCION_SOBRE',
  'AJUSTE'
);

-- If we want to add a check constraint (optional, but recommended):
-- ALTER TABLE billeteras_transacciones
-- ADD CONSTRAINT check_billeteras_transacciones_tipo
-- CHECK (tipo IN ('CREACION', 'DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'GASTO', 'ASIGNACION_SOBRE', 'DEVOLUCION_SOBRE', 'AJUSTE'));
