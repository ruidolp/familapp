/**
 * i18n Configuration
 *
 * Configuración centralizada de idiomas soportados.
 * Para agregar un nuevo idioma, solo agrega el código a 'locales'
 * y crea el archivo correspondiente en src/i18n/messages/{locale}.json
 */

export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
}
