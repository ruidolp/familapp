/**
 * Onboarding Template Builder
 *
 * Combines base structure with country-specific brands
 */

import { BASE_ONBOARDING_TEMPLATE } from './onboarding-base'
import { BRANDS_BY_COUNTRY, DEFAULT_BRANDS } from './onboarding-brands'

export interface BuiltCategoria {
  key: string
  emoji: string
  color: string
  marcas: string[]
}

export interface BuiltSobre {
  key: string
  tipo: 'HOGAR' | 'PERSONAL'
  categorias: BuiltCategoria[]
}

/**
 * Build onboarding template for specific country
 *
 * @param pais - Country code (e.g., 'CL', 'ES', 'MX')
 * @returns Complete template with country-specific brands
 */
export function buildOnboardingTemplate(pais: string): BuiltSobre[] {
  const countryBrands = BRANDS_BY_COUNTRY[pais] || DEFAULT_BRANDS

  return BASE_ONBOARDING_TEMPLATE.map(sobre => ({
    key: sobre.key,
    tipo: sobre.tipo,
    categorias: sobre.categorias.map(categoria => ({
      key: categoria.key,
      emoji: categoria.emoji,
      color: categoria.color,
      marcas: countryBrands[categoria.key] || []
    }))
  }))
}
