import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import {
  getShoppingListById,
  createInvitacionLista,
  findParticipantesByLista,
  findInvitacionesListasByLista,
} from '@/infrastructure/database/queries/shopping-lists.queries'
import {
  parseContact,
  findUserByContact,
  generateInvitationCode,
  isValidEmail,
  isValidPhone,
} from '@/infrastructure/utils/invitation.utils'

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

    const { type, normalized } = parseContact(contact)
    if (type === 'email' && !isValidEmail(normalized)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }
    if (type === 'phone' && !isValidPhone(normalized)) {
      return NextResponse.json(
        { error: 'Formato de teléfono inválido' },
        { status: 400 }
      )
    }

    const sessionEmail = session.user.email?.toLowerCase()
    const sessionPhoneRaw = (session.user as any)?.phone as string | undefined
    const sessionPhone = sessionPhoneRaw?.replace(/[\s\-\(\)]/g, '')
    if (
      (type === 'email' && sessionEmail && sessionEmail === normalized) ||
      (type === 'phone' && sessionPhone && sessionPhone === normalized)
    ) {
      return NextResponse.json(
        { error: 'No puedes invitarte a ti mismo' },
        { status: 400 }
      )
    }

    const existingUser = await findUserByContact(normalized)

    if (existingUser) {
      const alreadyParticipant = participantes.some(
        (p: any) => p.usuario_id === existingUser.id
      )
      if (alreadyParticipant) {
        return NextResponse.json(
          { error: 'Este usuario ya es participante de la lista' },
          { status: 400 }
        )
      }

      const invitacionExistente = await db
        .selectFrom('invitaciones_listas')
        .select(['id'])
        .where('lista_id', '=', listaId)
        .where('invitado_user_id', '=', existingUser.id)
        .where('estado', '=', 'PENDIENTE')
        .executeTakeFirst()

      if (invitacionExistente) {
        return NextResponse.json(
          { error: 'Ya existe una invitación pendiente para este usuario' },
          { status: 400 }
        )
      }
    } else {
      const invitacionPorContacto = await db
        .selectFrom('invitaciones_listas')
        .select(['id'])
        .where('lista_id', '=', listaId)
        .where('invitado_email_o_telefono', '=', normalized)
        .where('estado', '=', 'PENDIENTE')
        .executeTakeFirst()

      if (invitacionPorContacto) {
        return NextResponse.json(
          { error: 'Ya enviaste una invitación pendiente a este contacto' },
          { status: 400 }
        )
      }
    }

    const codigoInvitacion = existingUser ? null : generateInvitationCode()

    const invitacion = await createInvitacionLista({
      lista_id: listaId,
      invitado_por_id: session.user.id,
      invitado_email_o_telefono: normalized,
      invitado_user_id: existingUser?.id || null,
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
