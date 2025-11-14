/**
 * Utilidades de criptografía y seguridad
 */

import bcrypt from 'bcryptjs'
import { appConfig } from '@/config/app.config'

/**
 * Hash de contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(appConfig.auth.password.bcryptRounds)
  return bcrypt.hash(password, salt)
}

/**
 * Verificar contraseña contra hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generar código de verificación numérico
 */
export function generateVerificationCode(length: number = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

/**
 * Generar fecha de expiración para código de verificación
 */
export function generateCodeExpiration(minutes: number): Date {
  const now = new Date()
  now.setMinutes(now.getMinutes() + minutes)
  return now
}

/**
 * Verificar si un código ha expirado
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Sanitizar email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Sanitizar teléfono (remover espacios y guiones)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[\s-()]/g, '')
}

/**
 * Generar token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
