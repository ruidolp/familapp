/**
 * Locale Layout with i18n support
 *
 * Este layout envuelve toda la aplicación y provee:
 * - next-intl provider para traducciones
 * - SessionProvider para autenticación
 * - Configuración de idioma
 * - HTML y body tags
 */

import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { SessionProvider } from '@/presentation/providers/session-provider'
import { ThemeProvider } from '@/presentation/providers/theme-provider'
import { QueryProvider } from '@/presentation/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { getActiveThemes, getUserThemePreference } from '@/infrastructure/database/queries'
import { auth } from '@/infrastructure/lib/auth'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'WApp - Aplicación Full Stack',
  description: 'Next.js + Kysely + NextAuth + Capacitor',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WApp',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validar que el locale sea válido
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Obtener las traducciones para este locale
  const messages = await getMessages()

  // Load available themes (with fallback for build time)
  let themes = []
  let defaultTheme = 'blanco'

  try {
    const themesData = await getActiveThemes()
    themes = themesData.map(t => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description || undefined,
      colors: t.colors as any,
    }))

    // Get user's saved theme preference
    const session = await auth()
    if (session?.user) {
      const preference = await getUserThemePreference(session.user.id)
      if (preference) {
        defaultTheme = preference.theme.slug
      }
    }
  } catch (error) {
    // During build time or when DB is not available, use hardcoded themes
    // The actual theme colors are defined in globals.css
    themes = [
      { id: '1', slug: 'neon', name: 'Neon', colors: {} as any },
      { id: '2', slug: 'blanco', name: 'Blanco', colors: {} as any },
      { id: '3', slug: 'negro', name: 'Negro', colors: {} as any },
      { id: '4', slug: 'rosado', name: 'Rosado', colors: {} as any },
    ]
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <ThemeProvider defaultTheme={defaultTheme} themes={themes}>
            <SessionProvider>
              <NextIntlClientProvider messages={messages}>
                {children}
                <Toaster />
                <SonnerToaster position="top-center" richColors />
              </NextIntlClientProvider>
            </SessionProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
