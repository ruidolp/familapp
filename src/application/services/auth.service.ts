/**
 * Servicio de autenticación
 *
 * Contiene la lógica de negocio para autenticación, registro,
 * verificación y recuperación de cuenta.
 *
 * Migrado a Kysely para mejor performance y type-safety.
 */

import {
  createUser,
  findUserByEmailOrPhone,
  updateLastLogin,
  findUserById,
  verifyUserEmail,
  verifyUserPhone,
  updateUserPassword,
  userExistsByEmailOrPhone,
} from '@/infrastructure/database/queries/user.queries'
import {
  createVerificationCode,
  findPendingVerificationCode,
  invalidatePendingCodes,
  markCodeAsUsed,
  markCodeAsExpired,
} from '@/infrastructure/database/queries/verification.queries'
import { hashPassword, verifyPassword, generateVerificationCode, generateCodeExpiration, sanitizeEmail, sanitizePhone } from '@/infrastructure/utils/crypto'
import { detectIdentifierType } from '@/infrastructure/utils/validation'
import { appConfig } from '@/config/app.config'
import type {
  RegisterCredentials,
  LoginCredentials,
  AuthResult,
  DomainUser,
  RecoveryRequest,
  ResetPasswordRequest,
  VerifyAccountRequest,
} from '@/domain/types/auth.types'
import type { UsersTable } from '@/infrastructure/database/types'

/**
 * Registrar un nuevo usuario
 */
export async function registerUser(
  credentials: RegisterCredentials
): Promise<AuthResult> {
  try {
    // Validar que el tipo de cuenta esté permitido
    if (credentials.accountType === 'EMAIL' && !appConfig.auth.registration.allowedAccountTypes.email) {
      return {
        success: false,
        error: 'Registro con email no está permitido',
      }
    }

    if (credentials.accountType === 'PHONE' && !appConfig.auth.registration.allowedAccountTypes.phone) {
      return {
        success: false,
        error: 'Registro con teléfono no está permitido',
      }
    }

    // Sanitizar email o teléfono
    const email = credentials.email ? sanitizeEmail(credentials.email) : undefined
    const phone = credentials.phone ? sanitizePhone(credentials.phone) : undefined

    // Verificar si el usuario ya existe
    const exists = await userExistsByEmailOrPhone(email, phone)

    if (exists) {
      return {
        success: false,
        error: 'El usuario ya existe',
      }
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(credentials.password)

    // Crear usuario
    const user = await createUser({
      name: credentials.name,
      email: email || null,
      phone: phone || null,
      password: hashedPassword,
      account_type: credentials.accountType,
      email_verified: null,
      phone_verified: null,
      image: null,
      last_login_at: null,
    })

    // Generar código de verificación si está habilitado
    if (appConfig.auth.confirmation.enabled) {
      const code = generateVerificationCode(appConfig.auth.confirmation.codeLength)
      const expiresAt = generateCodeExpiration(appConfig.auth.confirmation.codeExpirationHours * 60)

      await createVerificationCode({
        user_id: user.id,
        code,
        type: credentials.accountType === 'EMAIL' ? 'EMAIL_CONFIRMATION' : 'PHONE_CONFIRMATION',
        expires_at: expiresAt,
        used_at: null,
      })

      // TODO: Enviar código por email o SMS
      // await sendVerificationCode(user, code)
    }

    const domainUser = mapToDomainUser(user)

    return {
      success: true,
      user: domainUser,
      requiresVerification: appConfig.auth.confirmation.enabled,
    }
  } catch (error) {
    console.error('Error en registerUser:', error)
    return {
      success: false,
      error: 'Error al registrar usuario',
    }
  }
}

/**
 * Login de usuario
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<AuthResult> {
  try {
    // Detectar si es email o teléfono
    const identifierType = detectIdentifierType(credentials.identifier)

    if (identifierType === 'unknown') {
      return {
        success: false,
        error: 'Email o teléfono inválido',
      }
    }

    // Sanitizar identificador
    const identifier = identifierType === 'email'
      ? sanitizeEmail(credentials.identifier)
      : sanitizePhone(credentials.identifier)

    // Buscar usuario
    const user = await findUserByEmailOrPhone(
      identifierType === 'email' ? identifier : undefined,
      identifierType === 'phone' ? identifier : undefined
    )

    if (!user || !user.password) {
      return {
        success: false,
        error: 'Credenciales inválidas',
      }
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(credentials.password, user.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Credenciales inválidas',
      }
    }

    // Verificar si requiere confirmación
    if (appConfig.auth.confirmation.enabled && !appConfig.auth.confirmation.allowUnverifiedLogin) {
      const isVerified = identifierType === 'email'
        ? user.email_verified
        : user.phone_verified

      if (!isVerified) {
        return {
          success: false,
          error: 'Cuenta no verificada. Por favor verifica tu cuenta.',
          requiresVerification: true,
        }
      }
    }

    // Actualizar última fecha de login
    await updateLastLogin(user.id)

    const domainUser = mapToDomainUser(user)

    return {
      success: true,
      user: domainUser,
    }
  } catch (error) {
    console.error('Error en loginUser:', error)
    return {
      success: false,
      error: 'Error al iniciar sesión',
    }
  }
}

/**
 * Solicitar recuperación de contraseña
 */
export async function requestPasswordRecovery(
  request: RecoveryRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!appConfig.auth.recovery.enabled) {
      return {
        success: false,
        error: 'Recuperación de contraseña no está habilitada',
      }
    }

    // Detectar tipo de identificador
    const identifierType = detectIdentifierType(request.identifier)

    if (identifierType === 'unknown') {
      return {
        success: false,
        error: 'Email o teléfono inválido',
      }
    }

    // Sanitizar
    const identifier = identifierType === 'email'
      ? sanitizeEmail(request.identifier)
      : sanitizePhone(request.identifier)

    // Buscar usuario
    const user = await findUserByEmailOrPhone(
      identifierType === 'email' ? identifier : undefined,
      identifierType === 'phone' ? identifier : undefined
    )

    // Por seguridad, siempre retornar éxito aunque el usuario no exista
    if (!user) {
      return { success: true }
    }

    // Invalidar códigos anteriores
    await invalidatePendingCodes(user.id, 'PASSWORD_RESET')

    // Generar nuevo código
    const code = generateVerificationCode(appConfig.auth.recovery.codeLength)
    const expiresAt = generateCodeExpiration(appConfig.auth.recovery.codeExpirationMinutes)

    await createVerificationCode({
      user_id: user.id,
      code,
      type: 'PASSWORD_RESET',
      expires_at: expiresAt,
      used_at: null,
    })

    // TODO: Enviar código por email o SMS
    // await sendRecoveryCode(user, code)

    return { success: true }
  } catch (error) {
    console.error('Error en requestPasswordRecovery:', error)
    return {
      success: false,
      error: 'Error al solicitar recuperación',
    }
  }
}

