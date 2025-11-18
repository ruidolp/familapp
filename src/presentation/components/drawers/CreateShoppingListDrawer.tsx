'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
import { notify } from '@/infrastructure/lib/notifications'

interface CreateShoppingListDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Generate a random slug for unnamed lists
 * Returns 3-6 character slug like "abc123"
 */
function generateRandomSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}

export function CreateShoppingListDrawer({
  open,
  onOpenChange,
}: CreateShoppingListDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Extract locale from pathname (e.g., "/es/..." -> "es")
  const locale = pathname.split('/')[1] || 'es'

  const handleCreate = async () => {
    try {
      setIsLoading(true)

      // If no name provided, create with "Sin nombre #slug"
      const finalName = name.trim() || `Sin nombre #${generateRandomSlug()}`

      // Create the shopping list via API
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: finalName,
          descripcion: null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear lista')
      }

      const data = await response.json()
      const listId = data.list.id

      notify.success('Lista creada correctamente')

      // Close drawer
      onOpenChange(false)
      setName('')

      // Navigate to the editor with correct locale
      router.push(`/${locale}/shopping-lists/${listId}`)
    } catch (error: any) {
      console.error('Error creating shopping list:', error)
      notify.error(error.message || 'Error al crear la lista')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen)
      if (!newOpen) setName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreate()
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Crear nueva lista de compras</DrawerTitle>
          <DrawerDescription>
            Dale un nombre a tu nueva lista (opcional)
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6">
          <Input
            type="text"
            placeholder="Ej: Supermercado, Verduras, etc..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoFocus
            className="text-base"
          />
          <p className="text-xs text-muted-foreground mt-3">
            Si no escribes un nombre, se creará como "Sin nombre #abc123"
          </p>
        </div>

        <DrawerFooter className="flex-row gap-2 justify-end">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DrawerClose>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
