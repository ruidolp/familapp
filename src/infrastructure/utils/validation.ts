/**
 * Esquemas de validación con Zod
 *
 * Centraliza todas las validaciones de la aplicación usando Zod.
 * Los esquemas están basados en la configuración de app.config.ts
 */

import { z } from 'zod'
import { appConfig } from '@/config/app.config'

/**
 * Validación de email
 */
export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(3, 'Email debe tener al menos 3 caracteres')
  .max(255, 'Email debe tener máximo 255 caracteres')

/**
 * Validación de teléfono
 * Acepta formatos internacionales: +1234567890, +52 1234567890, etc.
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Teléfono inválido. Usa formato internacional: +1234567890'
  )
  .min(10, 'Teléfono debe tener al menos 10 dígitos')
  .max(15, 'Teléfono debe tener máximo 15 dígitos')

/**
 * Validación de contraseña basada en configuración
 */
const passwordValidators: z.ZodString = z
  .string()
  .min(
    appConfig.auth.password.minLength,
    `Contraseña debe tener al menos ${appConfig.auth.password.minLength} caracteres`
  )
  .max(128, 'Contraseña debe tener máximo 128 caracteres')

// Agregar validaciones según configuración
let passwordSchema = passwordValidators

if (appConfig.auth.password.requireUppercase) {
  passwordSchema = passwordSchema.regex(
    /[A-Z]/,
    'Contraseña debe contener al menos una mayúscula'
  )
}

if (appConfig.auth.password.requireLowercase) {
  passwordSchema = passwordSchema.regex(
    /[a-z]/,
    'Contraseña debe contener al menos una minúscula'
  )
}

if (appConfig.auth.password.requireNumbers) {
  passwordSchema = passwordSchema.regex(
    /\d/,
    'Contraseña debe contener al menos un número'
  )
}

if (appConfig.auth.password.requireSpecialChars) {
  passwordSchema = passwordSchema.regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Contraseña debe contener al menos un carácter especial'
  )
}

export { passwordSchema }

/**
 * Validación de nombre
 */
export const nameSchema = z
  .string()
  .min(2, 'Nombre debe tener al menos 2 caracteres')
  .max(100, 'Nombre debe tener máximo 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nombre contiene caracteres inválidos')

/**
 * Validación de código de verificación
 */
export const verificationCodeSchema = z
  .string()
  .length(
    appConfig.auth.confirmation.codeLength,
    `Código debe tener ${appConfig.auth.confirmation.codeLength} dígitos`
  )
  .regex(/^\d+$/, 'Código debe contener solo números')

/**
 * Schema para registro con email
 */
export const registerWithEmailSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

/**
 * Schema para registro con teléfono
 */
export const registerWithPhoneSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

/**
 * Schema para login
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email o teléfono es requerido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

/**
 * Schema para recuperación de contraseña
 */
export const recoveryRequestSchema = z.object({
  identifier: z.string().min(1, 'Email o teléfono es requerido'),
})

/**
 * Schema para reset de contraseña
 */
export const resetPasswordSchema = z.object({
  code: verificationCodeSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

/**
 * Schema para verificación de cuenta
 */
export const verifyAccountSchema = z.object({
  userId: z.string().cuid('ID de usuario inválido'),
  code: verificationCodeSchema,
})

/**
 * Tipos inferidos de los schemas
 */
export type RegisterWithEmailInput = z.infer<typeof registerWithEmailSchema>
export type RegisterWithPhoneInput = z.infer<typeof registerWithPhoneSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyAccountInput = z.infer<typeof verifyAccountSchema>

/**
 * Helper para validar si un identificador es email o teléfono
 */
export function detectIdentifierType(identifier: string): 'email' | 'phone' | 'unknown' {
  if (emailSchema.safeParse(identifier).success) {
    return 'email'
  }
  if (phoneSchema.safeParse(identifier).success) {
    return 'phone'
  }
  return 'unknown'
}

/**
 * Helper para formatear errores de Zod
 */
export function formatZodErrors(errors: z.ZodError) {
  return errors.errors.reduce((acc, error) => {
    const path = error.path.join('.')
    acc[path] = error.message
    return acc
  }, {} as Record<string, string>)
}
