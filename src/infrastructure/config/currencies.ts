/**
 * Currency Configuration
 *
 * Configuración de monedas soportadas usando @dinero.js/currencies.
 * Esto permite precarga automática de todas las monedas ISO 4217.
 */

import { USD, EUR, GBP, CAD, AUD, JPY, CNY, INR, BRL, MXN, CLP, ARS, COP, PEN } from '@dinero.js/currencies'

/**
 * Monedas principales soportadas por la aplicación.
 * Puedes agregar más importándolas desde @dinero.js/currencies.
 */
export const SUPPORTED_CURRENCIES = {
  USD, // Dólar estadounidense
  EUR, // Euro
  GBP, // Libra esterlina
  CAD, // Dólar canadiense
  AUD, // Dólar australiano
  JPY, // Yen japonés
  CNY, // Yuan chino
  INR, // Rupia india
  BRL, // Real brasileño
  MXN, // Peso mexicano
  CLP, // Peso chileno
  ARS, // Peso argentino
  COP, // Peso colombiano
  PEN, // Sol peruano
} as const

/**
 * Obtener información de una moneda por su código
 */
export function getCurrency(code: string) {
  const currency = SUPPORTED_CURRENCIES[code as keyof typeof SUPPORTED_CURRENCIES]

  if (!currency) {
    throw new Error(`Currency ${code} is not supported`)
  }

  return currency
}

/**
 * Verificar si una moneda está soportada
 */
export function isCurrencySupported(code: string): boolean {
  return code in SUPPORTED_CURRENCIES
}

/**
 * Obtener lista de códigos de monedas soportadas
 */
export function getSupportedCurrencyCodes(): string[] {
  return Object.keys(SUPPORTED_CURRENCIES)
}

/**
 * Formatear precio con símbolo de moneda
 */
export function formatPrice(amount: number, currencyCode: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  } catch (error) {
    // Fallback si la moneda no es soportada por Intl
    return `${amount} ${currencyCode}`
  }
}

/**
 * Obtener símbolo de moneda
 */
export function getCurrencySymbol(currencyCode: string, locale: string = 'en-US'): string {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0)

    // Extraer solo el símbolo removiendo el número
    return formatted.replace(/[\d.,\s]/g, '')
  } catch (error) {
    return currencyCode
  }
}
