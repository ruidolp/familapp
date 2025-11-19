/**
 * User Preferences Storage with IndexedDB
 *
 * Manages user UI preferences in IndexedDB
 * Database: 'familapp_db'
 * Store: 'user_preferences'
 */

const DB_NAME = 'familapp_db'
const DB_VERSION = 2 // Increment version to add new store
const PREFERENCES_STORE = 'user_preferences'
const SHOPPING_LIST_CHANGES_STORE = 'shopping_list_changes'

export interface ListEditorPreferences {
  groupByCategory: boolean
  showInlineQty: boolean
  flatListMode: boolean
}

export interface ExecutionConfigPreferences {
  enablePrices: boolean
  showCategories: boolean
  showTimer: boolean
}

export interface UserPreferences {
  listEditor?: ListEditorPreferences
  executionConfig?: ExecutionConfigPreferences
}

/**
 * Open or create IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      // Create shopping_list_changes store if it doesn't exist (v1)
      if (!db.objectStoreNames.contains(SHOPPING_LIST_CHANGES_STORE)) {
        db.createObjectStore(SHOPPING_LIST_CHANGES_STORE, { keyPath: 'listId' })
      }

      // Create user_preferences store (v2)
      if (!db.objectStoreNames.contains(PREFERENCES_STORE)) {
        db.createObjectStore(PREFERENCES_STORE, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Save preferences to IndexedDB
 */
export async function savePreferences(
  key: 'listEditor' | 'executionConfig',
  preferences: ListEditorPreferences | ExecutionConfigPreferences
): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction([PREFERENCES_STORE], 'readwrite')
    const store = tx.objectStore(PREFERENCES_STORE)

    const data = {
      key,
      value: preferences,
      updatedAt: Date.now(),
    }

    await new Promise((resolve, reject) => {
      const req = store.put(data)
      req.onsuccess = () => resolve(undefined)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to save preferences to IndexedDB:', error)
    // Fallback to localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`preferences:${key}`, JSON.stringify(preferences))
      } catch (e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }
  }
}

/**
 * Retrieve preferences from IndexedDB
 */
export async function getPreferences<T>(
  key: 'listEditor' | 'executionConfig',
  defaults: T
): Promise<T> {
  try {
    const db = await getDB()
    const tx = db.transaction([PREFERENCES_STORE], 'readonly')
    const store = tx.objectStore(PREFERENCES_STORE)

    const result = await new Promise<any>((resolve, reject) => {
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    if (result && result.value) {
      return { ...defaults, ...result.value }
    }

    // Try localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(`preferences:${key}`)
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) }
      }
    }

    return defaults
  } catch (error) {
    console.warn('Failed to retrieve preferences from IndexedDB:', error)

    // Try localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem(`preferences:${key}`)
        if (saved) {
          return { ...defaults, ...JSON.parse(saved) }
        }
      } catch (e) {
        console.warn('Failed to read from localStorage:', e)
      }
    }

    return defaults
  }
}

/**
 * Clear all preferences
 */
export async function clearPreferences(): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction([PREFERENCES_STORE], 'readwrite')
    const store = tx.objectStore(PREFERENCES_STORE)

    await new Promise((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve(undefined)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn('Failed to clear preferences from IndexedDB:', error)
  }
}
