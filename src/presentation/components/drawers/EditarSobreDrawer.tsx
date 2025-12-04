'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { HexColorPicker } from 'react-colorful'
import { ChevronDown } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { useTheme } from '@/presentation/providers/theme-provider'
import { cn } from '@/infrastructure/lib/utils'

interface EditarSobreDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreNombre: string
  sobreColor?: string
  onSobreUpdated?: () => void
  onSobreDeleted?: () => void
}

const COLORES_SUGERIDOS = [
  '#2EBE76',
  '#38D6AA',
  '#3BC9C7',
  '#2F89A3',
  '#7A91F9',
  '#A18CFF',
  '#FF8FA9',
  '#FFB77A',
  '#F7D76F',
  '#FF6F61',
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold typography-body-sm text-foreground">{children}</h3>
    </div>
  )
}

export function EditarSobreDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreNombre,
  sobreColor = COLORES_SUGERIDOS[0],
  onSobreUpdated,
  onSobreDeleted,
}: EditarSobreDrawerProps) {
  const t = useTranslations('sobres.edit')
  const { theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [sobreName, setSobreName] = useState(sobreNombre)
  const [sobreColorLocal, setSobreColorLocal] = useState(sobreColor)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingConfirm, setDeletingConfirm] = useState(false)

  const sobreNombreRef = useRef<HTMLInputElement>(null)
  useInputFocus(sobreNombreRef, 350)

  useEffect(() => {
    if (open) {
      setSobreName(sobreNombre)
      setSobreColorLocal(sobreColor)
      setShowColorPicker(false)
      setShowDeleteConfirm(false)
      setDeletingConfirm(false)
    }
  }, [open, sobreNombre, sobreColor])

  const handleActualizarSobre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sobreName.trim()) {
      notify.error(t('errors.updateFailed'))
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/sobres/${sobreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: sobreName.trim(),
          color: sobreColorLocal,
        }),
      })

      if (response.ok) {
        notify.success(t('success.updated'))
        onOpenChange(false)
        onSobreUpdated?.()
      } else {
        notify.error(t('errors.updateFailed'))
      }
    } catch (error) {
      console.error('Error al actualizar sobre:', error)
      notify.error(t('errors.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarSobre = async () => {
    setDeletingConfirm(true)
    try {
      const response = await fetch(`/api/sobres/${sobreId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notify.success(t('success.deleted'))
        onOpenChange(false)
        onSobreDeleted?.()
      } else {
        notify.error(t('errors.deleteFailed'))
        setDeletingConfirm(false)
      }
    } catch (error) {
      console.error('Error al eliminar sobre:', error)
      notify.error(t('errors.deleteFailed'))
      setDeletingConfirm(false)
    }
  }

  const drawerButtonVariant = theme === 'dark' ? 'outline' : 'outline'
  const drawerButtonClassName = 'h-auto justify-start'

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="typography-h3">{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          <form onSubmit={handleActualizarSobre} className="space-y-6">
            {/* Nombre */}
            <Card className="p-4 space-y-3 bg-card">
              <SectionTitle>{t('name')}</SectionTitle>
              <div className="space-y-2">
                <Label htmlFor="nombre" className="typography-label text-muted-foreground">
                  {t('name')}
                </Label>
                <Input
                  ref={sobreNombreRef}
                  id="nombre"
                  type="text"
                  value={sobreName}
                  onChange={(e) => setSobreName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  required
                  className="h-11"
                />
              </div>
            </Card>

            {/* Color */}
            <Card className="p-4 space-y-3 bg-card">
              <SectionTitle>{t('color')}</SectionTitle>
              <div className="space-y-3">
                <Label className="typography-label text-muted-foreground">{t('colorLabel')}</Label>

                {/* Color suggestions */}
                <div className="flex flex-wrap gap-2">
                  {COLORES_SUGERIDOS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSobreColorLocal(color)
                        setShowColorPicker(false)
                      }}
                      className={cn(
                        'h-9 w-9 rounded-lg border transition-all',
                        sobreColorLocal === color
                          ? 'border-primary ring-2 ring-primary/40'
                          : 'border-border hover:border-primary/60'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Color picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left typography-body-sm font-medium"
                >
                  {showColorPicker ? 'Cerrar selector de colores' : 'Más colores'}
                </button>

                {/* Color picker */}
                {showColorPicker && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex justify-center">
                      <HexColorPicker color={sobreColorLocal} onChange={setSobreColorLocal} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg border border-border"
                        style={{ backgroundColor: sobreColorLocal }}
                      />
                      <Input
                        type="text"
                        value={sobreColorLocal}
                        onChange={(e) => setSobreColorLocal(e.target.value)}
                        className="flex-1 font-mono h-10"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-border"
                    style={{ backgroundColor: sobreColorLocal }}
                  />
                  <span className="typography-body-sm text-muted-foreground">
                    {sobreColorLocal}
                  </span>
                </div>
              </div>
            </Card>

            {/* Delete section */}
            <Card className="p-4 space-y-3 bg-destructive/5 border-destructive/20">
              <SectionTitle className="text-destructive">{t('deleteSection')}</SectionTitle>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/15 border border-destructive/20 transition-colors"
                >
                  <div className="text-left">
                    <p className="typography-body-sm font-medium text-destructive">
                      {t('deleteLabel')}
                    </p>
                    <p className="typography-metadata text-destructive/70 mt-1">
                      {t('deleteDescription')}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-destructive transition-transform flex-shrink-0 ml-2'
                    )}
                  />
                </button>
              ) : (
                <div className="space-y-3">
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-destructive">
                      {t('deleteWarning')}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <p className="typography-body-sm font-medium text-destructive">
                      {t('deleteTitle', { name: sobreName })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deletingConfirm}
                      >
                        {t('deleteCancel')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleEliminarSobre}
                        disabled={deletingConfirm}
                      >
                        {deletingConfirm ? t('editing') : t('deleteConfirm')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <div className="flex gap-2 w-full">
            <DrawerClose asChild>
              <Button variant="outline" disabled={loading} className="flex-1">
                {t('cancel')}
              </Button>
            </DrawerClose>
            <Button
              disabled={loading}
              onClick={(e) => {
                const form = document.querySelector('form') as HTMLFormElement
                form?.dispatchEvent(new Event('submit', { bubbles: true }))
              }}
              className="flex-1"
            >
              {loading ? t('editing') : t('submit')}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
