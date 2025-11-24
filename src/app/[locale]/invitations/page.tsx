/**
 * Invitations Page
 *
 * Vista de invitaciones a sobres compartidos
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { InvitationsManager } from '@/presentation/components/sobres/invitations-manager'

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <InvitationsManager />
    </div>
  )
}
