/**
 * Rate Limiting Middleware
 *
 * Protección contra ataques de fuerza bruta y DDoS.
 *
 * IMPORTANTE: Esta implementación usa memoria local (Map) que funciona para:
 * - Desarrollo
 * - Producción con un solo servidor
 *
 * Para producción con múltiples servidores, migrar a Redis:
 * - Usar @upstash/redis o ioredis
 * - Implementar el mismo patrón pero con Redis como store
 *
 * Cloudflare ya provee rate limiting a nivel de CDN, esta capa es adicional.
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  /**
   * Número máximo de requests permitidos en la ventana de tiempo
   */
  maxRequests: number

  /**
   * Ventana de tiempo en milisegundos
   */
  windowMs: number

  /**
   * Mensaje personalizado al alcanzar el límite
   */
  message?: string

  /**
   * Agregar headers de rate limit a la respuesta
   */
  includeHeaders?: boolean
}

/**
 * Store en memoria para rate limiting
 * En producción con múltiples servidores, usar Redis
 */
const rateLimitStore = new Map<string, RateLimitStore>()

/**
 * Limpia entradas expiradas cada 10 minutos
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

/**
 * Obtiene el identificador del cliente (IP)
 * Prioriza headers de Cloudflare y proxies
 */
function getClientIdentifier(request: NextRequest): string {
  // Cloudflare IP
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // X-Forwarded-For (usado por proxies)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  // X-Real-IP
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // Fallback a unknown si no hay headers de IP
  return 'unknown'
}

/**
 * Middleware de rate limiting
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     maxRequests: 5,
 *     windowMs: 60 * 1000, // 1 minuto
 *   })
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *
 *   // Continuar con la lógica del endpoint
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ success: boolean; response?: NextResponse }> {
  const {
    maxRequests,
    windowMs,
    message = 'Demasiadas solicitudes. Por favor intenta más tarde.',
    includeHeaders = true,
  } = config

  const identifier = getClientIdentifier(request)
  const key = `${request.nextUrl.pathname}:${identifier}`
  const now = Date.now()

  // Obtener o crear entrada en el store
  let record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Nueva ventana de tiempo
    record = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, record)
  } else {
    // Incrementar contador en ventana actual
    record.count++
  }

  const isRateLimited = record.count > maxRequests
  const remaining = Math.max(0, maxRequests - record.count)
  const resetInSeconds = Math.ceil((record.resetTime - now) / 1000)

  // Si excede el límite, retornar error 429
  if (isRateLimited) {
    const response = NextResponse.json(
      {
        error: message,
        retryAfter: resetInSeconds,
      },
      { status: 429 }
    )

    if (includeHeaders) {
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', record.resetTime.toString())
      response.headers.set('Retry-After', resetInSeconds.toString())
    }

    return { success: false, response }
  }

  // Agregar headers informativos a la respuesta exitosa
  if (includeHeaders) {
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString())
  }

  return { success: true }
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const RateLimitPresets = {
  /**
   * Para endpoints de autenticación (login, register)
   * Límite estricto para prevenir fuerza bruta
   */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
  },

  /**
   * Para endpoints públicos generales
   */
  public: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },

  /**
   * Para endpoints de configuración (menos críticos)
   */
  config: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minuto
  },

  /**
   * Para recuperación de contraseña
   * Muy restrictivo para prevenir spam
   */
  recovery: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
    message: 'Demasiados intentos de recuperación. Intenta de nuevo en 1 hora.',
  },
} as const

/**
 * Limpia el store manualmente (útil para testing)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear()
}
