'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { notify } from '@/infrastructure/lib/notifications'
import { EmojiPicker } from '@/components/inputs/EmojiPicker'
import { Check } from 'lucide-react'

interface EditarCategoriaDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoriaId: string
  categoriaNombre: string
  categoriaEmoji?: string
  categoriaColor?: string
  onSuccess?: () => void
}

// Paleta de colores desde el theme
const THEME_COLORS = [
  { name: 'primary', class: 'bg-primary', value: 'primary' },
  { name: 'secondary', class: 'bg-secondary', value: 'secondary' },
  { name: 'destructive', class: 'bg-destructive', value: 'destructive' },
  { name: 'success', class: 'bg-success', value: 'success' },
  { name: 'warning', class: 'bg-warning', value: 'warning' },
  { name: 'info', class: 'bg-info', value: 'info' },
  { name: 'accent', class: 'bg-accent', value: 'accent' },
  { name: 'tertiary', class: 'bg-tertiary', value: 'tertiary' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold text-sm text-foreground">{children}</h3>
    </div>
  )
}

export function EditarCategoriaDrawer({
  open,
  onOpenChange,
  categoriaId,
  categoriaNombre,
  categoriaEmoji = '',
  categoriaColor = 'primary',
  onSuccess,
}: EditarCategoriaDrawerProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('')
  const [color, setColor] = useState('primary')

  useEffect(() => {
    if (open) {
      setNombre(categoriaNombre)
      setEmoji(categoriaEmoji)
      setColor(categoriaColor || 'primary')
    }
  }, [open, categoriaId, categoriaNombre, categoriaEmoji, categoriaColor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      notify.error(t('categorias.edit.nameRequired'))
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/categorias/${categoriaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          emoji: emoji || undefined,
          color: color,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('categorias.edit.notifications.updateError'))
      }

      notify.success(t('categorias.edit.notifications.updateSuccess'))
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      notify.error(error.message || t('categorias.edit.notifications.updateError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('categorias.edit.title')}</DrawerTitle>
          <DrawerDescription>
            {t('categorias.edit.description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="max-h-[70vh] overflow-y-auto pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* INFORMACIÓN BÁSICA */}
              <div className="space-y-3">
                <SectionTitle>{t('categorias.edit.basicInfo')}</SectionTitle>

                <Card className="p-4 space-y-4 bg-card-elevated">
                  {/* Nombre con Emoji */}
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-sm font-medium text-muted-foreground">
                      {t('categorias.edit.nameLabel')}
                    </Label>
                    <div className="flex gap-2 items-center">
                      <EmojiPicker value={emoji} onChange={setEmoji} />
                      <Input
                        id="nombre"
                        type="text"
                        placeholder={t('categorias.edit.namePlaceholder')}
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="flex-1 h-11"
                        autoFocus
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* COLOR */}
              <div className="space-y-3">
                <SectionTitle>{t('categorias.edit.colorSection')}</SectionTitle>

                <Card className="p-4 bg-card-elevated">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('categorias.edit.colorLabel')}
                    </Label>
                    <div className="grid grid-cols-4 gap-3">
                      {THEME_COLORS.map((themeColor) => (
                        <button
                          key={themeColor.value}
                          type="button"
                          onClick={() => setColor(themeColor.value)}
                          className={[
                            'relative h-14 w-full rounded-lg transition-all',
                            themeColor.class,
                            color === themeColor.value
                              ? 'ring-2 ring-offset-2 ring-foreground scale-105'
                              : 'hover:scale-105',
                          ].join(' ')}
                        >
                          {color === themeColor.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          )}
                          <span className="sr-only">{themeColor.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </form>
          </div>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={loading || !nombre.trim()}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? t('categorias.edit.saving') : t('categorias.edit.submit')}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" disabled={loading} className="w-full">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
