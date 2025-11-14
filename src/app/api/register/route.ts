/**
 * API Route para registro de usuarios
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/application/services/auth.service'
import { registerWithEmailSchema, registerWithPhoneSchema } from '@/infrastructure/utils/validation'
import { appConfig } from '@/config/app.config'
import { rateLimit, RateLimitPresets } from '@/infrastructure/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - Prevenir registro masivo y ataques
    const rateLimitResult = await rateLimit(request, RateLimitPresets.auth)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    // Verificar que el auto-registro esté habilitado
    if (!appConfig.auth.registration.allowSelfSignup) {
      return NextResponse.json(
        { error: 'El registro no está disponible' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Determinar tipo de cuenta
    const accountType = body.email ? 'EMAIL' : 'PHONE'

    // Validar según tipo de cuenta
    let validated
    if (accountType === 'EMAIL') {
      if (!appConfig.auth.registration.allowedAccountTypes.email) {
        return NextResponse.json(
          { error: 'Registro con email no está permitido' },
          { status: 403 }
        )
      }

      const result = registerWithEmailSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: result.error.errors },
          { status: 400 }
        )
      }
      validated = result.data
    } else {
      if (!appConfig.auth.registration.allowedAccountTypes.phone) {
        return NextResponse.json(
          { error: 'Registro con teléfono no está permitido' },
          { status: 403 }
        )
      }

      const result = registerWithPhoneSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: result.error.errors },
          { status: 400 }
        )
      }
      validated = result.data
    }

    // Registrar usuario
    const result = await registerUser({
      name: validated.name,
      password: validated.password,
      accountType,
      email: 'email' in validated ? validated.email : undefined,
      phone: 'phone' in validated ? validated.phone : undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          phone: result.user!.phone,
        },
        requiresVerification: result.requiresVerification,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en /api/register:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
