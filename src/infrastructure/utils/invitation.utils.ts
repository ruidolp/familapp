/**
 * Invitation Utilities
 *
 * Funciones auxiliares para el sistema de invitaciones
 */

import { customAlphabet } from 'nanoid'
import { db } from '../database/kysely'

// Alfabeto personalizado sin caracteres confusos (0,O,I,l,1)
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', 12)

/**
 * Generar código único de invitación
 */
export function generateInvitationCode(): string {
  return nanoid() // ej: "a3K7mN9pQr5x"
}

/**
 * Detectar si un contacto es email o teléfono
 */
export function parseContact(contact: string): {
  type: 'email' | 'phone'
  normalized: string
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalized = contact.trim().toLowerCase()

  if (emailRegex.test(normalized)) {
    return { type: 'email', normalized }
  }

  // Es teléfono - normalizar removiendo espacios y caracteres especiales
  const phoneNormalized = contact.replace(/[\s\-\(\)]/g, '')
  return { type: 'phone', normalized: phoneNormalized }
}

/**
 * Buscar usuario por email o teléfono
 */
export async function findUserByContact(contact: string) {
  const { type, normalized } = parseContact(contact)

  return await db
    .selectFrom('users')
    .selectAll()
    .where(type === 'email' ? 'email' : 'phone', '=', normalized)
    .executeTakeFirst()
}

/**
 * Validar formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validar formato de teléfono (básico)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
  return phoneRegex.test(phone.trim())
}

/**
 * Generar link de invitación
 */
export function generateInvitationLink(codigo: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${base}/invite/${codigo}`
}
