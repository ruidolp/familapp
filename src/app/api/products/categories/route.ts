import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  createProductCategory,
  getUserProductCategories,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await getUserProductCategories(session.user.id)

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/products/categories error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener categorías' },
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
    const { nombre, color, emoji } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      )
    }

    const category = await createProductCategory(
      session.user.id,
      nombre,
      color,
      emoji
    )

    return NextResponse.json({
      success: true,
      category,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/products/categories error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
