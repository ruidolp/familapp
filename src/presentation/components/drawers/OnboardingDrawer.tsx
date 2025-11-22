'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCountryOptions } from '@/infrastructure/utils/countries'
import { getMonedaByCountry } from '@/infrastructure/utils/moneda'
import { getUserCountry } from '@/infrastructure/utils/country'

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
  const router = useRouter()
  const t = useTranslations('onboarding')

  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMonedas, setLoadingMonedas] = useState(true)
  const [loadingCountry, setLoadingCountry] = useState(true)

  // Formulario
  const [paisSeleccionado, setPaisSeleccionado] = useState('')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('')
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState('1')

  // Cargar país automáticamente
  useEffect(() => {
    async function loadCountry() {
      try {
        const country = await getUserCountry()
        setPaisSeleccionado(country)
        // Preseleccionar moneda según país
        const monedaConfig = getMonedaByCountry(country)
        setMonedaSeleccionada(monedaConfig.monedaId)
      } catch (error) {
        console.error('Error detecting country:', error)
        // Fallback
        setPaisSeleccionado('CL')
      } finally {
        setLoadingCountry(false)
      }
    }
    loadCountry()
  }, [])

  // Cargar monedas
  useEffect(() => {
    async function loadMonedas() {
      try {
        const response = await fetch('/api/monedas')
        const data = await response.json()
        if (data.success) {
          setMonedas(data.monedas)
        }
      } catch (error) {
        console.error('Error loading currencies:', error)
      } finally {
        setLoadingMonedas(false)
      }
    }
    loadMonedas()
  }, [])

  const handleCountryChange = (country: string) => {
    setPaisSeleccionado(country)
    // Cambiar moneda automáticamente según país
    const monedaConfig = getMonedaByCountry(country)
    setMonedaSeleccionada(monedaConfig.monedaId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crear configuración de usuario
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

      if (!configData.success) {
        throw new Error(configData.error || 'Error al guardar configuración')
      }

      // 2. Initialize profile (create wallet, envelopes, categories, and brands)
      const initResponse = await fetch('/api/sobres/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const initData = await initResponse.json()

      if (!initData.success) {
        throw new Error(initData.error || 'Error al inicializar perfil')
      }

      // 3. Cerrar drawer y refrescar
      onOpenChange?.(false)

      // Asegurar que después del onboarding vaya a la pantalla de sobres
      localStorage.setItem('dashboard-active-tab', 'sobres')

      // Hacer un reload completo después de pequeño delay para asegurar que el servidor procesó las creaciones
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Onboarding error:', error)
      alert(error instanceof Error ? error.message : 'Error al completar onboarding')
    } finally {
      setLoading(false)
    }
  }

  const countryOptions = getCountryOptions()

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-2xl">{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="country" className="typography-body font-medium">
                {t('fields.country')} <span className="text-red-500">*</span>
              </Label>
              <Select value={paisSeleccionado} onValueChange={handleCountryChange} disabled={loadingCountry}>
                <SelectTrigger id="country">
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

            {/* Moneda Principal */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="typography-body font-medium">
                {t('fields.currency')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={monedaSeleccionada}
                onValueChange={setMonedaSeleccionada}
                disabled={loadingMonedas}
              >
                <SelectTrigger id="currency">
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

            {/* Día de inicio período */}
            <div className="space-y-2">
              <Label htmlFor="day-of-month" className="typography-body font-medium">
                {t('fields.dayOfMonth')} <span className="text-red-500">*</span>
              </Label>
              <Select value={diaInicioPeriodo} onValueChange={setDiaInicioPeriodo}>
                <SelectTrigger id="day-of-month">
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
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={loading || !paisSeleccionado || !monedaSeleccionada || loadingCountry || loadingMonedas}
          >
            {loading ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
          <p className="typography-body-sm text-center text-muted-foreground mt-2">{t('buttons.disclaimer')}</p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
