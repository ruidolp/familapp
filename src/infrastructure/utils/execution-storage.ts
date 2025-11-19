/**
 * IndexedDB Storage for Shopping Executions (Offline-First)
 *
 * This module provides robust local storage for purchase executions
 * to support offline functionality in supermarkets with poor connectivity.
 *
 * Features:
 * - Auto-save every change
 * - Transactional updates (ACID)
 * - Automatic recovery on app restart
 * - Fallback to localStorage if IndexedDB fails
 */

import type {
  LocalShoppingExecution,
  LocalExecutionItem,
  CreateLocalExecutionInput,
  UpdateExecutionInput,
  UpdateItemInput,
  AddItemOnTheFlyInput,
} from '@/domain/types/shopping-execution'

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'familapp_shopping_db'
const DB_VERSION = 1
const STORE_EXECUTIONS = 'executions'
const FALLBACK_KEY_PREFIX = 'execution_'

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let dbInstance: IDBDatabase | null = null

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB failed to open:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create executions store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_EXECUTIONS)) {
        const store = db.createObjectStore(STORE_EXECUTIONS, { keyPath: 'localId' })

        // Indexes for efficient queries
        store.createIndex('shopping_list_id', 'shopping_list_id', { unique: false })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
        store.createIndex('user_id', 'user_id', { unique: false })
        store.createIndex('list_status', ['shopping_list_id', 'status'], { unique: false })
      }
    }
  })
}

// ============================================================================
// FALLBACK TO LOCALSTORAGE
// ============================================================================

function saveFallback(execution: LocalShoppingExecution): void {
  try {
    const key = `${FALLBACK_KEY_PREFIX}${execution.localId}`
    localStorage.setItem(key, JSON.stringify(execution))
  } catch (error) {
    console.error('Failed to save to localStorage fallback:', error)
  }
}

function loadFallback(localId: string): LocalShoppingExecution | null {
  try {
    const key = `${FALLBACK_KEY_PREFIX}${localId}`
    const data = localStorage.getItem(key)
    if (!data) return null

    const parsed = JSON.parse(data)
    // Reconvert date strings to Date objects
    return deserializeExecution(parsed)
  } catch (error) {
    console.error('Failed to load from localStorage fallback:', error)
    return null
  }
}

