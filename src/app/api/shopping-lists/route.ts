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

    const collaboratorDetails = ownedListIds.length === 0
      ? []
      : await db
        .selectFrom('shopping_list_collaborators as slc')
        .innerJoin('users as u', 'slc.user_id', 'u.id')
        .select([
          'slc.shopping_list_id',
          'u.id as collaborator_id',
          'u.name as collaborator_name',
          'u.email as collaborator_email',
        ])
        .where('slc.deleted_at', 'is', null)
        .where('slc.shopping_list_id', 'in', ownedListIds)
        .where('u.id', '!=', session.user.id)
        .execute()

    // Create a map of list id -> collaborator count
    const collaboratorCountMap = new Map(
      collaboratorCounts.map((row: any) => [row.shopping_list_id, row.collaborator_count])
    )

    const collaboratorDetailMap = new Map<string, Array<{ id: string; name: string | null; email: string | null }>>()
    for (const detail of collaboratorDetails) {
      const entry = {
        id: detail.collaborator_id,
        name: detail.collaborator_name,
        email: detail.collaborator_email,
      }
      const arr = collaboratorDetailMap.get(detail.shopping_list_id) || []
      arr.push(entry)
      collaboratorDetailMap.set(detail.shopping_list_id, arr)
    }

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
    const listsWithCounts = lists.map((list) => {
      const collaboratorCount = collaboratorCountMap.get(list.id) || 0
      const collaborators = collaboratorDetailMap.get(list.id) || []
      return {
        ...list,
        _itemCount: itemCountMap.get(list.id) || 0,
        ...(collaboratorCount > 0 ? { _collaboratorCount: collaboratorCount } : {}),
        ...(collaborators.length > 0 ? { _collaborators: collaborators } : {}),
      }
    })

    // Add item count to shared lists
    const sharedListsWithCounts = sharedLists.map((list: any) => ({
      ...list,
      _itemCount: itemCountMap.get(list.id) || 0,
      _isShared: true, // Flag to identify shared lists
      _sharedBy: list.shared_by_name || list.shared_by_email
        ? {
            name: list.shared_by_name,
            email: list.shared_by_email,
          }
        : list.owner_name || list.owner_email
          ? {
              name: list.owner_name,
              email: list.owner_email,
            }
          : undefined,
      _ownerInfo: list.owner_name || list.owner_email
        ? {
            name: list.owner_name,
            email: list.owner_email,
          }
        : undefined,
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

    console.log('📝 Creating shopping list:', { userId: session.user.id, nombre, descripcion })
    const newList = await createShoppingList(session.user.id, nombre, descripcion)
    console.log('✅ Shopping list created:', newList)

    return NextResponse.json({
      success: true,
      list: newList,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Error al crear lista', details: error.detail },
      { status: 500 }
    )
  }
}
