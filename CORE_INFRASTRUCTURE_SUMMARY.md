# CORE Infrastructure Implementation - FASE 1

## Summary

Complete infrastructure layer for the CORE financial management system with multi-currency support using a hybrid approach (simple fields + JSONB for future expansion).

**Commit:** `a1a7140` - feat: add CORE financial system infrastructure (FASE 1)
**Branch:** `claude/tenemos-el-011CUu5QiDj8F5e84XkGdbrZ`
**Date:** 2025-11-08

---

## Database Schema

### Migration: `003_create_core_tables.sql`

Complete SQL migration with all CORE tables following the hierarchical structure:
**BILLETERAS (dinero real) → SOBRES (presupuesto virtual) → CATEGORÍAS (conceptos) → SUBCATEGORÍAS (marcas)**

#### Tables Created

1. **monedas** - Currency catalog
   - Pre-loaded: CLP, USD, EUR, UF
   - Fields: `id`, `nombre`, `simbolo`, `decimales`, `tipo`, `activa`, `orden`
   - Supports FIAT, INDICE, CRYPTO types

2. **tipos_cambio** - Exchange rates (skeleton for future)
   - Fields: `moneda_origen`, `moneda_destino`, `tasa`, `fecha`, `fuente`
   - Primary key: (moneda_origen, moneda_destino, fecha)

3. **user_config** - User configuration
   - One per user (references `users.id`)
   - Fields: `moneda_principal_id`, `monedas_habilitadas[]`, `timezone`, `locale`
   - Budget period settings: `tipo_periodo`, `dia_inicio_periodo`
   - Defaults: CLP, America/Santiago, es-CL, MENSUAL

4. **billeteras** - Wallets (real money)
   - Types: DEBITO, CREDITO, EFECTIVO, AHORRO, etc.
   - FASE 1: `moneda_principal_id`, `saldo_real`, `saldo_proyectado`
   - FASE 2: `saldos_multimoneda` JSONB for future expansion
   - Personalization: `color`, `emoji`
   - Sharing: `is_compartida`, `usuario_id` (owner)
   - Soft delete: `deleted_at`

5. **sobres** - Envelopes/Budgets (virtual money)
   - Types: GASTO, AHORRO, DEUDA
   - FASE 1: `moneda_principal_id`, `presupuesto_asignado`, `gastado`
   - FASE 2: `presupuestos_multimoneda` JSONB
   - Personalization: `color`, `emoji`
   - Sharing: `is_compartido`, `max_participantes`, `usuario_id` (owner)
   - Soft delete: `deleted_at`

6. **sobres_usuarios** - Shared envelope participants
   - Tracking: `presupuesto_asignado`, `gastado` per participant
   - Roles: OWNER, ADMIN, CONTRIBUTOR, VIEWER
   - Permissions: `permisos` JSONB for future granular control
   - Primary key: (sobre_id, usuario_id)

7. **invitaciones_sobres** - Envelope invitations
   - References: `sobre_id`, `invitado_por_id`, `invitado_user_id`
   - Rol: Assigned role for invited user
   - States: PENDIENTE, ACEPTADA, RECHAZADA, CANCELADA
   - Validation: `invitado_user_id` must be in inviter's `linked_users`

8. **categorias** - Expense categories (user catalog)
   - Personal catalog per user
   - Personalization: `color`, `emoji`
   - Unique constraint: (usuario_id, LOWER(nombre))
   - Soft delete: `deleted_at`

9. **sobres_categorias** - Envelope-Category relationship (N:N)
   - Links categories to envelopes
   - Primary key: (sobre_id, categoria_id)

10. **subcategorias** - Brands/Companies (user catalog)
    - Belongs to one category
    - Personalization: `color`, `emoji`, `imagen_url` (for logos)
    - Unique constraint: (usuario_id, categoria_id, LOWER(nombre))
    - Soft delete: `deleted_at`

11. **transacciones** - Financial transactions
    - Types: GASTO, INGRESO, TRANSFERENCIA, DEPOSITO, PAGO_TC, AJUSTE
    - Required: `monto`, `moneda_id`, `billetera_id`, `tipo`, `usuario_id`, `fecha`
    - Optional: `sobre_id`, `categoria_id`, `subcategoria_id`, `descripcion`
    - Transfers: `billetera_destino_id`
    - Credit card payments: `pago_tc` JSONB (monto_pagado, monto_usado, interes)
    - Conversions: `conversion_info` JSONB (tasa, monto_destino, moneda_destino)
    - Auto-increases: `auto_aumento_sobre` JSONB
    - Versioning: `version` for change tracking
    - Soft delete: `deleted_at`

