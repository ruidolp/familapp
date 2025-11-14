/**
 * API Route para health check
 *
 * Endpoint simple para verificar que la API está funcionando
 * y que la conexión a la base de datos está activa.
 *
 * Migrado a Kysely para mejor performance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/infrastructure/database/kysely'
import { sql } from 'kysely'
import { appConfig } from '@/config/app.config'
import { rateLimit, RateLimitPresets } from '@/infrastructure/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting - Prevenir abuso del endpoint de health check
  const rateLimitResult = await rateLimit(request, RateLimitPresets.public)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    // Verificar conexión a la base de datos
    await sql`SELECT 1`.execute(db)

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '0.1.0',
      database: 'connected',
      config: {
        selfSignupEnabled: appConfig.auth.registration.allowSelfSignup,
        emailEnabled: appConfig.email.enabled,
        smsEnabled: appConfig.sms.enabled,
        recoveryEnabled: appConfig.auth.recovery.enabled,
        confirmationEnabled: appConfig.auth.confirmation.enabled,
        oauthProviders: {
          google: appConfig.auth.oauth.google.enabled,
          facebook: appConfig.auth.oauth.facebook.enabled,
        },
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
