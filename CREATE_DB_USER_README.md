# 🗄️ Crear Usuario PostgreSQL para WApp

Guía para crear un usuario (role) de PostgreSQL con todos los permisos necesarios para que la aplicación WApp funcione correctamente.

---

## 📋 Métodos Disponibles

### ✅ Método 1: Script Node.js Interactivo (Recomendado)

**Ventajas:**
- ✨ Interfaz interactiva
- 🔐 Genera contraseña segura automáticamente
- ✅ Validaciones incluidas
- 🎨 Colores y mensajes claros

**Comando:**
```bash
node scripts/create-db-user.js
```

**Pasos:**
1. Ingresa username (default: `app_user`)
2. Ingresa contraseña o déjala en blanco para generar una
3. Se ejecutará automáticamente

**Ejemplo:**
```
👤 Username para PostgreSQL (default: app_user): app_user
🔐 Contraseña (dejar en blanco para generar una): [enter - genera automáticamente]
✅ Contraseña generada: K9xP#mL2@qR5vN8$
```

---

### 📝 Método 2: Script SQL Directo

**Para ejecutar desde psql:**

#### Opción A: Con username y password por defecto

```bash
psql -U postgres -d neondb -f scripts/create-db-user.sql
```

**Antes de ejecutar:** Edita `scripts/create-db-user.sql` y reemplaza:
- `app_user` → tu nombre de usuario
- `secure_password_here` → tu contraseña

#### Opción B: Parametrizado (variables)

```bash
psql -U postgres -d neondb \
  -v user_name="app_user" \
  -v user_pass="tu_contraseña_segura" \
  -f scripts/create-db-user-parametrized.sql
```

#### Opción C: Directamente en la terminal

```bash
psql -U postgres -d neondb
```

Luego copia y pega el contenido de `scripts/create-db-user.sql`

---

## 🚀 Quick Start (2 minutos)

### 1. Asegúrate que tienes DATABASE_URL

```bash
# Si no está en .env, obtén la URL de tu PostgreSQL
cat .env | grep DATABASE_URL

# Si no existe, solicítala a tu proveedor (Neon, Railway, etc)
```

### 2. Ejecuta el script

```bash
node scripts/create-db-user.js
```

### 3. Actualiza .env

El script te mostrará la nueva `DATABASE_URL`. Cópiala a tu `.env`:

```bash
DATABASE_URL="postgresql://app_user:password123@localhost:5432/neondb"
```

### 4. Verifica

```bash
npm run db:types
```

---

## 🔐 Permisos Otorgados

El script otorga estos permisos automáticamente:

### Lectura/Escritura Completa
- ✏️ `users`, `user_config`, `user_subscriptions`, `user_preferences`
- ✏️ `accounts`, `sessions`, `verification_codes`
- ✏️ `sobres`, `billeteras`, `transacciones`
- ✏️ `shopping_lists`, `shopping_list_items`, `shopping_executions`, `shopping_execution_items`
- ✏️ `categorias`, `subcategorias`, `marcas`
- ✏️ `themes`, `user_themes`, `linked_users`, `invitation_codes`

### Solo Lectura
- 📖 `subscription_plans`, `monedas`
- 📖 `product_catalog`, `product_categories_*`, `product_user_custom`

### Secuencias y Funciones
- 🔄 Permiso de usar secuencias (auto-increment)
- 🔄 Permiso de ejecutar funciones

---

## 📌 Environment Variables

### Durante desarrollo

```bash
# .env
DATABASE_URL="postgresql://app_user:tu_contraseña@localhost:5432/neondb"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_secret_aqui"
```

### Para producción (Neon, Railway, etc)

```bash
# Usa la URL proporcionada por tu servicio
DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

---

## 🔄 Cambiar Contraseña Después

Si necesitas cambiar la contraseña del usuario:

```bash
# Desde PostgreSQL
psql -U postgres -d neondb
```

```sql
-- Dentro de psql
ALTER ROLE app_user WITH PASSWORD 'nueva_contraseña_segura';
```

O con script SQL:

```bash
psql -U postgres -d neondb -c "ALTER ROLE app_user WITH PASSWORD 'nueva_contraseña';"
```

---

## ❌ Errores Comunes

### Error: "peer authentication failed"

**Causa:** PostgreSQL no acepta la contraseña sin contraseña

**Solución:**
```bash
# Conecta como superusuario primero
psql -U postgres

# O usa DATABASE_URL
psql $DATABASE_URL
```

### Error: "role already exists"

**Causa:** El usuario ya existe

**Soluciones:**

Opción 1: Cambiar contraseña del existente
```bash
psql -U postgres -d neondb -c "ALTER ROLE app_user WITH PASSWORD 'nueva_pass';"
```

Opción 2: Eliminar y recrear (⚠️ peligroso)
```bash
psql -U postgres -d neondb
DROP ROLE app_user;
# Luego ejecuta el script nuevamente
```

### Error: "connection refused"

**Causa:** PostgreSQL no está corriendo o URL es incorrecta

**Verificar:**
```bash
# Prueba la conexión
psql $DATABASE_URL -c "SELECT 1;"

# O verifica que PostgreSQL está corriendo
pg_isready -h localhost -p 5432
```

---

## 🛠️ Troubleshooting Avanzado

### Ver todos los usuarios creados

```sql
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname LIKE '%app%';
```

### Ver permisos de un usuario

```sql
SELECT * FROM information_schema.role_table_grants WHERE grantee = 'app_user';
```

### Revocar todos los permisos (si es necesario)

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_user;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_user;
REVOKE CONNECT ON DATABASE neondb FROM app_user;
```

---

## 📚 Scripts Incluidos

| Script | Propósito |
|--------|-----------|
| `scripts/create-db-user.js` | ⭐ Script Node.js interactivo (RECOMENDADO) |
| `scripts/create-db-user.sql` | Script SQL con valores por defecto |
| `scripts/create-db-user-parametrized.sql` | Script SQL parametrizado |
| `CREATE_DB_USER_README.md` | Este archivo |

---

## 🔗 Related Files

- `.env.example` - Variables de entorno de ejemplo
- `DATABASE_USER_SETUP.md` - Crear usuarios de aplicación (diferentes a usuarios DB)
- `CREATE_USER_QUICK_START.md` - Crear usuarios dentro de la aplicación

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito ser superusuario?**
R: Sí, solo para crear el role. Después la app usa el usuario `app_user`.

**P: ¿La contraseña se guarda en algún lado?**
R: No. Cópiala a tu `.env` después de crear el usuario.

**P: ¿Puedo cambiar el username?**
R: Sí, pero debe coincidir con el DATABASE_URL.

**P: ¿Estos permisos son suficientes?**
R: Sí, incluyen todas las tablas que WApp usa.

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa esta guía (CREATE_DB_USER_README.md)
2. Ejecuta el troubleshooting arriba
3. Verifica que PostgreSQL está corriendo
4. Verifica que DATABASE_URL es válido: `psql $DATABASE_URL -c "SELECT 1;"`

---

**Última actualización:** 2025-12-05
**Compatible con:** PostgreSQL 13+, Node.js 18+