12. **asignaciones_presupuesto** - Budget assignment tracking
    - Tracks which wallet contributed to which envelope
    - Fields: `sobre_id`, `billetera_id`, `usuario_id`, `monto`, `moneda_id`
    - Types: INICIAL, AUMENTO, DISMINUCION, TRANSFERENCIA

13. **ingresos_recurrentes** - Recurring income
    - Frequencies: SEMANAL, QUINCENAL, MENSUAL, ANUAL
    - Fields: `nombre`, `monto`, `moneda_id`, `frecuencia`, `dia`, `billetera_id`
    - Auto-distribution: `auto_distribuir`, `distribucion` JSONB
    - States: ACTIVO, PAUSADO, ELIMINADO
    - Scheduling: `proxima_ejecucion`
    - Soft delete: `deleted_at`

14. **periodos** - Budget periods (skeleton for future)
    - Period types: SEMANAL, QUINCENAL, MENSUAL, CUSTOM
    - Fields: `user_id`, `tipo`, `dia_inicio`, `fecha_inicio`, `fecha_fin`, `activo`

#### Indexes Created

- Performance indexes on foreign keys, dates, and frequently filtered columns
- Partial indexes on `deleted_at IS NULL` for soft-deleted tables
- Unique indexes for business constraints (category names, etc.)

#### Triggers

- `update_updated_at_column()` function for auto-updating `updated_at` timestamp
- Applied to all tables with `updated_at` field

---

## Domain Types

### Updated: `src/domain/types/core.ts`

#### New Types Added

1. **Moneda** (Currency)
   ```typescript
   interface Moneda {
     id: string           // CLP, USD, EUR, UF
     nombre: string
     simbolo: string
     decimales: number
     tipo: TipoMoneda     // FIAT, INDICE, CRYPTO
     activa: boolean
     orden: number
   }
   ```

2. **TipoCambio** (Exchange Rate)
   ```typescript
   interface TipoCambio {
     moneda_origen: string
     moneda_destino: string
     tasa: number
     fecha: Date
     fuente?: string
   }
   ```

3. **UserConfig** (User Configuration)
   ```typescript
   interface UserConfig {
     user_id: string
     moneda_principal_id: string
     monedas_habilitadas: string[]
     timezone: string
     locale: string
     primer_dia_semana: number
     tipo_periodo: TipoPeriodo
     dia_inicio_periodo: number
   }
   ```

#### Updated Types

1. **Billetera** - Added multi-currency and personalization
   - `moneda_principal_id: string` (FASE 1)
   - `saldos_multimoneda?: Record<string, BilleteraSaldoMultimoneda>` (FASE 2)
   - `color?: string`
   - `emoji?: string`

2. **Sobre** - Added multi-currency and personalization
   - `moneda_principal_id: string` (FASE 1)
   - `presupuestos_multimoneda?: Record<string, SobrePresupuestoMultimoneda>` (FASE 2)
   - `color?: string`
   - `emoji?: string`
   - `max_participantes: number`

3. **SobreUsuario** - Added roles and permissions
   - `rol: RolSobreUsuario` (OWNER, ADMIN, CONTRIBUTOR, VIEWER)
   - `permisos?: SobreUsuarioPermisos`

4. **Categoria** & **Subcategoria** - Added personalization
   - `color?: string`
   - `emoji?: string`
   - Subcategoria also has: `imagen_url?: string` (for brand logos)

5. **Transaccion** - Added currency and conversion tracking
   - `moneda_id: string`
   - `conversion_info?: TransaccionConversion`
   - `auto_aumento_sobre?: TransaccionAutoAumento`

6. **InvitacionSobre** - Changed from email to user ID
   - `invitado_user_id: string` (instead of email)
   - User must be in inviter's `linked_users`

7. **IngresoRecurrente** - Added currency
   - `moneda_id: string`

---

## DTOs (Data Transfer Objects)

### Updated: `src/domain/types/core-dtos.ts`

#### Key Changes

1. **Moneda Fields Added**
   - All Input DTOs involving money operations now include `moneda_id` or `moneda_principal_id`
   - Examples:
     - `CrearBilleteraInput`: `moneda_principal_id`
     - `RegistrarGastoInput`: `moneda_id`
     - `CrearIngresoRecurrenteInput`: `moneda_id`
     - `AsignarPresupuestoInput.asignaciones[]`: `moneda_id`

