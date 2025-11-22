'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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

interface ShoppingList {
  id: string
  nombre: string
  descripcion?: string
}

interface EditShoppingListDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: ShoppingList
  onSave: (nombre: string, descripcion?: string) => Promise<void>
}

export function EditShoppingListDrawer({
  open,
  onOpenChange,
  list,
  onSave,
}: EditShoppingListDrawerProps) {
  const t = useTranslations()
  const [name, setName] = useState(list.nombre)
  const [isLoading, setIsLoading] = useState(false)

  // Update name when list changes
  useEffect(() => {
    setName(list.nombre)
  }, [list.nombre])

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      setIsLoading(true)
      await onSave(name.trim())
    } catch (error: any) {
      console.error('Error updating list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) setName(list.nombre)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && name.trim()) {
      handleSave()
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Editar Lista</DrawerTitle>
          <DrawerDescription>
            Cambia el nombre de tu lista de compras
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6">
          <Input
            type="text"
            placeholder="Nombre de la lista"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoFocus
            className="typography-body"
          />
        </div>

        <DrawerFooter className="flex-row gap-2 justify-end">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              {t('common.cancel')}
            </Button>
          </DrawerClose>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
