'use client'

/**
 * PriceInputDrawer Component
 *
 * Drawer for inputting product prices during shopping execution
 * Features:
 * - Cantidad comprada (defaults to planeada)
 * - Precio unitario
 * - Precio total
 * - Auto-calculation between unitario and total
 * - Calculator button
 */

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Calculator, Minus, Plus } from 'lucide-react'
import { CalculatorDrawer } from './CalculatorDrawer'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { useCurrencyInput } from '@/presentation/hooks/useCurrencyInput'
import type { LocalExecutionItem } from '@/domain/types/shopping-execution'

interface PriceInputDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: LocalExecutionItem | null
  onSave: (data: { unitario?: number; total?: number; cantidad?: number }) => void
  onMarkAsNotPurchased?: () => void
}

export function PriceInputDrawer({
  open,
  onOpenChange,
  item,
  onSave,
  onMarkAsNotPurchased,
}: PriceInputDrawerProps) {
  const { decimales, formatNumber } = useCurrency()
  const { formatInputValue, parseInputToNumber } = useCurrencyInput()
  const [cantidad, setCantidad] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)

  const stepValue = decimales > 0
    ? Number((1 / Math.pow(10, decimales)).toFixed(decimales))
    : 1

  // Initialize values when item changes
  useEffect(() => {
    if (item) {
      setCantidad(
        formatInputValue(String(item.cantidad_comprada || item.cantidad_planeada || 1))
      )
      setPrecioUnitario(item.precio_unitario ? formatInputValue(String(item.precio_unitario)) : '')
      setPrecioTotal(item.precio_total ? formatInputValue(String(item.precio_total)) : '')
    }
  }, [item, formatInputValue])

  // Auto-calculate total when unitario or cantidad changes
  const handleUnitarioChange = (value: string) => {
    const formatted = formatInputValue(value)
    setPrecioUnitario(formatted)

    const unitario = parseInputToNumber(formatted)
    const cant = parseInputToNumber(cantidad)

    if (!isNaN(unitario) && !isNaN(cant) && cant > 0) {
      const total = unitario * cant
      setPrecioTotal(formatInputValue(total.toFixed(decimales)))
    }
  }

  // Auto-calculate unitario when total changes
  const handleTotalChange = (value: string) => {
    const formatted = formatInputValue(value)
    setPrecioTotal(formatted)

    const total = parseInputToNumber(formatted)
    const cant = parseInputToNumber(cantidad)

    if (!isNaN(total) && !isNaN(cant) && cant > 0) {
      const unitario = total / cant
      setPrecioUnitario(formatInputValue(unitario.toFixed(decimales)))
    }
  }

  // Recalculate when cantidad changes
  const handleCantidadChange = (value: string) => {
    const formatted = formatInputValue(value)
    setCantidad(formatted)

    const cant = parseInputToNumber(formatted)

    // If we have unitario, recalculate total
    if (precioUnitario && !isNaN(cant) && cant > 0) {
      const unitario = parseInputToNumber(precioUnitario)
      if (!isNaN(unitario)) {
        const total = unitario * cant
        setPrecioTotal(formatInputValue(total.toFixed(decimales)))
      }
    }
    // If we have total, recalculate unitario
    else if (precioTotal && !isNaN(cant) && cant > 0) {
      const total = parseInputToNumber(precioTotal)
      if (!isNaN(total)) {
        const unitario = total / cant
        setPrecioUnitario(formatInputValue(unitario.toFixed(decimales)))
      }
    }
  }

  const adjustCantidad = (delta: number) => {
    if (!item) return
    const fallback = item.cantidad_comprada || item.cantidad_planeada || 1
    const parsed = parseInputToNumber(cantidad || String(fallback))
    const current = !isNaN(parsed) && parsed > 0 ? parsed : fallback
    const increment = decimales > 0 ? delta * stepValue : delta
    const minValue = decimales > 0 ? stepValue : 1
    const nextRaw = current + increment
    const nextValue = Math.max(minValue, nextRaw)
    const formatted =
      decimales > 0 ? nextValue.toFixed(decimales) : String(Math.round(nextValue))
    handleCantidadChange(formatted)
  }

  const handleSave = () => {
    const data: { unitario?: number; total?: number; cantidad?: number } = {}

    const cant = parseInputToNumber(cantidad)
    if (!isNaN(cant) && cant > 0) {
      data.cantidad = cant
    }

    const unitario = parseInputToNumber(precioUnitario)
    if (!isNaN(unitario)) {
      data.unitario = unitario
    }

    const total = parseInputToNumber(precioTotal)
    if (!isNaN(total)) {
      data.total = total
    }

    onSave(data)
    onOpenChange(false)
  }

  if (!item) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[460px] p-0 flex h-[90vh] flex-col">
          <SheetHeader className="border-b border-border bg-gradient-to-r from-primary/10 via-card to-background px-6 py-5 text-left">
            <SheetTitle className="typography-label-lg">Registrar precio</SheetTitle>
            <div className="flex flex-wrap items-center gap-2">
              <p className="typography-body-sm text-foreground font-semibold">{item.product_name}</p>
              {item.unidad_medida && (
                <span className="rounded-full bg-primary/10 text-primary typography-metadata px-2 py-0.5">
                  {item.unidad_medida}
                </span>
              )}
              {item.marca && (
                <span className="rounded-full bg-muted px-2 py-0.5 typography-metadata text-muted-foreground">
                  {item.marca}
                </span>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
              <div className="space-y-3 px-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cantidad" className="typography-label">
                    Cantidad comprada
                  </Label>
                  <span className="typography-metadata text-muted-foreground">
                    Planeado: {item.cantidad_planeada} {item.unidad_medida || 'unid.'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={() => adjustCantidad(-1)}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    id="cantidad"
                    type="number"
                    inputMode="decimal"
                    step={stepValue}
                    value={cantidad}
                    onChange={e => handleCantidadChange(e.target.value)}
                    placeholder={String(item.cantidad_planeada || 1)}
                    className="h-14 flex-1 text-center text-2xl font-semibold rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl"
                    onClick={() => adjustCantidad(1)}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <p className="typography-metadata text-muted-foreground">
                  Ajusta la cantidad real comprada para que el cálculo sea exacto.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
              <div className="px-4 py-4">
                <p className="typography-label text-primary">Ingresa precio unitario o total</p>
                <p className="typography-body-sm text-muted-foreground">
                  Solo necesitas uno; calculamos el otro automáticamente.
                </p>
              </div>

              <div className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="unitario" className="typography-metadata text-muted-foreground">
                    Precio unitario
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="unitario"
                        type="text"
                        inputMode="decimal"
                        step={stepValue}
                        value={precioUnitario}
                        onChange={e => handleUnitarioChange(e.target.value)}
                        placeholder="0"
                        className="h-12 w-full rounded-xl pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl"
                      onClick={() => setCalculatorOpen(true)}
                    >
                      <Calculator className="h-5 w-5" />
                      <span className="sr-only">Abrir calculadora</span>
                    </Button>
                  </div>
                  <p className="typography-metadata text-muted-foreground">
                    Ingrésalo si sabes el valor por unidad o kilo.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 typography-body-sm flex items-center gap-2 text-muted-foreground">
                  <span>{cantidad || '—'} {item.unidad_medida || 'unidades'}</span>
                  <span>×</span>
                  <span>{precioUnitario ? formatNumber(parseInputToNumber(precioUnitario) || 0) : '—'}</span>
                  <span>=</span>
                  <span className="font-semibold text-foreground">
                    {precioTotal ? formatNumber(parseInputToNumber(precioTotal) || 0) : '—'}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total" className="typography-metadata text-muted-foreground">
                    Precio total pagado
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="total"
                        type="text"
                        inputMode="decimal"
                        step={stepValue}
                        value={precioTotal}
                        onChange={e => handleTotalChange(e.target.value)}
                        placeholder="0"
                        className="h-12 rounded-xl pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl"
                      onClick={() => setCalculatorOpen(true)}
                    >
                      <Calculator className="h-5 w-5" />
                      <span className="sr-only">Abrir calculadora</span>
                    </Button>
                  </div>
                  <p className="typography-metadata text-muted-foreground">
                    Si ingresas el total, calculamos el unitario.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-border bg-background px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 typography-body"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!precioTotal && !precioUnitario}
                className="flex-1 h-12 typography-label-lg"
              >
                Guardar
              </Button>
            </div>
            {item.status === 'purchased' && onMarkAsNotPurchased && (
              <Button
                variant="ghost"
                className="w-full typography-body-sm text-destructive hover:text-destructive"
                onClick={() => {
                  onMarkAsNotPurchased()
                  onOpenChange(false)
                }}
              >
                Marcar como no comprado
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </>
  )
}
