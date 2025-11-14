/**
 * Session Provider para NextAuth
 *
 * Este componente debe envolver la aplicación para proporcionar
 * el contexto de sesión a todos los componentes.
 */

'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
