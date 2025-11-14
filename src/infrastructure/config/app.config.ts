/**
 * Configuración centralizada de la aplicación
 *
 * Este archivo contiene TODA la configuración de la aplicación, siguiendo el principio
 * de no hardcodear valores en el código. Permite migrar backend, cambiar servicios
 * y modificar comportamientos sin tocar el código fuente.
 *
 * IMPORTANTE: Todos los valores están centralizados aquí para facilitar el mantenimiento
 * y la migración entre entornos (desarrollo, staging, producción).
 */

export const appConfig = {
  /**
   * Configuración de API y URLs base
   */
  api: {
    // Base URL de la API - cambiar aquí para migrar el backend sin tocar código
    // NEXT_PUBLIC_API_BASE_URL: Para usar desde el navegador (frontend externo)
    // API_BASE_URL: Para usar desde el servidor (server-to-server)
    // Si no se configura, usa URLs relativas en navegador y NEXTAUTH_URL en servidor
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

    // Timeout para requests (ms)
    timeout: 30000,

    // Reintentos en caso de error
    retries: 3,
  },

  /**
   * Configuración de base de datos
   */
  database: {
    url: process.env.DATABASE_URL || '',
  },

  /**
   * Configuración de autenticación
   */
  auth: {
    // NextAuth
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    nextAuthSecret: process.env.NEXTAUTH_SECRET,

    // Sesiones
    session: {
      // Duración de la sesión en segundos (30 días)
      maxAge: 30 * 24 * 60 * 60,

      // Actualizar sesión cada 24 horas
      updateAge: 24 * 60 * 60,

      // Estrategia: 'jwt' para cookies, 'database' para DB
      strategy: 'jwt' as const,
    },

    // Configuración de registro
    registration: {
      // Permitir auto-registro de usuarios
      allowSelfSignup: true,

      // Tipos de cuenta permitidos
      allowedAccountTypes: {
        email: true,
        phone: true,
      },

      // Requerir verificación de cuenta
      requireVerification: false, // Activar cuando email/SMS esté configurado
    },

    // Configuración de contraseñas
    password: {
      // Longitud mínima
      minLength: 8,

      // Requerir mayúsculas
      requireUppercase: true,

      // Requerir minúsculas
      requireLowercase: true,

      // Requerir números
      requireNumbers: true,

      // Requerir caracteres especiales
      requireSpecialChars: false,

      // Rounds de bcrypt (10-12 recomendado)
      bcryptRounds: 10,
    },

    // Proveedores OAuth
    oauth: {
      google: {
        enabled: !!process.env.GOOGLE_CLIENT_ID,
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      },

      facebook: {
        enabled: !!process.env.FACEBOOK_CLIENT_ID,
        clientId: process.env.FACEBOOK_CLIENT_ID || '',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      },
    },

    // Recuperación de cuenta
    recovery: {
      // Activar recuperación por código
      enabled: false, // Activar cuando email/SMS esté configurado

      // Duración del código en minutos
      codeExpirationMinutes: 15,

      // Longitud del código
      codeLength: 6,

      // Reintentos permitidos
      maxAttempts: 5,
    },

    // Confirmación de cuenta
    confirmation: {
      // Activar confirmación por código
      enabled: false, // Activar cuando email/SMS esté configurado

      // Duración del código en horas
      codeExpirationHours: 24,

      // Longitud del código
      codeLength: 6,

      // Permitir inicio de sesión sin confirmar
      allowUnverifiedLogin: true,
    },
  },

  /**
   * Configuración de email
   */
  email: {
    // Habilitar envío de emails
    enabled: !!process.env.SMTP_HOST,

    // Configuración SMTP
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },

    // Remitente por defecto
    from: process.env.SMTP_FROM || 'noreply@wapp.com',

    // Templates
    templates: {
      verification: {
        subject: 'Confirma tu cuenta',
      },
      recovery: {
        subject: 'Recupera tu contraseña',
      },
    },
  },

  /**
   * Configuración de SMS
   */
  sms: {
    // Habilitar envío de SMS
    enabled: !!process.env.SMS_API_KEY,

    // Proveedor (twilio, vonage, etc)
    provider: process.env.SMS_PROVIDER || '',

    // Credenciales
    apiKey: process.env.SMS_API_KEY || '',
    from: process.env.SMS_FROM || '',
  },

  /**
   * Configuración de plataforma y UI
   */
  platform: {
    // Detección de plataforma
    enableMobileDetection: true,

    // Gestos móviles
    enableSwipeNavigation: true,

    // Rutas móviles específicas
    mobileRoutes: [
      '/m/home',
      '/m/profile',
      '/m/settings',
    ],
  },

  /**
   * Configuración de Capacitor
   */
  capacitor: {
    // App ID
    appId: 'com.wapp.app',

    // Nombre de la app
    appName: 'WApp',

    // Secure Storage
    secureStorage: {
      // Key para almacenar el refresh token
      sessionKey: 'wapp_session',
    },
  },

  /**
   * Configuración de theming
   */
  theme: {
    // Tema por defecto
    defaultTheme: 'light' as const,

    // Temas disponibles
    availableThemes: ['light', 'dark', 'system'] as const,

    // Colores personalizables (CSS variables)
    colors: {
      primary: 'hsl(222.2 47.4% 11.2%)',
      secondary: 'hsl(210 40% 96.1%)',
      accent: 'hsl(210 40% 96.1%)',
      destructive: 'hsl(0 84.2% 60.2%)',
    },
  },

  /**
   * Configuración de rutas
   */
  routes: {
    // Rutas públicas (no requieren autenticación)
    public: [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/recovery',
      '/auth/verify',
      '/api/health',
    ],

    // Rutas protegidas (requieren autenticación)
    protected: [
      '/dashboard',
      '/profile',
      '/settings',
    ],

    // Redirecciones
    afterLogin: '/dashboard',
    afterLogout: '/auth/login',
    afterRegister: '/auth/verify', // Si confirmation.enabled = true
  },

  /**
   * Configuración de ambiente
   */
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  /**
   * Configuración de seguridad
   */
  security: {
    // Rate limiting
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutos
    },

    // CORS
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'capacitor://localhost', 'ionic://localhost'],
    },
  },
} as const

/**
 * Type helper para extraer tipos de la configuración
 */
export type AppConfig = typeof appConfig

/**
 * Helper para validar que la configuración está completa
 */
export function validateConfig() {
  const errors: string[] = []

  // Validar configuración crítica
  if (!appConfig.auth.nextAuthSecret && appConfig.environment.isProduction) {
    errors.push('NEXTAUTH_SECRET es requerido en producción')
  }

  if (!appConfig.database.url) {
    errors.push('DATABASE_URL es requerido')
  }

  if (appConfig.auth.oauth.google.enabled && !appConfig.auth.oauth.google.clientId) {
    errors.push('GOOGLE_CLIENT_ID es requerido si Google OAuth está habilitado')
  }

  if (appConfig.auth.oauth.facebook.enabled && !appConfig.auth.oauth.facebook.clientId) {
    errors.push('FACEBOOK_CLIENT_ID es requerido si Facebook OAuth está habilitado')
  }

  if (appConfig.auth.recovery.enabled && !appConfig.email.enabled && !appConfig.sms.enabled) {
    errors.push('Email o SMS debe estar configurado para habilitar recuperación de cuenta')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
