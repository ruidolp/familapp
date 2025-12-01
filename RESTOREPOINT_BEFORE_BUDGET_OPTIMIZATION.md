# RESTOREPOINT: Before Budget Optimization Implementation

**Date:** 2025-12-01
**Last Migration:** 035_owner_registration_status.sql
**Purpose:** Full backup before implementing Estrategia 1 (Aggregation Tables + Triggers)

## Changes to be Applied

### New Tables
1. `sobres_presupuestos` - Budget configuration per period
2. `sobres_categorias_cuotas` - Budget quotas per category
3. `presupuesto_ajustes_log` - Budget adjustment audit log
4. `sobres_gastos_resumen` - Pre-calculated expense aggregations (OPTIMIZATION)

### New Triggers
1. `trigger_actualizar_resumen_gastos` - After INSERT on transacciones
2. `trigger_actualizar_resumen_gastos_update` - After UPDATE on transacciones
3. `trigger_actualizar_resumen_gastos_delete` - After soft-delete on transacciones

### Modified Queries
- `findCategoriasWithGastosBySobre` - Will use `sobres_gastos_resumen` instead of SUM

## Current State

### Affected Tables Schema

#### `sobres` (existing)
- Has `presupuesto_asignado` and `gastado` columns
- Currently gastado is calculated on-the-fly with SUM queries

#### `sobres_categorias` (existing)
- Simple many-to-many relationship
- No budget quotas per category

#### `transacciones` (existing)
- Currently no triggers for aggregation
- Soft-delete supported via `deleted_at`

## Rollback Instructions

If you need to rollback these changes:

```bash
# 1. Run the rollback script
psql $DATABASE_URL -f src/infrastructure/database/migrations/ROLLBACK_036_budget_optimization.sql

# 2. Regenerate TypeScript types
npm run db:types

# 3. Restore backup queries file
cp src/infrastructure/database/queries/sobres.queries.ts.backup src/infrastructure/database/queries/sobres.queries.ts
```

## Files Modified

### New Files
- `src/infrastructure/database/migrations/036_budget_optimization_tables.sql`
- `src/infrastructure/database/migrations/037_budget_optimization_triggers.sql`
- `src/infrastructure/database/migrations/ROLLBACK_036_budget_optimization.sql`

### Modified Files (backups created)
- `src/infrastructure/database/queries/sobres.queries.ts`
- `src/infrastructure/database/types.ts` (auto-generated)

## Testing Checklist After Apply

- [ ] Verify all triggers are created: `\df actualizar_resumen_gastos*`
- [ ] Insert test transaction and verify aggregation table updates
- [ ] Update test transaction and verify aggregation recalculates
- [ ] Soft-delete test transaction and verify aggregation adjusts
- [ ] Run reconciliation script to ensure consistency
- [ ] Test queries performance with EXPLAIN ANALYZE
- [ ] Verify backward compatibility with existing sobres

## Reconciliation Script

If aggregation data becomes inconsistent, run:

```sql
-- Full recalculation from scratch
TRUNCATE sobres_gastos_resumen;

INSERT INTO sobres_gastos_resumen (
  sobre_id, categoria_id, periodo_year, periodo_month,
  total_gastado, cantidad_transacciones
)
SELECT
  sobre_id,
  categoria_id,
  EXTRACT(YEAR FROM fecha)::INTEGER,
  EXTRACT(MONTH FROM fecha)::INTEGER,
  SUM(monto),
  COUNT(*)
FROM transacciones
WHERE deleted_at IS NULL
  AND tipo = 'GASTO'
  AND sobre_id IS NOT NULL
GROUP BY sobre_id, categoria_id, EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha);
```

## Emergency Contact

If issues arise:
1. Check trigger execution: `SELECT * FROM pg_trigger WHERE tgname LIKE '%resumen%'`
2. Check for errors in logs: Look for trigger failures
3. Disable triggers temporarily: `ALTER TABLE transacciones DISABLE TRIGGER ALL`
4. Run rollback script
5. Contact: [Your contact info]

---

**IMPORTANT:** Do not delete this file until changes are verified stable in production for at least 1 month.
