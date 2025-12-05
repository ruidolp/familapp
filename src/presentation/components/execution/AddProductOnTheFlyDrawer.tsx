'use client'

/**
 * AddProductOnTheFlyDrawer Component
 *
 * Drawer for adding new products during shopping execution
 * Features:
 * - Nombre del producto (required)
 * - Cantidad
 * - Precio unitario
 * - Precio total
 * - Auto-calculation between unitario and total
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
import { Card } from '@/presentation/components/ui/card'

interface AddProductOnTheFlyDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    nombre: string
    cantidad: number
    unitario?: number
    total?: number
  }) => void
  availableProducts?: { id: string; nombre: string }[]
}

export function AddProductOnTheFlyDrawer({
  open,
  onOpenChange,
  onSave,
  availableProducts = [],
}: AddProductOnTheFlyDrawerProps) {
  const { decimales, formatNumber } = useCurrency()
  const { formatInputValue, parseInputToNumber } = useCurrencyInput()
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [precioTotal, setPrecioTotal] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<{ id: string; nombre: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const stepValue = decimales > 0
    ? Number((1 / Math.pow(10, decimales)).toFixed(decimales))
    : 1

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setNombre('')
      setCantidad(formatInputValue('1'))
      setPrecioUnitario('')
      setPrecioTotal('')
      setShowSuggestions(false)
      setFilteredProducts([])
      setSelectedIndex(-1)
    }
  }, [open, formatInputValue])

  // Autocomplete filtering
  useEffect(() => {
    if (!nombre.trim()) {
      setFilteredProducts([])
      setShowSuggestions(false)
      setSelectedIndex(-1)
      return
    }
    const search = nombre.toLowerCase().trim()
    const matches = availableProducts
      .filter(p => p.nombre.toLowerCase().includes(search))
      .slice(0, 10)
    setFilteredProducts(matches)
    setShowSuggestions(matches.length > 0)
    setSelectedIndex(-1)
  }, [nombre, availableProducts])

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
    const parsed = parseInputToNumber(cantidad || '1')
    const current = !isNaN(parsed) && parsed > 0 ? parsed : 1
    const increment = decimales > 0 ? delta * stepValue : delta
    const minValue = decimales > 0 ? stepValue : 1
    const nextRaw = current + increment
    const nextValue = Math.max(minValue, nextRaw)
    const formatted =
      decimales > 0 ? nextValue.toFixed(decimales) : String(Math.round(nextValue))
    handleCantidadChange(formatted)
  }

  const handleSave = () => {
    if (!nombre.trim()) return

    const data: {
      nombre: string
      cantidad: number
      unitario?: number
      total?: number
    } = {
      nombre: nombre.trim(),
      cantidad: parseInputToNumber(cantidad) || 1,
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

  const handleSelectSuggestion = (productName: string) => {
    setNombre(productName)
    setShowSuggestions(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        handleSelectSuggestion(filteredProducts[selectedIndex].nombre)
      } else {
        handleSave()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions && filteredProducts.length > 0) {
        setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const canSave = nombre.trim().length > 0

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[460px] p-0 flex h-[90vh] flex-col">
          <SheetHeader className="border-b border-border bg-card px-6 py-4 text-left">
            <SheetTitle className="typography-label-lg">
              Agregar producto
            </SheetTitle>
            <p className="typography-body-sm text-muted-foreground">
              Producto agregado durante la compra
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border">
              {/* Nombre del producto */}
              <div className="space-y-2 px-4 py-4">
                <Label htmlFor="nombre" className="typography-label">
                  Nombre del producto *
                </Label>
                <div className="relative">
                  <Input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onFocus={() => setShowSuggestions(filteredProducts.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                    placeholder="Nombre del producto"
                    className="h-12 typography-body-lg"
                    autoFocus
                    autoComplete="off"
                  />
                  {showSuggestions && filteredProducts.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto shadow-lg">
                      {filteredProducts.map((product, index) => (
                        <button
                          key={product.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors ${
                            index === selectedIndex ? 'bg-muted' : ''
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectSuggestion(product.nombre)
                          }}
                        >
                          <span className="typography-body-sm">{product.nombre}</span>
                        </button>
                      ))}
                    </Card>
                  )}
                </div>
              </div>

              {/* Cantidad */}
              <div className="space-y-2 px-4 py-4">
                <Label htmlFor="cantidad" className="typography-label">
                  Cantidad
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl"
                    onClick={() => adjustCantidad(-1)}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <Input
                    id="cantidad"
                    type="text"
                    inputMode="decimal"
                    step={stepValue}
                    value={cantidad}
                    onChange={e => handleCantidadChange(e.target.value)}
                    placeholder="1"
                    className="h-14 flex-1 text-center text-2xl font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl"
                    onClick={() => adjustCantidad(1)}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Precio unitario / total */}
              <div className="space-y-2 px-4 py-4">
                <Label htmlFor="unitario" className="typography-label">
                  Ingresa precio unitario o total (opcional)
                </Label>

                <div className="space-y-2">
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
                        className="h-12 flex-1 typography-body-lg pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setCalculatorOpen(true)}
                    >
                      <Calculator className="h-5 w-5" />
                      <span className="sr-only">Abrir calculadora</span>
                    </Button>
                  </div>
                  <p className="typography-metadata text-muted-foreground">
                    Ingresa el valor por unidad o kilo y calculamos el total automáticamente.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 typography-body-sm flex items-center gap-2 text-muted-foreground">
                  <span>{cantidad || '—'} unidades</span>
                  <span>×</span>
                  <span>{precioUnitario ? formatNumber(parseInputToNumber(precioUnitario) || 0) : '—'}</span>
                  <span>=</span>
                  <span className="font-semibold text-foreground">
                    {precioTotal ? formatNumber(parseInputToNumber(precioTotal) || 0) : '—'}
                  </span>
                </div>

                <div className="space-y-2">
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
                        className="h-12 typography-number-md pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setCalculatorOpen(true)}
                    >
                      <Calculator className="h-5 w-5" />
                      <span className="sr-only">Abrir calculadora</span>
                    </Button>
                  </div>
                  <p className="typography-metadata text-muted-foreground">
                    Si sabes el total pagado, calculamos el precio por unidad automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border bg-background px-6 py-4">
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
                disabled={!canSave}
                className="flex-1 h-12 typography-label-lg"
              >
                Agregar
              </Button>
            </div>
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
