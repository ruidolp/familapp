# Arquitectura del Proyecto

## Principios Arquitectónicos

Este proyecto está diseñado siguiendo principios de **Clean Architecture** y **SOLID**, con énfasis en:

1. **Separación de Responsabilidades**: Cada capa tiene responsabilidades bien definidas
2. **Inversión de Dependencias**: Las capas internas no dependen de las externas
3. **Independencia de Frameworks**: El core de negocio es independiente de Next.js, Prisma, etc.
4. **Testeable**: La arquitectura facilita testing unitario y de integración
5. **Escalable**: Fácil agregar nuevas features sin romper código existente

## Capas de la Arquitectura

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│   (UI, Components, Hooks, Pages)        │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│        Application Layer                │
│   (Services, Use Cases, DTOs)           │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│   (Entities, Types, Business Rules)     │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│ (Database, APIs, Config, External Deps) │
└─────────────────────────────────────────┘
```

## Descripción de Capas

### 1. Domain Layer (Dominio)

**Ubicación**: `src/domain/`

**Responsabilidad**: Contiene el core del negocio

**Contenido**:
- **Entities**: Objetos de negocio con identidad (User, Transaction, etc.)
- **Types**: Tipos TypeScript para el dominio
- **Enums**: Enumeraciones del dominio

**Reglas**:
- ❌ No depende de ninguna otra capa
- ❌ No usa librerías externas (excepto types)
- ✅ Solo lógica de negocio pura
- ✅ Framework-agnostic

**Ejemplo**:
```typescript
// src/domain/types/auth.types.ts
export interface DomainUser {
  id: string
  name: string
  email?: string | null
  accountType: AccountType
}
```

### 2. Application Layer (Aplicación)

**Ubicación**: `src/application/`

**Responsabilidad**: Casos de uso y orquestación

**Contenido**:
- **Services**: Servicios que implementan lógica de negocio
- **Use Cases**: Casos de uso específicos (en proyectos más grandes)

**Reglas**:
- ✅ Puede usar Domain
- ✅ Puede usar Infrastructure (mediante interfaces)
- ❌ No debe conocer detalles de Presentation
- ✅ Implementa la lógica de negocio compleja

**Ejemplo**:
```typescript
// src/application/services/auth.service.ts
export async function registerUser(
  credentials: RegisterCredentials
): Promise<AuthResult> {
  // 1. Validar reglas de negocio
  // 2. Interactuar con infraestructura (DB)
  // 3. Retornar resultado del dominio
}
```

### 3. Infrastructure Layer (Infraestructura)

**Ubicación**: `src/infrastructure/`

**Responsabilidad**: Detalles técnicos y adaptadores

**Contenido**:
- **Config**: Configuración centralizada
- **Database**: Cliente Kysely y query functions
- **Lib**: Adaptadores a librerías (NextAuth, utils)
- **Utils**: Utilidades técnicas (validación, crypto)
- **Middleware**: Middleware de Next.js

**Reglas**:
- ✅ Puede usar Domain y Application
- ✅ Implementa adaptadores a servicios externos
- ✅ Contiene detalles de implementación
- ❌ No debe contener lógica de negocio

**Ejemplo**:
```typescript
// src/infrastructure/database/kysely.ts
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool })
})

// src/infrastructure/config/app.config.ts
export const appConfig = {
  api: { baseUrl: '...' },
  auth: { ... },
}
```

### 4. Presentation Layer (Presentación)

**Ubicación**: `src/presentation/` y `src/app/`

**Responsabilidad**: UI y experiencia de usuario

**Contenido**:
- **Components**: Componentes React
  - `ui/`: Componentes base (shadcn/ui)
  - `auth/`: Componentes de autenticación
  - `layout/`: Layouts reutilizables
- **Hooks**: Custom hooks de React
- **Providers**: Context providers
- **App**: Páginas de Next.js (App Router)

**Reglas**:
- ✅ Puede usar Application y Domain (a través de services)
- ✅ Maneja estado local y UI
- ❌ No debe contener lógica de negocio
- ❌ No debe acceder directamente a Infrastructure

**Ejemplo**:
```typescript
// src/presentation/components/auth/login-form.tsx
export function LoginForm() {
  // 1. Manejar estado del formulario
  // 2. Validar inputs
  // 3. Llamar a servicios de Application
  // 4. Mostrar feedback
}
```

## Flujo de Datos

### Ejemplo: Registro de Usuario

```
1. USER → LoginForm (Presentation)
   ↓
2. LoginForm → registerUser() (Application Service)
   ↓
3. registerUser() → Valida contra Domain Types
   ↓
4. registerUser() → hashPassword() (Infrastructure Utils)
   ↓
5. registerUser() → db.insertInto('users') (Infrastructure DB)
   ↓
6. registerUser() → Retorna DomainUser (Domain)
   ↓
7. LoginForm ← Recibe resultado
   ↓
8. USER ← Muestra feedback (toast)
```

## Patrones de Diseño Utilizados

### 1. Repository Pattern
```typescript
// Abstraer acceso a datos
export async function findUserByEmail(email: string): Promise<User | null> {
  return await db
    .selectFrom('users')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst()
}
```

### 2. Service Pattern
```typescript
// Encapsular lógica de negocio
export async function loginUser(credentials: LoginCredentials) {
  // Lógica de autenticación
}
```

### 3. Factory Pattern
```typescript
// Crear objetos complejos
function createUser(data: CreateUserData): User {
  return {
    id: generateId(),
    ...data,
    createdAt: new Date(),
  }
}
```

### 4. Strategy Pattern (Configuración)
```typescript
// Comportamiento configurable
const authStrategy = appConfig.auth.oauth.google.enabled
  ? new GoogleStrategy()
  : new CredentialsStrategy()
