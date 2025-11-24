import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  cloneShoppingList,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import { canUserAccessList } from '@/application/services/shopping-lists.service'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const list = await getShoppingListById(id)

    if (!list) {
      return NextResponse.json(
        { error: 'Lista no encontrada' },
        { status: 404 }
      )
    }

    // Permitir clonar si el usuario es OWNER o tiene acceso como colaborador
    const hasAccess = await canUserAccessList(id, session.user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para clonar esta lista' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { newName } = body

    if (!newName) {
      return NextResponse.json(
        { error: 'newName es requerido' },
        { status: 400 }
      )
    }

    const clonedList = await cloneShoppingList(id, session.user.id, newName)

    return NextResponse.json({
      success: true,
      list: clonedList,
      message: 'Lista clonada correctamente',
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/clone error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al clonar lista' },
      { status: 500 }
    )
  }
}
