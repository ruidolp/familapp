/**
 * Dashboard Page
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage({
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
    <DashboardClient
      locale={locale}
      user={session.user}
    />
  )
}
