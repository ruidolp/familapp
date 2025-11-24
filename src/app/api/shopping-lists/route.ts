import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  createShoppingList,
  getShoppingListsByUser,
  getSharedShoppingLists,
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
    const sharedLists = await getSharedShoppingLists(session.user.id)

    // Get collaborator counts for owned lists
    const ownedListIds = lists.map(l => l.id)
    const collaboratorCounts = ownedListIds.length === 0
      ? []
      : await db
        .selectFrom('shopping_list_collaborators')
        .select((eb) => [
          'shopping_list_id',
          eb.fn.count<number>('id').as('collaborator_count'),
        ])
        .where('deleted_at', 'is', null)
        .where('shopping_list_id', 'in', ownedListIds)
        .groupBy('shopping_list_id')
        .execute()

    // Create a map of list id -> collaborator count
    const collaboratorCountMap = new Map(
      collaboratorCounts.map((row: any) => [row.shopping_list_id, row.collaborator_count])
    )

    // Get item counts for all lists (owned + shared)
    const allListIds = [...lists.map(l => l.id), ...sharedLists.map(l => l.id)]

    const itemCounts = allListIds.length === 0
      ? []
      : await db
        .selectFrom('shopping_list_items')
        .select((eb) => [
          'shopping_list_id',
          eb.fn.count<number>('id').as('item_count'),
        ])
        .where('deleted_at', 'is', null)
        .where('shopping_list_id', 'in', allListIds)
        .groupBy('shopping_list_id')
        .execute()

    // Create a map of list id -> item count
    const itemCountMap = new Map(
      itemCounts.map((row: any) => [row.shopping_list_id, row.item_count])
    )

    // Add item count and collaborator count to each list
    const listsWithCounts = lists.map((list) => ({
      ...list,
      _itemCount: itemCountMap.get(list.id) || 0,
      _collaboratorCount: collaboratorCountMap.get(list.id) || 0,
    }))

    // Add item count to shared lists
    const sharedListsWithCounts = sharedLists.map((list: any) => ({
      ...list,
      _itemCount: itemCountMap.get(list.id) || 0,
      _isShared: true, // Flag to identify shared lists
    }))

    return NextResponse.json({
      success: true,
      lists: listsWithCounts,
      sharedLists: sharedListsWithCounts,
      total: lists.length,
      sharedTotal: sharedLists.length,
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
