'use client'

import { useState, useCallback, useEffect } from 'react'

/**
 * Hook para obtener detalles de un sobre
 */
export function useSobre(sobreId: string) {
  const [sobre, setSobre] = useState<any>(null)
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [miAsignacion, setMiAsignacion] = useState<any[]>([])
  const [resumen, setResumen] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSobre = useCallback(async () => {
    if (!sobreId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sobres/${sobreId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener sobre')
      }

      const data = await response.json()

      setSobre(data.sobre)
      setAsignaciones(data.asignaciones || [])
      setMiAsignacion(data.miAsignacion || [])
      setResumen(data.resumen || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [sobreId])

  return {
    sobre,
    asignaciones,
    miAsignacion,
    resumen,
    loading,
    error,
    refetch: fetchSobre,
  }
}

/**
 * Hook para agregar presupuesto a un sobre desde una billetera
 */
export function useAgregarPresupuesto(sobreId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregarPresupuesto = useCallback(
    async (billeteraId: string, monto: number, descripcion?: string) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/sobres/${sobreId}/asignaciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billeteraId,
            monto,
            descripcion,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al agregar presupuesto')
        }

        const data = await response.json()
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [sobreId]
  )

  return {
    agregarPresupuesto,
    loading,
    error,
  }
}

/**
 * Hook para devolver presupuesto de un sobre
 */
export function useDevolverPresupuesto(sobreId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const devolverPresupuesto = useCallback(
    async (billeteraDestinoId?: string) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/sobres/${sobreId}/devolver`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billeteraDestinoId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al devolver presupuesto')
        }

        const data = await response.json()
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [sobreId]
  )

  return {
    devolverPresupuesto,
    loading,
    error,
  }
}

/**
 * Hook para transferir presupuesto entre sobres
 */
export function useTransferenciaEntreSobres() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transferir = useCallback(
    async (
      sobreOrigenId: string,
      sobreDestinoId: string,
      billeteraId: string,
      monto: number
    ) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/sobres/transferencia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sobreOrigenId,
            sobreDestinoId,
            billeteraId,
            monto,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al transferir presupuesto')
        }

        const data = await response.json()
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMsg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    transferir,
    loading,
    error,
  }
}

/**
 * Hook para obtener asignaciones de un sobre
 */
export function useSobreAsignaciones(sobreId: string) {
  const [asignaciones, setAsignaciones] = useState<any[]>([])
  const [sobre, setSobre] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAsignaciones = useCallback(async () => {
    if (!sobreId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sobres/${sobreId}/asignaciones`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener asignaciones')
      }

      const data = await response.json()

      setAsignaciones(data.asignaciones || [])
      setSobre(data.sobre)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [sobreId])

  return {
    asignaciones,
    sobre,
    loading,
    error,
    refetch: fetchAsignaciones,
  }
}

/**
 * Hook para obtener categorías de un sobre con gastos y porcentajes
 */
export function useSobreCategories(sobreId: string) {
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!sobreId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al obtener categorías')
      }

      const data = await response.json()
      setCategorias(data.categorias || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [sobreId])

  // Ejecutar fetch al montar y cuando cambie sobreId
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categorias,
    loading,
    error,
    refetch: fetchCategories,
  }
}
