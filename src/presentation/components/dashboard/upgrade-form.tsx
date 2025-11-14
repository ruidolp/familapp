/**
 * Upgrade Form - Plan selection with period (monthly/yearly)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient, getErrorMessage } from '@/infrastructure/lib/api-client'

interface UpgradeFormProps {
  currentPlanSlug: string
  locale: string
}

export function UpgradeForm({ currentPlanSlug, locale }: UpgradeFormProps) {
  const t = useTranslations('dashboard.upgrade')
  const router = useRouter()
  const { toast } = useToast()

  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'familiar'>('premium')
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)

  // Plan configuration
  const plans = {
    premium: {
      name: 'Premium',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      maxLinkedUsers: 1,
      features: [
        'view_dashboard',
        'create_basic_items',
        'export_data',
        'advanced_reports',
        'invite_users',
        'shared_resources',
        'priority_support',
        'api_access',
      ],
    },
    familiar: {
      name: 'Familiar',
      monthlyPrice: 14.99,
      yearlyPrice: 149.99,
      maxLinkedUsers: 3,
      features: [
        'view_dashboard',
        'create_basic_items',
        'export_data',
        'advanced_reports',
        'invite_users',
        'shared_resources',
        'priority_support',
        'api_access',
        'admin_controls',
        'bulk_operations',
      ],
    },
  }

  const selectedPlanData = plans[selectedPlan]
  const price = selectedPeriod === 'monthly'
    ? selectedPlanData.monthlyPrice
    : selectedPlanData.yearlyPrice

  const yearlyDiscount = selectedPeriod === 'yearly'
    ? Math.round((1 - (selectedPlanData.yearlyPrice / (selectedPlanData.monthlyPrice * 12))) * 100)
    : 0

  const handleUpgrade = async () => {
    setIsLoading(true)

    try {
      const data = await apiClient.post('/api/subscriptions/upgrade', {
        planSlug: selectedPlan,
        period: selectedPeriod,
        platform: 'web',
        locale,
      })

      // Redirect to checkout URL (sandbox or production)
      if (data.checkoutUrl) {
        // Redirect to checkout page (sandbox shows mock payment page, production goes to Stripe/etc)
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
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
      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('selectPlan')}</CardTitle>
          <CardDescription>{t('selectPlanDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value as 'premium' | 'familiar')}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Premium Plan */}
            <Label
              htmlFor="premium"
              className={`flex flex-col items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedPlan === 'premium'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="premium" id="premium" />
                  <span className="font-semibold">Premium</span>
                </div>
                {currentPlanSlug === 'free' && (
                  <Badge variant="default">Popular</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('plans.premium.description')}
              </div>
              <div className="text-lg font-bold">
                ${selectedPeriod === 'monthly' ? plans.premium.monthlyPrice : plans.premium.yearlyPrice}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPeriod === 'monthly' ? t('period.month') : t('period.year')}
                </span>
              </div>
            </Label>

            {/* Familiar Plan */}
            <Label
              htmlFor="familiar"
              className={`flex flex-col items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedPlan === 'familiar'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="familiar" id="familiar" />
                  <span className="font-semibold">Familiar</span>
                </div>
                <Badge variant="default" className="bg-purple-500">Best Value</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('plans.familiar.description')}
              </div>
              <div className="text-lg font-bold">
                ${selectedPeriod === 'monthly' ? plans.familiar.monthlyPrice : plans.familiar.yearlyPrice}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPeriod === 'monthly' ? t('period.month') : t('period.year')}
                </span>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('selectPeriod')}</CardTitle>
          <CardDescription>{t('selectPeriodDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value as 'monthly' | 'yearly')}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Monthly */}
            <Label
              htmlFor="monthly"
              className={`flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedPeriod === 'monthly'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <div>
                  <div className="font-semibold">{t('period.monthly')}</div>
                  <div className="text-sm text-muted-foreground">
                    ${selectedPlanData.monthlyPrice}/{t('period.month')}
                  </div>
                </div>
              </div>
            </Label>

            {/* Yearly */}
            <Label
              htmlFor="yearly"
              className={`flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedPeriod === 'yearly'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {t('period.yearly')}
                    <Badge variant="secondary" className="text-xs">
                      {t('period.save')} {yearlyDiscount}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${selectedPlanData.yearlyPrice}/{t('period.year')}
                  </div>
                </div>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('features.title')}</CardTitle>
          <CardDescription>{t('features.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {selectedPlanData.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm">
                  {t(`features.${feature}`)}
                </span>
              </div>
            ))}
            {selectedPlan === 'familiar' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-purple-50 rounded">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-semibold">
                  {t('features.shareWith', { count: plans.familiar.maxLinkedUsers })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? t('processing.button') : t('confirmUpgrade', { price: price.toFixed(2) })}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/dashboard`)}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
