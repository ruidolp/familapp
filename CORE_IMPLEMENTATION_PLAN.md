# Plan de Implementación del CORE - WApp

## 🎯 Objetivo

Implementar el sistema CORE de gestión financiera con Clean Architecture, manteniendo separación de capas front/back para migración futura.

---

## 📊 Estructura de Implementación

```
BILLETERAS → SOBRES → CATEGORÍAS → SUBCATEGORÍAS → TRANSACCIONES → REPORTES
   (base)    (presupuesto)  (organización)        (movimientos)    (analytics)
```

---

## 🚀 ETAPA 1: INFRAESTRUCTURA Y BASE DE DATOS

### Prioridad: CRÍTICA
### Tiempo estimado: 2-3 días

#### 1.1 Schema de Base de Datos

**Tablas principales:**

```sql
-- BILLETERAS
CREATE TABLE billeteras (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- DEBITO, TC, EFECTIVO, etc.
  saldo_real DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_proyectado DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_compartida BOOLEAN NOT NULL DEFAULT false,
  usuario_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- SOBRES
CREATE TABLE sobres (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'GASTO', -- GASTO, AHORRO, DEUDA
  is_compartido BOOLEAN NOT NULL DEFAULT false,
  usuario_id TEXT NOT NULL REFERENCES users(id), -- owner
  presupuesto_asignado DECIMAL(15,2) DEFAULT 0,
  gastado DECIMAL(15,2) DEFAULT 0,
  meta_objetivo DECIMAL(15,2), -- para AHORRO
  ahorrado_actual DECIMAL(15,2), -- para AHORRO
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- SOBRES_USUARIOS (para compartidos - tracking individual)
CREATE TABLE sobres_usuarios (
  sobre_id TEXT NOT NULL REFERENCES sobres(id),
  usuario_id TEXT NOT NULL REFERENCES users(id),
  presupuesto_asignado DECIMAL(15,2) NOT NULL DEFAULT 0,
  gastado DECIMAL(15,2) NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'PARTICIPANTE', -- OWNER, PARTICIPANTE
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sobre_id, usuario_id)
);

-- CATEGORÍAS (catálogo global del usuario)
CREATE TABLE categorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(usuario_id, nombre, deleted_at) -- No duplicados activos
);

-- SOBRES_CATEGORIAS (relación N:N)
CREATE TABLE sobres_categorias (
  sobre_id TEXT NOT NULL REFERENCES sobres(id),
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sobre_id, categoria_id)
);

-- SUBCATEGORÍAS (marcas/empresas)
CREATE TABLE subcategorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  usuario_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(usuario_id, categoria_id, nombre, deleted_at)
);

-- TRANSACCIONES (serializables - TODO movimiento de dinero)
CREATE TABLE transacciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  monto DECIMAL(15,2) NOT NULL, -- OBLIGATORIO
  billetera_id TEXT NOT NULL REFERENCES billeteras(id), -- OBLIGATORIO
  tipo TEXT NOT NULL, -- GASTO, INGRESO, TRANSFERENCIA, DEPOSITO, PAGO_TC
  usuario_id TEXT NOT NULL REFERENCES users(id), -- OBLIGATORIO

  -- OPCIONALES (flexibles)
  sobre_id TEXT REFERENCES sobres(id),
  categoria_id TEXT REFERENCES categorias(id),
  subcategoria_id TEXT REFERENCES subcategorias(id),
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT NOW(),

  -- Para transferencias
  billetera_destino_id TEXT REFERENCES billeteras(id),

  -- Para pagos TC (JSON)
  pago_tc JSONB,

  -- Auto-aumentos (JSON)
  auto_aumento_sobre JSONB,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

-- ASIGNACIONES_PRESUPUESTO (tracking de qué billetera aportó a qué sobre)
CREATE TABLE asignaciones_presupuesto (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id),
  billetera_id TEXT NOT NULL REFERENCES billeteras(id),
  usuario_id TEXT NOT NULL REFERENCES users(id),
  monto DECIMAL(15,2) NOT NULL,
  tipo TEXT NOT NULL, -- INICIAL, AUMENTO, DISMINUCION, TRANSFERENCIA
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INGRESOS_RECURRENTES
CREATE TABLE ingresos_recurrentes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nombre TEXT NOT NULL,
  monto DECIMAL(15,2) NOT NULL,
  frecuencia TEXT NOT NULL, -- MENSUAL, QUINCENAL, SEMANAL, ANUAL
  dia INTEGER NOT NULL,
  billetera_id TEXT NOT NULL REFERENCES billeteras(id),
  usuario_id TEXT NOT NULL REFERENCES users(id),
  auto_distribuir BOOLEAN NOT NULL DEFAULT false,
  distribucion JSONB, -- [{ sobre_id, monto }]
  estado TEXT NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, PAUSADO, ELIMINADO
  proxima_ejecucion TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- INVITACIONES_SOBRES (para sobres compartidos)
CREATE TABLE invitaciones_sobres (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sobre_id TEXT NOT NULL REFERENCES sobres(id),
  invitado_por_id TEXT NOT NULL REFERENCES users(id),
  invitado_email TEXT NOT NULL,
  invitado_user_id TEXT REFERENCES users(id),
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ACEPTADA, RECHAZADA
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Índices:**

```sql
-- Billeteras
CREATE INDEX idx_billeteras_usuario ON billeteras(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_billeteras_compartidas ON billeteras(is_compartida) WHERE deleted_at IS NULL;

-- Sobres
CREATE INDEX idx_sobres_usuario ON sobres(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sobres_compartidos ON sobres(is_compartido) WHERE deleted_at IS NULL;

-- Transacciones
CREATE INDEX idx_transacciones_usuario ON transacciones(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_billetera ON transacciones(billetera_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_sobre ON transacciones(sobre_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo) WHERE deleted_at IS NULL;

-- Categorías
CREATE INDEX idx_categorias_usuario ON categorias(usuario_id) WHERE deleted_at IS NULL;

-- Subcategorías
CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subcategorias_usuario ON subcategorias(usuario_id) WHERE deleted_at IS NULL;
```

#### 1.2 Kysely Types

```bash
npm run db:types
```

Genera tipos TypeScript desde schema PostgreSQL.

#### 1.3 Queries Base

Crear archivos en `src/infrastructure/database/queries/`:
- `billeteras.ts`
- `sobres.ts`
- `categorias.ts`
- `subcategorias.ts`
- `transacciones.ts`
- `ingresos-recurrentes.ts`

---

## 🚀 ETAPA 2: BILLETERAS (BASE DEL SISTEMA)

### Prioridad: CRÍTICA
### Tiempo estimado: 2-3 días

### 2.1 Backend

**Estructura:**

```
src/
├── application/services/
│   └── billeteras.service.ts
├── app/api/
│   └── billeteras/
│       ├── route.ts (GET all, POST create)
│       ├── [id]/
│       │   ├── route.ts (GET, PUT, DELETE)
│       │   ├── depositar/route.ts
│       │   ├── transferir/route.ts
│       │   ├── pagar-tc/route.ts
│       │   └── compartir/route.ts
│       └── compartidas/route.ts
```

**Endpoints:**

- `GET /api/billeteras` - Listar mis billeteras + compartidas
- `POST /api/billeteras` - Crear billetera
- `GET /api/billeteras/[id]` - Detalle de billetera
- `PUT /api/billeteras/[id]` - Actualizar billetera
- `DELETE /api/billeteras/[id]` - Eliminar (soft delete)
- `POST /api/billeteras/[id]/depositar` - Depositar dinero
- `POST /api/billeteras/transferir` - Transferir entre billeteras
- `POST /api/billeteras/[id]/pagar-tc` - Pagar tarjeta de crédito
- `POST /api/billeteras/[id]/compartir` - Compartir con pareja

**Servicios:**

```typescript
// src/application/services/billeteras.service.ts
export async function crearBilletera(userId: string, data: CrearBilleteraInput)
export async function obtenerBilleteras(userId: string)
export async function obtenerBilletera(userId: string, billeteraId: string)
export async function actualizarBilletera(userId: string, billeteraId: string, data: ActualizarBilleteraInput)
export async function eliminarBilletera(userId: string, billeteraId: string)
export async function depositarDinero(userId: string, billeteraId: string, data: DepositarBilleteraInput)
export async function transferirEntreB illeteras(userId: string, data: TransferirBilleterasInput)
export async function pagarTC(userId: string, data: PagarTCInput)
export async function compartirBilletera(userId: string, data: CompartirBilleteraInput)
```

### 2.2 Frontend

**Componentes:**

```
src/presentation/components/core/
└── billeteras/
    ├── lista-billeteras.tsx
    ├── crear-billetera-form.tsx
    ├── detalle-billetera.tsx
    ├── depositar-form.tsx
    ├── transferir-form.tsx
    ├── pagar-tc-form.tsx
    └── compartir-billetera-dialog.tsx
```

**Páginas:**

```
src/app/[locale]/
└── dashboard/
    └── billeteras/
        ├── page.tsx (lista)
        └── [id]/page.tsx (detalle)
```

**Hooks:**

```typescript
// src/presentation/hooks/use-billeteras.ts
export function useBilleteras()
export function useBilletera(id: string)
export function useCrearBilletera()
export function useDepositarBilletera()
export function useTransferirBilleteras()
```

### 2.3 Validaciones

**Reglas de negocio:**

- FREE: máximo 1 billetera personal
- Premium: ilimitadas personales
- Premium Pareja/Familiar: ilimitadas + compartidas
- Solo owner puede eliminar billetera compartida
- Soft delete preserva historial de transacciones

---

## 🚀 ETAPA 3: CATEGORÍAS Y SUBCATEGORÍAS

### Prioridad: ALTA
### Tiempo estimado: 1-2 días

### 3.1 Backend

**Endpoints:**

- `GET /api/categorias` - Mi catálogo
- `POST /api/categorias` - Crear categoría
- `PUT /api/categorias/[id]` - Editar
- `DELETE /api/categorias/[id]` - Eliminar (validar sin gastos)
- `GET /api/subcategorias` - Mi catálogo
- `POST /api/subcategorias` - Crear subcategoría
- `PUT /api/subcategorias/[id]` - Editar
- `DELETE /api/subcategorias/[id]` - Eliminar

### 3.2 Frontend

**Componentes:**

```
src/presentation/components/core/
├── categorias/
│   ├── catalogo-categorias.tsx
│   ├── crear-categoria-form.tsx
│   └── selector-categoria.tsx (con creación inline)
└── subcategorias/
    ├── catalogo-subcategorias.tsx
    ├── crear-subcategoria-form.tsx
    └── selector-subcategoria.tsx (con creación inline)
```

---

## 🚀 ETAPA 4: SOBRES (PRESUPUESTO VIRTUAL)

### Prioridad: CRÍTICA
### Tiempo estimado: 3-4 días

### 4.1 Backend

**Endpoints:**

- `GET /api/sobres` - Listar mis sobres (personales + compartidos)
- `POST /api/sobres` - Crear sobre
- `GET /api/sobres/[id]` - Detalle
- `PUT /api/sobres/[id]` - Actualizar nombre
- `DELETE /api/sobres/[id]` - Eliminar (soft delete, libera presupuesto)
- `POST /api/sobres/[id]/asignar-presupuesto` - Asignar inicial
- `POST /api/sobres/[id]/aumentar-presupuesto` - Aumentar
- `POST /api/sobres/[id]/disminuir-presupuesto` - Disminuir (libera proyectado)
- `POST /api/sobres/transferir-presupuesto` - Transferir entre sobres
- `POST /api/sobres/[id]/categorias` - Agregar categorías (inline)
- `DELETE /api/sobres/[id]/categorias/[catId]` - Quitar categoría
- `POST /api/sobres/[id]/invitar` - Invitar a sobre compartido
- `POST /api/sobres/invitaciones/[id]/aceptar` - Aceptar invitación
- `POST /api/sobres/invitaciones/[id]/rechazar` - Rechazar

### 4.2 Frontend

**Componentes:**

```
src/presentation/components/core/sobres/
├── lista-sobres.tsx
├── crear-sobre-form.tsx
├── detalle-sobre.tsx
├── sobre-personal.tsx
├── sobre-compartido.tsx (con tracking individual)
├── asignar-presupuesto-form.tsx
├── aumentar-presupuesto-form.tsx
├── transferir-presupuesto-form.tsx
├── gestionar-categorias.tsx
└── invitar-usuario-dialog.tsx
```

### 4.3 Lógica de Negocio

**Validaciones:**

- FREE: 1 sobre personal, 0 compartidos
- Premium Individual: ∞ personales, 0 compartidos
- Premium Pareja: ∞ personales + compartidos (2 usuarios)
- Familiar: ∞ personales + compartidos (5 usuarios)

**Flujos especiales:**

- Asignar presupuesto: descuenta proyectado de billeteras
- Disminuir presupuesto: libera proyectado
- Eliminar sobre: libera todo el presupuesto asignado
- Transferir desde compartido: solo MI parte disponible
- Auto-aumentar al gastar más del presupuesto

---

## 🚀 ETAPA 5: TRANSACCIONES (GASTOS E INGRESOS)

### Prioridad: CRÍTICA
### Tiempo estimado: 3-4 días

### 5.1 Backend

**Endpoints:**

- `POST /api/transacciones` - Registrar transacción genérica
- `POST /api/transacciones/gasto` - Registrar gasto
- `POST /api/transacciones/ingreso` - Registrar ingreso
- `GET /api/transacciones` - Listar (con filtros)
- `GET /api/transacciones/[id]` - Detalle
- `PUT /api/transacciones/[id]` - Editar (recalcula todo)
- `DELETE /api/transacciones/[id]` - Eliminar (revierte cambios)

### 5.2 Lógica de Transacciones

**Al registrar gasto:**

1. Validar billetera existe y es accesible (personal propia o compartida)
2. Si tiene sobre_id:
   - Verificar disponible en sobre
   - Si excede: auto-aumentar presupuesto del sobre
   - Actualizar gastado del sobre
   - En compartidos: actualizar tracking individual
3. Actualizar saldo_real de billetera
4. Si gasto NO presupuestado: actualizar saldo_proyectado
5. Crear transacción serializable

**Al eliminar gasto:**

1. Revertir cambios en sobre (devolver al disponible)
2. Revertir cambios en billetera (devolver al real)
3. Si era NO presupuestado: revertir proyectado
4. Soft delete de transacción

### 5.3 Frontend

**Componentes:**

```
src/presentation/components/core/transacciones/
├── registrar-gasto-form.tsx
├── registrar-ingreso-form.tsx
├── lista-transacciones.tsx
├── detalle-transaccion.tsx
├── editar-transaccion-dialog.tsx
└── gasto-rapido-button.tsx (sin categoría/sobre)
```

---

## 🚀 ETAPA 6: INGRESOS RECURRENTES

### Prioridad: MEDIA
### Tiempo estimado: 2 días

### 6.1 Backend

**Endpoints:**

- `GET /api/ingresos-recurrentes` - Listar
- `POST /api/ingresos-recurrentes` - Crear
- `PUT /api/ingresos-recurrentes/[id]` - Editar
- `DELETE /api/ingresos-recurrentes/[id]` - Eliminar
- `POST /api/ingresos-recurrentes/[id]/ejecutar` - Ejecutar manual
- `POST /api/ingresos-recurrentes/[id]/pausar` - Pausar temporalmente

### 6.2 Cron Job

**Implementar:**

- Verificar ingresos pendientes de ejecutar cada día
- Ejecutar y preguntar al usuario si distribuir
- Actualizar próxima_ejecucion

---

## 🚀 ETAPA 7: REPORTES Y DASHBOARD

### Prioridad: ALTA
### Tiempo estimado: 2-3 días

### 7.1 Backend

**Endpoints:**

- `GET /api/reportes/dashboard` - Dashboard general
- `GET /api/reportes/billetera/[id]` - Reporte de billetera
- `GET /api/reportes/sobre/[id]` - Reporte de sobre
- `GET /api/reportes/categoria/[id]` - Reporte de categoría (por sobre o global)
- `GET /api/reportes/subcategoria/[id]` - Reporte de subcategoría

### 7.2 Frontend

**Páginas:**

```
src/app/[locale]/dashboard/
├── page.tsx (dashboard principal)
├── reportes/
│   ├── billeteras/[id]/page.tsx
│   ├── sobres/[id]/page.tsx
│   ├── categorias/[id]/page.tsx
│   └── subcategorias/[id]/page.tsx
```

**Componentes:**

```
src/presentation/components/core/reportes/
├── dashboard-overview.tsx
├── grafico-billeteras.tsx
├── grafico-sobres.tsx
├── resumen-mes.tsx
├── ultimas-transacciones.tsx
└── alertas-presupuesto.tsx (sobres en rojo)
```

---

## 🚀 ETAPA 8: VALIDACIONES POR PLAN

### Prioridad: ALTA
### Tiempo estimado: 1 día

### 8.1 Middleware de Validación

**Crear middleware:**

```typescript
// src/infrastructure/lib/plan-validation.ts
export function validateBilleterasLimit(userId: string, action: 'create')
export function validateSobresLimit(userId: string, action: 'create', tipo: 'personal' | 'compartido')
export function validateCompartidosLimit(userId: string, sobreId: string, action: 'invite')
```

**Aplicar en endpoints:**

- Crear billetera: validar límite según plan
- Crear sobre: validar límite y tipo según plan
- Invitar a sobre: validar límite de participantes según plan

---

## 📅 CRONOGRAMA ESTIMADO

| Etapa | Tiempo | Dependencias |
|-------|--------|--------------|
| 1. Infraestructura y BD | 2-3 días | Ninguna |
| 2. Billeteras | 2-3 días | Etapa 1 |
| 3. Categorías/Subcategorías | 1-2 días | Etapa 1 |
| 4. Sobres | 3-4 días | Etapas 1, 2, 3 |
| 5. Transacciones | 3-4 días | Etapas 1, 2, 3, 4 |
| 6. Ingresos Recurrentes | 2 días | Etapas 1, 2, 4 |
| 7. Reportes | 2-3 días | Todas las anteriores |
| 8. Validaciones por Plan | 1 día | Etapas 2, 4 |

**TOTAL: ~16-22 días (3-4 semanas)**

---

## ✅ CHECKLIST DE CADA ETAPA

Para cada feature:

- [ ] Schema de BD migrado
- [ ] Queries de Kysely creadas
- [ ] Service layer implementado
- [ ] API endpoints creados
- [ ] Validaciones de negocio
- [ ] Componentes frontend
- [ ] Hooks de React
- [ ] Integración con apiClient
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Mensajes de éxito/error
- [ ] Testing básico
- [ ] Documentación

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **Infraestructura** (base crítica)
2. **Billeteras** (sin billeteras no hay nada)
3. **Categorías/Subcategorías** (catálogo reutilizable)
4. **Sobres** (presupuestos virtuales)
5. **Transacciones** (gastos e ingresos)
6. **Ingresos Recurrentes** (automatización)
7. **Reportes** (analytics)
8. **Validaciones por Plan** (restricciones de negocio)

---

## 🔧 PRÓXIMOS PASOS

1. ✅ Cliente HTTP centralizado creado
2. ✅ Tipos del dominio definidos
3. ⏳ Crear migration SQL para schema
4. ⏳ Implementar queries base
5. ⏳ Iniciar Etapa 2: Billeteras

¿Procedemos con la Etapa 1 (Schema de BD y queries)?
