'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { X, Clock, MapPin, DollarSign } from 'lucide-react'
import type { LocalShoppingExecution } from '@/domain/types/shopping-execution'

interface ExecutionHistoryDrawerProps {
  execution: any // Soporta LocalShoppingExecution, ShoppingExecutions, o ShoppingExecution local
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ExecutionHistoryDrawer({
  execution,
  isOpen,
  onOpenChange,
}: ExecutionHistoryDrawerProps) {
  if (!execution) return null

  // Helper para obtener items según el tipo
  const getItems = () => {
    if ('items' in execution && Array.isArray(execution.items)) {
      // LocalShoppingExecution
      return execution.items.filter((item: any) => item.status === 'purchased')
    }
    // ShoppingExecutions del servidor - no tiene items directamente
    return []
  }

  // Helper para formatear tiempo
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Helper para formatear duración
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    if (secs === 0) return `${mins}m`
    return `${mins}m ${secs}s`
  }

  const items = getItems()
  // Check if execution is not synced - verify syncStatus field
  const isNotSynced = 'syncStatus' in execution && execution.syncStatus !== 'synced'

  // Convertir dates de manera segura considerando que pueden ser Date o string
  const startDate = new Date(
    execution.started_at instanceof Date
      ? execution.started_at
      : typeof execution.started_at === 'string'
        ? execution.started_at
        : new Date()
  )
  const endDate = new Date(
    execution.completed_at instanceof Date
      ? execution.completed_at
      : typeof execution.completed_at === 'string' && execution.completed_at
        ? execution.completed_at
        : new Date()
  )
  const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)

  // Calcular total desde items o desde campos total_* del servidor
  let totalPrice = 0
  if (items.length > 0) {
    totalPrice = items.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0) || 0
  } else if ('total_manual' in execution && execution.total_manual) {
    totalPrice = parseFloat(String(execution.total_manual))
  } else if ('total_calculated' in execution && execution.total_calculated) {
    totalPrice = parseFloat(String(execution.total_calculated))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} direction="right">
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Clock size={20} className="text-emerald-600" />
            Historial de Compra
            {isNotSynced && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                No sincronizado
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Header Info */}
        <div className="space-y-4 mb-6">
          {/* Horarios */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Inicio</p>
              <p className="font-semibold text-sm">
                {formatTime(startDate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {startDate.toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Finalización</p>
              <p className="font-semibold text-sm">
                {formatTime(endDate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {endDate.toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          {/* Duration and Store */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Duración</p>
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                {formatDuration(durationSeconds)}
              </p>
            </div>
            {(execution as any).store_name && (
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Tienda
                </p>
                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100 truncate">
                  {(execution as any).store_name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3 text-foreground">
            Productos Comprados ({items.length})
          </h3>

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item: any) => (
                <div
                  key={item.localId}
                  className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">
                        {item.product_name}
                      </p>
                      {item.categoria_producto_nombre && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.categoria_producto_nombre}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      {item.cantidad_comprada && (
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.cantidad_comprada}{' '}
                          {item.unidad_medida && `(${item.unidad_medida})`}
                        </p>
                      )}
                      {item.precio_unitario && (
                        <p className="text-xs text-muted-foreground">
                          Precio unit: ${item.precio_unitario.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {item.precio_total && (
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ${item.precio_total.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No hay productos registrados</p>
            </div>
          )}
        </div>

        {/* Total Section */}
        <div className="border-t pt-4 mb-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                Total
              </span>
            </div>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            <X size={16} className="mr-2" />
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
