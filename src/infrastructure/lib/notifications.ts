import { toast } from 'sonner'

/**
 * Módulo de notificaciones reutilizable usando Sonner
 *
 * Centraliza todas las notificaciones de la aplicación para evitar duplicidad
 * y mantener consistencia en los mensajes.
 */

export const notify = {
  /**
   * Notificación de éxito al crear un recurso
   */
  created: (resource: string) => {
    toast.success('¡Creado exitosamente!', {
      description: `${resource} ha sido creado correctamente`,
      duration: 3000,
    })
  },

  /**
   * Notificación de éxito al editar un recurso
   */
  updated: (resource: string) => {
    toast.success('¡Actualizado exitosamente!', {
      description: `${resource} ha sido actualizado correctamente`,
      duration: 3000,
    })
  },

  /**
   * Notificación de éxito al eliminar un recurso
   */
  deleted: (resource: string) => {
    toast.success('¡Eliminado exitosamente!', {
      description: `${resource} ha sido eliminado correctamente`,
      duration: 3000,
    })
  },

  /**
   * Notificación de recurso duplicado
   */
  duplicate: (resource: string, field?: string) => {
    const description = field
      ? `Ya existe un ${resource.toLowerCase()} con ese ${field}`
      : `Este ${resource.toLowerCase()} ya existe`

    toast.error('Duplicado', {
      description,
      duration: 4000,
    })
  },

  /**
   * Notificación de error genérico
   */
  error: (message?: string) => {
    toast.error('Error', {
      description: message || 'Ocurrió un error. Por favor, intenta nuevamente',
      duration: 4000,
    })
  },

  /**
   * Notificación de éxito personalizada
   */
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 3000,
    })
  },

  /**
   * Notificación de advertencia
   */
  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 3500,
    })
  },

  /**
   * Notificación informativa
   */
  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 3000,
    })
  },

  /**
   * Notificación de promesa (loading → success/error)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string
      error: string
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },
}
