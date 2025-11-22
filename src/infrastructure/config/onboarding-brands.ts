/**
 * Brands by Country
 *
 * Only country-specific data (brands/subcategories)
 * Structure: { [countryCode]: { [categoryKey]: [brands] } }
 */

export const BRANDS_BY_COUNTRY: Record<string, Record<string, string[]>> = {
  CL: {
    supermercado: ['Alvi', 'Jumbo', 'Líder', 'Unimarc', 'Santa Isabel'],
    transporte: ['Copec', 'Shell', 'Petrobras', 'Enex'],
    medicina: ['Salcobrand', 'Cruz Verde', 'Farmacias Ahumada'],
    cuentas_hogar: ['CGE', 'Chilquinta', 'Aguas Andinas', 'Movistar', 'Entel'],
    comida_rapida: ['McDonald\'s', 'Burger King', 'KFC', 'Doggis']
  },
  ES: {
    supermercado: ['Mercadona', 'Carrefour', 'Lidl', 'Alcampo', 'Día'],
    transporte: ['Repsol', 'Cepsa', 'BP', 'Galp'],
    medicina: ['Farmacia del Ahorro', 'Dosfarma', 'Cruz Verde'],
    cuentas_hogar: ['Iberdrola', 'Endesa', 'Naturgy', 'Movistar', 'Vodafone'],
    comida_rapida: ['McDonald\'s', 'Burger King', 'Telepizza', 'KFC']
  },
  MX: {
    supermercado: ['Soriana', 'Walmart', 'Chedraui', 'Bodega Aurrera', 'Oxxo'],
    transporte: ['Pemex', 'BP', 'Shell', 'Mobil'],
    medicina: ['Farmacias del Ahorro', 'Farmacia Guadalajara', 'Similares'],
    cuentas_hogar: ['CFE', 'Telmex', 'Telcel', 'Totalplay'],
    comida_rapida: ['McDonald\'s', 'Burger King', 'Carl\'s Jr', 'Domino\'s']
  },
  AR: {
    supermercado: ['Carrefour', 'Coto', 'Día', 'Disco', 'Jumbo'],
    transporte: ['YPF', 'Shell', 'Axion', 'Puma'],
    medicina: ['Farmacity', 'Dr. Ahorro', 'Farmacias del Dr. Simi'],
    cuentas_hogar: ['Edenor', 'Edesur', 'Metrogas', 'Personal', 'Claro'],
    comida_rapida: ['McDonald\'s', 'Burger King', 'Mostaza', 'KFC']
  },
  US: {
    supermercado: ['Walmart', 'Target', 'Kroger', 'Costco', 'Whole Foods'],
    transporte: ['Shell', 'Chevron', 'BP', 'Exxon', 'Mobil'],
    medicina: ['CVS', 'Walgreens', 'Rite Aid'],
    cuentas_hogar: ['AT&T', 'Verizon', 'Comcast', 'Duke Energy'],
    comida_rapida: ['McDonald\'s', 'Burger King', 'Wendy\'s', 'Taco Bell', 'KFC']
  }
}

/**
 * Fallback for countries without specific configuration
 */
export const DEFAULT_BRANDS: Record<string, string[]> = {
  supermercado: [],
  transporte: [],
  medicina: [],
  cuentas_hogar: [],
  comida_rapida: []
}
