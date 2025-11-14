/**
 * Capacitor Session Manager
 *
 * Maneja la persistencia de sesión en aplicaciones móviles con Capacitor.
 * Usa Preferences API de Capacitor para almacenar de forma segura la sesión.
 *
 * IMPORTANTE: No almacena credenciales en claro, solo el token de sesión.
 * La sesión se valida contra el servidor en cada apertura de la app.
 */

import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import { appConfig } from '@/config/app.config'

/**
 * Verificar si estamos en entorno Capacitor
 */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Guardar token de sesión
 * Se usa para persistir la sesión entre cierres de app
 */
export async function saveSessionToken(token: string): Promise<void> {
  if (!isCapacitor()) {
    return
  }

  try {
    await Preferences.set({
      key: appConfig.capacitor.secureStorage.sessionKey,
      value: token,
    })
  } catch (error) {
    console.error('Error saving session token:', error)
  }
}

/**
 * Obtener token de sesión guardado
 */
export async function getSessionToken(): Promise<string | null> {
  if (!isCapacitor()) {
    return null
  }

  try {
    const { value } = await Preferences.get({
      key: appConfig.capacitor.secureStorage.sessionKey,
    })
    return value
  } catch (error) {
    console.error('Error getting session token:', error)
    return null
  }
}

/**
 * Eliminar token de sesión
 */
export async function clearSessionToken(): Promise<void> {
  if (!isCapacitor()) {
    return
  }

  try {
    await Preferences.remove({
      key: appConfig.capacitor.secureStorage.sessionKey,
    })
  } catch (error) {
    console.error('Error clearing session token:', error)
  }
}

/**
 * Verificar si hay una sesión guardada
 */
export async function hasStoredSession(): Promise<boolean> {
  const token = await getSessionToken()
  return !!token
}

/**
 * Hook para hidratar sesión al abrir la app
 * Debe llamarse en el componente raíz de la app móvil
 */
export async function hydrateSession(): Promise<void> {
  if (!isCapacitor()) {
    return
  }

  try {
    const token = await getSessionToken()

    if (token) {
      // Validar token contra el servidor
      const response = await fetch(`${appConfig.api.baseUrl}/api/auth/session`, {
        headers: {
          Cookie: `next-auth.session-token=${token}`,
        },
      })

      if (!response.ok) {
        // Token inválido, limpiar
        await clearSessionToken()
      }
    }
  } catch (error) {
    console.error('Error hydrating session:', error)
    await clearSessionToken()
  }
}

/**
 * Configurar listeners para sincronizar sesión
 */
export function setupSessionSync(): void {
  if (!isCapacitor()) {
    return
  }

  // Listener para guardar sesión cuando cambia
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', async (event) => {
      if (event.key === 'next-auth.session-token') {
        if (event.newValue) {
          await saveSessionToken(event.newValue)
        } else {
          await clearSessionToken()
        }
      }
    })
  }
}
