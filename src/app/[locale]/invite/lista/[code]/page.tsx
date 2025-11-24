/**
 * Invite Lista Page
 *
 * Página para aceptar invitaciones a listas compartidas mediante link único
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { InviteListaAcceptPage } from '@/presentation/components/listas/invite-lista-accept-page'

export default async function InviteListaPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>
}) {
  const { locale, code } = await params
  const session = await getSession()

  // Si no está logueado, redirigir a registro con el código en query
  if (!session?.user) {
    redirect(`/${locale}/auth/register?inviteLista=${code}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <InviteListaAcceptPage code={code} userId={session.user.id} />
    </div>
  )
}
