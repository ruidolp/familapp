import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  createCustomProduct,
  searchUserCustomProducts,
  findUserCustomProductByNombre,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const products = await searchUserCustomProducts(session.user.id, q, limit)

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/custom error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener productos personalizados' },
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
    const { nombre, descripcion } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del producto es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un producto con ese nombre (case-insensitive)
    const existing = await findUserCustomProductByNombre(
      session.user.id,
      nombre.trim()
    )

    if (existing) {
      // Retornar el producto existente en lugar de crear duplicado
      return NextResponse.json({
        success: true,
        product: existing,
        existed: true, // Flag para indicar que ya existía
      }, { status: 200 })
    }

    const product = await createCustomProduct(
      session.user.id,
      nombre.trim(),
      descripcion
    )

    return NextResponse.json({
      success: true,
      product,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/products/custom error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear producto personalizado' },
      { status: 500 }
    )
  }
}
