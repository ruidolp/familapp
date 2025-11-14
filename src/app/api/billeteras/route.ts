/**
 * /api/billeteras
 *
 * API endpoints para gestión de billeteras (wallets)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  crearBilletera,
  obtenerBilleterasUsuario,
} from '@/application/services/billeteras.service'

/**
 * GET /api/billeteras
 *
 * Obtener todas las billeteras del usuario autenticado
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await obtenerBilleterasUsuario(session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      billeteras: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener billeteras:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billeteras
 *
 * Crear una nueva billetera
 *
 * Body:
 * {
 *   nombre: string (requerido)
 *   tipo: TipoBilletera (requerido)
 *   monedaPrincipalId?: string
 *   saldoInicial?: number
 *   color?: string
 *   emoji?: string
 *   isCompartida?: boolean
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { nombre, tipo, monedaPrincipalId, saldoInicial, color, emoji, isCompartida } = body

    // Validaciones
    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: 'Campos requeridos: nombre, tipo' },
        { status: 400 }
      )
    }

    const result = await crearBilletera({
      nombre,
      tipo,
      monedaPrincipalId,
      saldoInicial,
      color,
      emoji,
      isCompartida,
      userId: session.user.id,
    })

    if (!result.success) {
      // Si el error es por falta de configuración, indicar que requiere onboarding
      const requiresOnboarding = result.error?.includes('Configuración de usuario no encontrada')
      return NextResponse.json(
        {
          error: result.error,
          ...(requiresOnboarding && { requiresOnboarding: true })
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      billetera: result.data,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear billetera:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
