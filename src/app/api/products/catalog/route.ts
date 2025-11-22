import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { getAllProductCatalogByIdioma } from '@/infrastructure/database/queries/shopping-lists.queries'

/**
 * GET /api/products/catalog?idioma=es
 * Obtener todos los productos del catálogo global por idioma (para caché IndexedDB)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const idioma = searchParams.get('idioma') || 'es'

    const products = await getAllProductCatalogByIdioma(idioma)

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
      idioma,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/catalog error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener catálogo de productos' },
      { status: 500 }
    )
  }
}
