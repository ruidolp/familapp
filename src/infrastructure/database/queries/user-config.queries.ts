/**
 * User Config Queries
 *
 * Queries para configuración de usuario (moneda principal, timezone, período, etc.)
 */

import { db } from '../kysely'

import type { UserConfig } from '../types'
import type { TipoPeriodo } from '../custom-enums'

/**
 * Tipo para actualización de configuración
 */
export type UpdateUserConfigData = {
  moneda_principal_id?: string
  monedas_habilitadas?: string[]
  timezone?: string
  locale?: string
  pais?: string
  primer_dia_semana?: number
  tipo_periodo?: TipoPeriodo
  dia_inicio_periodo?: number
}

/**
 * Obtener configuración de usuario
 */
export async function findUserConfig(userId: string) {
  return await db
    .selectFrom('user_config')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst()
}

/**
 * Tipo para crear configuración de usuario
 */
export type CreateUserConfigData = {
  user_id: string
  moneda_principal_id: string
  timezone?: string
  locale?: string
  pais?: string
  primer_dia_semana?: number
  tipo_periodo?: TipoPeriodo
  dia_inicio_periodo?: number
}

/**
 * Crear configuración para usuario
 * IMPORTANTE: No usa valores hardcodeados. Los valores deben ser proporcionados.
 */
export async function createDefaultUserConfig(
  userId: string,
  monedaPrincipalId: string,
  options: {
    timezone?: string
    locale?: string
    pais?: string
    primerDiaSemana?: number
    tipoPeriodo?: TipoPeriodo
    diaInicioPeriodo?: number
  } = {}
) {
  return await db
    .insertInto('user_config')
    .values({
      user_id: userId,
      moneda_principal_id: monedaPrincipalId,
      monedas_habilitadas: [monedaPrincipalId],
      // Usar valores proporcionados o dejar que la DB use sus defaults
      timezone: options.timezone,
      locale: options.locale,
      pais: options.pais,
      primer_dia_semana: options.primerDiaSemana,
      tipo_periodo: options.tipoPeriodo || 'MENSUAL',
      dia_inicio_periodo: options.diaInicioPeriodo,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Actualizar configuración de usuario
 */
export async function updateUserConfig(userId: string, configData: UpdateUserConfigData) {
  return await db
    .updateTable('user_config')
    .set({
      ...configData,
      updated_at: new Date(),
    })
    .where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}

/**
 * Agregar moneda habilitada
 */
export async function addMonedaHabilitada(userId: string, monedaId: string) {
  const config = await findUserConfig(userId)
  if (!config) return null

  const monedasActuales = config.monedas_habilitadas || []
  if (monedasActuales.includes(monedaId)) {
    return config // Ya está habilitada
  }

  return await updateUserConfig(userId, {
    monedas_habilitadas: [...monedasActuales, monedaId],
  })
}

/**
 * Remover moneda habilitada
 */
export async function removeMonedaHabilitada(userId: string, monedaId: string) {
  const config = await findUserConfig(userId)
  if (!config) return null

  // No permitir remover la moneda principal
  if (config.moneda_principal_id === monedaId) {
    throw new Error('No se puede desactivar la moneda principal')
  }

  const monedasActuales = config.monedas_habilitadas || []
  return await updateUserConfig(userId, {
    monedas_habilitadas: monedasActuales.filter((id: string) => id !== monedaId),
  })
}

/**
 * Obtener versión de marcas globales (MAX updated_at) por país
 * Si no hay marcas para el país, intenta con 'CL' como fallback
 */
export async function getMarcasGlobalesVersion(pais: string): Promise<string | null> {
  // Intentar con el país del usuario
  let result = await db
    .selectFrom('subcategorias_globales')
    .select(({ fn }) => [
      fn.max('updated_at').as('max_updated_at')
    ])
    .where('pais', '=', pais)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Si no hay marcas para ese país, intentar con Chile como fallback
  if (!result?.max_updated_at && pais !== 'CL') {
    result = await db
      .selectFrom('subcategorias_globales')
      .select(({ fn }) => [
        fn.max('updated_at').as('max_updated_at')
      ])
      .where('pais', '=', 'CL')
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  // Si aún no hay resultado, usar versión por defecto
  if (!result?.max_updated_at) {
    return 'v1.0.0'
  }

  return result.max_updated_at.toISOString()
}

/**
 * Obtener versión de productos del catálogo (MAX updated_at) por idioma
 * Si no hay productos para el idioma, intenta con 'es' como fallback
 */
export async function getProductCatalogVersion(idioma: string): Promise<string | null> {
  // Intentar con el idioma del usuario
  let result = await db
    .selectFrom('product_catalog')
    .select(({ fn }) => [
      fn.max('updated_at').as('max_updated_at')
    ])
    .where('idioma', '=', idioma)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Si no hay productos para ese idioma, intentar con español como fallback
  if (!result?.max_updated_at && idioma !== 'es') {
    result = await db
      .selectFrom('product_catalog')
      .select(({ fn }) => [
        fn.max('updated_at').as('max_updated_at')
      ])
      .where('idioma', '=', 'es')
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  // Si aún no hay resultado, usar versión por defecto
  if (!result?.max_updated_at) {
    return 'v1.0.0'
  }

  return result.max_updated_at.toISOString()
}

/**
 * Obtener versión de categorías globales de productos (MAX updated_at) por idioma
 */
export async function getProductCategoriesGlobalVersion(idioma: string): Promise<string | null> {
  // Intentar con el idioma del usuario
  let result = await db
    .selectFrom('product_categories_global')
    .select(({ fn }) => [
      fn.max('updated_at').as('max_updated_at')
    ])
    .where('idioma', '=', idioma)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Fallback a español
  if (!result?.max_updated_at && idioma !== 'es') {
    result = await db
      .selectFrom('product_categories_global')
      .select(({ fn }) => [
        fn.max('updated_at').as('max_updated_at')
      ])
      .where('idioma', '=', 'es')
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  if (!result?.max_updated_at) {
    return 'v1.0.0'
  }

  return result.max_updated_at.toISOString()
}
