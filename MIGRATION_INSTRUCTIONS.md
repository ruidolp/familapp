# 🔧 Instrucciones de Migración Actualizadas - Regeneración Completa

## ⚠️ IMPORTANTE: Estrategia de Generación de IDs

Este proyecto ahora usa **PostgreSQL DEFAULT gen_random_uuid()::TEXT** en lugar de `crypto.randomUUID()` para:
- ✅ Mejor compatibilidad con mobile (Capacitor)
- ✅ Estándares de la industria
- ✅ Generación automática en la base de datos
- ✅ Sin dependencias de Node.js crypto API

## 📋 Archivos de Migración Actualizados

### Nuevos Archivos de Migración

1. **`000_create_base_tables.sql`** - Tablas base del sistema:
   - users (con id TEXT DEFAULT gen_random_uuid()::TEXT)
   - accounts (OAuth providers)
   - sessions (NextAuth sessions)
   - verification_tokens
   - verification_codes

2. **`001_create_subscription_tables.sql`** - Módulo de suscripciones:
   - subscription_plans
   - plan_capabilities
   - plan_limits
   - user_subscriptions
   - linked_users
   - invitation_codes
   - subscription_history
   - payment_products

3. **`002_seed_subscriptions_data.sql`** - Datos iniciales de planes

## 📝 Pasos para Ejecutar las Migraciones

### Opción 1: Desde Neon SQL Editor (Recomendado)

1. **Limpiar la base de datos**:
   ```sql
   -- Eliminar TODAS las tablas y tipos existentes
   DROP TABLE IF EXISTS payment_products CASCADE;
   DROP TABLE IF EXISTS subscription_history CASCADE;
   DROP TABLE IF EXISTS invitation_codes CASCADE;
   DROP TABLE IF EXISTS linked_users CASCADE;
   DROP TABLE IF EXISTS user_subscriptions CASCADE;
   DROP TABLE IF EXISTS plan_limits CASCADE;
   DROP TABLE IF EXISTS plan_capabilities CASCADE;
   DROP TABLE IF EXISTS subscription_plans CASCADE;
   DROP TABLE IF EXISTS verification_codes CASCADE;
   DROP TABLE IF EXISTS verification_tokens CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TABLE IF EXISTS accounts CASCADE;
   DROP TABLE IF EXISTS users CASCADE;

   DROP TYPE IF EXISTS subscription_event_type;
   DROP TYPE IF EXISTS invitation_status;
   DROP TYPE IF EXISTS subscription_period;
   DROP TYPE IF EXISTS subscription_platform;
   DROP TYPE IF EXISTS subscription_status;
   DROP TYPE IF EXISTS verification_code_status;
   DROP TYPE IF EXISTS verification_code_type;
   DROP TYPE IF EXISTS account_type;

   DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
   ```

2. **Ejecutar migración de tablas base**:
   - Ve a https://console.neon.tech → Tu Proyecto → SQL Editor
   - Copia TODO el contenido de `000_create_base_tables.sql`
   - Ejecuta el script
   - Verifica: `SELECT * FROM users LIMIT 1;` (debería estar vacía pero existir)

3. **Ejecutar migración de suscripciones**:
   - Copia TODO el contenido de `001_create_subscription_tables.sql`
   - Ejecuta el script
   - Verifica: `SELECT * FROM subscription_plans;` (debería estar vacía)

4. **Ejecutar seed de datos**:
   - Copia TODO el contenido de `002_seed_subscriptions_data.sql`
   - Ejecuta el script
   - Verifica: `SELECT slug, name, max_linked_users FROM subscription_plans;`

### Opción 2: Desde psql (línea de comandos)

```bash
# Conectar a Neon
psql "postgresql://neondb_owner:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require"

# Limpiar base de datos (opcional, solo si hay datos antiguos)
\i src/infrastructure/database/migrations/cleanup.sql

# Ejecutar migraciones en orden
\i src/infrastructure/database/migrations/000_create_base_tables.sql
\i src/infrastructure/database/migrations/001_create_subscription_tables.sql
\i src/infrastructure/database/migrations/002_seed_subscriptions_data.sql

# Verificar
\dt
SELECT * FROM subscription_plans;
```

## ✅ Verificación Post-Migración

### 1. Verificar Tablas Creadas

```sql
\dt

-- Deberías tener estas 13 tablas:
-- accounts
-- invitation_codes
-- linked_users
-- payment_products
-- plan_capabilities
-- plan_limits
-- sessions
-- subscription_history
-- subscription_plans
-- user_subscriptions
-- users
-- verification_codes
-- verification_tokens
```

### 2. Verificar Planes de Suscripción

```sql
SELECT slug, name, trial_days, max_linked_users FROM subscription_plans;

-- Resultado esperado:
--   slug   |   name   | trial_days | max_linked_users
------------+----------+------------+------------------
-- free     | Free     |          0 |                0
-- premium  | Premium  |          7 |                1
-- familiar | Familiar |          7 |                3
```

### 3. Verificar Generación Automática de IDs

