import { redirect } from 'next/navigation'
import { getSession } from '@/infrastructure/lib/auth'
import { MonitoringScreen } from '@/presentation/components/screens/MonitoringScreen'

export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  return <MonitoringScreen locale={locale} />
}
