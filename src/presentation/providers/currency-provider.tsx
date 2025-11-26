/**
 * Currency Provider
 *
 * Proporciona funciones de formateo de moneda basadas en la configuración del usuario.
 * Ahora usa UserConfigProvider para obtener datos sin hacer llamadas adicionales.
 *
 * Flujo optimizado:
 * 1. Obtiene datos de moneda del UserConfigProvider (ya cargados)
 * 2. Crea función de formateo con esos datos
 * 3. Los componentes usan useCurrency().formatNumber() para formatear números
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useUserConfig } from './user-config-provider'

export interface CurrencyContextType {
  monedaId: string | null
  nombre: string | null
  simbolo: string | null
  decimales: number
  locale: string
  isLoading: boolean
  formatNumber: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { config, moneda, isLoading: configLoading } = useUserConfig()
  const [currency, setCurrency] = useState<CurrencyContextType>({
    monedaId: null,
    nombre: null,
    simbolo: null,
    decimales: 2,
    locale: 'es-CL',
    isLoading: true,
    formatNumber: (value: number) => value.toFixed(2),
  })

  useEffect(() => {
    // Defaults si no hay configuración
    const createDefaultCurrency = () => {
      const defaultDecimals = 0
      const formatNumber = (value: number): string => {
        if (typeof value !== 'number') return '0'
        const formatter = new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: defaultDecimals,
          maximumFractionDigits: defaultDecimals,
        })
        return formatter.format(value)
      }

      return {
        monedaId: 'CLP',
        nombre: 'Peso Chileno',
        simbolo: '$',
        decimales: defaultDecimals,
        locale: 'es-CL',
        isLoading: false,
        formatNumber,
      }
    }

    // Si aún está cargando, esperar
    if (configLoading) {
      setCurrency(prev => ({ ...prev, isLoading: true }))
      return
    }

    // Si no hay configuración o moneda, usar defaults
    if (!config || !moneda) {
      setCurrency(createDefaultCurrency())
      return
    }

    // Determinar locale según moneda
    const localeMap: Record<string, string> = {
      CLP: 'es-CL',
      USD: 'en-US',
      EUR: 'es-ES',
      ARS: 'es-AR',
      COP: 'es-CO',
      MXN: 'es-MX',
      BRL: 'pt-BR',
      PEN: 'es-PE',
      BOB: 'es-BO',
      PYG: 'es-PY',
      UYU: 'es-UY',
      VES: 'es-VE',
      GBP: 'en-GB',
      CAD: 'en-CA',
    }

    const monedaId = config.moneda_principal_id
    const selectedLocale = localeMap[monedaId] || 'es-CL'
    const decimales = moneda.decimales ?? 2

    // Crear función de formateo con los datos de la moneda
    const formatNumber = (value: number): string => {
      if (typeof value !== 'number') return '0'

      const formatter = new Intl.NumberFormat(selectedLocale, {
        style: 'currency',
        currency: monedaId,
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      })

      return formatter.format(value)
    }

    setCurrency({
      monedaId,
      nombre: moneda.nombre,
      simbolo: moneda.simbolo,
      decimales,
      locale: selectedLocale,
      isLoading: false,
      formatNumber,
    })
  }, [config, moneda, configLoading])

  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