2. **Color/Emoji Personalization**
   - Added to all creation and update DTOs:
     - `CrearBilleteraInput`, `ActualizarBilleteraInput`
     - `CrearSobreInput`, `ActualizarSobreInput`
     - `CrearCategoriaInput`, `ActualizarCategoriaInput`
     - `CrearSubcategoriaInput`, `ActualizarSubcategoriaInput`
   - Subcategoría also includes: `imagen_url?: string`

3. **Response DTOs Enhanced**
   - All Response DTOs now include full `Moneda` object:
     - `BilleteraResponse.moneda?: Moneda`
     - `SobreResponse.moneda?: Moneda`
     - `TransaccionResponse.moneda?: Moneda`
     - `IngresoRecurrenteResponse.moneda?: Moneda`
   - `TransaccionResponse` includes: `conversion_info?: TransaccionConversion`

4. **Invitation Changes**
   - `InvitarASobreInput`: Changed from `email_usuario` to `usuario_id`
   - Added `rol?: RolSobreUsuario` parameter (defaults to CONTRIBUTOR)
   - `CompartirBilleteraInput`: Changed from `email_usuario` to `usuario_id`

5. **Dashboard Enhanced**
   - `DashboardResponse.moneda_principal: Moneda` added
   - All totals documented as being in moneda principal

6. **Report Parameters**
   - Added optional `moneda_id` filter to:
     - `ReporteBilleteraParams`
     - `ReporteCategoriaParams`
     - `ReporteSubcategoriaParams`

---

## Kysely Queries

### New Query Files

#### 1. `monedas.queries.ts`
```typescript
findAllMonedasActivas()           // Get all active currencies
findAllMonedas()                  // Get all currencies (including inactive)
findMonedaById(monedaId)          // Find by ID
findMonedasByIds(monedaIds[])     // Find multiple by IDs
findMonedasHabilitadasByUser(userId) // Get user's enabled currencies
```

#### 2. `user-config.queries.ts`
```typescript
findUserConfig(userId)                                // Get user config
createDefaultUserConfig(userId, monedaPrincipalId?)   // Create with defaults
updateUserConfig(userId, configData)                  // Update config
addMonedaHabilitada(userId, monedaId)                // Enable currency
removeMonedaHabilitada(userId, monedaId)             // Disable currency
```

#### 3. `billeteras.queries.ts`
```typescript
findBilleteraById(billeteraId)                       // Find by ID
findBilleterasByUser(userId)                         // Find all user wallets
findBilleterasByUserAndMoneda(userId, monedaId)      // Filter by currency
createBilletera(billeteraData)                       // Create wallet
updateBilletera(billeteraId, billeteraData)          // Update wallet
softDeleteBilletera(billeteraId)                     // Soft delete
updateBilleteraSaldoReal(billeteraId, nuevoSaldo)    // Update real balance
updateBilleteraSaldoProyectado(billeteraId, nuevoSaldo) // Update projected
updateBilleteraSaldos(billeteraId, real, proyectado) // Update both
calcularSaldoTotalByUser(userId)                     // Calculate totals
```

#### 4. `sobres.queries.ts`
```typescript
findSobreById(sobreId)                               // Find by ID
findSobresByUser(userId)                             // Find all (owned + shared)
findSobresCompartidosByUser(userId)                  // Find shared only
createSobre(sobreData)                               // Create envelope
updateSobre(sobreId, sobreData)                      // Update envelope
softDeleteSobre(sobreId)                             // Soft delete
updateSobrePresupuesto(sobreId, nuevoPresupuesto)    // Update budget
updateSobreGastado(sobreId, nuevoGastado)           // Update spent
incrementarSobreGastado(sobreId, monto)             // Add to spent

// Participants
addParticipanteToSobre(sobreId, userId, rol, presupuesto) // Add participant
findParticipantesBySobre(sobreId)                    // Get all participants
findParticipanteInSobre(sobreId, userId)             // Get specific participant
updateParticipanteTracking(sobreId, userId, presupuesto?, gastado?) // Update tracking
incrementarParticipanteGastado(sobreId, userId, monto) // Add to participant spent
removeParticipanteFromSobre(sobreId, userId)         // Remove participant
```

