/**
 * Utilidades para detectar el país del usuario
 */

/**
 * Obtiene el código de país del usuario
 * Intenta desde: headers (Vercel), localStorage, o un fallback por defecto
 */
export async function getUserCountry(): Promise<string> {
  // Primero, intentar obtener desde una API endpoint que lea los headers
  try {
    const response = await fetch('/api/user/country', {
      method: 'GET',
    })
    if (response.ok) {
      const data = await response.json()
      if (data.country) {
        return data.country
      }
    }
  } catch (error) {
    console.error('Error fetching country from API:', error)
  }

  // Fallback: detectar por geolocalización del navegador (muy básico)
  try {
    const locale = navigator.language || 'es-CL'
    // Extractar código de país del locale (ej: 'es-CL' → 'CL')
    const countryCode = locale.split('-')[1]?.toUpperCase()
    if (countryCode && countryCode.length === 2) {
      return countryCode
    }
  } catch {
    // Ignorar errores
  }

  // Default: Chile
  return 'CL'
}
