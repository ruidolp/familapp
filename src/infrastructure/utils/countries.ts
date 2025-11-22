/**
 * Countries List
 *
 * Complete list of world countries (ISO 3166-1 alpha-2)
 * Organized by region for better UX
 */

export interface Country {
  code: string
  name: string
  nameEs: string
}

export const COUNTRIES: Country[] = [
  // Latin America & Caribbean
  { code: 'AR', name: 'Argentina', nameEs: 'Argentina' },
  { code: 'BO', name: 'Bolivia', nameEs: 'Bolivia' },
  { code: 'BR', name: 'Brazil', nameEs: 'Brasil' },
  { code: 'CL', name: 'Chile', nameEs: 'Chile' },
  { code: 'CO', name: 'Colombia', nameEs: 'Colombia' },
  { code: 'CR', name: 'Costa Rica', nameEs: 'Costa Rica' },
  { code: 'CU', name: 'Cuba', nameEs: 'Cuba' },
  { code: 'DO', name: 'Dominican Republic', nameEs: 'República Dominicana' },
  { code: 'EC', name: 'Ecuador', nameEs: 'Ecuador' },
  { code: 'SV', name: 'El Salvador', nameEs: 'El Salvador' },
  { code: 'GT', name: 'Guatemala', nameEs: 'Guatemala' },
  { code: 'HN', name: 'Honduras', nameEs: 'Honduras' },
  { code: 'MX', name: 'Mexico', nameEs: 'México' },
  { code: 'NI', name: 'Nicaragua', nameEs: 'Nicaragua' },
  { code: 'PA', name: 'Panama', nameEs: 'Panamá' },
  { code: 'PY', name: 'Paraguay', nameEs: 'Paraguay' },
  { code: 'PE', name: 'Peru', nameEs: 'Perú' },
  { code: 'PR', name: 'Puerto Rico', nameEs: 'Puerto Rico' },
  { code: 'UY', name: 'Uruguay', nameEs: 'Uruguay' },
  { code: 'VE', name: 'Venezuela', nameEs: 'Venezuela' },

  // North America
  { code: 'CA', name: 'Canada', nameEs: 'Canadá' },
  { code: 'US', name: 'United States', nameEs: 'Estados Unidos' },

  // Europe
  { code: 'AL', name: 'Albania', nameEs: 'Albania' },
  { code: 'AD', name: 'Andorra', nameEs: 'Andorra' },
  { code: 'AT', name: 'Austria', nameEs: 'Austria' },
  { code: 'BE', name: 'Belgium', nameEs: 'Bélgica' },
  { code: 'BA', name: 'Bosnia and Herzegovina', nameEs: 'Bosnia y Herzegovina' },
  { code: 'BG', name: 'Bulgaria', nameEs: 'Bulgaria' },
  { code: 'HR', name: 'Croatia', nameEs: 'Croacia' },
  { code: 'CY', name: 'Cyprus', nameEs: 'Chipre' },
  { code: 'CZ', name: 'Czech Republic', nameEs: 'República Checa' },
  { code: 'DK', name: 'Denmark', nameEs: 'Dinamarca' },
  { code: 'EE', name: 'Estonia', nameEs: 'Estonia' },
  { code: 'FI', name: 'Finland', nameEs: 'Finlandia' },
  { code: 'FR', name: 'France', nameEs: 'Francia' },
  { code: 'DE', name: 'Germany', nameEs: 'Alemania' },
  { code: 'GR', name: 'Greece', nameEs: 'Grecia' },
  { code: 'HU', name: 'Hungary', nameEs: 'Hungría' },
  { code: 'IS', name: 'Iceland', nameEs: 'Islandia' },
  { code: 'IE', name: 'Ireland', nameEs: 'Irlanda' },
  { code: 'IT', name: 'Italy', nameEs: 'Italia' },
  { code: 'LV', name: 'Latvia', nameEs: 'Letonia' },
  { code: 'LT', name: 'Lithuania', nameEs: 'Lituania' },
  { code: 'LU', name: 'Luxembourg', nameEs: 'Luxemburgo' },
  { code: 'MT', name: 'Malta', nameEs: 'Malta' },
  { code: 'MD', name: 'Moldova', nameEs: 'Moldavia' },
  { code: 'MC', name: 'Monaco', nameEs: 'Mónaco' },
  { code: 'ME', name: 'Montenegro', nameEs: 'Montenegro' },
  { code: 'NL', name: 'Netherlands', nameEs: 'Países Bajos' },
  { code: 'MK', name: 'North Macedonia', nameEs: 'Macedonia del Norte' },
  { code: 'NO', name: 'Norway', nameEs: 'Noruega' },
  { code: 'PL', name: 'Poland', nameEs: 'Polonia' },
  { code: 'PT', name: 'Portugal', nameEs: 'Portugal' },
  { code: 'RO', name: 'Romania', nameEs: 'Rumania' },
  { code: 'RU', name: 'Russia', nameEs: 'Rusia' },
  { code: 'RS', name: 'Serbia', nameEs: 'Serbia' },
  { code: 'SK', name: 'Slovakia', nameEs: 'Eslovaquia' },
  { code: 'SI', name: 'Slovenia', nameEs: 'Eslovenia' },
  { code: 'ES', name: 'Spain', nameEs: 'España' },
  { code: 'SE', name: 'Sweden', nameEs: 'Suecia' },
  { code: 'CH', name: 'Switzerland', nameEs: 'Suiza' },
  { code: 'UA', name: 'Ukraine', nameEs: 'Ucrania' },
  { code: 'GB', name: 'United Kingdom', nameEs: 'Reino Unido' },
  { code: 'VA', name: 'Vatican City', nameEs: 'Ciudad del Vaticano' },

  // Asia
  { code: 'AF', name: 'Afghanistan', nameEs: 'Afganistán' },
  { code: 'AM', name: 'Armenia', nameEs: 'Armenia' },
  { code: 'AZ', name: 'Azerbaijan', nameEs: 'Azerbaiyán' },
  { code: 'BH', name: 'Bahrain', nameEs: 'Baréin' },
  { code: 'BD', name: 'Bangladesh', nameEs: 'Bangladés' },
  { code: 'BT', name: 'Bhutan', nameEs: 'Bután' },
  { code: 'BN', name: 'Brunei', nameEs: 'Brunéi' },
  { code: 'KH', name: 'Cambodia', nameEs: 'Camboya' },
  { code: 'CN', name: 'China', nameEs: 'China' },
  { code: 'GE', name: 'Georgia', nameEs: 'Georgia' },
  { code: 'HK', name: 'Hong Kong', nameEs: 'Hong Kong' },
  { code: 'IN', name: 'India', nameEs: 'India' },
  { code: 'ID', name: 'Indonesia', nameEs: 'Indonesia' },
  { code: 'IR', name: 'Iran', nameEs: 'Irán' },
  { code: 'IQ', name: 'Iraq', nameEs: 'Irak' },
  { code: 'IL', name: 'Israel', nameEs: 'Israel' },
  { code: 'JP', name: 'Japan', nameEs: 'Japón' },
  { code: 'JO', name: 'Jordan', nameEs: 'Jordania' },
  { code: 'KZ', name: 'Kazakhstan', nameEs: 'Kazajistán' },
  { code: 'KW', name: 'Kuwait', nameEs: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan', nameEs: 'Kirguistán' },
  { code: 'LA', name: 'Laos', nameEs: 'Laos' },
  { code: 'LB', name: 'Lebanon', nameEs: 'Líbano' },
  { code: 'MY', name: 'Malaysia', nameEs: 'Malasia' },
  { code: 'MV', name: 'Maldives', nameEs: 'Maldivas' },
  { code: 'MN', name: 'Mongolia', nameEs: 'Mongolia' },
  { code: 'MM', name: 'Myanmar', nameEs: 'Myanmar' },
  { code: 'NP', name: 'Nepal', nameEs: 'Nepal' },
  { code: 'KP', name: 'North Korea', nameEs: 'Corea del Norte' },
  { code: 'OM', name: 'Oman', nameEs: 'Omán' },
  { code: 'PK', name: 'Pakistan', nameEs: 'Pakistán' },
  { code: 'PS', name: 'Palestine', nameEs: 'Palestina' },
  { code: 'PH', name: 'Philippines', nameEs: 'Filipinas' },
  { code: 'QA', name: 'Qatar', nameEs: 'Catar' },
  { code: 'SA', name: 'Saudi Arabia', nameEs: 'Arabia Saudita' },
  { code: 'SG', name: 'Singapore', nameEs: 'Singapur' },
  { code: 'KR', name: 'South Korea', nameEs: 'Corea del Sur' },
  { code: 'LK', name: 'Sri Lanka', nameEs: 'Sri Lanka' },
  { code: 'SY', name: 'Syria', nameEs: 'Siria' },
  { code: 'TW', name: 'Taiwan', nameEs: 'Taiwán' },
  { code: 'TJ', name: 'Tajikistan', nameEs: 'Tayikistán' },
  { code: 'TH', name: 'Thailand', nameEs: 'Tailandia' },
  { code: 'TL', name: 'Timor-Leste', nameEs: 'Timor Oriental' },
  { code: 'TR', name: 'Turkey', nameEs: 'Turquía' },
  { code: 'TM', name: 'Turkmenistan', nameEs: 'Turkmenistán' },
  { code: 'AE', name: 'United Arab Emirates', nameEs: 'Emiratos Árabes Unidos' },
  { code: 'UZ', name: 'Uzbekistan', nameEs: 'Uzbekistán' },
  { code: 'VN', name: 'Vietnam', nameEs: 'Vietnam' },
  { code: 'YE', name: 'Yemen', nameEs: 'Yemen' },

  // Africa
  { code: 'DZ', name: 'Algeria', nameEs: 'Argelia' },
  { code: 'AO', name: 'Angola', nameEs: 'Angola' },
  { code: 'BJ', name: 'Benin', nameEs: 'Benín' },
  { code: 'BW', name: 'Botswana', nameEs: 'Botsuana' },
  { code: 'BF', name: 'Burkina Faso', nameEs: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi', nameEs: 'Burundi' },
  { code: 'CM', name: 'Cameroon', nameEs: 'Camerún' },
  { code: 'CV', name: 'Cape Verde', nameEs: 'Cabo Verde' },
  { code: 'CF', name: 'Central African Republic', nameEs: 'República Centroafricana' },
  { code: 'TD', name: 'Chad', nameEs: 'Chad' },
  { code: 'KM', name: 'Comoros', nameEs: 'Comoras' },
  { code: 'CG', name: 'Congo', nameEs: 'Congo' },
  { code: 'CD', name: 'Democratic Republic of the Congo', nameEs: 'República Democrática del Congo' },
  { code: 'CI', name: 'Côte d\'Ivoire', nameEs: 'Costa de Marfil' },
  { code: 'DJ', name: 'Djibouti', nameEs: 'Yibuti' },
  { code: 'EG', name: 'Egypt', nameEs: 'Egipto' },
  { code: 'GQ', name: 'Equatorial Guinea', nameEs: 'Guinea Ecuatorial' },
  { code: 'ER', name: 'Eritrea', nameEs: 'Eritrea' },
  { code: 'ET', name: 'Ethiopia', nameEs: 'Etiopía' },
  { code: 'GA', name: 'Gabon', nameEs: 'Gabón' },
  { code: 'GM', name: 'Gambia', nameEs: 'Gambia' },
  { code: 'GH', name: 'Ghana', nameEs: 'Ghana' },
  { code: 'GN', name: 'Guinea', nameEs: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau', nameEs: 'Guinea-Bisáu' },
  { code: 'KE', name: 'Kenya', nameEs: 'Kenia' },
  { code: 'LS', name: 'Lesotho', nameEs: 'Lesoto' },
  { code: 'LR', name: 'Liberia', nameEs: 'Liberia' },
  { code: 'LY', name: 'Libya', nameEs: 'Libia' },
  { code: 'MG', name: 'Madagascar', nameEs: 'Madagascar' },
  { code: 'MW', name: 'Malawi', nameEs: 'Malaui' },
  { code: 'ML', name: 'Mali', nameEs: 'Malí' },
  { code: 'MR', name: 'Mauritania', nameEs: 'Mauritania' },
  { code: 'MU', name: 'Mauritius', nameEs: 'Mauricio' },
  { code: 'MA', name: 'Morocco', nameEs: 'Marruecos' },
  { code: 'MZ', name: 'Mozambique', nameEs: 'Mozambique' },
  { code: 'NA', name: 'Namibia', nameEs: 'Namibia' },
  { code: 'NE', name: 'Niger', nameEs: 'Níger' },
  { code: 'NG', name: 'Nigeria', nameEs: 'Nigeria' },
  { code: 'RW', name: 'Rwanda', nameEs: 'Ruanda' },
  { code: 'ST', name: 'São Tomé and Príncipe', nameEs: 'Santo Tomé y Príncipe' },
  { code: 'SN', name: 'Senegal', nameEs: 'Senegal' },
  { code: 'SC', name: 'Seychelles', nameEs: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone', nameEs: 'Sierra Leona' },
  { code: 'SO', name: 'Somalia', nameEs: 'Somalia' },
  { code: 'ZA', name: 'South Africa', nameEs: 'Sudáfrica' },
  { code: 'SS', name: 'South Sudan', nameEs: 'Sudán del Sur' },
  { code: 'SD', name: 'Sudan', nameEs: 'Sudán' },
  { code: 'SZ', name: 'Eswatini', nameEs: 'Esuatini' },
  { code: 'TZ', name: 'Tanzania', nameEs: 'Tanzania' },
  { code: 'TG', name: 'Togo', nameEs: 'Togo' },
  { code: 'TN', name: 'Tunisia', nameEs: 'Túnez' },
  { code: 'UG', name: 'Uganda', nameEs: 'Uganda' },
  { code: 'ZM', name: 'Zambia', nameEs: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe', nameEs: 'Zimbabue' },

  // Oceania
  { code: 'AU', name: 'Australia', nameEs: 'Australia' },
  { code: 'FJ', name: 'Fiji', nameEs: 'Fiyi' },
  { code: 'KI', name: 'Kiribati', nameEs: 'Kiribati' },
  { code: 'MH', name: 'Marshall Islands', nameEs: 'Islas Marshall' },
  { code: 'FM', name: 'Micronesia', nameEs: 'Micronesia' },
  { code: 'NR', name: 'Nauru', nameEs: 'Nauru' },
  { code: 'NZ', name: 'New Zealand', nameEs: 'Nueva Zelanda' },
  { code: 'PW', name: 'Palau', nameEs: 'Palaos' },
  { code: 'PG', name: 'Papua New Guinea', nameEs: 'Papúa Nueva Guinea' },
  { code: 'WS', name: 'Samoa', nameEs: 'Samoa' },
  { code: 'SB', name: 'Solomon Islands', nameEs: 'Islas Salomón' },
  { code: 'TO', name: 'Tonga', nameEs: 'Tonga' },
  { code: 'TV', name: 'Tuvalu', nameEs: 'Tuvalu' },
  { code: 'VU', name: 'Vanuatu', nameEs: 'Vanuatu' },
]

/**
 * Get country options for select/dropdown
 * @param locale - User locale ('es' or 'en')
 * @returns Array of { value: code, label: name }
 */
export function getCountryOptions(locale: 'es' | 'en' = 'es') {
  return COUNTRIES.map(country => ({
    value: country.code,
    label: locale === 'es' ? country.nameEs : country.name
  })).sort((a, b) => a.label.localeCompare(b.label, locale))
}

/**
 * Get country name by code
 * @param code - Country code (e.g., 'CL', 'US')
 * @param locale - User locale
 * @returns Country name or code if not found
 */
export function getCountryName(code: string, locale: 'es' | 'en' = 'es'): string {
  const country = COUNTRIES.find(c => c.code === code)
  if (!country) return code
  return locale === 'es' ? country.nameEs : country.name
}
