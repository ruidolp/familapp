import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { db } from '@/infrastructure/database/kysely'
import {
  findSobreById,
  createInvitacionSobre,
  findInvitacionesBySobre,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  parseContact,
  findUserByContact,
  generateInvitationCode,
  generateInvitationLink,
  isValidEmail,
  isValidPhone,
} from '@/infrastructure/utils/invitation.utils'
import type { RolSobreUsuario } from '@/infrastructure/database/custom-enums'
import { sendInvitationEmail } from '@/infrastructure/services/email/email.service'
import { appConfig } from '@/config/app.config'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: sobreId } = await context.params
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return NextResponse.json({ error: 'Sobre no encontrado' }, { status: 404 })
    }

    if (sobre.usuario_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver las invitaciones de este sobre' },
        { status: 403 }
      )
    }

    const invitaciones = await findInvitacionesBySobre(sobreId)

    return NextResponse.json({
      success: true,
      invitaciones,
    })
  } catch (error: any) {
    console.error('❌ GET /api/sobres/[id]/invite error:', error)
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

    const { id: sobreId } = await context.params

    // Validar que el sobre existe y pertenece al usuario
    const sobre = await findSobreById(sobreId)
    if (!sobre) {
      return NextResponse.json(
        { error: 'Sobre no encontrado' },
        { status: 404 }
      )
    }

    if (sobre.usuario_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para invitar a este sobre' },
        { status: 403 }
      )
    }

    // Parsear body
    const body = await req.json()
    const { contact, rol = 'CONTRIBUTOR' } = body

    if (!contact) {
      return NextResponse.json(
        { error: 'El campo "contact" es requerido (email o teléfono)' },
        { status: 400 }
      )
    }

    // Validar formato
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

    // Validar rol
    const validRoles: RolSobreUsuario[] = ['OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER']
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido. Valores permitidos: OWNER, ADMIN, CONTRIBUTOR, VIEWER' },
        { status: 400 }
      )
    }

    // No permitir invitarse a sí mismo
    if (
      (type === 'email' && session.user.email === normalized) ||
      (type === 'phone' && session.user.phone === normalized)
    ) {
      return NextResponse.json(
        { error: 'No puedes invitarte a ti mismo' },
        { status: 400 }
      )
    }

    // Buscar si el usuario existe
    const existingUser = await findUserByContact(normalized)

    // Si el usuario existe, verificar que no sea ya participante
    if (existingUser) {
      const participante = await db
        .selectFrom('sobres_usuarios')
        .selectAll()
        .where('sobre_id', '=', sobreId)
        .where('usuario_id', '=', existingUser.id)
        .executeTakeFirst()

      if (participante) {
        return NextResponse.json(
          { error: 'Este usuario ya es participante del sobre' },
          { status: 400 }
        )
      }

      // Verificar si ya tiene una invitación pendiente
      const invitacionExistente = await db
        .selectFrom('invitaciones_sobres')
        .selectAll()
        .where('sobre_id', '=', sobreId)
        .where('invitado_user_id', '=', existingUser.id)
        .where('estado', '=', 'PENDIENTE')
        .executeTakeFirst()

      if (invitacionExistente) {
        return NextResponse.json(
          { error: 'Ya existe una invitación pendiente para este usuario' },
          { status: 400 }
        )
      }
    }

    // Crear invitación
    const invitacion = await createInvitacionSobre({
      sobre_id: sobreId,
      invitado_por_id: session.user.id,
      invitado_email_o_telefono: normalized,
      invitado_user_id: existingUser?.id || null,
      codigo_invitacion: existingUser ? null : generateInvitationCode(),
      rol,
    })

    if (type === 'email' && appConfig.email.enabled) {
      const invitationLink = invitacion.codigo_invitacion
        ? generateInvitationLink(invitacion.codigo_invitacion, appConfig.api.baseUrl)
        : `${appConfig.api.baseUrl}/invitations`

      await sendInvitationEmail({
        email: normalized,
        inviteCode: invitacion.codigo_invitacion,
        inviteLink: invitationLink,
        inviterName: session.user.name || session.user.email || 'Miembro de Familapp',
        sobreNombre: sobre.nombre,
        participantExists: !!existingUser,
      })
    }

    return NextResponse.json(
      {
        success: true,
        invitacion: {
          id: invitacion.id,
          sobre_id: invitacion.sobre_id,
          invitado_email_o_telefono: invitacion.invitado_email_o_telefono,
          user_exists: !!existingUser,
          codigo_invitacion: invitacion.codigo_invitacion,
          expires_at: invitacion.expires_at,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ POST /api/sobres/[id]/invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear invitación' },
      { status: 500 }
    )
  }
}
