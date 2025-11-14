/**
 * Downgrade Page - Confirm downgrade to FREE plan
 */

import { auth } from '@/infrastructure/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DowngradeForm } from '@/presentation/components/dashboard/downgrade-form'

export default async function DowngradePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session) {
    redirect(`/${locale}/auth/login`)
  }

  // Only allow downgrade for Premium/Familiar users
  if (session.user.subscription.planSlug === 'free') {
    redirect(`/${locale}/dashboard`)
  }

  const t = await getTranslations('dashboard.downgrade')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <DowngradeForm
        currentPlanSlug={session.user.subscription.planSlug}
        currentPlanName={session.user.subscription.planName}
        locale={locale}
      />
    </div>
  )
}
