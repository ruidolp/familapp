/**
 * Subscription Configuration
 *
 * Configuración centralizada del módulo de suscripciones.
 * Usa variables de entorno para permitir personalización sin modificar código.
 */

/**
 * Configuración de suscripciones
 */
export const SUBSCRIPTION_CONFIG = {
  /**
   * Duración del trial en días
   * @default 7
   */
  trialDays: parseInt(process.env.TRIAL_DAYS || '7', 10),

  /**
   * Período de gracia en días antes de cancelar definitivamente
   * @default 3
   */
  gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '3', 10),

  /**
   * Días de expiración para códigos de invitación
   * @default 30
   */
  invitationExpiryDays: parseInt(process.env.INVITATION_EXPIRY_DAYS || '30', 10),

  /**
   * Moneda por defecto
   * @default USD
   */
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',

  /**
   * Modo de pago: sandbox o production
   * @default sandbox
   */
  paymentMode: (process.env.PAYMENT_MODE || 'sandbox') as 'sandbox' | 'production',

  /**
   * Secrets de webhooks para verificar autenticidad
   */
  webhookSecrets: {
    stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
    apple: process.env.APPLE_SHARED_SECRET || '',
    google: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
    sandbox: process.env.SANDBOX_WEBHOOK_SECRET || 'sandbox_secret_key_12345',
  },

  /**
   * API Keys de proveedores de pago
   */
  paymentProviders: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    },
    apple: {
      sharedSecret: process.env.APPLE_SHARED_SECRET || '',
    },
    google: {
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
    },
  },

  /**
   * URLs de callback para pagos
   */
  urls: {
    successUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`
      : 'http://localhost:3000/subscription/success',
    cancelUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`
      : 'http://localhost:3000/subscription/cancel',
  },

  /**
   * Configuración de WhatsApp para invitaciones
   */
  whatsapp: {
    /**
     * Número de WhatsApp para compartir invitaciones (opcional)
     * Si no se provee, solo genera el link con el mensaje
     */
    shareNumber: process.env.WHATSAPP_SHARE_NUMBER || '',

    /**
     * Prefijo del link de invitación
     */
    invitationLinkPrefix: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/invite`
      : 'http://localhost:3000/invite',
  },

  /**
   * Features flags (para activar/desactivar features)
   */
  features: {
    /**
     * Permitir trial automático al registrarse
     * @default true
     */
    autoTrialEnabled: process.env.AUTO_TRIAL_ENABLED !== 'false',

    /**
     * Permitir vincular usuarios (compartir plan)
     * @default true
     */
    linkingEnabled: process.env.LINKING_ENABLED !== 'false',

    /**
     * Notificaciones de trial próximo a expirar
     * @default true
     */
    trialNotificationsEnabled: process.env.TRIAL_NOTIFICATIONS_ENABLED !== 'false',
  },
} as const

/**
 * Validar configuración requerida
 */
export function validateSubscriptionConfig() {
  const errors: string[] = []

  if (SUBSCRIPTION_CONFIG.paymentMode === 'production') {
    if (!SUBSCRIPTION_CONFIG.paymentProviders.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required in production mode')
    }

    if (!SUBSCRIPTION_CONFIG.webhookSecrets.stripe) {
      errors.push('STRIPE_WEBHOOK_SECRET is required in production mode')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Subscription configuration errors:\n${errors.join('\n')}`)
  }
}