#### 5. `categorias.queries.ts`
```typescript
findCategoriaById(categoriaId)                       // Find by ID
findCategoriasByUser(userId)                         // Find all user categories
findCategoriaByNombre(userId, nombre)                // Find by name (case-insensitive)
createCategoria(categoriaData)                       // Create category
updateCategoria(categoriaId, categoriaData)          // Update category
softDeleteCategoria(categoriaId)                     // Soft delete

// Sobre-Categoria Linking (N:N)
linkCategoriaToSobre(sobreId, categoriaId)           // Link to envelope
unlinkCategoriaFromSobre(sobreId, categoriaId)       // Unlink from envelope
findCategoriasBySobre(sobreId)                       // Get categories in envelope
findSobresByCategoria(categoriaId)                   // Get envelopes using category
isCategoriaLinkedToSobre(sobreId, categoriaId)       // Check if linked
```

#### 6. `subcategorias.queries.ts`
```typescript
findSubcategoriaById(subcategoriaId)                 // Find by ID
findSubcategoriasByUser(userId)                      // Find all user subcategories
findSubcategoriasByCategoria(categoriaId)            // Find by category
findSubcategoriaByNombre(userId, categoriaId, nombre) // Find by name
createSubcategoria(subcategoriaData)                 // Create subcategory
updateSubcategoria(subcategoriaId, subcategoriaData) // Update subcategory
softDeleteSubcategoria(subcategoriaId)               // Soft delete
findSubcategoriasWithCategoria(userId)               // Get with category info
```

#### 7. `transacciones.queries.ts`
```typescript
findTransaccionById(transaccionId)                   // Find by ID
findTransaccionesByUser(userId, limit?, offset?)     // Find with pagination
findTransaccionesByBilletera(billeteraId, fechaInicio?, fechaFin?) // By wallet
findTransaccionesBySobre(sobreId, fechaInicio?, fechaFin?) // By envelope
findTransaccionesByCategoria(categoriaId, fechaInicio?, fechaFin?) // By category
findTransaccionesBySubcategoria(subcategoriaId, fechaInicio?, fechaFin?) // By subcategory
findTransaccionesByTipo(userId, tipo, fechaInicio?, fechaFin?) // By type
createTransaccion(transaccionData)                   // Create transaction
updateTransaccion(transaccionId, transaccionData)    // Update transaction
softDeleteTransaccion(transaccionId)                 // Soft delete
calcularTotalGastosBySobre(sobreId, fechaInicio?, fechaFin?) // Calculate expenses
calcularTotalesByUser(userId, fechaInicio?, fechaFin?) // Calculate totals
findUltimasTransacciones(userId, limit?)             // Get recent transactions
```

#### 8. `ingresos-recurrentes.queries.ts`
```typescript
findIngresoRecurrenteById(ingresoId)                 // Find by ID
findIngresosRecurrentesByUser(userId)                // Find all user recurring
findIngresosActivosByUser(userId)                    // Find active only
findIngresosPendientesEjecucion(fechaLimite)        // Find pending execution
createIngresoRecurrente(ingresoData)                 // Create recurring income
updateIngresoRecurrente(ingresoId, ingresoData)      // Update recurring income
softDeleteIngresoRecurrente(ingresoId)               // Soft delete
pausarIngresoRecurrente(ingresoId)                   // Pause
reactivarIngresoRecurrente(ingresoId, proximaEjecucion) // Reactivate
actualizarProximaEjecucion(ingresoId, proximaEjecucion) // Update next execution
```

### Updated: `index.ts`
Added exports for all CORE query modules.

---

## Architecture Decisions

### FASE 1: Hybrid Multi-Currency Approach

**Problem:** Need multi-currency support but want to keep initial implementation simple.

**Solution:** Hybrid approach with two-phase implementation:

#### FASE 1 (Current)
- Simple fields: `moneda_principal_id`, `saldo_real`, `saldo_proyectado`
- All operations use the principal currency
- Simple queries, no complex currency conversions
- Easy to understand and implement

#### FASE 2 (Future)
- JSONB fields: `saldos_multimoneda`, `presupuestos_multimoneda`
- Structure: `{"USD": {"real": 1000, "proyectado": 800}, "EUR": {...}}`
- Extensible without schema changes
- No migration needed from FASE 1

**Benefits:**
1. Current code stays simple
2. Database ready for future expansion
3. No breaking changes when adding FASE 2
4. Performance optimized for single currency (most common case)
5. Flexibility for multi-currency users

### Financial Data Precision

- All monetary amounts use `DECIMAL(15,2)` in database
- Supports up to 999,999,999,999.99 with 2 decimal places
- Prevents floating-point precision errors
- Sufficient for personal finance applications

### Soft Deletes

- All main entities use `deleted_at` timestamp for soft deletes
- Preserves data integrity and audit trails
- Allows "undelete" functionality
- Queries always filter `WHERE deleted_at IS NULL`

