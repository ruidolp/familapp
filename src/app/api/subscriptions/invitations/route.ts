/**
 * POST /api/subscriptions/invitations
 *
 * Generar código de invitación para vincular usuarios.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { generateInvitation } from '@/application/services/subscriptions'
import { SUBSCRIPTION_CONFIG } from '@/infrastructure/config/subscription.config'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verificar que el usuario tiene un plan que permite invitaciones
    if (session.user.subscription.planSlug === 'free') {
      return NextResponse.json(
        { error: 'Upgrade to a paid plan to invite users' },
        { status: 403 }
      )
    }

    // Verificar que el usuario no está vinculado (solo owners pueden invitar)
    if (session.user.subscription.isLinked) {
      return NextResponse.json(
        { error: 'You cannot invite users while linked to another plan' },
        { status: 403 }
      )
    }

    // Parse request body (opcional)
    const body = await req.json().catch(() => ({}))
    const { maxUses = 1, expiresInDays = SUBSCRIPTION_CONFIG.invitationExpiryDays } = body

    // Generar invitación
    const invitation = await generateInvitation(
      session.user.id,
      maxUses,
      expiresInDays
    )

    // Generar URLs
    const invitationUrl = `${SUBSCRIPTION_CONFIG.whatsapp.invitationLinkPrefix}/${invitation.code}`

    // Generar link de WhatsApp
    let whatsappUrl = null
    const whatsappText = encodeURIComponent(
      `🎉 ¡Te invito a usar nuestra app Premium! Haz clic en este link para aceptar: ${invitationUrl}`
    )

    if (SUBSCRIPTION_CONFIG.whatsapp.shareNumber) {
      whatsappUrl = `https://wa.me/${SUBSCRIPTION_CONFIG.whatsapp.shareNumber}?text=${whatsappText}`
    } else {
      whatsappUrl = `https://wa.me/?text=${whatsappText}`
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        code: invitation.code,
        expiresAt: invitation.expires_at,
        maxUses: invitation.max_uses,
        usesCount: invitation.uses_count,
      },
      invitationUrl,
      whatsappUrl,
    })
  } catch (error: any) {
    console.error('Error generating invitation:', error)

    if (error.message.includes('Maximum linked users reached')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
