import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await getFavorites(session.user.id)

    return NextResponse.json({
      success: true,
      favorites,
      total: favorites.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener favoritos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, productCustomId, isCatalog } = body

    if (!productId && !productCustomId) {
      return NextResponse.json(
        { error: 'productId o productCustomId es requerido' },
        { status: 400 }
      )
    }

    await addFavorite(
      session.user.id,
      isCatalog ? productId : null,
      !isCatalog ? productCustomId : null,
      isCatalog
    )

    return NextResponse.json({
      success: true,
      message: 'Producto agregado a favoritos',
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/products/favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al agregar a favoritos' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'productId es requerido' },
        { status: 400 }
      )
    }

    await removeFavorite(session.user.id, productId)

    return NextResponse.json({
      success: true,
      message: 'Producto removido de favoritos',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/products/favorites error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al remover de favoritos' },
      { status: 500 }
    )
  }
}