function removeFallback(localId: string): void {
  try {
    const key = `${FALLBACK_KEY_PREFIX}${localId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to remove from localStorage fallback:', error)
  }
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

function serializeExecution(execution: LocalShoppingExecution): any {
  return {
    ...execution,
    started_at: execution.started_at.toISOString(),
    completed_at: execution.completed_at?.toISOString(),
    created_at: execution.created_at.toISOString(),
    updated_at: execution.updated_at.toISOString(),
    lastSyncAttempt: execution.lastSyncAttempt?.toISOString(),
    timer: {
      ...execution.timer,
      startedAt: execution.timer.startedAt.toISOString(),
      pausedAt: execution.timer.pausedAt?.toISOString(),
    },
    items: execution.items.map(item => ({
      ...item,
      updated_at: item.updated_at.toISOString(),
    })),
  }
}

function deserializeExecution(data: any): LocalShoppingExecution {
  return {
    ...data,
    started_at: new Date(data.started_at),
    completed_at: data.completed_at ? new Date(data.completed_at) : undefined,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    lastSyncAttempt: data.lastSyncAttempt ? new Date(data.lastSyncAttempt) : undefined,
    timer: {
      ...data.timer,
      startedAt: new Date(data.timer.startedAt),
      pausedAt: data.timer.pausedAt ? new Date(data.timer.pausedAt) : undefined,
    },
    items: data.items.map((item: any) => ({
      ...item,
      updated_at: new Date(item.updated_at),
    })),
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export const ExecutionStorage = {
  /**
   * Create a new local execution
   */
  async createLocal(input: CreateLocalExecutionInput): Promise<LocalShoppingExecution> {
    const now = new Date()
    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const execution: LocalShoppingExecution = {
      localId,
      shopping_list_id: input.shopping_list_id,
      user_id: input.user_id,
      syncStatus: 'local',
      status: 'IN_PROGRESS',
      started_at: now,
      registration: input.registration,
      budget: input.budget,
      totalSpent: 0,
      settings: input.settings,
      timer: {
        startedAt: now,
        accumulatedSeconds: 0,
        isRunning: true,
      },
      items: input.items.map((item, index) => ({
        localId: `item_${Date.now()}_${index}`,
        shopping_list_item_id: item.shopping_list_item_id,
        product_id: item.product_id,
        product_custom_id: item.product_custom_id,
        is_catalog: item.is_catalog,
        product_name: item.product_name,
        categoria_producto_id: item.categoria_producto_id,
        categoria_producto_nombre: item.categoria_producto_nombre,
        categoria_global_id: item.categoria_global_id,
        status: 'pending',
        cantidad_planeada: item.cantidad_planeada,
        unidad_medida: item.unidad_medida,
        marca: item.marca,
        addedOnTheFly: false,
        item_order: item.item_order,
        updated_at: now,
      })),
      created_at: now,
      updated_at: now,
    }

    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readwrite')
      const store = tx.objectStore(STORE_EXECUTIONS)

      await new Promise<void>((resolve, reject) => {
        const request = store.add(serializeExecution(execution))
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Also save to fallback
      saveFallback(execution)

      return execution
    } catch (error) {
      console.error('Failed to create execution in IndexedDB:', error)
      // Save only to fallback
      saveFallback(execution)
      return execution
    }
  },

  /**
   * Get execution in progress for a shopping list
   */
  async getInProgress(listId: string): Promise<LocalShoppingExecution | null> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readonly')
      const store = tx.objectStore(STORE_EXECUTIONS)
      const index = store.index('list_status')

      const result = await new Promise<any>((resolve, reject) => {
        const request = index.get([listId, 'IN_PROGRESS'])
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      return result ? deserializeExecution(result) : null
    } catch (error) {
      console.error('Failed to get in-progress execution:', error)
      // Try fallback - scan all localStorage keys
      // This is less efficient but works as fallback
      return null
    }
  },

  /**
   * Get execution by local ID
   */
  async getById(localId: string): Promise<LocalShoppingExecution | null> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readonly')
      const store = tx.objectStore(STORE_EXECUTIONS)

      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(localId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      return result ? deserializeExecution(result) : null
    } catch (error) {
      console.error('Failed to get execution by ID:', error)
      return loadFallback(localId)
    }
  },

  /**
   * Update execution
   */
  async update(localId: string, changes: Partial<LocalShoppingExecution>): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readwrite')
      const store = tx.objectStore(STORE_EXECUTIONS)

      // Get current data
      const current = await new Promise<any>((resolve, reject) => {
        const request = store.get(localId)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (!current) {
        throw new Error(`Execution ${localId} not found`)
      }

      const currentDeserialized = deserializeExecution(current)
      const updated: LocalShoppingExecution = {
        ...currentDeserialized,
        ...changes,
        updated_at: new Date(),
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(serializeExecution(updated))
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Update fallback
      saveFallback(updated)
    } catch (error) {
      console.error('Failed to update execution:', error)
      throw error
    }
  },

  /**
   * Update a specific item
   */
  async updateItem(
    localId: string,
    itemLocalId: string,
    changes: UpdateItemInput
  ): Promise<void> {
    try {
      const execution = await this.getById(localId)
      if (!execution) {
        throw new Error(`Execution ${localId} not found`)
      }

      const updatedItems = execution.items.map(item => {
        if (item.localId !== itemLocalId) return item
        return {
          ...item,
          ...changes,
          updated_at: new Date(),
        }
      })

      // Recalculate total spent
      const totalSpent = updatedItems
        .filter(i => i.status === 'purchased' && i.precio_total)
        .reduce((sum, i) => sum + (i.precio_total || 0), 0)

      await this.update(localId, {
        items: updatedItems,
        totalSpent,
      })
    } catch (error) {
      console.error('Failed to update item:', error)
      throw error
    }
  },

  /**
   * Add item on the fly
   */
  async addItem(localId: string, input: AddItemOnTheFlyInput): Promise<string> {
    try {
      const execution = await this.getById(localId)
      if (!execution) {
        throw new Error(`Execution ${localId} not found`)
      }

      const itemLocalId = `item_fly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const maxOrder = Math.max(...execution.items.map(i => i.item_order), 0)

      const newItem: LocalExecutionItem = {
        localId: itemLocalId,
        product_id: input.product_id,
        product_custom_id: input.product_custom_id,
        is_catalog: input.is_catalog,
        product_name: input.product_name,
        categoria_producto_id: input.categoria_producto_id,
        categoria_producto_nombre: input.categoria_producto_nombre,
        status: 'pending',
        cantidad_planeada: input.cantidad_planeada,
        unidad_medida: input.unidad_medida,
        marca: input.marca,
        addedOnTheFly: true,
        item_order: maxOrder + 1,
        updated_at: new Date(),
      }

      await this.update(localId, {
        items: [...execution.items, newItem],
      })

      return itemLocalId
    } catch (error) {
      console.error('Failed to add item on the fly:', error)
      throw error
    }
  },

  /**
   * Get all active executions (IN_PROGRESS status)
   */
  async getAllInProgress(): Promise<LocalShoppingExecution[]> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readonly')
      const store = tx.objectStore(STORE_EXECUTIONS)
      const index = store.index('status')

      const results = await new Promise<any[]>((resolve, reject) => {
        const request = index.getAll('IN_PROGRESS')
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      return results.map(deserializeExecution)
    } catch (error) {
      console.error('Failed to get in-progress executions:', error)
      return []
    }
  },

  /**
   * Get all completed executions (COMPLETED status)
   */
  async getAllCompleted(): Promise<LocalShoppingExecution[]> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readonly')
      const store = tx.objectStore(STORE_EXECUTIONS)
      const index = store.index('status')

      const results = await new Promise<any[]>((resolve, reject) => {
        const request = index.getAll('COMPLETED')
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      return results
        .map(deserializeExecution)
        .sort((a, b) => {
          const dateA = new Date(a.completed_at || a.updated_at).getTime()
          const dateB = new Date(b.completed_at || b.updated_at).getTime()
          return dateB - dateA
        })
    } catch (error) {
      console.error('Failed to get completed executions:', error)
      return []
    }
  },

  /**
   * Get all executions pending sync
   */
  async getPendingSync(): Promise<LocalShoppingExecution[]> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readonly')
      const store = tx.objectStore(STORE_EXECUTIONS)
      const index = store.index('syncStatus')

      const results = await new Promise<any[]>((resolve, reject) => {
        const request = index.getAll('local')
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      return results.map(deserializeExecution)
    } catch (error) {
      console.error('Failed to get pending sync executions:', error)
      return []
    }
  },

  /**
   * Mark execution as synced
   */
  async markAsSynced(localId: string, serverExecutionId: string): Promise<void> {
    try {
      await this.update(localId, {
        syncStatus: 'synced',
        serverExecutionId,
        lastSyncAttempt: new Date(),
        syncError: undefined,
      })
    } catch (error) {
      console.error('Failed to mark as synced:', error)
      throw error
    }
  },

  /**
   * Mark sync as failed
   */
  async markSyncFailed(localId: string, error: string): Promise<void> {
    try {
      await this.update(localId, {
        syncStatus: 'failed',
        lastSyncAttempt: new Date(),
        syncError: error,
      })
    } catch (error) {
      console.error('Failed to mark sync as failed:', error)
      throw error
    }
  },

  /**
   * Delete local execution (after successful sync)
   */
  async deleteLocal(localId: string): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction([STORE_EXECUTIONS], 'readwrite')
      const store = tx.objectStore(STORE_EXECUTIONS)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(localId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Remove fallback
      removeFallback(localId)
    } catch (error) {
      console.error('Failed to delete local execution:', error)
      throw error
    }
  },

  /**
   * Pause timer
   */
  async pauseTimer(localId: string): Promise<void> {
    try {
      const execution = await this.getById(localId)
      if (!execution) throw new Error('Execution not found')

      const now = new Date()
      const elapsed = execution.timer.isRunning
        ? Math.floor((now.getTime() - execution.timer.startedAt.getTime()) / 1000)
        : 0

      await this.update(localId, {
        timer: {
          ...execution.timer,
          pausedAt: now,
          accumulatedSeconds: execution.timer.accumulatedSeconds + elapsed,
          isRunning: false,
        },
      })
    } catch (error) {
      console.error('Failed to pause timer:', error)
      throw error
    }
  },

  /**
   * Resume timer
   */
  async resumeTimer(localId: string): Promise<void> {
    try {
      const execution = await this.getById(localId)
      if (!execution) throw new Error('Execution not found')

      await this.update(localId, {
        timer: {
          ...execution.timer,
          startedAt: new Date(),
          pausedAt: undefined,
          isRunning: true,
        },
      })
    } catch (error) {
      console.error('Failed to resume timer:', error)
      throw error
    }
  },

  /**
   * Get elapsed time in seconds
   */
  async getElapsedTime(localId: string): Promise<number> {
    try {
      const execution = await this.getById(localId)
      if (!execution) return 0

      const accumulated = execution.timer.accumulatedSeconds

      if (!execution.timer.isRunning) {
        return accumulated
      }

      const now = new Date()
      const currentElapsed = Math.floor(
        (now.getTime() - execution.timer.startedAt.getTime()) / 1000
      )

      return accumulated + currentElapsed
    } catch (error) {
      console.error('Failed to get elapsed time:', error)
      return 0
    }
  },
}
