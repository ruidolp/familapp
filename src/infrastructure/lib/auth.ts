/**
 * Configuración de NextAuth v5
 *
 * NextAuth v5 (beta) está optimizado para App Router de Next.js 13+
 * Soporta autenticación con credenciales, OAuth y base de datos.
 *
 * Migrado a Kysely para mejor performance.
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'

import { KyselyAdapter } from './kysely-adapter'
import { appConfig } from '@/config/app.config'
import { loginUser } from '@/application/services/auth.service'
import { loginSchema } from '@/infrastructure/utils/validation'
import { findUserByEmail, updateLastLogin } from '@/infrastructure/database/queries/user.queries'
import { getUserActivePlan } from '@/application/services/subscriptions'

/**
 * Configuración de NextAuth
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: KyselyAdapter(),

  // Estrategia de sesión
  session: {
    strategy: appConfig.auth.session.strategy,
    maxAge: appConfig.auth.session.maxAge,
    updateAge: appConfig.auth.session.updateAge,
  },

  // Páginas personalizadas
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },

  // Providers
  providers: [
    // Credenciales (email/phone + password)
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: {
          label: 'Email o Teléfono',
          type: 'text',
        },
        password: {
          label: 'Contraseña',
          type: 'password',
        },
      },
      async authorize(credentials) {
        try {
          // Validar credenciales
          const parsed = loginSchema.safeParse(credentials)

          if (!parsed.success) {
            return null
          }

          // Intentar login
          const result = await loginUser(parsed.data)

          if (!result.success || !result.user) {
            return null
          }

          // Retornar usuario en formato NextAuth
          return {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email || undefined,
            image: result.user.image || undefined,
            phone: result.user.phone || undefined,
            accountType: result.user.accountType,
          }
        } catch (error) {
          console.error('Error en authorize:', error)
          return null
        }
      },
    }),

    // Google OAuth (si está habilitado)
    ...(appConfig.auth.oauth.google.enabled
      ? [
          Google({
            clientId: appConfig.auth.oauth.google.clientId,
            clientSecret: appConfig.auth.oauth.google.clientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // Facebook OAuth (si está habilitado)
    ...(appConfig.auth.oauth.facebook.enabled
      ? [
          Facebook({
            clientId: appConfig.auth.oauth.facebook.clientId,
            clientSecret: appConfig.auth.oauth.facebook.clientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  // Callbacks
  callbacks: {
    // Callback de JWT
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && user.id) {
        token.id = user.id
        token.accountType = (user.accountType as string) || ''
        token.phone = (user.phone as string) || ''
      }

      // OAuth sign in
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }

      return token
    },

    // Callback de sesión
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.accountType = token.accountType as string
        session.user.phone = token.phone as string

        // Obtener información de suscripción del usuario
        try {
          const activePlan = await getUserActivePlan(session.user.id)

          session.user.subscription = {
            planSlug: activePlan.planSlug,
            planName: activePlan.planName,
            status: activePlan.status,
            isLinked: activePlan.isLinked,
            ownerId: activePlan.ownerId,
            capabilities: activePlan.capabilities,
            limits: activePlan.limits,
            expiresAt: activePlan.expiresAt?.toISOString() || null,
            trialEndsAt: activePlan.trialEndsAt?.toISOString() || null,
          }
        } catch (error) {
          console.error('Error loading subscription data:', error)
          // Fallback a plan FREE si hay error
          session.user.subscription = {
            planSlug: 'free',
            planName: 'Free',
            status: 'free',
            isLinked: false,
            ownerId: null,
            capabilities: [],
            limits: {},
            expiresAt: null,
            trialEndsAt: null,
          }
        }
      }

      return session
    },

    // Callback de sign in
    async signIn({ user, account, profile }) {
      // Permitir login con credenciales
      if (account?.provider === 'credentials') {
        return true
      }

      // OAuth: verificar si el registro está permitido
      if (!appConfig.auth.registration.allowSelfSignup) {
        // Verificar si el usuario ya existe
        if (user.email) {
          const existingUser = await findUserByEmail(user.email)

          if (!existingUser) {
            return false
          }
        }
      }

      return true
    },
  },

  // Eventos
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log('Nuevo usuario registrado:', user.id)
      }

      // Actualizar última fecha de login
      if (user.id) {
        await updateLastLogin(user.id)
      }
    },
  },

  // Debug en desarrollo
  debug: appConfig.environment.isDevelopment,
})

/**
 * Helper para obtener la sesión del servidor
 */
export async function getSession() {
  return await auth()
}

/**
 * Helper para obtener el usuario actual
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

/**
 * Helper para verificar si el usuario está autenticado
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}
