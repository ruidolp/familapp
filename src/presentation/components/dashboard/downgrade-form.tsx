/**
 * Downgrade Form - Confirmation before downgrading to FREE
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { apiClient, getErrorMessage } from '@/infrastructure/lib/api-client'

interface DowngradeFormProps {
  currentPlanSlug: string
  currentPlanName: string
  locale: string
}

export function DowngradeForm({ currentPlanSlug, currentPlanName, locale }: DowngradeFormProps) {
  const t = useTranslations('dashboard.downgrade')
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)

  const handleDowngrade = async () => {
    setIsLoading(true)

    try {
      await apiClient.post('/api/subscriptions/downgrade')

      toast({
        title: t('success.title'),
        description: t('success.description'),
      })

      // Redirect to dashboard
      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch (error) {
      console.error('Downgrade error:', error)
      toast({
        variant: 'destructive',
        title: t('error.title'),
        description: getErrorMessage(error),
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('warning.title')}</AlertTitle>
        <AlertDescription>{t('warning.description')}</AlertDescription>
      </Alert>

      {/* What You'll Lose */}
      <Card>
        <CardHeader>
          <CardTitle>{t('willLose.title')}</CardTitle>
          <CardDescription>{t('willLose.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">{t('willLose.features')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('willLose.featuresDescription')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">{t('willLose.linkedUsers')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('willLose.linkedUsersDescription')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">{t('willLose.limits')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('willLose.limitsDescription')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium">{t('willLose.support')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('willLose.supportDescription')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('confirm.title')}</CardTitle>
          <CardDescription>
            {t('confirm.description', { planName: currentPlanName })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            <div className="text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">{t('confirm.currentPlan')}</span>
                <span className="font-semibold">{currentPlanName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('confirm.newPlan')}</span>
                <span className="font-semibold">Free</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleDowngrade}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {isLoading ? t('processing') : t('confirmButton')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/dashboard`)}
            disabled={isLoading}
            className="w-full"
          >
            {t('cancel')}
          </Button>
        </CardFooter>
      </Card>

      {/* Need Help? */}
      <Card>
        <CardHeader>
          <CardTitle>{t('help.title')}</CardTitle>
          <CardDescription>{t('help.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('help.contact')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
