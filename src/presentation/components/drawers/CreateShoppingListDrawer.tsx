'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Extract locale from pathname (e.g., "/es/..." -> "es")
  const locale = pathname.split('/')[1] || 'es'

  useEffect(() => {
    if (!open || isLoading) return
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 250)
    return () => clearTimeout(timer)
  }, [open, isLoading])

  const handleCreate = async () => {
    try {
      setIsLoading(true)

      // If no name provided, create with translated unnamed format
      const finalName = name.trim() || t('shopping.lists.createNew.unnamed', { slug: generateRandomSlug() })

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

      notify.success(t('common.success'))

      // Close drawer first
      onOpenChange(false)
      setName('')

      // Use startTransition for smoother navigation
      // This prevents the "flash" of showing lists before navigating
      startTransition(() => {
        router.push(`/${locale}/shopping-lists/${listId}`)
      })
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
          <DrawerTitle>{t('shopping.lists.createNew.title')}</DrawerTitle>
          <DrawerDescription>
            {t('shopping.lists.createNew.description')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6">
          <Input
            type="text"
            placeholder={t('shopping.lists.createNew.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            ref={inputRef}
            className="typography-body"
          />
          <p className="typography-metadata mt-3">
            {t('shopping.lists.createNew.hint')}
          </p>
        </div>

        <DrawerFooter className="flex-row gap-2 justify-end">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading}>
              {t('common.cancel')}
            </Button>
          </DrawerClose>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? t('shopping.lists.createNew.creating') : t('shopping.lists.createNew.submit')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
