/**
 * Currency Provider
 *
 * Carga la configuración de moneda del usuario una sola vez al iniciar sesión
 * y la mantiene en memoria para todo el app.
 *
 * Flujo:
 * 1. Se obtiene la sesión del usuario (SessionProvider)
 * 2. Se carga user_config para obtener moneda_principal_id
 * 3. Se fetch los datos de la moneda (decimales, símbolo, etc.)
 * 4. Se guarda en contexto React
 * 5. Los componentes usan useCurrencyFormat para formatear números
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

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
  const { data: session } = useSession()
  const [currency, setCurrency] = useState<CurrencyContextType>({
    monedaId: null,
    nombre: null,
    simbolo: null,
    decimales: 2, // default
    locale: 'es-CL',
    isLoading: true,
    formatNumber: (value: number) => value.toFixed(2),
  })

  useEffect(() => {
    if (!session?.user) {
      setCurrency(prev => ({ ...prev, isLoading: false }))
      return
    }

    // Cargar configuración de moneda del usuario
    const loadCurrencyConfig = async () => {
      try {
        const response = await fetch('/api/user/config')

        // Si no hay configuración (404), usar defaults sin error
        if (response.status === 404) {
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

          setCurrency({
            monedaId: 'CLP',
            nombre: 'Peso Chileno',
            simbolo: '$',
            decimales: defaultDecimals,
            locale: 'es-CL',
            isLoading: false,
            formatNumber,
          })
          return
        }

        if (!response.ok) throw new Error('Failed to load user config')

        const data = await response.json()
        const monedaPrincipalId = data.config?.moneda_principal_id || 'CLP'

        // Obtener datos de la moneda
        const monedaResponse = await fetch(`/api/monedas/${monedaPrincipalId}`)
        if (!monedaResponse.ok) throw new Error('Failed to load currency')

        const monedaData = await monedaResponse.json()

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

        const selectedLocale = localeMap[monedaPrincipalId] || 'es-CL'
        const decimales = monedaData.decimales ?? 2

        // Crear función de formateo con los datos de la moneda
        const formatNumber = (value: number): string => {
          if (typeof value !== 'number') return '0'

          const formatter = new Intl.NumberFormat(selectedLocale, {
            style: 'currency',
            currency: monedaPrincipalId,
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales,
          })

          return formatter.format(value)
        }

        setCurrency({
          monedaId: monedaPrincipalId,
          nombre: monedaData.nombre,
          simbolo: monedaData.simbolo,
          decimales,
          locale: selectedLocale,
          isLoading: false,
          formatNumber,
        })
      } catch (error) {
        console.error('Error loading currency config:', error)
        // Fallback a CLP
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

        setCurrency({
          monedaId: 'CLP',
          nombre: 'Peso Chileno',
          simbolo: '$',
          decimales: defaultDecimals,
          locale: 'es-CL',
          isLoading: false,
          formatNumber,
        })
      }
    }

    loadCurrencyConfig()
  }, [session])

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
