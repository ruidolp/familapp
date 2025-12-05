'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCountryOptions } from '@/infrastructure/utils/countries'
import { getMonedaByCountry } from '@/infrastructure/utils/moneda'
import { getUserCountry } from '@/infrastructure/utils/country'
import { Sparkles, Globe2, Home, Users2, ShoppingCart, ShieldCheck, ArrowLeft } from 'lucide-react'

interface OnboardingDrawerProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
}

interface Moneda {
  id: string
  codigo: string
  nombre: string
  simbolo: string
}

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}`,
}))

export function OnboardingDrawer({ open, onOpenChange }: OnboardingDrawerProps) {
  const t = useTranslations('onboarding')

  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMonedas, setLoadingMonedas] = useState(true)
  const [loadingCountry, setLoadingCountry] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  const [paisSeleccionado, setPaisSeleccionado] = useState('')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('')
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState('1')

  useEffect(() => {
    async function loadCountry() {
      try {
        const country = await getUserCountry()
        setPaisSeleccionado(country)
        const moneda = getMonedaByCountry(country)
        setMonedaSeleccionada(moneda.monedaId)
      } catch (error) {
        console.error('Error detecting country:', error)
        setPaisSeleccionado('CL')
        const moneda = getMonedaByCountry('CL')
        setMonedaSeleccionada(moneda.monedaId)
      } finally {
        setLoadingCountry(false)
      }
    }
    loadCountry()
  }, [])

  useEffect(() => {
    async function loadMonedas() {
      try {
        const response = await fetch('/api/monedas')
        const data = await response.json()
        if (data.success) setMonedas(data.monedas)
      } catch (error) {
        console.error('Error loading currencies:', error)
      } finally {
        setLoadingMonedas(false)
      }
    }
    loadMonedas()
  }, [])

  useEffect(() => {
    if (!paisSeleccionado || loadingMonedas) return
    const moneda = getMonedaByCountry(paisSeleccionado)
    const existe = monedas.some((m) => m.id === moneda.monedaId)
    const seleccionValida = monedas.some((m) => m.id === monedaSeleccionada)
    if (!seleccionValida && existe) {
      setMonedaSeleccionada(moneda.monedaId)
    }
  }, [paisSeleccionado, monedas, loadingMonedas, monedaSeleccionada])

  const handleCountryChange = (country: string) => {
    setPaisSeleccionado(country)
    const moneda = getMonedaByCountry(country)
    setMonedaSeleccionada(moneda.monedaId)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const configResponse = await fetch('/api/user/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monedaPrincipalId: monedaSeleccionada,
          locale: navigator.language || 'es-CL',
          pais: paisSeleccionado,
          diaInicioPeriodo: parseInt(diaInicioPeriodo),
        }),
      })

      const configData = await configResponse.json()
      if (!configData.success) throw new Error(configData.error || 'Error al guardar configuración')

      const initResponse = await fetch('/api/sobres/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const initData = await initResponse.json()
      if (!initData.success) throw new Error(initData.error || 'Error al inicializar perfil')

      onOpenChange?.(false)
      localStorage.setItem('dashboard-active-tab', 'sobres')
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error('Onboarding error:', error)
      alert(error instanceof Error ? error.message : 'Error al completar onboarding')
    } finally {
      setLoading(false)
    }
  }

  const steps = useMemo(
    () => [
      {
        key: 'welcome',
        icon: Sparkles,
        title: t('steps.1.title'),
        description: t('steps.1.description'),
        body: t('steps.1.body'),
      },
      {
        key: 'details',
        icon: Globe2,
        title: t('steps.2.title'),
        description: t('steps.2.description'),
      },
      {
        key: 'envelopes',
        icon: Home,
        title: t('steps.3.title'),
        description: t('steps.3.description'),
        body: t('steps.3.body'),
      },
      {
        key: 'team',
        icon: Users2,
        title: t('steps.4.title'),
        description: t('steps.4.description'),
        body: t('steps.4.body'),
      },
      {
        key: 'shopping',
        icon: ShoppingCart,
        title: t('steps.5.title'),
        description: t('steps.5.description'),
        body: t('steps.5.body'),
      },
    ],
    [t]
  )

  const isLastStep = currentStep === steps.length - 1
  const canContinueDetails =
    !!paisSeleccionado && !!monedaSeleccionada && !!diaInicioPeriodo && !loadingCountry && !loadingMonedas

  const handleNext = async () => {
    if (currentStep === 1 && !canContinueDetails) return
    if (isLastStep) {
      await handleSubmit()
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    if (currentStep === 0) return
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const countryOptions = getCountryOptions()

  const renderStepContent = () => {
    const step = steps[currentStep]

    if (step.key === 'details') {
      return (
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="country" className="typography-body font-medium text-foreground">
              {t('fields.country')} <span className="text-red-500">*</span>
            </Label>
            <Select value={paisSeleccionado} onValueChange={handleCountryChange} disabled={loadingCountry}>
              <SelectTrigger id="country" className="h-12">
                <SelectValue placeholder={t('fields.countryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="typography-body font-medium text-foreground">
              {t('fields.currency')} <span className="text-red-500">*</span>
            </Label>
            <Select value={monedaSeleccionada} onValueChange={setMonedaSeleccionada} disabled={loadingMonedas}>
              <SelectTrigger id="currency" className="h-12">
                <SelectValue placeholder={t('fields.currencyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {monedas.map((moneda) => (
                  <SelectItem key={moneda.id} value={moneda.id}>
                    {moneda.nombre} ({moneda.simbolo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="typography-body text-muted-foreground">{t('fields.currencyDescription')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="day-of-month" className="typography-body font-medium text-foreground">
              {t('fields.dayOfMonth')} <span className="text-red-500">*</span>
            </Label>
            <Select value={diaInicioPeriodo} onValueChange={setDiaInicioPeriodo}>
              <SelectTrigger id="day-of-month" className="h-12">
                <SelectValue placeholder={t('fields.dayPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_MONTH.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="typography-body text-muted-foreground">{t('fields.dayOfMonthDescription')}</p>
          </div>
        </form>
      )
    }

    if (step.key === 'envelopes') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Home className="h-4 w-4" />
              {t('sobres.HOGAR')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('steps.3.body')}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.supermercado')}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.cuentas_hogar')}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.transporte')}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {t('sobres.PERSONAL')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('steps.3.body')}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.comida_rapida')}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.medicina')}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('categorias.transporte')}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (step.key === 'team') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Users2 className="h-4 w-4" />
              {t('steps.4.title')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('steps.4.body')}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('steps.4.description')}</p>
                  <p className="text-xs text-muted-foreground">{t('buttons.disclaimer')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('steps.5.description')}</p>
                  <p className="text-xs text-muted-foreground">{t('steps.5.body')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (step.key === 'shopping') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <ShoppingCart className="h-4 w-4" />
              {t('steps.5.title')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('steps.5.body')}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('fields.currencyDescription')}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t('fields.dayOfMonthDescription')}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            {t('steps.1.title')}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t('steps.1.description')}</p>
          <p className="mt-3 text-sm text-foreground">{t('steps.1.body')}</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/80 p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t('steps.2.title')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('steps.2.description')}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t('steps.3.title')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('steps.3.description')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
      <DrawerContent className="border-none bg-transparent p-0 shadow-none">
        <div className="mx-auto my-6 w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-background/95 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background/80 to-background" />
            <div className="relative flex flex-col gap-6 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DrawerTitle className="text-2xl text-foreground">{t('title')}</DrawerTitle>
                  <DrawerDescription className="text-base text-muted-foreground">
                    {steps[currentStep].description}
                  </DrawerDescription>
                </div>
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('buttons.back')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = index <= currentStep
                  return (
                    <div key={step.key} className="flex-1">
                      <div
                        className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span>{index + 1}/5</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-border">
                        <div
                          className={`h-1 rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-border'}`}
                          style={{ width: isActive ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <DrawerBody className="p-0">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">{steps[currentStep].title}</h3>
                  {steps[currentStep].body ? (
                    <p className="text-base text-muted-foreground">{steps[currentStep].body}</p>
                  ) : null}
                </div>

                <div className="mt-4 min-h-[340px]">
                  {renderStepContent()}
                </div>
              </DrawerBody>

              <DrawerFooter className="flex flex-col gap-3 p-0">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="w-1/3"
                    onClick={handleBack}
                    disabled={currentStep === 0 || loading}
                  >
                    {t('buttons.back')}
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="w-2/3"
                    disabled={
                      loading || (currentStep === 1 && !canContinueDetails) || loadingCountry || loadingMonedas
                    }
                  >
                    {loading && isLastStep
                      ? t('buttons.submitting')
                      : isLastStep
                        ? t('buttons.finish')
                        : t('buttons.next')}
                  </Button>
                </div>
                <p className="typography-body-sm text-center text-muted-foreground mt-1">
                  {t('buttons.disclaimer')}
                </p>
              </DrawerFooter>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
