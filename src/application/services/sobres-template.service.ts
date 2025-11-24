/**
 * Sobres Template Service
 *
 * Servicio para crear sobres base con categorías predefinidas
 */

import { createSobre } from '@/infrastructure/database/queries/sobres.queries'
import { createCategoria } from '@/infrastructure/database/queries/categorias.queries'
import { addCategoriasToSobre } from '@/infrastructure/database/queries/sobres.queries'

/**
 * Template de sobres base con sus categorías
 */
const SOBRES_BASE = {
  HOGAR: {
    nombre: 'HOGAR',
    emoji: '🏠',
    tipo: 'GASTO' as const,
    categorias: [
      { nombre: 'Supermercado', emoji: '🛒', color: '#10B981' },
      { nombre: 'Transporte', emoji: '🚗', color: '#3B82F6' },
      { nombre: 'Medicina', emoji: '💊', color: '#EF4444' },
      { nombre: 'Cuentas del hogar', emoji: '🏡', color: '#F59E0B' },
      { nombre: 'Comida rápida', emoji: '🍕', color: '#EC4899' },
    ],
  },
  PERSONAL: {
    nombre: 'PERSONAL',
    emoji: '👤',
    tipo: 'GASTO' as const,
    categorias: [
      { nombre: 'Entretenimiento', emoji: '🎮', color: '#8B5CF6' },
      { nombre: 'Ropa', emoji: '👕', color: '#06B6D4' },
      { nombre: 'Cuidado personal', emoji: '💄', color: '#F97316' },
    ],
  },
}

/**
 * Crear sobre base con categorías template
 */
export async function createBaseSobre(
  userId: string,
  nombreSobre: 'HOGAR' | 'PERSONAL',
  monedaId: string
): Promise<{ sobre: any; categorias: any[] }> {
  const template = SOBRES_BASE[nombreSobre]
  if (!template) {
    throw new Error(`Sobre base "${nombreSobre}" no existe en templates`)
  }

  // 1. Crear el sobre
  const sobre = await createSobre({
    nombre: template.nombre,
    tipo: template.tipo,
    moneda_principal_id: monedaId,
    presupuesto_asignado: 0,
    gastado: 0,
    emoji: template.emoji,
    is_compartido: false,
    max_participantes: 1,
    usuario_id: userId,
  })

  // 2. Crear categorías y asociarlas al sobre
  const categorias = []
  for (const catTemplate of template.categorias) {
    const categoria = await createCategoria({
      nombre: catTemplate.nombre,
      usuario_id: userId,
      emoji: catTemplate.emoji,
      color: catTemplate.color,
    })

    // Asociar categoría al sobre
    await addCategoriasToSobre(sobre.id, categoria.id)
    categorias.push(categoria)
  }

  return { sobre, categorias }
}

/**
 * Detectar si un nombre de sobre es "base"
 */
export function isSobreBase(nombre: string): nombre is 'HOGAR' | 'PERSONAL' {
  const nombreUpper = nombre.toUpperCase().trim()
  return nombreUpper === 'HOGAR' || nombreUpper === 'PERSONAL'
}

/**
 * Obtener template de sobre base
 */
export function getSobreTemplate(nombreSobre: 'HOGAR' | 'PERSONAL') {
  return SOBRES_BASE[nombreSobre]
}
