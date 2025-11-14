'use client'

import { useState, useCallback } from 'react'

interface CrearGastoInput {
  monto: number
  monedaId: string
  billeteraId: string
  tipo: string
  descripcion?: string
  fecha: string
  sobreId?: string
  categoriaId?: string
  subcategoriaId?: string
}

interface CrearGastoResponse {
  success: boolean
  transaccion: any
  warning?: {
    type: 'OVERSPEND_SOBRE' | 'NEGATIVE_WALLET'
    message: string
    details: any
  }
}

/**
 * Hook para crear una transacción/gasto
 */
export function useCrearGasto() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const crearGasto = useCallback(
    async (input: CrearGastoInput): Promise<CrearGastoResponse> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/transacciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al crear gasto')
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
    crearGasto,
    loading,
    error,
  }
}
