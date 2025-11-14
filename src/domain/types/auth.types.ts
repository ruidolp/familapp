/**
 * Tipos de dominio para autenticación
 *
 * Estos tipos definen las estructuras de datos del dominio de autenticación,
 * independientes de la implementación técnica.
 */

export type AccountType = 'EMAIL' | 'PHONE'

export type VerificationCodeType =
  | 'EMAIL_CONFIRMATION'
  | 'PHONE_CONFIRMATION'
  | 'PASSWORD_RESET'

export type VerificationCodeStatus = 'PENDING' | 'USED' | 'EXPIRED'

/**
 * Usuario del dominio
 */
export interface DomainUser {
  id: string
  name: string
  email?: string | null
  emailVerified?: Date | null
  phone?: string | null
  phoneVerified?: Date | null
  image?: string | null
  accountType: AccountType
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date | null
}

/**
 * Credenciales para registro
 */
export interface RegisterCredentials {
  name: string
  password: string
  accountType: AccountType
  email?: string
  phone?: string
}

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  identifier: string // email o phone
  password: string
}

/**
 * Resultado de autenticación
 */
export interface AuthResult {
  success: boolean
  user?: DomainUser
  error?: string
  requiresVerification?: boolean
}

/**
 * Código de verificación
 */
export interface VerificationCode {
  id: string
  userId: string
  code: string
  type: VerificationCodeType
  status: VerificationCodeStatus
  expiresAt: Date
  usedAt?: Date | null
  createdAt: Date
}

/**
 * Request de recuperación de contraseña
 */
export interface RecoveryRequest {
  identifier: string // email o phone
  accountType: AccountType
}

/**
 * Request de reset de contraseña
 */
export interface ResetPasswordRequest {
  userId: string
  code: string
  newPassword: string
}

/**
 * Request de verificación de cuenta
 */
export interface VerifyAccountRequest {
  userId: string
  code: string
  type: VerificationCodeType
}

/**
 * Sesión de usuario
 */
export interface UserSession {
  user: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    image?: string | null
    accountType: AccountType
  }
  expires: string
}
