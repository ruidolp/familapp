import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { getAllGlobalProductCategoriesByIdioma } from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * GET /api/products/categories/global?idioma=es
 * Obtener todas las categorías globales por idioma (para caché IndexedDB)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const idioma = searchParams.get('idioma') || 'es'

    const categories = await getAllGlobalProductCategoriesByIdioma(idioma)

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
      idioma,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/categories/global error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener categorías globales' },
      { status: 500 }
    )
  }
}
