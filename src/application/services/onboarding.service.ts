/**
 * Onboarding Service
 *
 * Handles profile initialization when a user first starts using the app
 * Creates default envelopes, categories, and brands based on user's country
 */

import { buildOnboardingTemplate } from '@/infrastructure/config/onboarding-builder'
import {
  createSobre,
  addParticipanteToSobre,
  findSobresByUser,
} from '@/infrastructure/database/queries/sobres.queries'
import {
  createCategoria,
  linkCategoriasToSobre,
} from '@/infrastructure/database/queries/categorias.queries'
import {
  createSubcategoria,
} from '@/infrastructure/database/queries/subcategorias.queries'
import {
  findBilleterasByUser,
  createBilletera,
} from '@/infrastructure/database/queries/billeteras.queries'
import {
  findUserConfig,
} from '@/infrastructure/database/queries/user-config.queries'

export interface InitializeProfileResult {
  success: boolean
  data?: {
    billetera: any
    sobres: any[]
  }
  error?: string
}

/**
 * Initialize user profile with default data
 *
 * Creates:
 * - Default wallet (if doesn't exist)
 * - PERSONAL envelope (no categories)
 * - HOGAR envelope with categories and brands
 *
 * @param userId - User ID
 * @param locale - User locale for translations (e.g., 'es', 'en')
 * @param t - Translation function from next-intl
 * @returns Result with created entities
 */
export async function initializeUserProfile(
  userId: string,
  locale: string,
  t: (key: string) => string
): Promise<InitializeProfileResult> {
  try {
    // 1. Check if user already has sobres (avoid duplicate initialization)
    const existingSobres = await findSobresByUser(userId)
    if (existingSobres.length > 0) {
      return {
        success: false,
        error: 'User already has envelopes created'
      }
    }

    // 2. Get user config to determine country
    const userConfig = await findUserConfig(userId)
    if (!userConfig) {
      return {
        success: false,
        error: 'User config not found'
      }
    }

    const pais = userConfig.pais || 'CL' // Default to CL if not set
    const monedaPrincipal = userConfig.moneda_principal_id || 'CLP'

    // 3. Create default wallet if user doesn't have one
    // IMPORTANT: Always use 'dummy' as the wallet name (literal, not translated)
    // This is required for transaction creation logic that looks for this specific name
    let billetera
    const existingBilleteras = await findBilleterasByUser(userId)
    if (existingBilleteras.length === 0) {
      billetera = await createBilletera({
        nombre: 'dummy',
        tipo: 'DEBITO',
        moneda_principal_id: monedaPrincipal,
        saldo_real: 0,
        saldo_proyectado: 0,
        is_compartida: false,
        usuario_id: userId
      })
    } else {
      billetera = existingBilleteras[0]
    }

    // 4. Build template for user's country
    const template = buildOnboardingTemplate(pais)

    // 5. Create envelopes in order: PERSONAL first, then HOGAR (HOGAR appears first in carousel)
    const createdSobres: any[] = []

    for (const sobreTemplate of template) {
      // Translate sobre name
      const sobreNombre = t(`onboarding.sobres.${sobreTemplate.key}`)

      // Create sobre
      const sobre = await createSobre({
        nombre: sobreNombre,
        tipo: sobreTemplate.tipo,
        moneda_principal_id: monedaPrincipal,
        presupuesto_asignado: 0,
        gastado: 0,
        color: sobreTemplate.tipo === 'HOGAR' ? '#10b981' : '#3b82f6',
        emoji: sobreTemplate.tipo === 'HOGAR' ? '🏠' : '👤',
        is_compartido: false,
        max_participantes: 10,
        usuario_id: userId
      })

      // Create categories for this sobre
      const categoriaIds: string[] = []
      for (const categoriaTemplate of sobreTemplate.categorias) {
        // Translate category name
        const categoriaNombre = t(`onboarding.categorias.${categoriaTemplate.key}`)

        // Create category
        const categoria = await createCategoria({
          nombre: categoriaNombre,
          usuario_id: userId,
          color: categoriaTemplate.color,
          emoji: categoriaTemplate.emoji
        })

        categoriaIds.push(categoria.id)

        // Create brands (subcategorias) for this category
        for (const marcaNombre of categoriaTemplate.marcas) {
          await createSubcategoria({
            nombre: marcaNombre,
            categoria_id: categoria.id,
            usuario_id: userId
          })
        }
      }

      // Link categories to sobre
      if (categoriaIds.length > 0) {
        await linkCategoriasToSobre(sobre.id, categoriaIds)
      }

      createdSobres.push({
        ...sobre,
        categorias: categoriaIds.length
      })

      await addParticipanteToSobre(
        sobre.id,
        userId,
        'OWNER',
        Number(sobre.presupuesto_asignado) || 0
      )
    }

    return {
      success: true,
      data: {
        billetera,
        sobres: createdSobres
      }
    }
  } catch (error: any) {
    console.error('Error initializing user profile:', error)
    return {
      success: false,
      error: error.message || 'Failed to initialize profile'
    }
  }
}
