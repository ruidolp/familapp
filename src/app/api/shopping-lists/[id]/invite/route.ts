import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { nanoid } from 'nanoid'
import {
  getShoppingListById,
  createInvitacionLista,
  findParticipantesByLista,
  findInvitacionesListasByLista,
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

    const { id: listaId } = await context.params
    const lista = await getShoppingListById(listaId)
    if (!lista) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 })
    }

    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === session.user.id)
    const isOwner =
      lista.user_id === session.user.id || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Solo el propietario puede ver las invitaciones' },
        { status: 403 }
      )
    }

    const invitaciones = await findInvitacionesListasByLista(listaId)

    return NextResponse.json({
      success: true,
      invitaciones,
      total: invitaciones.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/shopping-lists/[id]/invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener invitaciones' },
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

    const { id: listaId } = await context.params
    const body = await req.json()
    const { contact, rol } = body

    // Validar datos requeridos
    if (!contact || !rol) {
      return NextResponse.json(
        { error: 'Contact y rol son requeridos' },
        { status: 400 }
      )
    }

    // Validar rol
    const rolesValidos = ['EDITOR', 'EXECUTION_ONLY']
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ error: 'Rol no válido' }, { status: 400 })
    }

    // Verificar que la lista existe
    const lista = await getShoppingListById(listaId)
    if (!lista) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 })
    }

    // Verificar que el usuario es OWNER
    const participantes = await findParticipantesByLista(listaId)
    const participante = participantes.find((p: any) => p.usuario_id === session.user.id)
    const isOwner =
      lista.user_id === session.user.id || (participante && participante.rol === 'OWNER')

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Solo el propietario puede enviar invitaciones' },
        { status: 403 }
      )
    }

    // Generar código único
    const codigoInvitacion = nanoid(12)

    // Crear invitación
    const invitacion = await createInvitacionLista({
      lista_id: listaId,
      invitado_por_id: session.user.id,
      invitado_email_o_telefono: contact.toLowerCase().trim(),
      codigo_invitacion: codigoInvitacion,
      rol,
    })

    return NextResponse.json({
      success: true,
      invitacion,
      codigo: codigoInvitacion,
    })
  } catch (error: any) {
    console.error('❌ POST /api/shopping-lists/[id]/invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear invitación' },
      { status: 500 }
    )
  }
}
