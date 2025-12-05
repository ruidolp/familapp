'use client'

/**
 * AddOnTheFlyProductsModal Component
 *
 * Modal que aparece cuando el usuario entra a una lista después de finalizar una compra
 * Muestra productos agregados on-the-fly y permite agregarlos a la lista permanentemente
 *
 * Features:
 * - Todos los productos pre-seleccionados
 * - Botón "-" para quitar cada uno fácilmente
 * - Botones: "Descartar todos" / "Agregar a lista"
 * - Estética del theme (usa variables CSS)
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, ShoppingBag } from 'lucide-react'

interface OnTheFlyProduct {
  id: string
  product_name: string
  cantidad_comprada?: number
  unidad_medida?: string
  precio_unitario?: number | string
  precio_total?: number
  marca?: string
}

interface AddOnTheFlyProductsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  products: OnTheFlyProduct[]
  onAddToList: (selectedProducts: OnTheFlyProduct[]) => void
}

export function AddOnTheFlyProductsModal({
  isOpen,
  onOpenChange,
  products,
  onAddToList,
}: AddOnTheFlyProductsModalProps) {
  const formatUnitPrice = (precio?: number | string) => {
    if (typeof precio === 'number') return precio.toFixed(2)
    if (typeof precio === 'string') {
      const parsed = Number(precio)
      if (Number.isFinite(parsed)) return parsed.toFixed(2)
    }
    return null
  }

  // Todos seleccionados por defecto
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Pre-seleccionar todos cuando se abre o cambian los productos
  useEffect(() => {
    if (isOpen && products.length > 0) {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }, [isOpen, products])

  const toggleProduct = (productId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(products.map(p => p.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleAddToList = () => {
    const selected = products.filter(p => selectedIds.has(p.id))
    onAddToList(selected)
    onOpenChange(false)
  }

  const handleDiscard = () => {
    onOpenChange(false)
  }

  const selectedCount = selectedIds.size

  if (products.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 typography-label-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Productos agregados durante la compra
          </DialogTitle>
          <DialogDescription className="typography-body-sm">
            Encontramos {products.length} producto{products.length !== 1 ? 's' : ''} que agregaste durante tu última compra.
            ¿Quieres agregarlos permanentemente a esta lista?
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable product list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {products.map(product => {
              const unitPrice = formatUnitPrice(product.precio_unitario)

              return (
                <Card
                  key={product.id}
                  className={`
                    rounded-xl p-4 border transition-all duration-200
                    ${
                      selectedIds.has(product.id)
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-card hover:border-border/80'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                      className="mt-1"
                    />

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold typography-body-sm text-foreground">
                          {product.product_name}
                        </p>
                        <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-xs">
                          Agregado
                        </Badge>
                        {product.marca && (
                          <Badge variant="secondary" className="text-xs">
                            {product.marca}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 typography-metadata text-muted-foreground">
                        {product.cantidad_comprada && (
                          <span>
                            {product.cantidad_comprada} {product.unidad_medida || 'und'}
                          </span>
                        )}
                        {unitPrice && (
                          <span className="text-xs">
                            • ${unitPrice} c/u
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => toggleProduct(product.id)}
                      title="Quitar"
                    >
                      {selectedIds.has(product.id) ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Footer with actions */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {/* Select/Deselect all */}
            <div className="flex gap-2 sm:mr-auto">
              {selectedCount < products.length ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="typography-body-sm"
                >
                  Seleccionar todos
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="typography-body-sm text-muted-foreground"
                >
                  Deseleccionar todos
                </Button>
              )}
            </div>

            {/* Main actions */}
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="flex-1 sm:flex-none"
              >
                No agregar
              </Button>
              <Button
                onClick={handleAddToList}
                disabled={selectedCount === 0}
                className="flex-1 sm:flex-none"
              >
                Agregar {selectedCount > 0 && `(${selectedCount})`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
