/**
 * Utilidad para gestionar categorías de productos globales y personales en IndexedDB
 * Combina categorías del usuario con categorías globales para autocompletado
 */

const DB_NAME = 'FamilappProductCategoriesDB'
const DB_VERSION = 1
const STORE_NAME = 'categories'

export interface CategoriaGlobal {
  id: string
  nombre: string
  idioma: string
  color?: string
  emoji?: string
}

export interface CategoriaUser {
  id: string
  nombre: string
  user_id: string
  color?: string
  emoji?: string
}

interface CategoriesCache {
  globales: CategoriaGlobal[]
  personales: CategoriaUser[]
  version: string
  idioma: string
  timestamp: number
}

/**
 * Inicializar IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Guardar categorías en IndexedDB
 */
export async function saveCategoriesToCache(data: CategoriesCache): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  store.put(data, 'categories_cache')

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Obtener categorías desde IndexedDB
 */
export async function getCategoriesFromCache(): Promise<CategoriesCache | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('categories_cache')

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error reading categories from cache:', error)
    return null
  }
}

/**
 * Obtener categorías globales (fetch si no están en cache o version cambió)
 */
export async function getCategoriesGlobal(
  idioma: string,
  currentVersion: string
): Promise<CategoriaGlobal[]> {
  const cached = await getCategoriesFromCache()

  // Si tiene cache válido, retornar
  if (cached && cached.idioma === idioma && cached.version === currentVersion) {
    return cached.globales
  }

  // Fetch desde API
  const response = await fetch(`/api/products/categories/global?idioma=${idioma}`)
  if (!response.ok) {
    throw new Error('Error al cargar categorías globales')
  }

  const data = await response.json()
  return data.categories || []
}

/**
 * Actualizar cache completo de categorías (globales + personales)
 */
export async function updateCategoriesCache(
  globales: CategoriaGlobal[],
  personales: CategoriaUser[],
  version: string,
  idioma: string
): Promise<void> {
  await saveCategoriesToCache({
    globales,
    personales,
    version,
    idioma,
    timestamp: Date.now(),
  })
}

/**
 * Obtener categorías combinadas para autocompletado (personales + globales)
 */
export async function getCategoriesCombinadas(
  idioma: string,
  currentVersion: string,
  categoriasPersonales: CategoriaUser[]
): Promise<{
  personales: CategoriaUser[]
  globales: CategoriaGlobal[]
}> {
  const cached = await getCategoriesFromCache()

  // Si cache es válido, retornar desde cache
  if (cached && cached.idioma === idioma && cached.version === currentVersion) {
    return {
      personales: cached.personales,
      globales: cached.globales,
    }
  }

  // Cache inválido o no existe, fetch categorías globales
  const globales = await getCategoriesGlobal(idioma, currentVersion)

  // Actualizar cache
  await updateCategoriesCache(globales, categoriasPersonales, currentVersion, idioma)

  return {
    personales: categoriasPersonales,
    globales,
  }
}

/**
 * Buscar categorías por texto (solo globales, excluyendo las que el usuario ya tiene)
 */
export function filterCategories(
  query: string,
  personales: CategoriaUser[],
  globales: CategoriaGlobal[]
): Array<{
  id: string
  nombre: string
  emoji?: string
  color?: string
  isGlobal: boolean
}> {
  const lowerQuery = query.toLowerCase()

  // Crear set de nombres de categorías personales para excluir duplicados
  const nombresPersonales = new Set(
    personales.map(c => c.nombre.toLowerCase())
  )

  // Filtrar globales que NO estén ya en categorías personales del usuario
  const globalFiltered = globales.filter(c => {
    const matchesQuery = c.nombre.toLowerCase().includes(lowerQuery)
    const noEsDuplicado = !nombresPersonales.has(c.nombre.toLowerCase())
    return matchesQuery && noEsDuplicado
  })

  const globalResults = globalFiltered.map(c => ({
    id: c.id,
    nombre: c.nombre,
    emoji: c.emoji,
    color: c.color,
    isGlobal: true,
  }))

  return globalResults
}

/**
 * Limpiar cache de categorías
 */
export async function clearCategoriesCache(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete('categories_cache')

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error clearing categories cache:', error)
  }
}
