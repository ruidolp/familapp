/**
 * API Route para obtener configuración pública
 *
 * Este endpoint devuelve solo la configuración necesaria para el cliente
 * sin exponer secrets o información sensible.
 */

import { NextRequest, NextResponse } from 'next/server'
import { appConfig } from '@/config/app.config'
import { rateLimit, RateLimitPresets } from '@/infrastructure/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting - Prevenir abuso del endpoint
  const rateLimitResult = await rateLimit(request, RateLimitPresets.config)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  return NextResponse.json({
    auth: {
      registration: {
        allowSelfSignup: appConfig.auth.registration.allowSelfSignup,
        allowedAccountTypes: appConfig.auth.registration.allowedAccountTypes,
      },
      recovery: {
        enabled: appConfig.auth.recovery.enabled,
      },
      oauth: {
        google: {
          enabled: appConfig.auth.oauth.google.enabled,
        },
        facebook: {
          enabled: appConfig.auth.oauth.facebook.enabled,
        },
      },
    },
  })
}