/**
 * Reset de contraseña con código
 */
export async function resetPassword(
  request: ResetPasswordRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!appConfig.auth.recovery.enabled) {
      return {
        success: false,
        error: 'Recuperación de contraseña no está habilitada',
      }
    }

    // Buscar código de verificación
    const verificationCode = await findPendingVerificationCode(
      request.userId,
      request.code,
      'PASSWORD_RESET'
    )

    if (!verificationCode) {
      return {
        success: false,
        error: 'Código inválido o expirado',
      }
    }

    // Verificar si el código ha expirado
    if (new Date() > new Date(verificationCode.expires_at)) {
      await markCodeAsExpired(verificationCode.id)

      return {
        success: false,
        error: 'Código expirado',
      }
    }

    // Hash de la nueva contraseña
    const hashedPassword = await hashPassword(request.newPassword)

    // Actualizar contraseña
    await updateUserPassword(request.userId, hashedPassword)

    // Marcar código como usado
    await markCodeAsUsed(verificationCode.id)

    return { success: true }
  } catch (error) {
    console.error('Error en resetPassword:', error)
    return {
      success: false,
      error: 'Error al resetear contraseña',
    }
  }
}

/**
 * Verificar cuenta con código
 */
export async function verifyAccount(
  request: VerifyAccountRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!appConfig.auth.confirmation.enabled) {
      return {
        success: false,
        error: 'Verificación de cuenta no está habilitada',
      }
    }

    // Buscar código
    const verificationCode = await findPendingVerificationCode(
      request.userId,
      request.code,
      request.type
    )

    if (!verificationCode) {
      return {
        success: false,
        error: 'Código inválido',
      }
    }

    // Verificar si ha expirado
    if (new Date() > new Date(verificationCode.expires_at)) {
      await markCodeAsExpired(verificationCode.id)

      return {
        success: false,
        error: 'Código expirado',
      }
    }

    // Actualizar usuario según el tipo de verificación
    if (request.type === 'EMAIL_CONFIRMATION') {
      await verifyUserEmail(request.userId)
    } else if (request.type === 'PHONE_CONFIRMATION') {
      await verifyUserPhone(request.userId)
    }

    // Marcar código como usado
    await markCodeAsUsed(verificationCode.id)

    return { success: true }
  } catch (error) {
    console.error('Error en verifyAccount:', error)
    return {
      success: false,
      error: 'Error al verificar cuenta',
    }
  }
}

/**
 * Obtener usuario por ID
 */
export async function getUserById(
  userId: string
): Promise<DomainUser | null> {
  try {
    const user = await findUserById(userId)

    if (!user) {
      return null
    }

    return mapToDomainUser(user)
  } catch (error) {
    console.error('Error en getUserById:', error)
    return null
  }
}

/**
 * Mapear usuario de Kysely a dominio
 */
function mapToDomainUser(user: any): DomainUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.email_verified ? new Date(user.email_verified) : null,
    phone: user.phone,
    phoneVerified: user.phone_verified ? new Date(user.phone_verified) : null,
    image: user.image,
    accountType: user.account_type,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
    lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null,
  }
}
