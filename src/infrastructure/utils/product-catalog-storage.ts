/**
 * Utilidad para gestionar productos del catálogo global y personales en IndexedDB
 * Combina productos del usuario con catálogo global para autocompletado
 * Incluye favoritos y productos frecuentes para búsqueda rápida
 */

const DB_NAME = 'FamilappProductsDB'
const DB_VERSION = 1
const STORE_NAME = 'products'

export interface ProductoCatalogo {
  id: string
  nombre: string
  idioma: string
  category_id?: string
  descripcion?: string
}

export interface ProductoUser {
  id: string
  nombre: string
  user_id: string
  descripcion?: string
}

export interface ProductoFavorito {
  id: string
  nombre: string
  isCatalog: boolean
}

export interface ProductoFrecuente {
  id: string
  nombre: string
  frecuencia: number
}

interface ProductsCache {
  globales: ProductoCatalogo[]
  personales: ProductoUser[]
  favoritos: ProductoFavorito[]
  frecuentes: ProductoFrecuente[]
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
 * Guardar productos en IndexedDB
 */
export async function saveProductsToCache(data: ProductsCache): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  store.put(data, 'products_cache')

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Obtener productos desde IndexedDB
 */
export async function getProductsFromCache(): Promise<ProductsCache | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('products_cache')

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error reading products from cache:', error)
    return null
  }
}

/**
 * Obtener productos del catálogo global (fetch si no están en cache o version cambió)
 */
export async function getProductCatalog(
  idioma: string,
  currentVersion: string
): Promise<ProductoCatalogo[]> {
  const cached = await getProductsFromCache()

  // Si tiene cache válido, retornar
  if (cached && cached.idioma === idioma && cached.version === currentVersion) {
    return cached.globales
  }

  // Fetch desde API
  const response = await fetch(`/api/products/catalog?idioma=${idioma}`)
  if (!response.ok) {
    throw new Error('Error al cargar catálogo de productos')
  }

  const data = await response.json()
  return data.products || []
}

/**
 * Obtener productos favoritos del usuario
 */
export async function getProductsFavoritos(): Promise<ProductoFavorito[]> {
  try {
    const response = await fetch('/api/products/favorites')
    if (!response.ok) return []

    const data = await response.json()
    return data.favorites || []
  } catch (error) {
    console.error('Error al cargar favoritos:', error)
    return []
  }
}

/**
 * Obtener productos frecuentes del usuario
 */
export async function getProductsFrecuentes(): Promise<ProductoFrecuente[]> {
  try {
    const response = await fetch('/api/products/search?type=frequent&limit=20')
    if (!response.ok) return []

    const data = await response.json()
    return data.results?.frequent || []
  } catch (error) {
    console.error('Error al cargar productos frecuentes:', error)
    return []
  }
}

/**
 * Actualizar cache completo de productos (globales + personales + favoritos + frecuentes)
 */
export async function updateProductsCache(
  globales: ProductoCatalogo[],
  personales: ProductoUser[],
  favoritos: ProductoFavorito[],
  frecuentes: ProductoFrecuente[],
  version: string,
  idioma: string
): Promise<void> {
  await saveProductsToCache({
    globales,
    personales,
    favoritos,
    frecuentes,
    version,
    idioma,
    timestamp: Date.now(),
  })
}

/**
 * Obtener productos combinados para autocompletado (personales + globales + favoritos + frecuentes)
 */
export async function getProductsCombinados(
  idioma: string,
  currentVersion: string,
  productosPersonales: ProductoUser[]
): Promise<{
  personales: ProductoUser[]
  globales: ProductoCatalogo[]
  favoritos: ProductoFavorito[]
  frecuentes: ProductoFrecuente[]
}> {
  const cached = await getProductsFromCache()

  // Si cache es válido, retornar desde cache
  if (cached && cached.idioma === idioma && cached.version === currentVersion) {
    return {
      personales: cached.personales,
      globales: cached.globales,
      favoritos: cached.favoritos,
      frecuentes: cached.frecuentes,
    }
  }

  // Cache inválido o no existe, fetch datos
  const [globales, favoritos, frecuentes] = await Promise.all([
    getProductCatalog(idioma, currentVersion),
    getProductsFavoritos(),
    getProductsFrecuentes(),
  ])

  // Actualizar cache
  await updateProductsCache(
    globales,
    productosPersonales,
    favoritos,
    frecuentes,
    currentVersion,
    idioma
  )

  return {
    personales: productosPersonales,
    globales,
    favoritos,
    frecuentes,
  }
}

/**
 * Buscar productos por texto (globales + personales + favoritos + frecuentes)
 * Excluye productos globales que el usuario ya tiene como personales
 */
export function filterProducts(
  query: string,
  personales: ProductoUser[],
  globales: ProductoCatalogo[],
  favoritos: ProductoFavorito[],
  frecuentes: ProductoFrecuente[]
): Array<{
  id: string
  nombre: string
  isGlobal: boolean
  isFavorito: boolean
  isFrecuente: boolean
}> {
  const lowerQuery = query.toLowerCase()

  // Crear set de nombres de productos personales para excluir duplicados
  const nombresPersonales = new Set(
    personales.map(p => p.nombre.toLowerCase())
  )

  // Filtrar productos frecuentes que coincidan con query
  const frecuentesResults = frecuentes
    .filter(p => p.nombre.toLowerCase().includes(lowerQuery))
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      isGlobal: false,
      isFavorito: false,
      isFrecuente: true,
    }))

  // Filtrar favoritos que coincidan con query
  const favoritosResults = favoritos
    .filter(p => p.nombre.toLowerCase().includes(lowerQuery))
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      isGlobal: p.isCatalog,
      isFavorito: true,
      isFrecuente: false,
    }))

  // Filtrar personales que coincidan con query
  const personalesResults = personales
    .filter(p => p.nombre.toLowerCase().includes(lowerQuery))
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      isGlobal: false,
      isFavorito: false,
      isFrecuente: false,
    }))

  // Filtrar globales que NO estén ya en productos personales del usuario
  const globalFiltered = globales.filter(p => {
    const matchesQuery = p.nombre.toLowerCase().includes(lowerQuery)
    const noEsDuplicado = !nombresPersonales.has(p.nombre.toLowerCase())
    return matchesQuery && noEsDuplicado
  })

  const globalResults = globalFiltered.map(p => ({
    id: p.id,
    nombre: p.nombre,
    isGlobal: true,
    isFavorito: false,
    isFrecuente: false,
  }))

  // Retornar en orden: frecuentes, favoritos, personales, globales
  return [
    ...frecuentesResults,
    ...favoritosResults,
    ...personalesResults,
    ...globalResults,
  ]
}

/**
 * Limpiar cache de productos
 */
export async function clearProductsCache(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete('products_cache')

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error clearing products cache:', error)
  }
}
