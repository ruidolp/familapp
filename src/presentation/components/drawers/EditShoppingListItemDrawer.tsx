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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { notify } from '@/infrastructure/lib/notifications'
import { ProductQuantityInput } from '@/components/inputs/ProductQuantityInput'
import { quantityToDecimal } from '@/infrastructure/utils/quantity'

interface ListItem {
  id: string
  nombre?: string
  cantidad: number
  comentario?: string
}

interface EditShoppingListItemDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ListItem | null
  onSave: (cantidad: number, comentario?: string) => void
}

export function EditShoppingListItemDrawer({
  open,
  onOpenChange,
  item,
  onSave,
}: EditShoppingListItemDrawerProps) {
  const [cantidad, setCantidad] = useState<number>(1)
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    if (item) {
      setCantidad(item.cantidad)
      setComentario(item.comentario || '')
    }
  }, [item, item?.cantidad, item?.comentario])

  const handleSave = () => {
    onSave(cantidad, comentario || undefined)
    onOpenChange(false)
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
          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="text"
              placeholder="Ej: 1, 1/2, 2.5"
              value={cantidad.toString()}
              onChange={(e) => {
                const val = quantityToDecimal(e.target.value)
                setCantidad(val)
              }}
              className="text-base"
            />
          </div>

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

        <DrawerFooter className="flex-row gap-2 justify-end">
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
          <Button onClick={handleSave}>Guardar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
