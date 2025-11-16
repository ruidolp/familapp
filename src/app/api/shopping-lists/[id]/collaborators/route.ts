import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import {
  getShoppingListById,
  addCollaborator,
  getListCollaborators,
  removeCollaborator,
} from '@/infrastructure/database/queries/shopping-lists.queries'

export async function GET(
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

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta lista' },
        { status: 403 }
      )
    }

    const collaborators = await getListCollaborators(id)

    return NextResponse.json({
      success: true,
      collaborators,
      total: collaborators.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/collaborators error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener colaboradores' },
      { status: 500 }
    )
  }
}

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

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para compartir esta lista' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { user_id, permission_level } = body

    if (!user_id || !permission_level) {
      return NextResponse.json(
        { error: 'user_id y permission_level son requeridos' },
        { status: 400 }
      )
    }

    if (!['FULL_ACCESS', 'EXECUTION_ONLY'].includes(permission_level)) {
      return NextResponse.json(
        { error: 'permission_level inválido' },
        { status: 400 }
      )
    }

    const newCollaborator = await addCollaborator(
      id,
      user_id,
      permission_level,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      collaborator: newCollaborator,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/collaborators error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al agregar colaborador' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    if (list.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar colaboradores' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    await removeCollaborator(id, userId)

    return NextResponse.json({
      success: true,
      message: 'Colaborador removido correctamente',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/shopping-lists/[id]/collaborators error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al remover colaborador' },
      { status: 500 }
    )
  }
}
