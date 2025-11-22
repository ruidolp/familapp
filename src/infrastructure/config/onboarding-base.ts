/**
 * Base Onboarding Template
 *
 * Universal structure for all countries (no duplication)
 * Names are translated via i18n using the "key" field
 */

export type SobreTipo = 'HOGAR' | 'PERSONAL'

export interface CategoriaTemplate {
  key: string // i18n key (e.g., 'supermercado')
  emoji: string
  color: string
}

export interface SobreTemplate {
  key: string // i18n key (e.g., 'HOGAR')
  tipo: SobreTipo
  categorias: CategoriaTemplate[]
}

export const BASE_ONBOARDING_TEMPLATE: SobreTemplate[] = [
  {
    key: 'PERSONAL',
    tipo: 'PERSONAL',
    categorias: [] // No predefined categories
  },
  {
    key: 'HOGAR',
    tipo: 'HOGAR',
    categorias: [
      {
        key: 'supermercado',
        emoji: '🛒',
        color: '#10b981'
      },
      {
        key: 'transporte',
        emoji: '🚗',
        color: '#3b82f6'
      },
      {
        key: 'medicina',
        emoji: '💊',
        color: '#ef4444'
      },
      {
        key: 'cuentas_hogar',
        emoji: '📄',
        color: '#f59e0b'
      },
      {
        key: 'comida_rapida',
        emoji: '🍔',
        color: '#ec4899'
      }
    ]
  }
]
