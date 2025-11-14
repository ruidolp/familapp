/**
 * Cliente HTTP centralizado para todas las llamadas a la API
 *
 * Este cliente permite separar completamente el frontend del backend.
 *
 * Estrategia de URLs:
 * - En el NAVEGADOR (client-side): Usa URLs relativas (ej: '/api/config')
 *   El navegador resuelve automáticamente al dominio actual (localhost, Vercel, etc.)
 *   No requiere configurar API_BASE_URL en variables de entorno.
 *
 * - En el SERVIDOR (server-side): Usa URLs absolutas desde appConfig.api.baseUrl
 *   Permite llamadas internas entre servicios si es necesario.
 *   Se configura con la variable de entorno API_BASE_URL.
 *
 * Características:
 * - Centraliza todas las llamadas HTTP
 * - Manejo de errores consistente
 * - Soporte para autenticación (headers automáticos)
 * - Tipos TypeScript fuertes
 * - Funciona automáticamente en cualquier entorno (localhost, Vercel, custom domain)
 */

import { appConfig } from '@/config/app.config'

/**
 * Opciones de configuración para requests
 */
interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: any
  params?: Record<string, string | number | boolean>
}

/**
 * Respuesta estándar de la API
 */
interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Error personalizado de API
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Cliente HTTP centralizado
 */
class ApiClient {
  private baseUrl: string

  constructor() {
    // Estrategia de URLs:
    // 1. Si NEXT_PUBLIC_API_BASE_URL está configurada: Usar esa URL (backend separado)
    // 2. Si estamos en navegador y no hay NEXT_PUBLIC_API_BASE_URL: Usar URLs relativas
    // 3. Si estamos en servidor: Usar appConfig.api.baseUrl
    if (typeof window !== 'undefined') {
      // Navegador (client-side)
      this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    } else {
      // Servidor (server-side)
      this.baseUrl = appConfig.api.baseUrl
    }
  }

  /**
   * Construye la URL completa con query params
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    // Si baseUrl está vacío (navegador), usar endpoint directamente (URL relativa)
    // Si baseUrl existe (servidor), construir URL absoluta
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint

    if (!params) return url

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    return `${url}?${searchParams.toString()}`
  }

  /**
   * Request genérico
   */
  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { body, params, headers = {}, ...restConfig } = config

    try {
      const url = this.buildUrl(endpoint, params)

      const response = await fetch(url, {
        ...restConfig,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      // Intentar parsear respuesta JSON
      let data: any
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Si la respuesta no es OK, lanzar error
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          data
        )
      }

      // Si la API retorna { success: false }, lanzar error
      if (data?.success === false) {
        throw new ApiError(
          response.status,
          data.error || data.message || 'Request failed',
          data
        )
      }

      return data as T
    } catch (error) {
      // Re-lanzar ApiError tal cual
      if (error instanceof ApiError) {
        throw error
      }

      // Network errors u otros errores
      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Network error',
        error
      )
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
    })
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
    })
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
    })
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
    })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body,
    })
  }

  /**
   * Upload de archivos (multipart/form-data)
   */
  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // NO establecer Content-Type, el browser lo hace automáticamente con boundary
      })

      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data?.error || data?.message || `HTTP ${response.status}`,
          data
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Upload failed',
        error
      )
    }
  }
}

/**
 * Instancia singleton del cliente
 */
export const apiClient = new ApiClient()

/**
 * Hook para manejo de errores en componentes
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}
