/**
 * Utilidad para gestionar marcas globales y personales en IndexedDB
 * Combina marcas del usuario con marcas globales para autocompletado
 */

const DB_NAME = 'FamilappMarcasDB'
const DB_VERSION = 1
const STORE_NAME = 'marcas'

interface MarcaGlobal {
  id: string
  nombre: string
  pais: string
  categoria_tipo?: string
  emoji?: string
  imagen_url?: string
}

interface MarcaPersonal {
  id: string
  nombre: string
  emoji?: string
  categoria_id: string
}

interface MarcasCache {
  globales: MarcaGlobal[]
  personales: MarcaPersonal[]
  version: string
  pais: string
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
 * Guardar marcas en IndexedDB
 */
export async function saveMarcasToCache(data: MarcasCache): Promise<void> {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  store.put(data, 'marcas_cache')

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Obtener marcas desde IndexedDB
 */
export async function getMarcasFromCache(): Promise<MarcasCache | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('marcas_cache')

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error reading marcas from cache:', error)
    return null
  }
}

/**
 * Obtener marcas globales (fetch si no están en cache o version cambió)
 */
export async function getMarcasGlobales(
  pais: string,
  currentVersion: string
): Promise<MarcaGlobal[]> {
  const cached = await getMarcasFromCache()

  // Si tiene cache válido, retornar
  if (cached && cached.pais === pais && cached.version === currentVersion) {
    return cached.globales
  }

  // Fetch desde API
  const response = await fetch(`/api/subcategorias/global?pais=${pais}`)
  if (!response.ok) {
    throw new Error('Error al cargar marcas globales')
  }

  const data = await response.json()
  return data.marcas || []
}

/**
 * Actualizar cache completo de marcas (globales + personales)
 */
export async function updateMarcasCache(
  globales: MarcaGlobal[],
  personales: MarcaPersonal[],
  version: string,
  pais: string
): Promise<void> {
  await saveMarcasToCache({
    globales,
    personales,
    version,
    pais,
    timestamp: Date.now(),
  })
}

/**
 * Obtener marcas combinadas para autocompletado (personales + globales)
 */
export async function getMarcasCombinadas(
  pais: string,
  currentVersion: string,
  marcasPersonales: MarcaPersonal[]
): Promise<{ personales: MarcaPersonal[]; globales: MarcaGlobal[] }> {
  const cached = await getMarcasFromCache()

  // Si cache es válido, retornar desde cache
  if (cached && cached.pais === pais && cached.version === currentVersion) {
    return {
      personales: cached.personales,
      globales: cached.globales,
    }
  }

  // Cache inválido o no existe, fetch marcas globales
  const globales = await getMarcasGlobales(pais, currentVersion)

  // Actualizar cache
  await updateMarcasCache(globales, marcasPersonales, currentVersion, pais)

  return {
    personales: marcasPersonales,
    globales,
  }
}

/**
 * Buscar marcas por texto (solo globales, excluyendo las que el usuario ya tiene)
 */
export function filterMarcas(
  query: string,
  personales: MarcaPersonal[],
  globales: MarcaGlobal[],
  categoriaId?: string
): Array<{ id: string; nombre: string; emoji?: string; isGlobal: boolean }> {
  const lowerQuery = query.toLowerCase()

  // Crear set de nombres de marcas personales para excluir duplicados
  const nombresPersonales = new Set(
    personales.map(m => m.nombre.toLowerCase())
  )

  // Filtrar globales que NO estén ya en marcas personales del usuario
  const globalFiltered = globales.filter(m => {
    const matchesQuery = m.nombre.toLowerCase().includes(lowerQuery)
    const noEsDuplicado = !nombresPersonales.has(m.nombre.toLowerCase())
    return matchesQuery && noEsDuplicado
  })

  const globalResults = globalFiltered.map(m => ({
    id: m.id,
    nombre: m.nombre,
    emoji: m.emoji,
    isGlobal: true,
  }))

  return globalResults
}

/**
 * Limpiar cache de marcas
 */
export async function clearMarcasCache(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete('marcas_cache')

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error clearing marcas cache:', error)
  }
}
