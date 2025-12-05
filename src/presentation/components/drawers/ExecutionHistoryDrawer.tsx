'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ReceiptText, MapPin, CalendarClock, TimerReset } from 'lucide-react'
import { useCurrency } from '@/presentation/providers/currency-provider'

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

  const safeNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

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

  const formatDateTime = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const get = (type: string) => parts.find(p => p.type === type)?.value || ''
    return `${get('day')} de ${get('month')} ${get('year')} ${get('hour')}:${get('minute')}`
  }

  const items = getItems()

  const normalizeItem = (item: any) => {
    // Si es un item local, ya tiene el formato correcto
    if (item.localId) {
      return {
        ...item,
        addedOnTheFly: item.addedOnTheFly || false,
      }
    }

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
      addedOnTheFly: item.es_agregado_vuelo || false,
    }
  }

  const normalizedItems = items.map(normalizeItem)

  // Separar items normales de items agregados on-the-fly
  const regularItems = normalizedItems.filter((item: any) => !item.addedOnTheFly)
  const onTheFlyItems = normalizedItems.filter((item: any) => item.addedOnTheFly)

  const itemsTotal = normalizedItems.reduce(
    (sum: number, item: any) => sum + (item.precio_total || 0),
    0
  )

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
  const durationSeconds = Math.max(
    0,
    Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
  )

  const manualTotal =
    safeNumber((execution as any).total_manual) ??
    safeNumber((execution as any).budget?.amount)
  const calculatedTotal =
    safeNumber((execution as any).total_calculated) ??
    safeNumber((execution as any).totalSpent) ??
    (itemsTotal > 0 ? itemsTotal : null)
  const purchaseTotal =
    manualTotal ??
    calculatedTotal ??
    (normalizedItems.length > 0 ? itemsTotal : null) ??
    0
  const budgetReference = safeNumber(
    (execution as any).budget?.enabled
      ? (execution as any).budget.amount
      : (execution as any).total_estimado
  )
  const budgetDelta = budgetReference !== null ? purchaseTotal - budgetReference : null
  const budgetStatus =
    budgetDelta !== null ? (budgetDelta > 0 ? 'over' : 'under') : null

  const estimatedBudget = budgetReference
  const onTheFlyTotal = onTheFlyItems.reduce(
    (sum: number, item: any) => sum + (item.precio_total || 0),
    0
  )

  const projectedTotal =
    estimatedBudget ??
    calculatedTotal ??
    manualTotal ??
    (purchaseTotal - onTheFlyTotal > 0 ? purchaseTotal - onTheFlyTotal : null)

  const additionalPercent =
    projectedTotal && projectedTotal > 0
      ? ((purchaseTotal - projectedTotal) / projectedTotal) * 100
      : null

  const clampTwoLines = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  }

  const storeName = (execution as any).store_name
  const formattedDateTime = formatDateTime(startDate)

  // Budget registration info
  const sobreInfo = (execution as any).sobre_info
  const categoriaInfo = (execution as any).categoria_info
  const marcaInfo = (execution as any).marca_info
  const hasRegistrationInfo = sobreInfo || categoriaInfo || marcaInfo

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-h-[90vh] flex-col overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background sm:mx-auto sm:max-h-[82vh] sm:max-w-5xl sm:rounded-3xl sm:border sm:border-border/80 sm:px-0 sm:shadow-2xl">
        <SheetHeader className="px-4 pb-2 pt-3 sm:px-8">
          <SheetTitle className="flex items-center gap-2 typography-label-lg">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            {t('title')}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-3 typography-body-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 typography-caption">
              <CalendarClock className="h-3.5 w-3.5" />
              {formattedDateTime}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 typography-caption">
              <TimerReset className="h-3.5 w-3.5" />
              {formatDuration(durationSeconds)}
            </span>
            {storeName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 typography-caption">
                <MapPin className="h-3.5 w-3.5" />
                {storeName}
              </span>
            )}
          </div>

          {/* Budget registration info */}
          {hasRegistrationInfo && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sobreInfo && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border border-primary/40">
                  {sobreInfo.emoji && <span>{sobreInfo.emoji}</span>}
                  {sobreInfo.nombre}
                </Badge>
              )}
              {categoriaInfo && (
                <Badge variant="outline" className="gap-1">
                  {categoriaInfo.emoji && <span>{categoriaInfo.emoji}</span>}
                  {categoriaInfo.nombre}
                </Badge>
              )}
              {marcaInfo && (
                <Badge variant="outline" className="gap-1 border-muted-foreground/40">
                  {marcaInfo.emoji && <span>{marcaInfo.emoji}</span>}
                  {marcaInfo.nombre}
                </Badge>
              )}
            </div>
          )}
        </SheetHeader>

        <SheetBody className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 sm:px-8">
          <Card className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/90 p-4 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
            <div className="flex flex-col gap-3">
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total de la compra</p>
                  <p className="text-4xl font-bold text-foreground leading-tight">
                    {formatNumber(purchaseTotal)}
                  </p>
                  {manualTotal !== null && calculatedTotal !== null && (
                    <p className="typography-body-sm text-muted-foreground">
                      Compra asistida: {formatNumber(calculatedTotal)}
                    </p>
                  )}
                </div>
                {budgetStatus && (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      budgetStatus === 'over'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-200'
                    }`}
                  >
                    {budgetStatus === 'over' ? 'Sobre presupuesto' : 'Dentro del presupuesto'}
                  </span>
                )}
              </div>

              <div className="relative grid gap-3 sm:grid-cols-3">
                {estimatedBudget !== null && (
                  <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm">
                    <p className="text-[11px] uppercase text-muted-foreground">Proyección</p>
                    <p className="typography-label-lg text-foreground">
                      {formatNumber(estimatedBudget)}
                    </p>
                    {budgetDelta !== null && (
                      <p className="typography-metadata mt-1 text-muted-foreground">
                        {budgetDelta > 0
                          ? `Te pasaste por ${formatNumber(budgetDelta)}`
                          : `Ahorro de ${formatNumber(Math.abs(budgetDelta))}`}
                      </p>
                    )}
                  </div>
                )}

                {onTheFlyItems.length > 0 && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase text-primary">Agregados en tienda</p>
                      <Badge variant="secondary" className="border border-primary/40 bg-primary/10 text-primary">
                        {onTheFlyItems.length}
                      </Badge>
                    </div>
                    <p className="typography-label-lg text-foreground">
                      {formatNumber(onTheFlyTotal)}
                    </p>
                    <p className="typography-metadata mt-1 text-muted-foreground">
                      Total de productos agregados durante la compra
                    </p>
                  </div>
                )}

                {onTheFlyItems.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm">
                    <p className="text-[11px] uppercase text-muted-foreground">Adicional vs proyección</p>
                    <p
                      className={`typography-label-lg ${
                        additionalPercent !== null && additionalPercent > 0
                          ? 'text-destructive'
                          : 'text-emerald-600 dark:text-emerald-200'
                      }`}
                    >
                      {additionalPercent !== null
                        ? `${additionalPercent > 0 ? '+' : ''}${additionalPercent.toFixed(1)}%`
                        : '—'}
                    </p>
                    <p className="typography-metadata mt-1 text-muted-foreground">
                      Referencia: {projectedTotal ? formatNumber(projectedTotal) : 'sin proyección'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Regular Products */}
          {regularItems.length > 0 && (
            <Card className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="typography-body-sm font-semibold text-foreground">
                  {t('purchasedProducts')} ({regularItems.length})
                </h3>
                {loadingItems && <span className="typography-metadata">Cargando...</span>}
              </div>

              {loadingItems ? (
                <Card className="rounded-xl border border-dashed border-border bg-muted/30 p-4 typography-body-sm text-muted-foreground">
                  Cargando productos...
                </Card>
              ) : (
                <div className="divide-y divide-border/70">
                  {regularItems.map((item: any) => (
                    <div key={item.localId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold typography-body-sm text-foreground" style={clampTwoLines}>
                            {item.product_name}
                          </p>
                          {item.marca && (
                            <Badge variant="secondary" className="border border-primary/40 bg-primary/10 text-primary">
                              {item.marca}
                            </Badge>
                          )}
                          {item.categoria_producto_nombre && (
                            <Badge variant="outline" className="border-border/70 text-xs">
                              {item.categoria_producto_nombre}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {item.cantidad_comprada && (
                            <span>
                              {item.cantidad_comprada}
                              {item.unidad_medida ? ` ${item.unidad_medida}` : ''}
                            </span>
                          )}
                          {item.precio_unitario && (
                            <span className="inline-flex items-center gap-1">
                              <Separator orientation="vertical" className="h-4" />
                              {simbolo ?? ''}
                              {item.precio_unitario.toFixed(decimales)}
                              {item.unidad_medida ? ` · ${item.unidad_medida}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {item.precio_total ? (
                          <p className="typography-label-lg text-foreground">
                            {simbolo ?? ''}
                            {item.precio_total.toFixed(decimales)}
                          </p>
                        ) : (
                          <p className="typography-body-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* On-the-fly Products - Special Section */}
          {onTheFlyItems.length > 0 && (
            <Card className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="typography-body-sm font-semibold text-foreground">
                    Agregados durante la compra
                  </h3>
                  <Badge variant="secondary" className="border border-primary/40 bg-primary/10 text-primary">
                    {onTheFlyItems.length}
                  </Badge>
                </div>
                <p className="typography-metadata text-muted-foreground">
                  Total: {formatNumber(onTheFlyTotal)}
                </p>
              </div>

              <div className="divide-y divide-primary/20">
                {onTheFlyItems.map((item: any) => (
                  <div key={item.localId} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold typography-body-sm text-foreground" style={clampTwoLines}>
                          {item.product_name}
                        </p>
                        <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                          Agregado
                        </Badge>
                        {item.marca && (
                          <Badge variant="secondary" className="border border-border/40 bg-muted text-foreground">
                            {item.marca}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.cantidad_comprada && (
                          <span>
                            {item.cantidad_comprada}
                            {item.unidad_medida ? ` ${item.unidad_medida}` : ''}
                          </span>
                        )}
                        {item.precio_unitario && (
                          <span className="inline-flex items-center gap-1">
                            <Separator orientation="vertical" className="h-4" />
                            {simbolo ?? ''}
                            {item.precio_unitario.toFixed(decimales)}
                            {item.unidad_medida ? ` · ${item.unidad_medida}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.precio_total ? (
                        <p className="typography-label-lg text-foreground">
                          {simbolo ?? ''}
                          {item.precio_total.toFixed(decimales)}
                        </p>
                      ) : (
                        <p className="typography-body-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!loadingItems && normalizedItems.length === 0 && (
            <Card className="rounded-xl border border-dashed border-border bg-muted/30 p-4 typography-body-sm text-muted-foreground text-center">
              {t('noPurchasedProducts')}
            </Card>
          )}
        </SheetBody>

        <SheetFooter className="px-4 pb-4 sm:px-8">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
