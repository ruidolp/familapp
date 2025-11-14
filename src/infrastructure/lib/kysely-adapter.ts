/**
 * Kysely Adapter for NextAuth
 *
 * Custom adapter para usar Kysely en lugar de Prisma con NextAuth v5.
 * Implementa la interface Adapter de NextAuth usando queries de Kysely.
 */

import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'
import {
  createUser,
  findUserById,
  findUserByEmail,
  updateUserById,
  deleteUserById,
} from '../database/queries/user.queries'
import {
  createAccount,
  findAccountByProvider,
  deleteAccount,
} from '../database/queries/account.queries'
import {
  createSession,
  findSessionByToken,
  updateSession,
  deleteSession,
  findSessionWithUser,
} from '../database/queries/session.queries'
import { db } from '../database/kysely'

/**
 * Crear Kysely Adapter para NextAuth
 */
export function KyselyAdapter(): Adapter {
  return {
    /**
     * Crear usuario
     */
    async createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
      const createdUser = await createUser({
        name: user.name || '',
        email: user.email || null,
        email_verified: user.emailVerified || null,
        phone: null,
        phone_verified: null,
        image: user.image || null,
        password: null,
        last_login_at: null,
      })

      return {
        id: createdUser.id,
        email: createdUser.email || '',
        emailVerified: createdUser.email_verified ? new Date(createdUser.email_verified) : null,
        name: createdUser.name,
        image: createdUser.image,
      }
    },

    /**
     * Obtener usuario por ID
     */
    async getUser(id: string): Promise<AdapterUser | null> {
      const user = await findUserById(id)
      if (!user) return null

      return {
        id: user.id,
        email: user.email || '',
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        name: user.name,
        image: user.image,
      }
    },

    /**
     * Obtener usuario por email
     */
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const user = await findUserByEmail(email)
      if (!user) return null

      return {
        id: user.id,
        email: user.email || '',
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        name: user.name,
        image: user.image,
      }
    },

    /**
     * Obtener usuario por account
     */
    async getUserByAccount(
      providerAccountId: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
    ): Promise<AdapterUser | null> {
      const account = await findAccountByProvider(
        providerAccountId.provider,
        providerAccountId.providerAccountId
      )

      if (!account) return null

      const user = await findUserById(account.user_id)
      if (!user) return null

      return {
        id: user.id,
        email: user.email || '',
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        name: user.name,
        image: user.image,
      }
    },

    /**
     * Actualizar usuario
     */
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
      const updatedUser = await updateUserById(user.id, {
        name: user.name ?? undefined,
        email: user.email || undefined,
        email_verified: user.emailVerified || undefined,
        image: user.image || undefined,
      })

      if (!updatedUser) {
        throw new Error('User not found')
      }

      return {
        id: updatedUser.id,
        email: updatedUser.email || '',
        emailVerified: updatedUser.email_verified ? new Date(updatedUser.email_verified) : null,
        name: updatedUser.name,
        image: updatedUser.image,
      }
    },

    /**
     * Eliminar usuario
     */
    async deleteUser(userId: string): Promise<void> {
      await deleteUserById(userId)
    },

    /**
     * Vincular account (OAuth)
     */
    async linkAccount(account: AdapterAccount): Promise<void> {
      await createAccount({
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token || null,
        access_token: account.access_token || null,
        expires_at: account.expires_at || null,
        token_type: account.token_type || null,
        scope: account.scope || null,
        id_token: account.id_token || null,
        session_state: typeof account.session_state === 'string' ? account.session_state : (account.session_state ? JSON.stringify(account.session_state) : null),
      })
    },

    /**
     * Desvincular account
     */
    async unlinkAccount(
      providerAccountId: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
    ): Promise<void> {
      await deleteAccount(providerAccountId.provider, providerAccountId.providerAccountId)
    },

    /**
     * Crear sesión
     */
    async createSession(session: {
      sessionToken: string
      userId: string
      expires: Date
    }): Promise<AdapterSession> {
      const createdSession = await createSession({
        session_token: session.sessionToken,
        user_id: session.userId,
        expires: session.expires,
      })

      return {
        sessionToken: createdSession.session_token,
        userId: createdSession.user_id,
        expires: new Date(createdSession.expires),
      }
    },

    /**
     * Obtener sesión y usuario
     */
    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await findSessionWithUser(sessionToken)

      if (!result) return null

      return {
        session: {
          sessionToken: result.session_token,
          userId: result.user_id,
          expires: new Date(result.expires),
        },
        user: {
          id: result.id,
          email: result.email || '',
          emailVerified: result.email_verified ? new Date(result.email_verified) : null,
          name: result.name,
          image: result.image,
        },
      }
    },

    /**
     * Actualizar sesión
     */
    async updateSession(
      session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>
    ): Promise<AdapterSession | null | undefined> {
      const updatedSession = await updateSession(
        session.sessionToken,
        session.expires || new Date()
      )

      if (!updatedSession) return null

      return {
        sessionToken: updatedSession.session_token,
        userId: updatedSession.user_id,
        expires: new Date(updatedSession.expires),
      }
    },

    /**
     * Eliminar sesión
     */
    async deleteSession(sessionToken: string): Promise<void> {
      await deleteSession(sessionToken)
    },

    /**
     * Crear verification token
     */
    async createVerificationToken(verificationToken: VerificationToken): Promise<VerificationToken> {
      const result = await db
        .insertInto('verification_tokens')
        .values({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      return {
        identifier: result.identifier,
        token: result.token,
        expires: new Date(result.expires),
      }
    },

    /**
     * Usar verification token
     */
    async useVerificationToken(params: { identifier: string; token: string }): Promise<VerificationToken | null> {
      const result = await db
        .deleteFrom('verification_tokens')
        .where('identifier', '=', params.identifier)
        .where('token', '=', params.token)
        .returningAll()
        .executeTakeFirst()

      if (!result) return null

      return {
        identifier: result.identifier,
        token: result.token,
        expires: new Date(result.expires),
      }
    },
  }
}
