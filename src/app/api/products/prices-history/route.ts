import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  recordPrice,
  getPriceHistory,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const stores = searchParams.getAll('stores')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!productId) {
      return NextResponse.json(
        { error: 'productId es requerido' },
        { status: 400 }
      )
    }

    const history = await getPriceHistory(
      productId,
      stores.length > 0 ? stores : undefined,
      limit
    )

    return NextResponse.json({
      success: true,
      history,
      total: history.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/prices-history error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener historial de precios' },
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
    const {
      product_id,
      product_custom_id,
      is_catalog,
      store_name,
      price,
      currency_id,
    } = body

    if (!store_name || price === undefined) {
      return NextResponse.json(
        { error: 'store_name y price son requeridos' },
        { status: 400 }
      )
    }

    if (!product_id && !product_custom_id) {
      return NextResponse.json(
        { error: 'product_id o product_custom_id es requerido' },
        { status: 400 }
      )
    }

    await recordPrice({
      user_id: session.user.id,
      product_id: is_catalog ? product_id : undefined,
      product_custom_id: !is_catalog ? product_custom_id : undefined,
      is_catalog,
      store_name,
      price: Number(price),
      currency_id,
    })

    return NextResponse.json({
      success: true,
      message: 'Precio registrado correctamente',
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/products/prices-history error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al registrar precio' },
      { status: 500 }
    )
  }
}
