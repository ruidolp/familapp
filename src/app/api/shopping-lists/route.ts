import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  createShoppingList,
  getShoppingListsByUser,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { db } from '@/infrastructure/database/kysely'
import { notify } from '@/infrastructure/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lists = await getShoppingListsByUser(session.user.id)

    // Get item counts for each list
    const itemCounts = await db
      .selectFrom('shopping_list_items')
      .select((eb) => [
        'shopping_list_id',
        eb.fn.count<number>('id').as('item_count'),
      ])
      .where('deleted_at', 'is', null)
      .groupBy('shopping_list_id')
      .execute()

    // Create a map of list id -> item count
    const itemCountMap = new Map(
      itemCounts.map((row: any) => [row.shopping_list_id, row.item_count])
    )

    // Add item count to each list
    const listsWithCounts = lists.map((list) => ({
      ...list,
      _itemCount: itemCountMap.get(list.id) || 0,
    }))

    return NextResponse.json({
      success: true,
      lists: listsWithCounts,
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
