import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/lib/auth'
import { appConfig } from '@/config/app.config'
import { sendTestEmail } from '@/infrastructure/services/email/email.service'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!appConfig.email.enabled) {
    return NextResponse.json(
      { error: 'Email provider no está habilitado' },
      { status: 400 }
    )
  }

  if (!session.user.email) {
    return NextResponse.json(
      { error: 'Tu cuenta no tiene email asociado' },
      { status: 400 }
    )
  }

  const rawBody = (await req.json().catch(() => null)) as unknown
  const parsedBody =
    rawBody && typeof rawBody === 'object'
      ? (rawBody as { message?: unknown; subject?: unknown })
      : {}

  const message =
    typeof parsedBody.message === 'string' ? parsedBody.message.trim() : ''
  const subject =
    typeof parsedBody.subject === 'string' && parsedBody.subject.trim().length > 0
      ? parsedBody.subject.trim()
      : `Prueba de email - ${appConfig.email.brandName}`

  if (!message) {
    return NextResponse.json(
      { error: 'Mensaje es requerido' },
      { status: 400 }
    )
  }

  const result = await sendTestEmail({
    email: session.user.email,
    name: session.user.name,
    message: `${subject}\n\n${message}`,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: 'No se pudo enviar el email de prueba' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    sentTo: session.user.email,
  })
}
