# Creación de Usuarios en Base de Datos

Guía completa para crear nuevos usuarios en la aplicación WApp.

## 📋 Contenido

1. [Métodos disponibles](#métodos-disponibles)
2. [Permisos necesarios](#permisos-necesarios)
3. [Opción 1: Script Node.js (Recomendado)](#opción-1-script-nodejs-recomendado)
4. [Opción 2: Script SQL Manual](#opción-2-script-sql-manual)
5. [Verificación y Troubleshooting](#verificación-y-troubleshooting)

---

## 🔧 Métodos Disponibles

### 1. Script Node.js Interactivo (Recomendado)
- ✅ Más seguro y validado
- ✅ Hashea automáticamente la contraseña
- ✅ Crea toda la configuración asociada
- ✅ Mejor manejo de errores

```bash
node scripts/create-user.js
```

### 2. Script SQL Manual
- Para usuarios avanzados o integraciones
- Requiere hashear la contraseña manualmente
- Archivo: `create_user.sql`

---

## 🔐 Permisos Necesarios

### Usuario de la Aplicación (Durante runtime)

Si tu usuario de BD tiene permisos limitados, asegúrate que tenga estos permisos:

```sql
-- Tablasde lectura/escritura
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE ON user_config TO app_user;
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO app_user;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO app_user;
GRANT SELECT, INSERT, UPDATE ON billeteras TO app_user;
GRANT SELECT, INSERT, UPDATE ON sobres TO app_user;
GRANT SELECT, INSERT, UPDATE ON transacciones TO app_user;
GRANT SELECT, INSERT, UPDATE ON shopping_lists TO app_user;
GRANT SELECT, INSERT, UPDATE ON shopping_list_items TO app_user;
GRANT SELECT, INSERT, UPDATE ON shopping_executions TO app_user;
GRANT SELECT, INSERT, UPDATE ON shopping_execution_items TO app_user;
GRANT SELECT, INSERT, UPDATE ON categorias TO app_user;
GRANT SELECT, INSERT, UPDATE ON subcategorias TO app_user;

-- Tablas de solo lectura
GRANT SELECT ON subscription_plans TO app_user;
GRANT SELECT ON monedas TO app_user;
GRANT SELECT ON product_catalog TO app_user;
GRANT SELECT ON product_categories_global TO app_user;
GRANT SELECT ON product_categories_user TO app_user;
GRANT SELECT ON product_user_custom TO app_user;
```

### Usuario para Crear Usuarios (Script Setup)

Si usarás un usuario especial para este script:

```sql
-- Crear rol específico para setup
CREATE ROLE setup_user WITH LOGIN PASSWORD 'secure_password';

-- Dar permisos
GRANT CONNECT ON DATABASE neondb TO setup_user;
GRANT USAGE ON SCHEMA public TO setup_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO setup_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO setup_user;

-- Permisos para funciones (bcrypt, uuid, etc.)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO setup_user;
```

### Superusuario (Solo si es necesario)

Para operaciones administrativas especiales:

```bash
# Conectarse con superusuario
psql -U postgres -d neondb -h localhost

# Luego ejecutar los scripts SQL
```

---

## ✨ Opción 1: Script Node.js (Recomendado)

### Paso 1: Preparar el entorno

```bash
# Instalar dependencias (si no está)
npm install bcryptjs

# Asegurar que DATABASE_URL está en .env
cat .env | grep DATABASE_URL
```

### Paso 2: Ejecutar el script

```bash
node scripts/create-user.js
```

### Paso 3: Ingresar datos

```
👤 Nombre completo: Juan Pérez García
📧 Email: juan.perez@example.com
📱 Teléfono (opcional): +56912345678
🔐 Contraseña: MiContraseña123!
🔐 Confirma contraseña: MiContraseña123!
```

### Paso 4: Confirmación

El script mostrará:

```
╔════════════════════════════════════════════════════════╗
║            ✅ USUARIO CREADO EXITOSAMENTE             ║
╚════════════════════════════════════════════════════════╝

Datos del usuario creado:
  📌 ID:       550e8400-e29b-41d4-a716-446655440000
  👤 Nombre:   Juan Pérez García
  📧 Email:    juan.perez@example.com
  📱 Teléfono: +56912345678
  🔐 Tipo:     EMAIL
  📊 Plan:     FREE
  💰 Billetera: Efectivo (CLP $0)
```

---

## 📝 Opción 2: Script SQL Manual

### Paso 1: Preparar la contraseña

Generar hash bcrypt con Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10).then(h => console.log(h));"
```

Resultado: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLK`

O con PostgreSQL (menos recomendado):

```sql
SELECT crypt('password123', gen_salt('bf', 10));
```

### Paso 2: Editar el script SQL

Abrir `create_user.sql` y reemplazar:

```sql
-- Reemplazar estos valores
<name>                 → "Juan Pérez"
<email>                → "juan@example.com"
<phone>                → "+56912345678" o NULL
<hashed_password>      → "$2a$10$N9qo8uLOickgx2Z..."
```

### Paso 3: Ejecutar el script

```bash
# Con psql local
psql -U postgres -d neondb -f create_user.sql

# Con Neon (cloud)
psql postgresql://user:password@host/neondb -f create_user.sql

# O copiar y pegar en pgAdmin/DBeaver
```

### Paso 4: Obtener el user_id

Si el INSERT no retorna el ID, ejecutar:

```sql
SELECT id FROM users WHERE email = 'juan@example.com' LIMIT 1;
```

Usar ese ID en el resto del script.

---

## ✅ Verificación y Troubleshooting

### Verificar que el usuario fue creado

```sql
-- Ver usuario
SELECT id, name, email, account_type, created_at
FROM users
WHERE email = 'juan@example.com';

-- Ver configuración completa
SELECT
  u.id,
  u.name,
  u.email,
  uc.locale,
  uc.moneda_principal_id,
  us.status as subscription_status
FROM users u
LEFT JOIN user_config uc ON u.id = uc.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.email = 'juan@example.com';

-- Ver billeteras
SELECT nombre, tipo, saldo_real, moneda_principal_id
FROM billeteras
WHERE usuario_id = 'user-id-aqui';
```

### Errores Comunes

#### ❌ Error: "duplicate key value violates unique constraint 'users_email_key'"

**Causa:** El email ya está registrado

**Solución:**
```bash
# Verificar
SELECT * FROM users WHERE email = 'juan@example.com';

# Eliminar el usuario anterior (si es necesario)
DELETE FROM users WHERE email = 'juan@example.com';

# O usar un email diferente
```

#### ❌ Error: "foreign key constraint 'user_subscriptions_plan_id_fkey'"

**Causa:** El plan 'free' no existe

**Solución:**
```bash
# Ejecutar migraciones
npm run db:types

# Verificar planes
psql -c "SELECT id, slug, name FROM subscription_plans;"

# Crear plan FREE si no existe
psql -c "INSERT INTO subscription_plans (slug, name, trial_days) VALUES ('free', 'Plan Gratuito', 0);"
```

#### ❌ Error: "password must be encrypted to login"

**Causa:** La contraseña no está hasheada

**Solución:**
```bash
# Hashear con Node.js (no usar plain text)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('mypassword', 10).then(h => console.log(h));"

# Actualizar en BD
UPDATE users SET password = '$2a$10$...' WHERE id = 'user-id';
```

#### ❌ Error: "database connection failed"

**Causa:** DATABASE_URL no es válido

**Solución:**
```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1;"

# Verificar .env
cat .env | grep DATABASE_URL

# Formato correcto de DATABASE_URL:
# postgresql://user:password@host:5432/database
```

---

## 🔄 Workflow Completo (Desarrollo)

```bash
# 1. Asegurar que las migraciones están aplicadas
npm run db:migrate

# 2. Crear usuario
node scripts/create-user.js

# 3. Iniciar aplicación
npm run dev

# 4. Login con el usuario creado
# https://localhost:3000/en/auth/login
```

---

## 📊 Estructura de Datos Creada

Cuando creas un usuario, se crean automáticamente:

```
users
├── id: UUID único
├── name: Nombre
├── email: Email (único)
├── password: Hash bcrypt
├── account_type: EMAIL o PHONE
└── ...

user_config
├── locale: es-CL (idioma/país)
├── moneda_principal_id: CLP
├── timezone: America/Santiago
└── ...

user_subscriptions
├── plan_id: plan FREE
├── status: free
└── ...

user_preferences
├── show_inline_qty: true
├── group_by_category: false
└── ...

billeteras
├── nombre: Efectivo
├── tipo: EFECTIVO
├── saldo_real: 0
└── ...
```

---

## 🔑 Valores Por Defecto

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `account_type` | EMAIL | Tipo de cuenta primaria |
| `email_verified` | NOW() | Email verificado automáticamente |
| `phone_verified` | NULL | Teléfono no verificado (opcional) |
| `locale` | es-CL | Español - Chile |
| `timezone` | America/Santiago | Zona horaria |
| `moneda_principal_id` | CLP | Peso Chileno |
| `subscription_status` | free | Plan gratuito |
| `primer_dia_semana` | 1 | Lunes como primer día |
| `tipo_periodo` | MENSUAL | Período mensual |

---

## 📚 Scripts Relacionados

- `scripts/create-user.js` - Crear usuario interactivo
- `create_user.sql` - Crear usuario manualmente
- `npm run db:types` - Regenerar tipos de BD
- `npm run db:migrate` - Aplicar migraciones (si existen)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa `DATABASE_USER_SETUP.md` (este archivo)
2. Ejecuta verificaciones SQL arriba
3. Revisa logs de la aplicación
4. Verifica permisos de BD

---

**Última actualización:** 2025-12-05
**Compatible con:** Next.js 15, PostgreSQL 13+, Kysely
