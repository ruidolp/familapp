/**
 * /api/user/config
 *
 * API endpoint para configuración de usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  findUserConfig,
  createDefaultUserConfig,
  updateUserConfig,
} from '@/infrastructure/database/queries/user-config.queries'

/**
 * GET /api/user/config
 *
 * Obtener configuración del usuario autenticado
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await findUserConfig(session.user.id)

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          requiresOnboarding: true,
          error: 'Configuración no encontrada'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error: any) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/config
 *
 * Crear configuración inicial del usuario
 *
 * Body:
 * {
 *   monedaPrincipalId: string (requerido)
 *   timezone?: string
 *   locale?: string
 *   primerDiaSemana?: number (0=Domingo, 1=Lunes)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que no exista ya una configuración
    const existingConfig = await findUserConfig(session.user.id)
    if (existingConfig) {
      return NextResponse.json(
        { error: 'La configuración ya existe. Usa PUT para actualizar.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { monedaPrincipalId, timezone, locale, primerDiaSemana } = body

    // Validar campo requerido
    if (!monedaPrincipalId) {
      return NextResponse.json(
        { error: 'monedaPrincipalId es requerido' },
        { status: 400 }
      )
    }

    // Crear configuración con todos los valores proporcionados
    const config = await createDefaultUserConfig(
      session.user.id,
      monedaPrincipalId,
      {
        timezone,
        locale,
        primerDiaSemana,
      }
    )

    return NextResponse.json(
      {
        success: true,
        config,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al crear configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/config
 *
 * Actualizar configuración del usuario
 *
 * Body: cualquier campo de configuración
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      monedaPrincipalId,
      monedasHabilitadas,
      timezone,
      locale,
      primerDiaSemana,
      tipoPeriodo,
      diaInicioPeriodo,
    } = body

    const updateData: any = {}
    if (monedaPrincipalId) updateData.moneda_principal_id = monedaPrincipalId
    if (monedasHabilitadas) updateData.monedas_habilitadas = monedasHabilitadas
    if (timezone) updateData.timezone = timezone
    if (locale) updateData.locale = locale
    if (primerDiaSemana !== undefined) updateData.primer_dia_semana = primerDiaSemana
    if (tipoPeriodo) updateData.tipo_periodo = tipoPeriodo
    if (diaInicioPeriodo !== undefined) updateData.dia_inicio_periodo = diaInicioPeriodo

    const config = await updateUserConfig(session.user.id, updateData)

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
