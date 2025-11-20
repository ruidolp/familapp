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
import { Calculator } from 'lucide-react'
import { CalculatorDrawer } from './CalculatorDrawer'
import { useCurrency } from '@/presentation/providers/currency-provider'
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
        String(item.cantidad_comprada || item.cantidad_planeada || 1)
      )
      setPrecioUnitario(item.precio_unitario ? String(item.precio_unitario) : '')
      setPrecioTotal(item.precio_total ? String(item.precio_total) : '')
    }
  }, [item])

  // Auto-calculate total when unitario or cantidad changes
  const handleUnitarioChange = (value: string) => {
    setPrecioUnitario(value)

    const unitario = parseFloat(value)
    const cant = parseFloat(cantidad)

    if (!isNaN(unitario) && !isNaN(cant) && cant > 0) {
      const total = unitario * cant
      setPrecioTotal(total.toFixed(decimales))
    }
  }

  // Auto-calculate unitario when total changes
  const handleTotalChange = (value: string) => {
    setPrecioTotal(value)

    const total = parseFloat(value)
    const cant = parseFloat(cantidad)

    if (!isNaN(total) && !isNaN(cant) && cant > 0) {
      const unitario = total / cant
      setPrecioUnitario(unitario.toFixed(decimales))
    }
  }

  // Recalculate when cantidad changes
  const handleCantidadChange = (value: string) => {
    setCantidad(value)

    const cant = parseFloat(value)

    // If we have unitario, recalculate total
    if (precioUnitario && !isNaN(cant) && cant > 0) {
      const unitario = parseFloat(precioUnitario)
      if (!isNaN(unitario)) {
        const total = unitario * cant
        setPrecioTotal(total.toFixed(decimales))
      }
    }
    // If we have total, recalculate unitario
    else if (precioTotal && !isNaN(cant) && cant > 0) {
      const total = parseFloat(precioTotal)
      if (!isNaN(total)) {
        const unitario = total / cant
        setPrecioUnitario(unitario.toFixed(decimales))
      }
    }
  }

  const handleSave = () => {
    const data: { unitario?: number; total?: number; cantidad?: number } = {}

    const cant = parseFloat(cantidad)
    if (!isNaN(cant) && cant > 0) {
      data.cantidad = cant
    }

    const unitario = parseFloat(precioUnitario)
    if (!isNaN(unitario)) {
      data.unitario = unitario
    }

    const total = parseFloat(precioTotal)
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
          <SheetHeader className="border-b border-border bg-card px-6 py-4 text-left">
            <SheetTitle className="text-base font-semibold">
              Registrar precio
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{item.product_name}</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="rounded-2xl border border-border/70 bg-card-accent px-4 py-3">
              <p className="text-xs uppercase text-muted-foreground">Detalle del producto</p>
              <p className="text-base font-semibold mt-1">{item.product_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.unidad_medida ? `${item.unidad_medida}` : 'Sin unidad definida'}
                {item.marca ? ` • ${item.marca}` : ''}
              </p>
              {item.precio_total && (
                <p className="text-xs text-muted-foreground mt-2">
                  Último total guardado:{' '}
                  <span className="font-semibold text-primary">
                    {formatNumber(item.precio_total)}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad" className="text-sm font-medium">
                  Cantidad comprada
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  inputMode="decimal"
                  step={stepValue}
                  value={cantidad}
                  onChange={e => handleCantidadChange(e.target.value)}
                  placeholder={String(item.cantidad_planeada || 1)}
                  className="h-12 text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Planeado: {item.cantidad_planeada} {item.unidad_medida || 'unidad(es)'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unitario" className="text-sm font-medium">
                    Precio unitario
                  </Label>
                  <Button variant="ghost" size="sm" onClick={() => setCalculatorOpen(true)}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculadora
                  </Button>
                </div>
                <Input
                  id="unitario"
                  type="number"
                  inputMode="decimal"
                  step={stepValue}
                  value={precioUnitario}
                  onChange={e => handleUnitarioChange(e.target.value)}
                  placeholder={item.precio_unitario ? String(item.precio_unitario) : 'Ej: 2500'}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total" className="text-sm font-medium">
                  Precio total
                </Label>
                <Input
                  id="total"
                  type="number"
                  inputMode="decimal"
                  step={stepValue}
                  value={precioTotal}
                  onChange={e => handleTotalChange(e.target.value)}
                  placeholder={item.precio_total ? String(item.precio_total) : 'Ej: 10000'}
                  className="h-12 text-xl font-semibold"
                />
              </div>

              {precioUnitario && cantidad && (
                <div className="rounded-xl border border-border/70 bg-muted px-4 py-3 text-sm">
                  <p className="text-muted-foreground">
                    {cantidad} × {formatNumber(Number(precioUnitario) || 0)} ={' '}
                    <span className="font-semibold text-foreground">
                      {precioTotal ? formatNumber(Number(precioTotal) || 0) : formatNumber(0)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-background px-6 py-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!precioTotal && !precioUnitario}
                className="flex-1 h-12 text-base font-semibold"
              >
                Guardar
              </Button>
            </div>
            {item.status === 'purchased' && onMarkAsNotPurchased && (
              <Button
                variant="ghost"
                className="w-full text-sm text-destructive hover:text-destructive"
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
