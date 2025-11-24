/**
 * Invite Page
 *
 * Página para aceptar invitaciones a sobres compartidos mediante link único
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { InviteAcceptPage } from '@/presentation/components/sobres/invite-accept-page'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>
}) {
  const { locale, code } = await params
  const session = await getSession()

  // Si no está logueado, redirigir a registro con el código en query
  if (!session?.user) {
    redirect(`/${locale}/auth/register?invite=${code}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <InviteAcceptPage code={code} userId={session.user.id} />
    </div>
  )
}
