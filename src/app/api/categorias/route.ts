/**
 * /api/categorias
 *
 * API endpoints para gestión de categorías
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  crearCategoria,
  obtenerCategoriasUsuario,
} from '@/application/services/categorias.service'

/**
 * GET /api/categorias
 *
 * Obtener todas las categorías del usuario autenticado
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await obtenerCategoriasUsuario(session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      categorias: result.data,
    })
  } catch (error: any) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categorias
 *
 * Crear una nueva categoría
 *
 * Body:
 * {
 *   nombre: string (requerido)
 *   color?: string
 *   emoji?: string
 *   sobreId?: string (opcional, vincula automáticamente la categoría al sobre)
 * }
 */
export async function POST(req: NextRequest) {
  // ============ DEBUG MODE ============
  console.log('🔍 [API DEBUG] POST /api/categorias iniciado')

  try {
    const session = await auth()
    console.log('🔍 [API DEBUG] Session:', session ? `Usuario: ${session.user?.id} (${session.user?.email})` : 'NO SESSION')

    if (!session?.user) {
      console.error('❌ [API DEBUG] Unauthorized - No hay sesión')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('🔍 [API DEBUG] Body recibido:', JSON.stringify(body, null, 2))
    console.log('🔍 [API DEBUG] userId del session:', session.user.id)

    const { nombre, color, emoji, sobreId } = body
    console.log('🔍 [API DEBUG] Datos extraídos:')
    console.log('  - nombre:', nombre)
    console.log('  - color:', color)
    console.log('  - emoji:', emoji)
    console.log('  - sobreId:', sobreId)

    // Validaciones
    if (!nombre) {
      console.error('❌ [API DEBUG] Validación fallida: nombre es requerido')
      return NextResponse.json(
        { error: 'Campo requerido: nombre' },
        { status: 400 }
      )
    }

    console.log('✅ [API DEBUG] Validaciones pasadas, llamando a crearCategoria...')

    const inputData = {
      nombre,
      color,
      emoji,
      userId: session.user.id,
      sobreId,
    }
    console.log('🔍 [API DEBUG] Input para crearCategoria:', JSON.stringify(inputData, null, 2))

    const result = await crearCategoria(inputData)

    console.log('🔍 [API DEBUG] Resultado de crearCategoria:', JSON.stringify({
      success: result.success,
      error: result.error,
      data: result.data ? 'Categoría creada' : 'Sin data'
    }, null, 2))

    if (!result.success) {
      console.error('❌ [API DEBUG] crearCategoria falló:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log('✅ [API DEBUG] Categoría creada exitosamente:', result.data?.id)
    return NextResponse.json(
      {
        success: true,
        categoria: result.data,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ [API DEBUG] Exception en POST /api/categorias:', error)
    console.error('❌ [API DEBUG] Error stack:', error.stack)
    console.error('❌ [API DEBUG] Error message:', error.message)

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  } finally {
    console.log('🏁 [API DEBUG] POST /api/categorias finalizado')
  }
}