### Personalization

- Color (hex): Visual identification of entities
- Emoji: Quick visual recognition
- Subcategorías también soportan `imagen_url` for brand logos
- All personalization fields are optional

### Role-Based Access Control

Shared envelopes support 4 roles:
- **OWNER**: Full control, can delete envelope
- **ADMIN**: Can manage participants and settings
- **CONTRIBUTOR**: Can view and add transactions
- **VIEWER**: Read-only access

Permissions stored in JSONB for future granular control.

### Timezone Awareness

- User config includes `timezone` field
- Critical for accurate date/time calculations
- Defaults to `America/Santiago`
- Should be auto-detected and confirmed on user registration

---

## Next Steps

### Immediate: Apply Migration
```bash
# Connect to database
psql -U user -d wapp_db

# Run migration
\i src/infrastructure/database/migrations/003_create_core_tables.sql

# Verify tables
\dt

# Check data
SELECT * FROM monedas;
SELECT * FROM user_config;
```

### Generate Kysely Types
```bash
# Regenerate TypeScript types from database schema
npm run db:types
```

### Etapa 2: Billeteras Implementation

1. **Application Services** (`src/application/services/`)
   - `billeteras.service.ts`: Business logic for wallets
   - Create, read, update, delete operations
   - Balance calculations
   - Sharing logic

2. **API Endpoints** (`src/app/api/billeteras/`)
   - `GET /api/billeteras` - List user wallets
   - `POST /api/billeteras` - Create wallet
   - `GET /api/billeteras/[id]` - Get wallet details
   - `PATCH /api/billeteras/[id]` - Update wallet
   - `DELETE /api/billeteras/[id]` - Delete wallet
   - `POST /api/billeteras/[id]/depositar` - Deposit
   - `POST /api/billeteras/transferir` - Transfer between wallets

3. **React Components** (`src/presentation/components/billeteras/`)
   - `billeteras-list.tsx` - List of wallets with totals
   - `billetera-card.tsx` - Individual wallet card
   - `crear-billetera-form.tsx` - Create wallet form
   - `editar-billetera-form.tsx` - Edit wallet form
   - `depositar-form.tsx` - Deposit form
   - `transferir-form.tsx` - Transfer form

4. **Dashboard Integration**
   - Add billeteras section to dashboard
   - Show total real and projected balances
   - Quick actions: Create, deposit, transfer

---

## Files Changed

### Created (12 files)
1. `src/infrastructure/database/migrations/003_create_core_tables.sql` (409 lines)
2. `src/infrastructure/database/queries/monedas.queries.ts` (68 lines)
3. `src/infrastructure/database/queries/user-config.queries.ts` (104 lines)
4. `src/infrastructure/database/queries/billeteras.queries.ts` (169 lines)
5. `src/infrastructure/database/queries/sobres.queries.ts` (237 lines)
6. `src/infrastructure/database/queries/categorias.queries.ts` (162 lines)
7. `src/infrastructure/database/queries/subcategorias.queries.ts` (143 lines)
8. `src/infrastructure/database/queries/transacciones.queries.ts` (298 lines)
9. `src/infrastructure/database/queries/ingresos-recurrentes.queries.ts` (137 lines)

### Modified (3 files)
1. `src/domain/types/core.ts` (397 lines, +134 changes)
2. `src/domain/types/core-dtos.ts` (408 lines, +77 changes)
3. `src/infrastructure/database/queries/index.ts` (37 lines, +8 exports)

### Total Changes
- **+2,123 insertions**
- **-34 deletions**
- **12 files changed**

---

## Testing Checklist

Before proceeding to Etapa 2, verify:

- [ ] Migration runs successfully without errors
- [ ] All tables created with correct schema
- [ ] Triggers work (updated_at auto-updates)
- [ ] Pre-loaded data exists (monedas: CLP, USD, EUR, UF)
- [ ] Kysely types regenerated successfully
- [ ] No TypeScript compilation errors
- [ ] All query functions compile correctly
- [ ] Soft delete queries work (deleted_at filtering)

---

## References

- **CORE Business Rules**: Detailed in initial user specifications
- **Database Schema**: `src/infrastructure/database/migrations/003_create_core_tables.sql`
- **Domain Types**: `src/domain/types/core.ts`
- **DTOs**: `src/domain/types/core-dtos.ts`
- **Queries**: `src/infrastructure/database/queries/*.queries.ts`
- **Commit**: `a1a7140` on branch `claude/tenemos-el-011CUu5QiDj8F5e84XkGdbrZ`
