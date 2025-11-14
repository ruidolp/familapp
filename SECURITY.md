# Seguridad de la Aplicación

Este documento describe las medidas de seguridad implementadas en la aplicación y las recomendaciones para configuración en producción.

## Tabla de Contenidos

- [Protecciones Implementadas](#protecciones-implementadas)
- [Rate Limiting](#rate-limiting)
- [Headers de Seguridad](#headers-de-seguridad)
- [Configuración de Cloudflare](#configuración-de-cloudflare)
- [Migración a Redis para Rate Limiting](#migración-a-redis-para-rate-limiting)
- [Mejores Prácticas](#mejores-prácticas)

## Protecciones Implementadas

### 1. Rate Limiting

La aplicación incluye rate limiting a nivel de aplicación para prevenir:

- ✅ Ataques de fuerza bruta en login/registro
- ✅ Spam de registro de cuentas
- ✅ Abuso de endpoints públicos
- ✅ Ataques DDoS a nivel de aplicación

#### Límites por Endpoint

| Endpoint | Límite | Ventana | Descripción |
|----------|--------|---------|-------------|
| `/api/register` | 5 requests | 15 minutos | Prevenir registro masivo |
| `/api/auth/signin` | 5 requests | 15 minutos | Prevenir fuerza bruta |
| `/api/config` | 60 requests | 1 minuto | Endpoint de configuración |
| `/api/health` | 100 requests | 15 minutos | Health check |
| Recuperación | 3 requests | 1 hora | Recuperación de contraseña |

#### Cómo Funciona

```typescript
import { rateLimit, RateLimitPresets } from '@/infrastructure/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await rateLimit(request, RateLimitPresets.auth)
  if (!rateLimitResult.success) {
    return rateLimitResult.response // 429 Too Many Requests
  }

  // Continuar con la lógica del endpoint
}
```

#### Identificación de Cliente

El rate limiting identifica clientes usando (en orden de prioridad):

1. **`cf-connecting-ip`** - IP real del cliente según Cloudflare
2. **`x-forwarded-for`** - IP del cliente según proxy
3. **`x-real-ip`** - IP real del cliente
4. **`request.ip`** - IP de la conexión (fallback para desarrollo)

#### Limitaciones Actuales

⚠️ **IMPORTANTE**: La implementación actual usa **memoria local (Map)** para almacenar contadores.

**Funciona bien para:**
- Desarrollo
- Producción con un solo servidor/container

**NO funciona para:**
- Producción con múltiples servidores
- Aplicaciones escalables horizontalmente

➡️ Ver [Migración a Redis](#migración-a-redis-para-rate-limiting) para producción con múltiples servidores.

### 2. Headers de Seguridad

La aplicación implementa headers de seguridad recomendados por OWASP:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Prevenir clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Protección XSS (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Proteger URLs sensibles |
| `Permissions-Policy` | `camera=(), microphone=()...` | Deshabilitar APIs peligrosas |
| `Content-Security-Policy` | Ver middleware | Política de contenido |

Estos headers se configuran en `src/middleware.ts` y se aplican a **todas** las requests.

### 3. Protección de Rutas

- ✅ Rutas protegidas requieren autenticación
- ✅ Redirección automática a login si no autenticado
- ✅ Redirección a dashboard si ya autenticado y accede a login/register

### 4. Validación de Entrada

- ✅ Validación con Zod en todos los endpoints
- ✅ Sanitización de datos
- ✅ Verificación de tipos de cuenta permitidos

## Configuración de Cloudflare

Cloudflare provee una capa adicional de protección. **Ambas capas (Cloudflare + Aplicación) trabajan juntas.**

### Configuración Recomendada

#### 1. Activar WAF (Web Application Firewall)

```
Dashboard → Security → WAF
```

- ✅ Activar **OWASP Core Ruleset**
- ✅ Activar **Cloudflare Managed Ruleset**
- ✅ Configurar sensibilidad: **Medium** o **High**

#### 2. Rate Limiting de Cloudflare

**Opción A: Cloudflare Free/Pro**

```
Dashboard → Security → WAF → Rate limiting rules
```

Crear reglas para:

| Ruta | Límite | Acción |
|------|--------|--------|
| `/api/register` | 10 req/15min por IP | Block |
| `/api/auth/*` | 10 req/15min por IP | Challenge |
| `/api/*` | 300 req/15min por IP | Challenge |

**Opción B: Cloudflare Enterprise**

Usar **Advanced Rate Limiting** con detección de bots y análisis de comportamiento.

#### 3. Bot Protection

```
Dashboard → Security → Bots
```

- ✅ Activar **Bot Fight Mode** (Free) o **Super Bot Fight Mode** (Pro+)
- ✅ Bloquear bots maliciosos automáticamente
- ✅ Permitir bots buenos (Google, etc.)

#### 4. DDoS Protection

```
Dashboard → Security → DDoS
```

- ✅ Activar **HTTP DDoS Attack Protection**
- ✅ Sensibilidad: **High**
- ✅ Activar notificaciones por email

#### 5. SSL/TLS

```
Dashboard → SSL/TLS
```

- ✅ Modo de encriptación: **Full (strict)**
- ✅ Activar **Always Use HTTPS**
- ✅ Activar **HSTS**
  - Max Age: `31536000` (1 año)
  - Include subdomains: ✅
  - Preload: ✅

#### 6. Firewall Rules

Crear reglas adicionales:

**Bloquear países de alto riesgo** (opcional):
```
(ip.geoip.country in {"CN" "RU" "KP"}) and (http.request.uri.path contains "/api/")
→ Block
```

**Bloquear User-Agents sospechosos**:
```
(http.user_agent contains "curl") or (http.user_agent contains "python-requests")
→ Challenge
```

**Permitir solo métodos HTTP válidos**:
```
(http.request.method in {"GET" "POST" "PUT" "DELETE" "PATCH"})
→ Allow
Else → Block
```

#### 7. Page Rules

```
Dashboard → Rules → Page Rules
```

**Cachear contenido estático**:
```
URL: */_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
```

**No cachear API**:
```
URL: */api/*
Cache Level: Bypass
```

## Migración a Redis para Rate Limiting

Para producción con múltiples servidores, migrar a Redis:

### 1. Instalar Dependencias

```bash
npm install ioredis
# o usar Upstash (Redis serverless)
npm install @upstash/redis
```

### 2. Configurar Redis

**Opción A: Redis tradicional**

```typescript
// src/infrastructure/lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
})
```

**Opción B: Upstash (Serverless, recomendado)**

```typescript
// src/infrastructure/lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

### 3. Actualizar Rate Limit

```typescript
// src/infrastructure/lib/rate-limit.ts

// Reemplazar Map por Redis
const key = `ratelimit:${request.nextUrl.pathname}:${identifier}`

// Obtener contador actual
const current = await redis.incr(key)

// Si es la primera request, establecer TTL
if (current === 1) {
  await redis.expire(key, Math.ceil(windowMs / 1000))
}

// Verificar límite
const remaining = Math.max(0, maxRequests - current)
if (current > maxRequests) {
  // Rate limited
}
```

### 4. Variables de Entorno

```bash
# .env
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

## Mejores Prácticas

### 1. Secretos y Variables de Entorno

- ✅ **NUNCA** commitear archivos `.env`
- ✅ Usar secretos fuertes (32+ caracteres aleatorios)
- ✅ Rotar secretos regularmente
- ✅ Usar servicios de gestión de secretos en producción (AWS Secrets Manager, etc.)

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32
```

### 2. Autenticación OAuth

Si usas Google/Facebook OAuth:

- ✅ Configurar **Authorized redirect URIs** correctamente
- ✅ Limitar dominios permitidos
- ✅ Rotar client secrets cada 3-6 meses
- ✅ Monitorear uso de API quotas

### 3. Base de Datos

- ✅ Usar conexiones SSL/TLS
- ✅ Limitar acceso por IP (whitelist)
- ✅ Usar usuario con privilegios mínimos
- ✅ Backups automáticos diarios
- ✅ Encriptar datos sensibles (tarjetas, etc.)

### 4. Monitoreo y Logging

Implementar:

- ✅ Logging de intentos de login fallidos
- ✅ Alertas por actividad sospechosa
- ✅ Monitoreo de rate limiting
- ✅ Tracking de errores (Sentry, etc.)

```typescript
// Ejemplo de logging
if (!result?.ok) {
  logger.warn('Failed login attempt', {
    identifier: data.identifier,
    ip: request.ip,
    timestamp: new Date(),
  })
}
```

### 5. Actualizaciones

- ✅ Mantener dependencias actualizadas
- ✅ Revisar CVEs regularmente
- ✅ Usar `npm audit` / `yarn audit`
- ✅ Implementar renovación automática de certificados SSL

```bash
# Revisar vulnerabilidades
npm audit
npm audit fix

# Actualizar dependencias
npm update
```

## Checklist de Seguridad para Producción

Antes de ir a producción, verificar:

- [ ] NEXTAUTH_SECRET configurado y fuerte
- [ ] Cloudflare WAF activado
- [ ] Rate limiting de Cloudflare configurado
- [ ] SSL/TLS en modo Full (strict)
- [ ] HSTS activado
- [ ] Bot protection activado
- [ ] Rate limiting migrado a Redis (si múltiples servidores)
- [ ] Backups de base de datos configurados
- [ ] Monitoreo y alertas configurados
- [ ] Variables de entorno en secretos manager
- [ ] Logs configurados (no exponer información sensible)
- [ ] Pruebas de penetración realizadas
- [ ] Plan de respuesta a incidentes definido

## Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Envía un email a: security@tudominio.com
3. Incluye detalles técnicos y pasos para reproducir
4. Te responderemos en 48 horas

## Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Docs](https://developers.cloudflare.com/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Security](https://next-auth.js.org/security)
