/**
 * Métricas Page
 */

import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { MetricasScreen } from '@/presentation/components/screens/MetricasScreen'

export default async function MetricasPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  return <MetricasScreen userId={session.user.id} />
}
