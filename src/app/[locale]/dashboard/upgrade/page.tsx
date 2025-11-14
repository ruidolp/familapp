/**
 * Upgrade Page - Plan selection and payment
 */

import { auth } from '@/infrastructure/lib/auth'
import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { UpgradeForm } from '@/presentation/components/dashboard/upgrade-form'

export default async function UpgradePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session) {
    redirect(`/${locale}/auth/login`)
  }

  const t = await getTranslations('dashboard.upgrade')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <UpgradeForm
        currentPlanSlug={session.user.subscription.planSlug}
        locale={locale}
      />
    </div>
  )
}
