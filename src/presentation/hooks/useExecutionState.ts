/**
 * useExecutionState Hook
 *
 * Main hook for managing shopping execution state
 * Features:
 * - Auto-save to IndexedDB every 500ms (debounced)
 * - Optimistic updates
 * - Offline-first
 * - Automatic price calculations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type {
  LocalShoppingExecution,
  LocalExecutionItem,
  ItemStatus,
  UpdateItemInput,
  AddItemOnTheFlyInput,
  ExecutionSettings,
  BudgetConfig,
  RegistrationConfig,
} from '@/domain/types/shopping-execution'
import { ExecutionStorage } from '@/infrastructure/utils/execution-storage'
import { syncExecutionToServer } from '@/infrastructure/utils/sync-execution'

export interface UseExecutionStateReturn {
  execution: LocalShoppingExecution | null
  loading: boolean
  autoSaving: boolean
  error: string | null

  // Item management
  markItemAs: (itemLocalId: string, status: ItemStatus) => Promise<void>
  updateItemPrice: (
    itemLocalId: string,
    price: { unitario?: number; total?: number; cantidad?: number }
  ) => Promise<void>
  addItemOnTheFly: (item: AddItemOnTheFlyInput) => Promise<string>

  // Settings
  updateSettings: (settings: Partial<ExecutionSettings>) => Promise<void>
  updateBudget: (budget: Partial<BudgetConfig>) => Promise<void>
  updateRegistration: (registration: Partial<RegistrationConfig>) => Promise<void>

  // Finalize
  finalizeExecution: () => Promise<string>

  // Computed values
  pendingItems: LocalExecutionItem[]
  purchasedItems: LocalExecutionItem[]
  discardedItems: LocalExecutionItem[]
  budgetRemaining: number
  budgetPercentage: number
}

export function useExecutionState(executionId: string): UseExecutionStateReturn {
  const router = useRouter()
  const [execution, setExecution] = useState<LocalShoppingExecution | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoSaving, setAutoSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save whenever execution changes
  useEffect(() => {
    if (!execution || loading) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setAutoSaving(true)
      try {
        await ExecutionStorage.update(execution.localId, execution)
      } catch (err) {
        console.error('Auto-save failed:', err)
      } finally {
        setAutoSaving(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [execution, loading])

  // Load execution on mount
  useEffect(() => {
    const loadExecution = async () => {
      try {
        setLoading(true)
        const data = await ExecutionStorage.getById(executionId)
        if (!data) {
          setError('Ejecución no encontrada')
          return
        }
        setExecution(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load execution:', err)
        setError('Error al cargar ejecución')
      } finally {
        setLoading(false)
      }
    }

    loadExecution()
  }, [executionId])

  // Mark item with new status
  const markItemAs = useCallback(async (itemLocalId: string, status: ItemStatus) => {
    if (!execution) return

    const updatedItems = execution.items.map(item => {
      if (item.localId !== itemLocalId) return item
      return {
        ...item,
        status,
        updated_at: new Date(),
        // Clear prices if discarding
        ...(status === 'discarded' && {
          precio_unitario: undefined,
          precio_total: undefined,
          razon_no_comprado: 'DESCARTADO' as const,
        }),
      }
    })

    // Recalculate total spent
    const totalSpent = updatedItems
      .filter(i => i.status === 'purchased' && i.precio_total)
      .reduce((sum, i) => sum + (i.precio_total || 0), 0)

    setExecution(prev =>
      prev
        ? {
            ...prev,
            items: updatedItems,
            totalSpent,
            updated_at: new Date(),
          }
        : null
    )
  }, [execution])

  // Update item price
  const updateItemPrice = useCallback(
    async (
      itemLocalId: string,
      price: { unitario?: number; total?: number; cantidad?: number }
    ) => {
      if (!execution) return

      const updatedItems = execution.items.map(item => {
        if (item.localId !== itemLocalId) return item

        let precioUnitario = price.unitario
        let precioTotal = price.total
        const cantidad = price.cantidad ?? item.cantidad_comprada ?? item.cantidad_planeada

        // If total is provided, calculate unitario
        if (precioTotal !== undefined && cantidad > 0) {
          precioUnitario = precioTotal / cantidad
        }
        // If unitario is provided, calculate total
        else if (precioUnitario !== undefined) {
          precioTotal = precioUnitario * cantidad
        }

        return {
          ...item,
          cantidad_comprada: cantidad,
          precio_unitario: precioUnitario,
          precio_total: precioTotal,
          status: 'purchased' as ItemStatus,
          updated_at: new Date(),
        }
      })

      // Recalculate total spent
      const totalSpent = updatedItems
        .filter(i => i.status === 'purchased' && i.precio_total)
        .reduce((sum, i) => sum + (i.precio_total || 0), 0)

      setExecution(prev =>
        prev
          ? {
              ...prev,
              items: updatedItems,
              totalSpent,
              updated_at: new Date(),
            }
          : null
      )
    },
    [execution]
  )

  // Add item on the fly
  const addItemOnTheFly = useCallback(
    async (item: AddItemOnTheFlyInput): Promise<string> => {
      if (!execution) throw new Error('No execution found')

      const itemLocalId = `item_fly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const maxOrder = Math.max(...execution.items.map(i => i.item_order), 0)

      const newItem: LocalExecutionItem = {
        localId: itemLocalId,
        product_id: item.product_id,
        product_custom_id: item.product_custom_id,
        is_catalog: item.is_catalog,
        product_name: item.product_name,
        categoria_producto_id: item.categoria_producto_id,
        categoria_producto_nombre: item.categoria_producto_nombre,
        status: 'pending',
        cantidad_planeada: item.cantidad_planeada,
        unidad_medida: item.unidad_medida,
        marca: item.marca,
        addedOnTheFly: true,
        item_order: maxOrder + 1,
        updated_at: new Date(),
      }

      setExecution(prev =>
        prev
          ? {
              ...prev,
              items: [...prev.items, newItem],
              updated_at: new Date(),
            }
          : null
      )

      return itemLocalId
    },
    [execution]
  )

  // Update settings
  const updateSettings = useCallback(
    async (settings: Partial<ExecutionSettings>) => {
      if (!execution) return

      setExecution(prev =>
        prev
          ? {
              ...prev,
              settings: { ...prev.settings, ...settings },
              updated_at: new Date(),
            }
          : null
      )
    },
    [execution]
  )

  // Update budget
  const updateBudget = useCallback(
    async (budget: Partial<BudgetConfig>) => {
      if (!execution) return

      setExecution(prev =>
        prev
          ? {
              ...prev,
              budget: { ...prev.budget, ...budget },
              updated_at: new Date(),
            }
          : null
      )
    },
    [execution]
  )

  // Update registration config
  const updateRegistration = useCallback(
    async (registration: Partial<RegistrationConfig>) => {
      if (!execution) return

      setExecution(prev =>
        prev
          ? {
              ...prev,
              registration: { ...prev.registration, ...registration },
              updated_at: new Date(),
            }
          : null
      )
    },
    [execution]
  )

  // Finalize execution and sync to server
  const finalizeExecution = useCallback(async (): Promise<string> => {
    if (!execution) throw new Error('No execution found')

    try {
      // 1. Mark as completed locally
      const finalized: LocalShoppingExecution = {
        ...execution,
        status: 'COMPLETED',
        completed_at: new Date(),
        syncStatus: 'local',
      }

      await ExecutionStorage.update(execution.localId, finalized)

      // 2. Sync to server
      const serverExecutionId = await syncExecutionToServer(finalized)

      // 3. Redirect to success page or back to list
      router.push(`/${execution.shopping_list_id}`)

      return serverExecutionId
    } catch (err) {
      console.error('Failed to finalize execution:', err)
      setError('Failed to finalize execution. Data saved locally and will sync later.')
      throw err
    }
  }, [execution, router])

  // Computed values
  const pendingItems = execution?.items.filter(i => i.status === 'pending') || []
  const purchasedItems = execution?.items.filter(i => i.status === 'purchased') || []
  const discardedItems = execution?.items.filter(i => i.status === 'discarded') || []

  const budgetRemaining =
    execution?.budget.enabled && execution?.budget.amount
      ? execution.budget.amount - execution.totalSpent
      : 0

  const budgetPercentage =
    execution?.budget.enabled && execution?.budget.amount && execution.budget.amount > 0
      ? (execution.totalSpent / execution.budget.amount) * 100
      : 0

  return {
    execution,
    loading,
    autoSaving,
    error,
    markItemAs,
    updateItemPrice,
    addItemOnTheFly,
    updateSettings,
    updateBudget,
    updateRegistration,
    finalizeExecution,
    pendingItems,
    purchasedItems,
    discardedItems,
    budgetRemaining,
    budgetPercentage,
  }
}
