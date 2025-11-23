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
import { CurrencyProvider } from '@/presentation/providers/currency-provider'
import { ThemeProvider } from '@/presentation/providers/theme-provider'
import { QueryProvider } from '@/presentation/providers/query-provider'
import { CategoryProvider } from '@/presentation/providers/category-context'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { getActiveThemes, getUserThemePreference } from '@/infrastructure/database/queries'
import { auth } from '@/infrastructure/lib/auth'
import { PWAInstaller } from '@/presentation/components/pwa-installer'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'FamilApp - Gestión Familiar',
  description: 'Gestión familiar inteligente',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FamilApp',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#000000',
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
    <html lang={locale} data-theme={defaultTheme} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <QueryProvider>
          <ThemeProvider defaultTheme={defaultTheme} themes={themes}>
            <SessionProvider>
              <CurrencyProvider>
                <CategoryProvider>
                  <NextIntlClientProvider messages={messages}>
                    <PWAInstaller />
                    {children}
                    <Toaster />
                    <SonnerToaster
                      position="top-center"
                      toastOptions={{
                        classNames: {
                          toast: 'bg-background text-foreground border-border',
                          title: 'text-foreground',
                          description: 'text-muted-foreground',
                          actionButton: 'bg-primary text-primary-foreground',
                          cancelButton: 'bg-muted text-muted-foreground',
                          error: 'bg-destructive text-destructive-foreground border-destructive',
                          success: 'bg-success text-success-foreground border-success',
                          warning: 'bg-warning text-warning-foreground border-warning',
                          info: 'bg-info text-info-foreground border-info',
                        },
                      }}
                    />
                  </NextIntlClientProvider>
                </CategoryProvider>
              </CurrencyProvider>
            </SessionProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
