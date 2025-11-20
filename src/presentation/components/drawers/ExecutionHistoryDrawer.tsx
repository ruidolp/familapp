'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ReceiptText, MapPin, CalendarClock, TimerReset } from 'lucide-react'
import { useCurrency } from '@/presentation/providers/currency-provider'
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
  const t = useTranslations('shopping.history')
  const { formatNumber, simbolo, decimales } = useCurrency()
  const [serverItems, setServerItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Fetch items del servidor cuando sea necesario
  useEffect(() => {
    const fetchServerItems = async () => {
      // Solo hacer fetch si:
      // 1. El drawer está abierto
      // 2. Tenemos una ejecución
      // 3. La ejecución NO tiene items locales (es del servidor)
      // 4. Tenemos un ID de ejecución
      if (!isOpen || !execution) {
        setServerItems([])
        return
      }

      const hasLocalItems = 'items' in execution && Array.isArray(execution.items)
      if (hasLocalItems) {
        setServerItems([])
        return
      }

      // Obtener el ID de la ejecución (puede ser 'id' o 'localId')
      const executionId = execution.id || execution.localId
      if (!executionId) {
        setServerItems([])
        return
      }

      // Hacer fetch de los items del servidor
      setLoadingItems(true)
      try {
        const response = await fetch(`/api/shopping-executions/${executionId}/items`)
        if (response.ok) {
          const data = await response.json()
          // Filtrar solo los items que fueron comprados (es_comprado = true)
          const purchasedItems = (data.items || []).filter((item: any) => item.es_comprado)
          setServerItems(purchasedItems)
        } else {
          console.error('Error fetching execution items:', response.statusText)
          setServerItems([])
        }
      } catch (error) {
        console.error('Error fetching execution items:', error)
        setServerItems([])
      } finally {
        setLoadingItems(false)
      }
    }

    fetchServerItems()
  }, [isOpen, execution])

  if (!execution) return null

  // Helper para obtener items según el tipo
  const getItems = () => {
    if ('items' in execution && Array.isArray(execution.items)) {
      // LocalShoppingExecution
      return execution.items.filter((item: any) => item.status === 'purchased')
    }
    // ShoppingExecutions del servidor - usar items obtenidos del fetch
    return serverItems
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
  // Helper para normalizar items (local vs servidor)
  const normalizeItem = (item: any) => {
    // Si es un item local, ya tiene el formato correcto
    if (item.localId) return item

    // Normalizar item del servidor a formato esperado
    return {
      localId: item.id,
      product_name: item.product_name || 'Producto',
      categoria_producto_nombre: item.categoria_producto_nombre,
      cantidad_comprada: item.cantidad_comprada,
      unidad_medida: item.unidad_medida,
      precio_unitario: item.precio_unitario ? parseFloat(String(item.precio_unitario)) : undefined,
      precio_total: item.precio_total ? parseFloat(String(item.precio_total)) : undefined,
      marca: item.marca,
    }
  }

  const normalizedItems = items.map(normalizeItem)

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
  if (normalizedItems.length > 0) {
    totalPrice = normalizedItems.reduce((sum: number, item: any) => sum + (item.precio_total || 0), 0) || 0
  } else if ('total_manual' in execution && execution.total_manual) {
    totalPrice = parseFloat(String(execution.total_manual))
  } else if ('total_calculated' in execution && execution.total_calculated) {
    totalPrice = parseFloat(String(execution.total_calculated))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} direction="right">
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto bg-background">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <Card className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t('purchaseDate')}</p>
                <p className="text-base font-semibold text-foreground">
                  {startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-muted-foreground flex items-center gap-1 justify-end">
                  <TimerReset className="h-3.5 w-3.5" />
                  Duración
                </p>
                <p className="text-sm font-semibold text-foreground">{formatDuration(durationSeconds)}</p>
              </div>
            </div>

            {(execution as any).store_name && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground truncate">
                  {(execution as any).store_name}
                </span>
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(totalPrice)}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="flex items-center gap-1 justify-end">
                  <CalendarClock className="h-4 w-4" />
                  {t('purchaseDate')}
                </p>
                <p>
                  {startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('purchasedProducts')} ({normalizedItems.length})
            </h3>
            {loadingItems && <span className="text-xs text-muted-foreground">Cargando...</span>}
          </div>
          <div className="space-y-3">
            {loadingItems ? (
              <Card className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Cargando productos...
              </Card>
            ) : normalizedItems.length > 0 ? (
              normalizedItems.map((item: any) => (
                <Card key={item.localId} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{item.product_name}</p>
                      {item.categoria_producto_nombre && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.categoria_producto_nombre}
                        </p>
                      )}
                    </div>
                    {item.precio_total && (
                      <span className="text-base font-semibold text-foreground">
                        {simbolo ?? ''}{item.precio_total.toFixed(decimales)}
                      </span>
                    )}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {item.cantidad_comprada && (
                      <span>
                        {t('quantity')}: {item.cantidad_comprada}
                        {item.unidad_medida && ` ${item.unidad_medida}`}
                      </span>
                    )}
                    {item.precio_unitario && (
                      <span>
                        {t('unitPrice')}: {simbolo ?? ''}{item.precio_unitario.toFixed(decimales)}
                      </span>
                    )}
                    {item.marca && <span>{item.marca}</span>}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
                {t('noPurchasedProducts')}
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
