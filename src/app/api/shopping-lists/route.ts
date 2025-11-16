import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  createShoppingList,
  getShoppingListsByUser,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { notify } from '@/infrastructure/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lists = await getShoppingListsByUser(session.user.id)
    return NextResponse.json({
      success: true,
      lists,
      total: lists.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener listas' },
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
        { error: 'El nombre de la lista es requerido' },
        { status: 400 }
      )
    }

    const newList = await createShoppingList(session.user.id, nombre, descripcion)

    return NextResponse.json({
      success: true,
      list: newList,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear lista' },
      { status: 500 }
    )
  }
}
