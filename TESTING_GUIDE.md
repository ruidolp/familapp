# Testing Guide: Budget Optimization System

## 📋 Overview

Testing suite for the budget optimization system implementation:
- Trigger functionality (INSERT, UPDATE, DELETE)
- API endpoints
- Data integrity verification

---

## 🧪 Test 1: Database Triggers

### Purpose
Verify that aggregation triggers work correctly for all transaction operations.

### Prerequisites
- PostgreSQL database with migrations applied
- `DATABASE_URL` environment variable set

### Run Test

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run trigger tests
psql $DATABASE_URL -f src/infrastructure/database/migrations/TEST_budget_triggers.sql
```

### Expected Output

```
========================================
TESTING: Budget Optimization Triggers
========================================

1. Setup: Creating test data...
  ✓ Created test user: [user-id]
  ✓ Created test wallet: [wallet-id]
  ✓ Created test sobre: [sobre-id]
  ✓ Created test categoria: [categoria-id]

2. TEST 1: INSERT transaction (trigger should create aggregation)
  ✓ Inserted transaction: [trx-id] (monto: 50000)
  ✅ PASS: Aggregation created correctly
     total_gastado: 50000, cantidad: 1

3. TEST 2: UPDATE transaction monto (trigger should recalculate)
  ✓ Updated transaction monto: 50000 → 75000
  ✅ PASS: Aggregation updated correctly
     total_gastado: 75000, cantidad: 1

4. TEST 3: INSERT second transaction (should accumulate)
  ✓ Inserted second transaction (monto: 25000)
  ✅ PASS: Aggregation accumulated correctly
     total_gastado: 100000 (75000 + 25000), cantidad: 2

5. TEST 4: SOFT DELETE transaction (trigger should subtract)
  ✓ Soft-deleted transaction (monto: 75000)
  ✅ PASS: Aggregation subtracted correctly
     total_gastado: 25000 (100000 - 75000), cantidad: 1

6. TEST 5: UPDATE fecha to different month (should move aggregation)
  ✓ Updated fecha to previous month
  ✅ PASS: Aggregation moved to correct period
     Current month: 0, Previous month: 25000

7. Cleanup: Removing test data...
  ✓ Test data cleaned up

========================================
✅ ALL TESTS PASSED
========================================

Triggers are working correctly! 🎉
```

### What It Tests

1. **INSERT Trigger**: Creates new aggregation record
2. **UPDATE Trigger (monto)**: Recalculates on amount change
3. **INSERT (accumulate)**: Adds to existing aggregation
4. **SOFT DELETE**: Subtracts from aggregation
5. **UPDATE (fecha)**: Moves aggregation to correct period

### Troubleshooting

**Error: "database does not exist"**
- Verify `DATABASE_URL` is set correctly
- Check database connection

**Error: "relation does not exist"**
- Run migrations first: `036_budget_optimization_tables.sql` and `037_budget_optimization_triggers.sql`

**Test fails on specific scenario**
- Check trigger function definitions
- Run reconciliation script if data is inconsistent

---

## 🌐 Test 2: API Endpoints

### Purpose
Test all budget-related API endpoints end-to-end.

### Prerequisites
- Development server running: `npm run dev`
- Valid authentication token
- Existing `sobre_id` in database

### Setup

1. **Get Auth Token**:
   - Login to your app
   - Open DevTools → Application → Cookies
   - Copy session token

2. **Get Sobre ID**:
   ```bash
   psql $DATABASE_URL -c "SELECT id, nombre FROM sobres LIMIT 5;"
   ```

3. **Update Test Script**:
   ```bash
   nano test-presupuesto-api.sh

   # Update these lines:
   AUTH_TOKEN="your-actual-token-here"
   SOBRE_ID="your-actual-sobre-id-here"
   CATEGORIA_ID="your-actual-categoria-id-here"
   ```

### Run Test

```bash
# Make script executable (already done)
chmod +x test-presupuesto-api.sh

# Run tests
./test-presupuesto-api.sh
```

### Expected Output

```
========================================
Testing Budget API Endpoints
========================================

✓ Configuration OK

----------------------------------------
TEST 1: GET /api/sobres/{id}/presupuesto
----------------------------------------
Response: { success: true, data: { ... } }
✅ PASS

----------------------------------------
TEST 2: PUT /api/sobres/{id}/presupuesto (enable)
----------------------------------------
Response: { success: true, data: { presupuesto_enabled: true, monto_global: 500000 } }
✅ PASS

...

========================================
Testing Complete
========================================
```

### Manual Testing (cURL)

If you prefer manual testing:

```bash
# 1. Get presupuesto
curl -X GET "http://localhost:3000/api/sobres/{sobreId}/presupuesto" \
  -H "Authorization: Bearer {token}"

# 2. Enable presupuesto
curl -X PUT "http://localhost:3000/api/sobres/{sobreId}/presupuesto" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "monto_global": 500000}'

# 3. Add categoria quota
curl -X POST "http://localhost:3000/api/sobres/{sobreId}/presupuesto/cuotas" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"categoria_id": "{categoriaId}", "monto_cuota": 200000}'

# 4. Get suggestion
curl -X GET "http://localhost:3000/api/sobres/{sobreId}/presupuesto/sugerencia" \
  -H "Authorization: Bearer {token}"

# 5. Get stats
curl -X GET "http://localhost:3000/api/sobres/{sobreId}/presupuesto/stats" \
  -H "Authorization: Bearer {token}"

