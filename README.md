# WApp - Next.js Full Stack Application

Aplicación fullstack moderna con Next.js 15, Kysely, NextAuth, Tailwind CSS, shadcn/ui y preparada para Capacitor.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Configuración](#-configuración)
- [Desarrollo Local](#-desarrollo-local)
- [Deploy en Vercel](#-deploy-en-vercel)
- [Capacitor (Mobile)](#-capacitor-mobile)
- [Migración de Backend](#-migración-de-backend)
- [Estructura de Directorios](#-estructura-de-directorios)

## ✨ Características

- **Autenticación Completa**: Registro y login con email/teléfono + OAuth (Google/Facebook)
- **Configuración Centralizada**: Sin hardcodeos, todo parametrizable desde `app.config.ts`
- **Arquitectura Modular**: Clean Architecture con separación por capas
- **Mobile-First**: Responsive 100% y optimizado para apps híbridas
- **Sesiones Seguras**: NextAuth con JWT, cookies HTTP-only
- **Validación Robusta**: Zod + React Hook Form
- **UI Moderna**: Tailwind CSS + shadcn/ui
- **Type-Safe**: TypeScript en todo el stack
- **Capacitor Ready**: Preparado para compilar como app móvil

## 🛠 Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 19** - Library UI
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3** - Utility-first CSS
- **shadcn/ui** - Componentes UI
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas

### Backend
- **Next.js API Routes** - Backend serverless
- **Kysely** - Type-safe SQL query builder
- **PostgreSQL** - Base de datos
- **NextAuth v5** - Autenticación
- **bcryptjs** - Hash de contraseñas

### Mobile
- **Capacitor 6** - Framework para apps híbridas
- **iOS & Android** - Soporte nativo

## 🏗 Arquitectura

Este proyecto sigue principios de **Clean Architecture** y **Domain-Driven Design**, con separación clara de responsabilidades:

```
src/
├── application/         # Lógica de aplicación
│   ├── services/       # Servicios de negocio
│   └── use-cases/      # Casos de uso
│
├── domain/             # Dominio y reglas de negocio
│   ├── entities/       # Entidades del dominio
│   ├── types/          # Tipos TypeScript
│   └── enums/          # Enumeraciones
│
├── infrastructure/     # Detalles de implementación
│   ├── config/         # Configuración centralizada
│   ├── database/       # Cliente Kysely y queries
│   ├── lib/            # Librerías (NextAuth, utils)
│   ├── middleware/     # Middleware de Next.js
│   └── utils/          # Utilidades (validación, crypto)
│
└── presentation/       # Capa de presentación
    ├── components/     # Componentes React
    │   ├── ui/        # Componentes base (shadcn/ui)
    │   ├── auth/      # Componentes de autenticación
    │   └── layout/    # Layouts
    ├── hooks/         # Custom hooks
    └── providers/     # Context providers
```

### Capas y Responsabilidades

#### 1. **Domain** (Dominio)
- Contiene las reglas de negocio puras
- Define tipos, entidades y enums
- Independiente de frameworks y librerías
- No tiene dependencias externas

#### 2. **Application** (Aplicación)
- Casos de uso y servicios
- Orquesta el flujo de datos
- Usa el dominio y la infraestructura
- Implementa la lógica de negocio

#### 3. **Infrastructure** (Infraestructura)
- Detalles técnicos de implementación
- Database, APIs externas, configuración
- Utilidades técnicas
- Adaptadores a librerías externas

#### 4. **Presentation** (Presentación)
- Componentes de UI
- Hooks personalizados
- Providers de contexto
- Todo lo relacionado a la vista

## ⚙️ Configuración

### Configuración Centralizada

**TODO está configurado en `src/infrastructure/config/app.config.ts`**

Este archivo contiene:
- URLs de API (para migración fácil de backend)
- Configuración de base de datos
- Toggles de features (OAuth, recovery, confirmación)
- Reglas de contraseñas
- Configuración de email/SMS
- Rutas de la aplicación
- Configuración de Capacitor

**Ejemplo de configuración:**

```typescript
export const appConfig = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  auth: {
    registration: {
      allowSelfSignup: true,
      allowedAccountTypes: {
        email: true,
        phone: true,
      },
    },

    oauth: {
      google: {
        enabled: !!process.env.GOOGLE_CLIENT_ID,
      },
    },

    password: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
    },
  },
}
```

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/wapp?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aleatorio-seguro"

# OAuth (Opcional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Email/SMS (Opcional - para recovery/confirmation)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="tu@email.com"
SMTP_PASSWORD="tu-password"
```

## 🚀 Desarrollo Local

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos
# Edita .env con tu connection string de PostgreSQL

# 3. Ejecutar migraciones SQL en tu base de datos
# Ver: src/infrastructure/database/migrations/

# 4. Generar tipos de Kysely desde el esquema
npm run db:types

# 5. Generar NEXTAUTH_SECRET
openssl rand -base64 32

# 6. Agregar el secret a .env
echo "NEXTAUTH_SECRET=<tu-secret>" >> .env

# 7. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Linter

# Kysely
npm run db:types     # Generar tipos TypeScript desde el esquema de la base de datos
```

## 🌐 Deploy en Vercel

### Paso 1: Preparar Base de Datos

1. Crea una base de datos PostgreSQL (recomendado: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) o [Supabase](https://supabase.com))

2. Obtén la connection string:
```
postgresql://user:password@host:5432/database
```

### Paso 2: Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
# Settings > Environment Variables
```

### Variables de Entorno en Vercel

Configura estas variables en el dashboard de Vercel:

- `DATABASE_URL`
- `NEXTAUTH_URL` (tu dominio de Vercel)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` (opcional)
- `GOOGLE_CLIENT_SECRET` (opcional)
- `API_BASE_URL` (mismo que NEXTAUTH_URL)

### Paso 3: Ejecutar Migraciones

```bash
# Ejecuta las migraciones SQL manualmente en tu base de datos de producción
# Archivos de migración: src/infrastructure/database/migrations/
# Puedes usar psql, pgAdmin, o el SQL Editor de tu proveedor

# Luego genera los tipos TypeScript (opcional, si DATABASE_URL está configurado)
DATABASE_URL="<production-url>" npm run db:types
```

## 📱 Capacitor (Mobile)

### Configuración Inicial

```bash
# 1. Copiar archivo de configuración
cp capacitor.config.example.ts capacitor.config.ts

# 2. Editar capacitor.config.ts con tu app ID

# 3. Build de Next.js para export estático
npm run build

# 4. Agregar plataformas
npx cap add android
npx cap add ios

# 5. Sincronizar
npx cap sync
```

### Desarrollo Mobile

```bash
# Android
npx cap open android

# iOS (solo en Mac)
npx cap open ios
```

### Importante para Capacitor

1. **Sesiones**: Las sesiones usan cookies seguras y se persisten usando Capacitor Preferences API

2. **API Base URL**: En `app.config.ts`, configura la URL de tu backend:
```typescript
api: {
  baseUrl: 'https://tu-api.vercel.app', // URL de producción
}
```

3. **CORS**: El middleware ya está configurado para aceptar requests de Capacitor

4. **Build**: Usa `npm run build` antes de `npx cap sync`

## 🔄 Migración de Backend

Para migrar el backend a otro servidor, **solo necesitas cambiar una variable**:

### Opción 1: Variable de Entorno
```bash
API_BASE_URL=https://nuevo-backend.com
```

### Opción 2: Editar app.config.ts
```typescript
export const appConfig = {
  api: {
    baseUrl: 'https://nuevo-backend.com',
  },
}
```

**¡Eso es todo!** Todos los fetch y llamadas API usarán automáticamente la nueva URL.

## 📁 Estructura de Directorios

```
wapp/
├── src/
│   ├── infrastructure/
│   │   └── database/
│   │       ├── migrations/     # SQL migrations
│   │       ├── kysely.ts       # Kysely client
│   │       ├── types.ts        # Generated types
│   │       └── queries/        # Query functions
│
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/         # NextAuth endpoints
│   │   │   ├── register/     # Registro
│   │   │   └── health/       # Health check
│   │   ├── auth/             # Páginas de auth
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── recovery/
│   │   ├── dashboard/        # Dashboard
│   │   ├── layout.tsx        # Layout raíz
│   │   ├── page.tsx          # Home
│   │   └── globals.css       # Estilos globales
│   │
│   ├── application/           # Capa de aplicación
│   │   ├── services/         # Servicios de negocio
│   │   │   └── auth.service.ts
│   │   └── use-cases/        # Casos de uso
│   │
│   ├── domain/               # Capa de dominio
│   │   ├── entities/        # Entidades
│   │   ├── types/           # Tipos TypeScript
│   │   │   ├── auth.types.ts
│   │   │   └── next-auth.d.ts
│   │   └── enums/           # Enumeraciones
│   │
│   ├── infrastructure/      # Capa de infraestructura
│   │   ├── config/         # Configuración
│   │   │   └── app.config.ts  # ⭐ Configuración centralizada
│   │   ├── database/       # Base de datos
│   │   │   ├── kysely.ts   # Kysely client
│   │   │   ├── types.ts    # Generated types
│   │   │   ├── queries/    # Query functions
│   │   │   └── migrations/ # SQL migrations
│   │   ├── lib/           # Librerías
│   │   │   ├── auth.ts    # NextAuth config
│   │   │   ├── utils.ts   # Utilidades generales
│   │   │   └── capacitor-session.ts
│   │   ├── middleware/    # Middleware
│   │   └── utils/        # Utilidades
│   │       ├── validation.ts  # Schemas Zod
│   │       └── crypto.ts     # Hash, códigos
│   │
│   ├── presentation/       # Capa de presentación
│   │   ├── components/    # Componentes React
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── toast.tsx
│   │   │   ├── auth/     # Componentes de auth
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── register-form.tsx
│   │   │   ├── layout/   # Layouts
│   │   │   └── mobile/   # Componentes móviles
│   │   ├── hooks/        # Custom hooks
│   │   │   └── use-toast.ts
│   │   └── providers/    # Providers
│   │       └── session-provider.tsx
│   │
│   └── middleware.ts      # Middleware de Next.js
│
├── public/               # Assets estáticos
├── .env.example         # Ejemplo de variables
├── capacitor.config.ts  # Config de Capacitor
├── next.config.ts       # Config de Next.js
├── tailwind.config.ts   # Config de Tailwind
├── tsconfig.json        # Config de TypeScript
├── package.json         # Dependencias
└── README.md           # Este archivo
```

## 🎨 Sistema de Theming

Los temas se configuran usando CSS variables en `globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... más variables */
}

.dark {
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... más variables */
}
```

Para cambiar colores, edita las variables CSS o usa Tailwind classes.

## 🔐 Seguridad

### Implementado
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Sesiones JWT con cookies HTTP-only
- ✅ CSRF protection (NextAuth)
- ✅ Validación de inputs (Zod)
- ✅ Middleware de protección de rutas
- ✅ Headers de seguridad
- ✅ SQL injection protection (Kysely parameterized queries)

### Recomendaciones Adicionales
- Habilitar HTTPS en producción
- Configurar CSP headers
- Implementar rate limiting real
- Auditar dependencias regularmente
- Revisar logs de seguridad

## 📝 Validación

Todas las validaciones están centralizadas en `src/infrastructure/utils/validation.ts` usando Zod:

```typescript
// Ejemplo: validación de contraseña
export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Requiere mayúscula')
  .regex(/\d/, 'Requiere número')
```

Los esquemas están sincronizados con `app.config.ts`, permitiendo cambiar reglas sin tocar código.

## 🧪 Testing (Próximamente)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Build y Deployment

### Build de Producción
```bash
npm run build
npm start
```

### Docker (Próximamente)
```bash
docker build -t wapp .
docker run -p 3000:3000 wapp
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🆘 Soporte

- **Documentación**: Este README
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/wapp/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/wapp/discussions)

## 🎯 Roadmap

- [x] Autenticación completa
- [x] Arquitectura modular
- [x] Configuración centralizada
- [x] UI con shadcn/ui
- [x] Preparación para Capacitor
- [ ] Recovery & Confirmation con códigos
- [ ] Tests unitarios y E2E
- [ ] Docker y CI/CD
- [ ] Documentación de API
- [ ] Modo offline (PWA)
- [ ] Internacionalización (i18n)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Kysely](https://kysely.dev/)
- [NextAuth](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Capacitor](https://capacitorjs.com/)

---

Desarrollado con ❤️ usando Next.js 15 y las mejores prácticas de la industria.
