/**
 * /api/subcategorias/global
 *
 * API endpoint para obtener marcas/subcategorías globales por país
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'

/**
 * GET /api/subcategorias/global?pais=CL
 *
 * Obtener marcas globales por país para autocompletado
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pais = searchParams.get('pais') || 'CL'

    // Intentar obtener marcas para el país solicitado
    let marcasGlobales = await db
      .selectFrom('subcategorias_globales')
      .selectAll()
      .where('pais', '=', pais)
      .where('deleted_at', 'is', null)
      .orderBy('nombre', 'asc')
      .execute()

    // Si no hay marcas para ese país y no es CL, usar CL como fallback
    if (marcasGlobales.length === 0 && pais !== 'CL') {
      marcasGlobales = await db
        .selectFrom('subcategorias_globales')
        .selectAll()
        .where('pais', '=', 'CL')
        .where('deleted_at', 'is', null)
        .orderBy('nombre', 'asc')
        .execute()
    }

    return NextResponse.json({
      success: true,
      marcas: marcasGlobales,
    })
  } catch (error: any) {
    console.error('Error al obtener marcas globales:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
