# ⚡ Quick Start - Crear Usuario

Guía rápida de 2 minutos para crear un usuario en la BD.

---

## Opción 1: Script Node.js (2 minutos)

### 1. Ejecuta:
```bash
node scripts/create-user.js
```

### 2. Ingresa datos cuando se pida:
```
👤 Nombre completo: Ana García
📧 Email: ana.garcia@example.com
📱 Teléfono: +56987654321
🔐 Contraseña: MiPassword123!
🔐 Confirma: MiPassword123!
```

### 3. ¡Listo!
```
✅ USUARIO CREADO EXITOSAMENTE
  📌 ID:       550e8400-e29b-41d4-a716-446655440000
  👤 Nombre:   Ana García
  📊 Plan:     FREE
```

---

## Opción 2: SQL Directo con psql (3 minutos)

### 1. Conecta a la BD:
```bash
psql $DATABASE_URL
```

### 2. Copia y ejecuta (reemplaza los datos):

```sql
-- Paso 1: Crear usuario
INSERT INTO users (
  name, email, email_verified, password, account_type, created_at, updated_at
) VALUES (
  'Ana García',
  'ana.garcia@example.com',
  NOW(),
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLK', -- cambiar hash
  'EMAIL',
  NOW(),
  NOW()
) RETURNING id;
```

**Resultado:** `550e8400-e29b-41d4-a716-446655440000` ← Copiar este ID

### 3. Usar el ID en estos comandos:

```sql
-- Paso 2: Configuración
INSERT INTO user_config (
  user_id, moneda_principal_id, timezone, locale, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'CLP', 'America/Santiago', 'es-CL', NOW(), NOW()
);

-- Paso 3: Suscripción
INSERT INTO user_subscriptions (
  user_id, plan_id, status, started_at, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM subscription_plans WHERE slug = 'free'),
  'free', NOW(), NOW(), NOW()
);

-- Paso 4: Preferencias
INSERT INTO user_preferences (
  user_id, show_inline_qty, group_by_category, created_at, updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  true, false, NOW(), NOW()
);

-- Paso 5: Billetera
INSERT INTO billeteras (
  nombre, tipo, moneda_principal_id, usuario_id, color, emoji, created_at, updated_at
) VALUES (
  'Efectivo', 'EFECTIVO', 'CLP',
  '550e8400-e29b-41d4-a716-446655440000',
  '#FF6B6B', '💵', NOW(), NOW()
);
```

### 4. Verificar:
```sql
SELECT * FROM users WHERE email = 'ana.garcia@example.com';
```

---

## Generar Hash de Contraseña

Si necesitas otra contraseña hasheada:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('tu_password', 10).then(h => console.log(h));"
```

---

## Errores Comunes

| Error | Solución |
|-------|----------|
| `duplicate key` | Email ya existe → usar otro email |
| `foreign key` | Plan FREE no existe → ejecuta `npm run db:migrate` |
| `connection failed` | BD no conecta → verifica `DATABASE_URL` |

---

## Verificar Usuario Creado

```sql
SELECT u.id, u.name, u.email, uc.locale, us.status
FROM users u
LEFT JOIN user_config uc ON u.id = uc.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE u.email = 'ana.garcia@example.com';
```

---

## Login en la Aplicación

1. Ir a: `http://localhost:3000/en/auth/login`
2. Email: `ana.garcia@example.com`
3. Password: `MiPassword123!`

---

¿Necesitas más detalles? Lee `DATABASE_USER_SETUP.md`