```sql
-- Insertar un usuario de prueba (el ID se genera automáticamente)
INSERT INTO users (name, email, password, updated_at)
VALUES ('Test User', 'test@example.com', 'hashed_password', NOW())
RETURNING id, name, email;

-- El ID debería ser un UUID generado automáticamente
-- Eliminar después: DELETE FROM users WHERE email = 'test@example.com';
```

## 🔄 Cambios en el Código

### ✅ Completados Automáticamente

1. **Prisma eliminado**:
   - Carpeta `/prisma` eliminada
   - Referencias en documentación actualizadas a Kysely

2. **crypto.randomUUID() eliminado**:
   - `src/infrastructure/database/queries/user.queries.ts` - Ya no genera IDs manualmente
   - Todos los IDs se generan en la base de datos con `DEFAULT gen_random_uuid()::TEXT`

3. **Traducciones agregadas**:
   - `src/i18n/messages/en.json` - Mensajes de error de autenticación
   - `src/i18n/messages/es.json` - Mensajes de error de autenticación

4. **Documentación actualizada**:
   - `README.md` - Todas las referencias Prisma → Kysely
   - `ARCHITECTURE.md` - Ejemplos actualizados con Kysely
   - `CLAUDE.md` - Documentación completa de OAuth flow

## 🚀 Próximos Pasos

### 1. Probar la Aplicación

```bash
# Iniciar servidor
npm run dev

# Probar endpoints
curl http://localhost:3000/api/subscriptions/status \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

### 2. Registrar un Nuevo Usuario

Visita: http://localhost:3000/auth/register

El ID del usuario se generará automáticamente en PostgreSQL.

### 3. Probar OAuth (Opcional)

Si tienes configurado Google OAuth:

1. Visita: http://localhost:3000/auth/login
2. Click en "Continue with Google"
3. El usuario se creará automáticamente con ID generado por PostgreSQL

## 📊 Flujo de Creación de Usuario

### Via Credentials (Email/Password)

```
1. Usuario llena formulario de registro
2. POST /api/register
3. registerUser() en auth.service.ts
4. createUser() en user.queries.ts
5. INSERT INTO users (...) - PostgreSQL genera el ID automáticamente
6. RETURNING id, ... - Se retorna el usuario con el ID
7. Usuario creado y redirigido a /dashboard
```

### Via OAuth (Google/Facebook)

```
1. Usuario hace click en "Continue with Google"
2. Redirección a Google OAuth
3. Usuario autoriza en Google
4. Callback a NextAuth
5. KyselyAdapter.createUser() se llama automáticamente
6. INSERT INTO users (...) - PostgreSQL genera el ID
7. INSERT INTO accounts (...) - Se vincula la cuenta OAuth
8. Usuario autenticado y redirigido a /dashboard
```

## 🔍 Estructura de IDs

Todos los IDs son generados por PostgreSQL como TEXT:

```typescript
// Tipo de ID en TypeScript
export interface UsersTable {
  id: Generated<string>  // PostgreSQL lo genera automáticamente
  name: string
  email: string | null
  // ...
}

// Ejemplo de ID generado:
// "a3bb189e-8bf9-4558-b8d9-cbb04e95c6f1"
```

## 🐛 Troubleshooting

### Error: "relation does not exist"

```sql
-- Verificar que las tablas existen
\dt

-- Si no existen, ejecutar las migraciones de nuevo
```

### Error: "function gen_random_uuid does not exist"

```sql
-- Verificar que la extensión pgcrypto está instalada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "null value in column 'id' violates not-null constraint"

Este error NO debería ocurrir más porque:
- ✅ Todas las tablas tienen `DEFAULT gen_random_uuid()::TEXT`
- ✅ El código NO intenta insertar IDs manualmente
- ✅ PostgreSQL genera los IDs automáticamente

Si aún lo ves:
1. Verifica que ejecutaste la migración `000_create_base_tables.sql`
2. Verifica que la columna `id` tiene DEFAULT: `\d users`

### OAuth: Usuario se crea sin problemas

Si el usuario no se crea al hacer login con Google:
1. Verifica que `allowSelfSignup: true` en `app.config.ts`
2. Verifica logs en la consola del servidor
3. El `KyselyAdapter` debería crear el usuario automáticamente

## 📚 Referencias

- **Database Migrations**: `src/infrastructure/database/migrations/`
- **Query Functions**: `src/infrastructure/database/queries/`
- **Types**: `src/infrastructure/database/types.ts`
- **Auth Config**: `src/infrastructure/lib/auth.ts`
- **Kysely Adapter**: `src/infrastructure/lib/kysely-adapter.ts`

## ✨ Resumen de Mejoras

1. ✅ **IDs generados por PostgreSQL** (industry standard)
2. ✅ **Compatible con mobile** (sin dependencia de crypto API)
3. ✅ **Código más limpio** (sin generación manual de IDs)
4. ✅ **OAuth automático** (usuarios se crean sin intervención)
5. ✅ **Migraciones SQL estándar** (fácil de versionar y replicar)
6. ✅ **Documentación completa** (OAuth flow explicado)
7. ✅ **Traducciones agregadas** (errores de autenticación en EN y ES)
8. ✅ **Prisma eliminado completamente** (100% Kysely)

---

¡Listo para producción! 🚀
