/**
 * User Config Provider
 *
 * Centraliza la carga de configuración del usuario para evitar llamadas duplicadas.
 * Todos los componentes deben usar este contexto en vez de hacer fetch directo a /api/user/config
 *
 * Beneficios:
 * - Una sola llamada a /api/user/config al iniciar sesión
 * - Datos compartidos entre todos los componentes
 * - Incluye datos de moneda (elimina llamada adicional a /api/monedas/[id])
 * - Método refreshConfig() para actualizar después de cambios
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export interface UserConfig {
  id: string
  user_id: string
  moneda_principal_id: string
  monedas_habilitadas: string[]
  timezone: string
  locale: string
  pais: string
  primer_dia_semana: number
  tipo_periodo: string
  dia_inicio_periodo: number
  created_at: string
  updated_at: string
}

export interface Moneda {
  id: string
  nombre: string
  codigo: string
  simbolo: string
  decimales: number
  activa: boolean
}

export interface UserConfigContextType {
  config: UserConfig | null
  moneda: Moneda | null
  marcasGlobalesVersion: number | null
  productCatalogVersion: number | null
  productCategoriesVersion: number | null
  isLoading: boolean
  requiresOnboarding: boolean
  refreshConfig: () => Promise<void>
}

const UserConfigContext = createContext<UserConfigContextType | undefined>(undefined)

export function UserConfigProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [state, setState] = useState<UserConfigContextType>({
    config: null,
    moneda: null,
    marcasGlobalesVersion: null,
    productCatalogVersion: null,
    productCategoriesVersion: null,
    isLoading: true,
    requiresOnboarding: false,
    refreshConfig: async () => {},
  })

  const loadConfig = useCallback(async () => {
    if (!session?.user) {
      setState(prev => ({ ...prev, isLoading: false, requiresOnboarding: false }))
      return
    }

    try {
      const response = await fetch('/api/user/config')

      // Si no hay configuración (404), necesita onboarding
      if (response.status === 404) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          requiresOnboarding: true,
          config: null,
          moneda: null,
        }))
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load user config')
      }

      const data = await response.json()

      setState(prev => ({
        ...prev,
        config: data.config || null,
        moneda: data.moneda || null,
        marcasGlobalesVersion: data.marcasGlobalesVersion || null,
        productCatalogVersion: data.productCatalogVersion || null,
        productCategoriesVersion: data.productCategoriesVersion || null,
        isLoading: false,
        requiresOnboarding: !data.success || !data.config,
      }))
    } catch (error) {
      console.error('Error loading user config:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        requiresOnboarding: false,
      }))
    }
  }, [session])

  // Cargar config cuando cambia la sesión
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Actualizar refreshConfig en el estado
  useEffect(() => {
    setState(prev => ({
      ...prev,
      refreshConfig: loadConfig,
    }))
  }, [loadConfig])

  return (
    <UserConfigContext.Provider value={state}>
      {children}
    </UserConfigContext.Provider>
  )
}

export function useUserConfig() {
  const context = useContext(UserConfigContext)
  if (!context) {
    throw new Error('useUserConfig must be used within UserConfigProvider')
  }
  return context
}
