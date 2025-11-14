/**
 * NextAuth Type Extensions
 *
 * Extiende los tipos de NextAuth para incluir campos personalizados.
 */

import { type DefaultSession } from 'next-auth'
import { type SubscriptionStatus } from '@/infrastructure/database/types'

declare module 'next-auth' {
  /**
   * Extender la interfaz de Session
   */
  interface Session {
    user: {
      id: string
      accountType: string
      phone: string
      subscription: {
        planSlug: string
        planName: string
        status: SubscriptionStatus
        isLinked: boolean
        ownerId: string | null
        capabilities: string[]
        limits: Record<string, number | null>
        expiresAt: string | null
        trialEndsAt: string | null
      }
    } & DefaultSession['user']
  }

  /**
   * Extender la interfaz de User
   */
  interface User {
    id: string
    accountType?: string
    phone?: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extender la interfaz de JWT
   */
  interface JWT {
    id: string
    accountType: string
    phone: string
  }
}
