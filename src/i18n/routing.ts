/**
 * i18n Routing Configuration
 *
 * Configuración centralizada de routing para next-intl
 */

import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // Idiomas soportados
  locales: ['en', 'es'],

  // Idioma por defecto
  defaultLocale: 'en',

  // Estrategia de prefijo de locale
  // 'always' = siempre incluir locale en URL (/en/dashboard, /es/dashboard)
  // 'as-needed' = solo incluir locale cuando no es el default
  localePrefix: 'always',
})
