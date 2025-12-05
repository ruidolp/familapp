/**
 * SessionRedirectProvider
 *
 * Detecta sesiones expiradas y redirige automáticamente al login con un
 * motivo en la query. No hace llamadas extra: se apoya en useSession.
 */

'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/recovery', '/auth/error']

export function SessionRedirectProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const locale = useLocale()
  const pathname = usePathname() || ''
  const hasRedirected = useRef(false)

  useEffect(() => {
    const normalized = pathname.replace(`/${locale}`, '') || '/'

    if (status !== 'unauthenticated') {
      hasRedirected.current = false
      return
    }

    // Evitar bucles si ya estamos en auth o ya redirigimos
    if (hasRedirected.current || AUTH_ROUTES.some(route => normalized.startsWith(route))) {
      return
    }

    hasRedirected.current = true
    signOut({
      callbackUrl: `/${locale}/auth/login?reason=session_expired`,
    })
  }, [status, locale, pathname])

  return <>{children}</>
}
