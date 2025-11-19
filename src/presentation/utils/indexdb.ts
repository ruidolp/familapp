/**
 * IndexedDB Utility for Shopping Lists
 *
 * Manages offline caching of pending changes for shopping lists
 * Database: 'familapp_db'
 * Store: 'shopping_list_changes'
 */

const DB_NAME = 'familapp_db'
const DB_VERSION = 2 // Increment version to add user_preferences store
const STORE_NAME = 'shopping_list_changes'
const PREFERENCES_STORE = 'user_preferences'

export interface PendingChanges {
  listId: string
  creates: any[]
  updates: any[]
  deletes: string[]
  reorder: string[]
  timestamp: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  lastError?: string
}

/**
 * Open or create IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      // Create shopping_list_changes store if it doesn't exist (v1)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'listId' })
      }

      // Create user_preferences store (v2)
      if (!db.objectStoreNames.contains(PREFERENCES_STORE)) {
        db.createObjectStore(PREFERENCES_STORE, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Save pending changes to IndexedDB
 */
export async function savePendingChanges(
  listId: string,
  changes: Omit<PendingChanges, 'listId' | 'timestamp'>
): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const data: PendingChanges = {
      listId,
      ...changes,
      timestamp: Date.now(),
    }

    await new Promise((resolve, reject) => {
      const req = store.put(data)
      req.onsuccess = () => resolve(undefined)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to save pending changes to IndexedDB:', error)
    // Don't throw - this is a cache, not critical
  }
}

/**
 * Retrieve pending changes from IndexedDB
 */
export async function getPendingChanges(listId: string): Promise<PendingChanges | null> {
  try {
    const db = await getDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const req = store.get(listId)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to retrieve pending changes from IndexedDB:', error)
    return null
  }
}

/**
 * Clear pending changes for a list (after successful sync)
 */
export async function clearPendingChanges(listId: string): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction([STORE_NAME], 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    await new Promise((resolve, reject) => {
      const req = store.delete(listId)
      req.onsuccess = () => resolve(undefined)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to clear pending changes from IndexedDB:', error)
  }
}

/**
 * Update sync status of pending changes
 */
export async function updateSyncStatus(
  listId: string,
  status: PendingChanges['syncStatus'],
  lastError?: string
): Promise<void> {
  try {
    const changes = await getPendingChanges(listId)
    if (changes) {
      changes.syncStatus = status
      if (lastError) {
        changes.lastError = lastError
      }
      await savePendingChanges(listId, {
        creates: changes.creates,
        updates: changes.updates,
        deletes: changes.deletes,
        reorder: changes.reorder,
        syncStatus: status,
        lastError,
      })
    }
  } catch (error) {
    console.warn('Failed to update sync status:', error)
  }
}

/**
 * Get all pending changes across all lists
 */
export async function getAllPendingChanges(): Promise<PendingChanges[]> {
  try {
    const db = await getDB()
    const tx = db.transaction([STORE_NAME], 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to retrieve all pending changes:', error)
    return []
  }
}
