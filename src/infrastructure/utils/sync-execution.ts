/**
 * Server Synchronization for Shopping Executions
 *
 * This module handles syncing local executions to the server
 * when the user finalizes a purchase.
 *
 * Features:
 * - Retry logic with exponential backoff
 * - Transaction creation if registered in budget
 * - Batch item creation for performance
 * - Error handling and recovery
 */

import type {
  LocalShoppingExecution,
  SyncExecutionPayload,
  SyncExecutionItemPayload,
} from '@/domain/types/shopping-execution'
import { ExecutionStorage } from './execution-storage'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const RETRY_MULTIPLIER = 2

// ============================================================================
// RETRY HELPER
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // Server error (5xx) - retry
      lastError = new Error(`Server error: ${response.status}`)
    } catch (error) {
      lastError = error as Error
    }

    // If not the last attempt, wait before retrying
    if (attempt < retries) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_MULTIPLIER, attempt)
      console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Failed after max retries')
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync local execution to server
 */
export async function syncExecutionToServer(
  execution: LocalShoppingExecution
): Promise<string> {
  try {
    // Mark as syncing
    await ExecutionStorage.update(execution.localId, { syncStatus: 'syncing' })

    // 1. Create shopping_execution on server
    const executionPayload: SyncExecutionPayload = {
      shopping_list_id: execution.shopping_list_id,
      status: execution.status,
      store_name: execution.registration.store_name,
      sobre_id: execution.registration.sobre_id,
      categoria_sobre_id: execution.registration.categoria_sobre_id,
      subcategoria_id: execution.registration.subcategoria_id,
      total_calculated: execution.totalSpent,
      total_manual: execution.budget.amount,
      tiempo_transcurrido: Math.floor(execution.timer.accumulatedSeconds / 60), // Convert to minutes
      started_at: execution.started_at,
      completed_at: execution.completed_at,
    }

    const createExecutionResponse = await fetchWithRetry(
      '/api/shopping-executions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionPayload),
      }
    )

    if (!createExecutionResponse.ok) {
      const error = await createExecutionResponse.json()
      throw new Error(error.error || 'Failed to create execution on server')
    }

    const { execution: serverExecution } = await createExecutionResponse.json()
    const serverExecutionId = serverExecution.id

    // 2. Create all items in batch
    const itemsPayload: SyncExecutionItemPayload[] = execution.items.map(item => ({
      shopping_list_item_id: item.shopping_list_item_id,
      product_id: item.product_id,
      product_custom_id: item.product_custom_id,
      is_catalog: item.is_catalog,
      cantidad_comprada: item.cantidad_comprada || item.cantidad_planeada,
      unidad_medida: item.unidad_medida,
      marca: item.marca,
      precio_unitario: item.precio_unitario,
      precio_total: item.precio_total,
      es_comprado: item.status === 'purchased',
      razon_no_comprado: item.status === 'discarded' ? item.razon_no_comprado : undefined,
      es_agregado_vuelo: item.addedOnTheFly,
    }))

    const createItemsResponse = await fetchWithRetry(
      `/api/shopping-executions/${serverExecutionId}/items/batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      }
    )

    if (!createItemsResponse.ok) {
      const error = await createItemsResponse.json()
      throw new Error(error.error || 'Failed to create execution items')
    }

    // 3. If registered in budget, create transaction
    if (
      execution.registration.registerInBudget &&
      execution.registration.sobre_id &&
      execution.totalSpent > 0
    ) {
      await createTransactionForExecution(execution, serverExecutionId)
    }

    // 4. Mark as synced
    await ExecutionStorage.markAsSynced(execution.localId, serverExecutionId)

    return serverExecutionId
  } catch (error) {
    console.error('Failed to sync execution to server:', error)

    // Mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await ExecutionStorage.markSyncFailed(execution.localId, errorMessage)

    throw error
  }
}

/**
 * Create transaction (gasto) for the execution
 */
async function createTransactionForExecution(
  execution: LocalShoppingExecution,
  serverExecutionId: string
): Promise<void> {
  try {
    // Get user's primary billetera and moneda
    // For now, we'll require these to be provided or use defaults
    // In a real implementation, you'd fetch the user's default billetera

    const transactionPayload = {
      monto: execution.totalSpent,
      tipo: 'GASTO' as const,
      sobre_id: execution.registration.sobre_id!,
      categoria_id: execution.registration.categoria_sobre_id,
      subcategoria_id: execution.registration.subcategoria_id,
      descripcion: `Compra en ${execution.registration.store_name || 'supermercado'}`,
      fecha: execution.completed_at || new Date(),
      // Note: billetera_id and moneda_id would need to be fetched or stored
      // This is a simplified version
      metadata: {
        shopping_execution_id: serverExecutionId,
        source: 'shopping_execution',
      },
    }

    const response = await fetchWithRetry('/api/transacciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionPayload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to create transaction:', error)
      // Don't throw - transaction creation failure shouldn't fail the entire sync
      // The execution is still valid, just without the transaction link
    }
  } catch (error) {
    console.error('Error creating transaction for execution:', error)
    // Don't throw - let the sync continue
  }
}

/**
 * Sync all pending executions
 * Useful for background sync or manual retry
 */
export async function syncAllPending(): Promise<{
  success: number
  failed: number
  errors: Array<{ localId: string; error: string }>
}> {
  const pending = await ExecutionStorage.getPendingSync()

  let success = 0
  let failed = 0
  const errors: Array<{ localId: string; error: string }> = []

  for (const execution of pending) {
    try {
      await syncExecutionToServer(execution)
      success++
    } catch (error) {
      failed++
      errors.push({
        localId: execution.localId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return { success, failed, errors }
}

/**
 * Check if execution needs sync
 */
export function needsSync(execution: LocalShoppingExecution): boolean {
  return (
    execution.status === 'COMPLETED' &&
    (execution.syncStatus === 'local' || execution.syncStatus === 'failed')
  )
}

/**
 * Retry failed sync
 */
export async function retryFailedSync(localId: string): Promise<void> {
  const execution = await ExecutionStorage.getById(localId)
  if (!execution) {
    throw new Error('Execution not found')
  }

  if (execution.syncStatus !== 'failed') {
    throw new Error('Execution is not in failed state')
  }

  await syncExecutionToServer(execution)
}
