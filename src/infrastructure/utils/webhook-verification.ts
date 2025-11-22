/**
 * Webhook Verification Utilities
 *
 * Funciones para verificar la autenticidad de webhooks de App Stores.
 */

import crypto from 'crypto'

/**
 * Verificar webhook de Apple App Store
 *
 * Apple firma los webhooks con JWT. Debes verificar:
 * 1. La firma JWT usando la clave pública de Apple
 * 2. El certificado x5c[0] contra el certificado raíz de Apple
 *
 * Docs: https://developer.apple.com/documentation/appstoreservernotifications/responding_to_app_store_server_notifications
 *
 * @param payload - Body del webhook
 * @returns true si es válido
 */
export async function verifyAppleWebhook(payload: any): Promise<boolean> {
  // TODO: Implementar verificación completa de JWT
  // Por ahora, verificación básica en sandbox mode

  const sandboxMode = process.env.PAYMENT_MODE === 'sandbox'

  if (sandboxMode) {
    // En modo sandbox, permitir todos (para testing)
    console.log('[Apple Webhook] Sandbox mode - skipping verification')
    return true
  }

  // Producción: verificar JWT signature
  // Necesitas usar librería como 'jsonwebtoken' o '@auth/core/jwt'
  // y validar contra el certificado público de Apple

  try {
    const signedPayload = payload.signedPayload

    if (!signedPayload) {
      console.error('[Apple Webhook] Missing signedPayload')
      return false
    }

    // TODO: Implementar verificación de JWT con certificado de Apple
    // const decoded = jwt.verify(signedPayload, applePublicKey, { algorithms: ['ES256'] })

    return true
  } catch (error) {
    console.error('[Apple Webhook] Verification failed:', error)
    return false
  }
}

/**
 * Verificar webhook de Google Play Store
 *
 * Google envía un mensaje firmado con Cloud Pub/Sub.
 * Debes verificar la firma usando la clave pública de Google.
 *
 * Docs: https://developer.android.com/google/play/billing/rtdn-reference
 *
 * @param message - Mensaje de Pub/Sub
 * @param signature - Firma del mensaje
 * @returns true si es válido
 */
export async function verifyGoogleWebhook(
  message: string,
  signature: string
): Promise<boolean> {
  const sandboxMode = process.env.PAYMENT_MODE === 'sandbox'

  if (sandboxMode) {
    console.log('[Google Webhook] Sandbox mode - skipping verification')
    return true
  }

  try {
    // Google Pub/Sub verifica automáticamente si usas Cloud Functions
    // Si recibes webhooks directamente, verifica la firma:

    const publicKey = process.env.GOOGLE_PUBSUB_PUBLIC_KEY

    if (!publicKey) {
      console.warn('[Google Webhook] Missing GOOGLE_PUBSUB_PUBLIC_KEY')
      return false
    }

    const verifier = crypto.createVerify('sha256')
    verifier.update(message)
    verifier.end()

    const isValid = verifier.verify(publicKey, signature, 'base64')

    if (!isValid) {
      console.error('[Google Webhook] Invalid signature')
    }

    return isValid
  } catch (error) {
    console.error('[Google Webhook] Verification failed:', error)
    return false
  }
}

/**
 * Verificar webhook en modo sandbox (testing local)
 *
 * @param secret - Secret compartido configurado en .env
 * @param providedSecret - Secret enviado en header
 */
export function verifySandboxWebhook(
  secret: string,
  providedSecret: string
): boolean {
  return secret === providedSecret
}
