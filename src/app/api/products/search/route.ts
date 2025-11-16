import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  searchProductCatalog,
  searchUserCustomProducts,
  getFavorites,
  getFrequentProducts,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const idioma = searchParams.get('idioma') || 'es'
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Search catalog and custom products
    const [catalog, custom, favorites, frequent] = await Promise.all([
      type === 'all' || type === 'catalog' ? searchProductCatalog(q, idioma, limit) : [],
      type === 'all' || type === 'custom' ? searchUserCustomProducts(session.user.id, q, limit) : [],
      type === 'favorites' ? getFavorites(session.user.id) : [],
      type === 'frequent' ? getFrequentProducts(session.user.id, limit) : [],
    ])

    return NextResponse.json({
      success: true,
      results: {
        catalog: catalog || [],
        custom: custom || [],
        favorites: favorites || [],
        frequent: frequent || [],
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/search error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al buscar productos' },
      { status: 500 }
    )
  }
}
