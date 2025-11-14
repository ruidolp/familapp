/**
 * Mapeo de países a monedas predeterminadas
 * Se usa en onboarding para preseleccionar moneda según país del usuario
 */

export type CountryCode = string

export interface CountryMonedaMap {
  country: CountryCode
  countryName: string
  monedaId: string
  monedaNombre: string
}

// Mapeo: País → Moneda principal recomendada
export const COUNTRY_TO_MONEDA: Record<CountryCode, CountryMonedaMap> = {
  // América Latina
  CL: {
    country: 'CL',
    countryName: 'Chile',
    monedaId: 'CLP',
    monedaNombre: 'Peso Chileno',
  },
  AR: {
    country: 'AR',
    countryName: 'Argentina',
    monedaId: 'ARS',
    monedaNombre: 'Peso Argentino',
  },
  CO: {
    country: 'CO',
    countryName: 'Colombia',
    monedaId: 'COP',
    monedaNombre: 'Peso Colombiano',
  },
  MX: {
    country: 'MX',
    countryName: 'México',
    monedaId: 'MXN',
    monedaNombre: 'Peso Mexicano',
  },
  BR: {
    country: 'BR',
    countryName: 'Brasil',
    monedaId: 'BRL',
    monedaNombre: 'Real Brasileño',
  },
  PE: {
    country: 'PE',
    countryName: 'Perú',
    monedaId: 'PEN',
    monedaNombre: 'Sol Peruano',
  },
  EC: {
    country: 'EC',
    countryName: 'Ecuador',
    monedaId: 'USD',
    monedaNombre: 'Dólar Estadounidense',
  },
  BO: {
    country: 'BO',
    countryName: 'Bolivia',
    monedaId: 'BOB',
    monedaNombre: 'Boliviano',
  },
  PY: {
    country: 'PY',
    countryName: 'Paraguay',
    monedaId: 'PYG',
    monedaNombre: 'Guaraní',
  },
  UY: {
    country: 'UY',
    countryName: 'Uruguay',
    monedaId: 'UYU',
    monedaNombre: 'Peso Uruguayo',
  },
  VE: {
    country: 'VE',
    countryName: 'Venezuela',
    monedaId: 'VES',
    monedaNombre: 'Bolívar Soberano',
  },

  // Europa
  ES: {
    country: 'ES',
    countryName: 'España',
    monedaId: 'EUR',
    monedaNombre: 'Euro',
  },
  FR: {
    country: 'FR',
    countryName: 'Francia',
    monedaId: 'EUR',
    monedaNombre: 'Euro',
  },
  DE: {
    country: 'DE',
    countryName: 'Alemania',
    monedaId: 'EUR',
    monedaNombre: 'Euro',
  },
  IT: {
    country: 'IT',
    countryName: 'Italia',
    monedaId: 'EUR',
    monedaNombre: 'Euro',
  },
  GB: {
    country: 'GB',
    countryName: 'Reino Unido',
    monedaId: 'GBP',
    monedaNombre: 'Libra Esterlina',
  },
  PT: {
    country: 'PT',
    countryName: 'Portugal',
    monedaId: 'EUR',
    monedaNombre: 'Euro',
  },

  // Norteamérica
  US: {
    country: 'US',
    countryName: 'Estados Unidos',
    monedaId: 'USD',
    monedaNombre: 'Dólar Estadounidense',
  },
  CA: {
    country: 'CA',
    countryName: 'Canadá',
    monedaId: 'CAD',
    monedaNombre: 'Dólar Canadiense',
  },

  // Default
  DEFAULT: {
    country: 'DEFAULT',
    countryName: 'Otro',
    monedaId: 'USD',
    monedaNombre: 'Dólar Estadounidense',
  },
}

/**
 * Obtiene la moneda recomendada para un país
 * @param countryCode - Código de país (ej: 'CL', 'US', 'ES')
 * @returns Información de la moneda recomendada
 */
export function getMonedaByCountry(countryCode: string): CountryMonedaMap {
  return COUNTRY_TO_MONEDA[countryCode.toUpperCase()] || COUNTRY_TO_MONEDA.DEFAULT
}

/**
 * Obtiene la lista de países en formato de select options
 */
export function getCountryOptions() {
  return Object.values(COUNTRY_TO_MONEDA)
    .filter((item) => item.country !== 'DEFAULT')
    .map((item) => ({
      value: item.country,
      label: `${item.countryName}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