```

## Decisiones de Arquitectura

### ¿Por qué Clean Architecture?

1. **Mantenibilidad**: Fácil encontrar y modificar código
2. **Testeable**: Cada capa se puede testear independientemente
3. **Escalable**: Agregar features sin romper código existente
4. **Migrable**: Cambiar frameworks sin reescribir todo

### ¿Por qué Configuración Centralizada?

Todo en `app.config.ts` permite:

1. **No Hardcoding**: Cero valores hardcodeados en código
2. **Migración Fácil**: Cambiar backend editando una variable
3. **Feature Toggles**: Activar/desactivar features sin deploy
4. **Auditable**: Ver toda la config en un solo lugar

### ¿Por qué TypeScript Estricto?

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

Beneficios:
- Menos bugs en producción
- Mejor autocompletado
- Refactoring seguro
- Documentación viva

### ¿Por qué Zod para Validación?

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

Ventajas:
- Type-safe: Infiere tipos TypeScript
- Runtime validation
- Mensajes de error customizables
- Composable y reutilizable

## Convenciones de Código

### Nombres de Archivos

```
kebab-case.ts          # Archivos normales
PascalCase.tsx         # Componentes React
index.ts               # Barrel exports
```

### Estructura de Archivos

```typescript
/**
 * Comentario de archivo
 * Describe el propósito del archivo
 */

// Imports externos
import { useState } from 'react'

// Imports internos (por capas)
import { Button } from '@/components/ui/button'
import { loginUser } from '@/application/services/auth.service'
import { appConfig } from '@/config/app.config'

// Types
interface Props { ... }

// Constants
const MAX_RETRIES = 3

// Componente/función principal
export function MyComponent() { ... }

// Helpers internos (no exportados)
function helperFunction() { ... }
```

### Imports con Path Aliases

```typescript
// ✅ Usar path aliases
import { Button } from '@/components/ui/button'
import { loginUser } from '@/application/services/auth.service'
import { appConfig } from '@/config/app.config'

// ❌ Evitar imports relativos largos
import { Button } from '../../../../presentation/components/ui/button'
```

Configurado en `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/components/*": ["./src/presentation/components/*"],
    "@/config/*": ["./src/infrastructure/config/*"],
    // ...
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/application/services/__tests__/auth.service.test.ts
describe('registerUser', () => {
  it('should hash password before saving', async () => {
    // Arrange
    const credentials = { email: 'test@test.com', password: 'Pass123' }

    // Act
    const result = await registerUser(credentials)

    // Assert
    expect(result.success).toBe(true)
    expect(result.user.password).not.toBe('Pass123')
  })
})
```

### Integration Tests
```typescript
// src/app/api/__tests__/register.test.ts
describe('POST /api/register', () => {
  it('should create a new user', async () => {
    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'Pass123' })
    })

    expect(res.status).toBe(201)
  })
})
```

### E2E Tests
```typescript
// e2e/auth.spec.ts
test('user can register and login', async ({ page }) => {
  await page.goto('/auth/register')
  await page.fill('[name=email]', 'test@test.com')
  await page.fill('[name=password]', 'Pass123')
  await page.click('button[type=submit]')

  await expect(page).toHaveURL('/dashboard')
})
```

## Performance

### Optimizaciones Implementadas

1. **Image Optimization**: next/image automático
2. **Code Splitting**: Por rutas (App Router)
3. **Tree Shaking**: Imports nombrados
4. **Static Generation**: Cuando es posible
5. **Edge Runtime**: Para middleware

### Métricas Objetivo

- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **TTI**: < 3.8s
- **CLS**: < 0.1

## Seguridad

### Implementaciones

1. **Authentication**: NextAuth con JWT
2. **Authorization**: Middleware de rutas
3. **Input Validation**: Zod en cliente y servidor
4. **Password Hashing**: bcrypt con 10 rounds
5. **CSRF Protection**: NextAuth built-in
6. **XSS Prevention**: React auto-escaping
7. **SQL Injection**: Kysely parameterized queries

### Checklist de Seguridad

- [x] Contraseñas hasheadas
- [x] Cookies HTTP-only
- [x] HTTPS en producción
- [x] Validación de inputs
- [x] Sanitización de datos
- [ ] Rate limiting (pendiente)
- [ ] 2FA (futuro)

## Escalabilidad

### Horizontal Scaling

- Serverless: Next.js API Routes son stateless
- Database: PostgreSQL con connection pooling (Kysely)
- Cache: Redis para sesiones (opcional)

### Vertical Scaling

- Optimización de queries (Kysely with type-safe SQL)
- Lazy loading de componentes
- Code splitting por rutas

## Monitoreo

### Logs
```typescript
// Structured logging
console.log({
  level: 'info',
  message: 'User registered',
  userId: user.id,
  timestamp: new Date().toISOString(),
})
```

### Métricas (Recomendadas)

- **Sentry**: Error tracking
- **Vercel Analytics**: Web Vitals
- **PostgreSQL Monitoring**: Database performance
- **LogRocket**: Session replay

## Migración y Mantenimiento

### Agregar Nueva Feature

1. Definir tipos en `domain/types/`
2. Crear servicio en `application/services/`
3. Agregar API route en `app/api/`
4. Crear componentes en `presentation/components/`
5. Agregar tests

### Cambiar de Database

1. Cambiar `DATABASE_URL` en `.env`
2. Ejecutar migraciones SQL en la nueva base de datos
3. Regenerar tipos: `npm run db:types`

### Cambiar de Framework UI

1. Reemplazar componentes en `presentation/components/ui/`
2. Mantener interfaces iguales
3. Lógica de negocio no cambia

---

Esta arquitectura está diseñada para evolucionar con tu proyecto. Comienza simple y crece según necesites.