# 6. Delete quota
curl -X DELETE "http://localhost:3000/api/sobres/{sobreId}/presupuesto/cuotas/{categoriaId}" \
  -H "Authorization: Bearer {token}"
```

---

## 🔍 Test 3: Data Integrity

### Purpose
Verify data consistency between transacciones and sobres_gastos_resumen.

### Manual Verification Queries

```sql
-- 1. Compare aggregation vs actual sum
SELECT
  'Aggregation Table' as source,
  sobre_id,
  categoria_id,
  periodo_year,
  periodo_month,
  total_gastado,
  cantidad_transacciones
FROM sobres_gastos_resumen
WHERE sobre_id = 'your-sobre-id'
  AND periodo_year = 2025
  AND periodo_month = 12

UNION ALL

SELECT
  'Actual Sum' as source,
  sobre_id,
  categoria_id,
  EXTRACT(YEAR FROM fecha)::INTEGER,
  EXTRACT(MONTH FROM fecha)::INTEGER,
  SUM(monto),
  COUNT(*)
FROM transacciones
WHERE sobre_id = 'your-sobre-id'
  AND deleted_at IS NULL
  AND tipo = 'GASTO'
  AND EXTRACT(YEAR FROM fecha) = 2025
  AND EXTRACT(MONTH FROM fecha) = 12
GROUP BY sobre_id, categoria_id, EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha)
ORDER BY source, categoria_id;

-- 2. Find discrepancies
WITH agregado AS (
  SELECT
    sobre_id,
    categoria_id,
    SUM(total_gastado) as total_agregado,
    SUM(cantidad_transacciones) as cant_agregado
  FROM sobres_gastos_resumen
  WHERE sobre_id = 'your-sobre-id'
  GROUP BY sobre_id, categoria_id
),
real AS (
  SELECT
    sobre_id,
    categoria_id,
    SUM(monto) as total_real,
    COUNT(*) as cant_real
  FROM transacciones
  WHERE sobre_id = 'your-sobre-id'
    AND deleted_at IS NULL
    AND tipo = 'GASTO'
  GROUP BY sobre_id, categoria_id
)
SELECT
  COALESCE(a.sobre_id, r.sobre_id) as sobre_id,
  COALESCE(a.categoria_id, r.categoria_id) as categoria_id,
  a.total_agregado,
  r.total_real,
  a.total_agregado - r.total_real as diferencia_monto,
  a.cant_agregado,
  r.cant_real,
  a.cant_agregado - r.cant_real as diferencia_cantidad
FROM agregado a
FULL OUTER JOIN real r
  ON a.sobre_id = r.sobre_id
  AND a.categoria_id = r.categoria_id
WHERE a.total_agregado IS DISTINCT FROM r.total_real
   OR a.cant_agregado IS DISTINCT FROM r.cant_real;
```

### If Discrepancies Found

Run reconciliation:

```bash
psql $DATABASE_URL -f src/infrastructure/database/migrations/RECONCILE_sobres_gastos_resumen.sql
```

---

## 📊 Performance Testing

### Before vs After Optimization

```sql
-- BEFORE (on-the-fly calculation)
EXPLAIN ANALYZE
SELECT
  categoria_id,
  SUM(monto) as total,
  COUNT(*) as cantidad
FROM transacciones
WHERE sobre_id = 'your-sobre-id'
  AND deleted_at IS NULL
  AND tipo = 'GASTO'
  AND fecha >= '2025-12-01'
  AND fecha < '2026-01-01'
GROUP BY categoria_id;

-- AFTER (pre-calculated)
EXPLAIN ANALYZE
SELECT
  categoria_id,
  total_gastado,
  cantidad_transacciones
FROM sobres_gastos_resumen
WHERE sobre_id = 'your-sobre-id'
  AND periodo_year = 2025
  AND periodo_month = 12;
```

Expected improvement:
- **Before**: Sequential Scan + Aggregate (O(n))
- **After**: Index Scan (O(1))
- **Speedup**: 10-100x depending on data volume

---

## ✅ Success Criteria

All tests should pass:
- ✅ All 5 trigger tests pass
- ✅ All 9 API endpoint tests pass
- ✅ No data discrepancies found
- ✅ Performance improvement verified

---

## 🚨 If Tests Fail

1. **Check migrations applied**:
   ```sql
   \dt sobres_presupuestos
   \dt sobres_categorias_cuotas
   \dt presupuesto_ajustes_log
   \dt sobres_gastos_resumen
   ```

2. **Check triggers exist**:
   ```sql
   \df actualizar_resumen_gastos*
   ```

3. **Check trigger is attached**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%resumen_gastos%';
   ```

4. **Re-run migrations if needed**:
   ```bash
   psql $DATABASE_URL -f src/infrastructure/database/migrations/036_budget_optimization_tables.sql
   psql $DATABASE_URL -f src/infrastructure/database/migrations/037_budget_optimization_triggers.sql
   ```

5. **Run reconciliation**:
   ```bash
   psql $DATABASE_URL -f src/infrastructure/database/migrations/RECONCILE_sobres_gastos_resumen.sql
   ```

---

## 📝 Notes

- Trigger tests use ROLLBACK to avoid polluting database
- API tests modify actual data (use test account)
- Always run in development environment first
- Keep test user (`test_triggers@example.com`) for repeated testing
