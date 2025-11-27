import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { getMyContacts } from '@/infrastructure/database/queries/invitation.queries'

/**
 * GET /api/my-contacts
 * Obtiene la lista de contactos del usuario (personas que aceptaron invitaciones a sobres o listas)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contacts = await getMyContacts(session.user.id)

    return NextResponse.json({
      success: true,
      contacts,
    })
  } catch (error: any) {
    console.error('❌ GET /api/my-contacts error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener contactos' },
      { status: 500 }
    )
  }
}
