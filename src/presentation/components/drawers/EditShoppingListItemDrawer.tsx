'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerBody,
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Minus, Plus, Trash2 } from 'lucide-react'
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
  const t = useTranslations('shopping.lists.editItem')
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

  const displayName = item?.nombre || t('unnamed')
  const formattedQty = decimalToFraction(cantidad) || Math.round(cantidad)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95dvh]">
        <DrawerHeader>
          <DrawerTitle>{t('title', { name: displayName })}</DrawerTitle>
          <DrawerDescription>
            {t('description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="typography-label-lg">{t('quantity')}</Label>
              <span className="typography-label text-muted-foreground">{displayName}</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAdjustQuantity('down')}
                className="h-14 w-14 text-2xl"
              >
                <Minus size={24} />
              </Button>

              <div className="text-4xl font-bold min-w-[120px] text-center">
                {formattedQty}
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleAdjustQuantity('up')}
                className="h-14 w-14 text-2xl"
              >
                <Plus size={24} />
              </Button>
            </div>
          </Card>

          {categories.length > 0 && (
            <Card className="p-4 space-y-3">
              <Label htmlFor="categoria" className="typography-label">
                {t('category.label')}
              </Label>
              <Select
                value={categoriaId || 'sin-categoria'}
                onValueChange={(value) => setCategoriaId(value === 'sin-categoria' ? null : value)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder={t('category.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-categoria">{t('category.none')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji ? `${cat.emoji} ` : ''}{cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <Label htmlFor="comentario" className="typography-label">
              {t('comment.label')}
            </Label>
            <textarea
              id="comentario"
              placeholder={t('comment.placeholder')}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              rows={3}
            />
          </Card>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="flex w-full gap-2">
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
                <Trash2 size={16} />
                {t('actions.delete')}
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                {t('actions.cancel')}
              </Button>
            </DrawerClose>
            <Button onClick={handleSave} className="flex-1">
              {t('actions.save')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
