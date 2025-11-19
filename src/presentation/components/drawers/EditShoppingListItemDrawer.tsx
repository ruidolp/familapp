'use client'

import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'
import { ProductQuantityInput } from '@/components/inputs/ProductQuantityInput'
import { quantityToDecimal, adjustQty, decimalToFraction } from '@/infrastructure/utils/quantity'

interface ListItem {
  id: string
  nombre?: string
  cantidad: number
  comentario?: string | null
  categoria_producto_id?: string | null
  final_category_id?: string | null  // The effective category (prioritized)
}

interface Category {
  id: string
  nombre: string
  color?: string
  emoji?: string
  _type?: 'user' | 'global'  // Indicates category type
}

interface EditShoppingListItemDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ListItem | null
  categories?: Category[]
  onSave: (cantidad: number, comentario?: string, categoriaId?: string | null) => void
  onDelete?: () => void
}

export function EditShoppingListItemDrawer({
  open,
  onOpenChange,
  item,
  categories = [],
  onSave,
  onDelete,
}: EditShoppingListItemDrawerProps) {
  const [cantidad, setCantidad] = useState<number>(1)
  const [comentario, setComentario] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setCantidad(item.cantidad)
      setComentario(item.comentario || '')
      // Use final_category_id which includes both user and global categories
      setCategoriaId(item.final_category_id || null)
    }
  }, [item, item?.cantidad, item?.comentario, item?.final_category_id])

  const handleAdjustQuantity = (direction: 'up' | 'down') => {
    // Convert current decimal to string for adjustQty
    const fractionStr = decimalToFraction(cantidad)
    const currentStr = fractionStr || String(Math.round(cantidad))

    const newStr = adjustQty(currentStr, direction)
    const newDecimal = quantityToDecimal(newStr)
    setCantidad(newDecimal)
  }

  const handleSave = () => {
    onSave(cantidad, comentario || undefined, categoriaId)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      onOpenChange(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar {item?.nombre}</DrawerTitle>
          <DrawerDescription>
            Actualiza los detalles del producto
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Cantidad with large +/- buttons */}
          <div className="space-y-3">
            <Label>Cantidad</Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAdjustQuantity('down')}
                className="h-16 w-16 text-2xl"
              >
                <Minus size={28} />
              </Button>

              <div className="text-5xl font-bold min-w-[120px] text-center">
                {cantidad}
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAdjustQuantity('up')}
                className="h-16 w-16 text-2xl"
              >
                <Plus size={28} />
              </Button>
            </div>
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría (opcional)</Label>
              <Select
                value={categoriaId || 'sin-categoria'}
                onValueChange={(value) => setCategoriaId(value === 'sin-categoria' ? null : value)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-categoria">Sin categoría</SelectItem>
                  {categories.map((cat) => {
                    const typeLabel = cat._type === 'global' ? ' (Global)' : cat._type === 'user' ? ' (Personal)' : ''
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.emoji ? `${cat.emoji} ` : ''}{cat.nombre}{typeLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {categoriaId && (
                <p className="text-xs text-muted-foreground">
                  {categories.find(c => c.id === categoriaId)?._type === 'global' ? '🌍 Categoría global' : '👤 Categoría personal'}
                </p>
              )}
            </div>
          )}

          {/* Comentario */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Observación (opcional)</Label>
            <textarea
              id="comentario"
              placeholder="Ej: Marca específica, notas especiales..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              rows={3}
            />
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2 justify-between">
          {onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
              <Trash2 size={16} />
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
