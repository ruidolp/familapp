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
  SheetFooter,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Calculator } from 'lucide-react'
import { CalculatorDrawer } from './CalculatorDrawer'
import type { LocalExecutionItem } from '@/domain/types/shopping-execution'

interface PriceInputDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: LocalExecutionItem | null
  onSave: (data: { unitario?: number; total?: number; cantidad?: number }) => void
}

export function PriceInputDrawer({
  open,
  onOpenChange,
  item,
  onSave,
}: PriceInputDrawerProps) {
  const [cantidad, setCantidad] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)

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
      setPrecioTotal(total.toFixed(2))
    }
  }

  // Auto-calculate unitario when total changes
  const handleTotalChange = (value: string) => {
    setPrecioTotal(value)

    const total = parseFloat(value)
    const cant = parseFloat(cantidad)

    if (!isNaN(total) && !isNaN(cant) && cant > 0) {
      const unitario = total / cant
      setPrecioUnitario(unitario.toFixed(2))
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
        setPrecioTotal(total.toFixed(2))
      }
    }
    // If we have total, recalculate unitario
    else if (precioTotal && !isNaN(cant) && cant > 0) {
      const total = parseFloat(precioTotal)
      if (!isNaN(total)) {
        const unitario = total / cant
        setPrecioUnitario(unitario.toFixed(2))
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
        <SheetContent side="bottom" className="h-[500px] sm:max-w-[425px] sm:mx-auto">
          <SheetHeader>
            <SheetTitle className="text-left">
              Precio: {item.product_name}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="cantidad" className="text-base font-medium">
                Cantidad comprada
              </Label>
              <Input
                id="cantidad"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={cantidad}
                onChange={e => handleCantidadChange(e.target.value)}
                placeholder="Cantidad"
                className="text-lg h-12"
              />
              <p className="text-sm text-muted-foreground">
                Planeado: {item.cantidad_planeada} {item.unidad_medida || 'unidad(es)'}
              </p>
            </div>

            {/* Precio Unitario */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unitario" className="text-base font-medium">
                  Precio unitario
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalculatorOpen(true)}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculadora
                </Button>
              </div>
              <Input
                id="unitario"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={precioUnitario}
                onChange={e => handleUnitarioChange(e.target.value)}
                placeholder="Precio por unidad"
                className="text-lg h-12"
              />
            </div>

            {/* Precio Total */}
            <div className="space-y-2">
              <Label htmlFor="total" className="text-base font-medium">
                Precio total
              </Label>
              <Input
                id="total"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={precioTotal}
                onChange={e => handleTotalChange(e.target.value)}
                placeholder="Precio total"
                className="text-lg h-12 font-bold"
              />
            </div>

            {/* Calculation Info */}
            {precioUnitario && cantidad && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  {cantidad} × ${precioUnitario} = ${precioTotal}
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="absolute bottom-6 left-6 right-6 flex gap-2">
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
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </>
  )
}
