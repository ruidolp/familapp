/**
 * i18n Request Configuration
 *
 * Configuración de next-intl para Server Components
 */

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale solicitado
  const requested = await requestLocale

  // Validar y usar el locale apropiado
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
