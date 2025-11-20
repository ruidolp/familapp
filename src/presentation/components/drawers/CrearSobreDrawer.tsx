'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { HexColorPicker } from 'react-colorful'
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
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface CrearSobreDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSobreCreated?: (sobre: any) => void
}

const COLORES_SUGERIDOS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#64748b',
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold text-sm text-foreground">{children}</h3>
    </div>
  )
}

export function CrearSobreDrawer({
  open,
  onOpenChange,
  userId,
  onSobreCreated,
}: CrearSobreDrawerProps) {
  const router = useRouter()
  const t = useTranslations('sobres.create')
  const [loading, setLoading] = useState(false)
  const [sobreName, setSobreName] = useState('')
  const [sobreColor, setSobreColor] = useState(COLORES_SUGERIDOS[0])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [existingSobres, setExistingSobres] = useState<string[]>([])

  const sobreNombreRef = useRef<HTMLInputElement>(null)
  useInputFocus(sobreNombreRef, 350)

  useEffect(() => {
    if (open) {
      setSobreName('')
      setSobreColor(COLORES_SUGERIDOS[0])
      setShowColorPicker(false)
      fetchExistingSobres()
    }
  }, [open])

  const fetchExistingSobres = async () => {
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        const nombres = data.sobres.map((s: any) => s.nombre.toLowerCase().trim())
        setExistingSobres(nombres)
      }
    } catch (error) {
      console.error('Error al cargar sobres:', error)
    }
  }

  const handleCrearSobre = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const nombreTrimmed = sobreName.trim()

      if (existingSobres.includes(nombreTrimmed.toLowerCase())) {
        notify.duplicate('sobre', 'nombre')
        setLoading(false)
        return
      }

      const response = await fetch('/api/sobres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nombre: nombreTrimmed,
          tipo: 'GASTO',
          presupuestoAsignado: 0,
          color: sobreColor,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresOnboarding) {
          notify.warning(t('errors.configRequired'), data.error)
        } else {
          notify.error(data.error)
        }
        setLoading(false)
        return
      }

      notify.created(t('success.created'))

      setSobreName('')
      setSobreColor(COLORES_SUGERIDOS[0])
      setShowColorPicker(false)

      onOpenChange(false)
      onSobreCreated?.(data.sobre)
      router.refresh()
    } catch (err: any) {
      notify.error(err.message || t('errors.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>
            {t('description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleCrearSobre} className="space-y-6">
            
            {/* PREVIEW - Card Accent */}
            <Card className="p-5 bg-card-accent">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold transition-colors"
                  style={{ backgroundColor: sobreColor }}
                >
                  {sobreName.trim() ? sobreName.trim().charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {t('form.preview')}
                  </p>
                  <p className="text-xl font-semibold">
                    {sobreName.trim() || t('form.envelopeName')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('form.budget')}: $0.00
                  </p>
                </div>
              </div>
            </Card>

            {/* IDENTIDAD */}
            <div className="space-y-3">
              <SectionTitle>{t('sections.identity')}</SectionTitle>
              
              <Card className="p-4 space-y-4 bg-card-elevated">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="nombre-sobre" className="text-sm font-medium text-muted-foreground">
                    {t('form.name')}
                  </Label>
                  <Input
                    ref={sobreNombreRef}
                    id="nombre-sobre"
                    value={sobreName}
                    onChange={(e) => setSobreName(e.target.value)}
                    placeholder={t('form.namePlaceholder')}
                    required
                    className="h-11 text-base"
                  />
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t('form.color')}
                  </Label>
                  
                  <div className="flex gap-2 flex-wrap items-center">
                    {COLORES_SUGERIDOS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSobreColor(c)
                          setShowColorPicker(false)
                        }}
                        className={`
                          w-10 h-10 rounded-full transition-all
                          ${sobreColor === c && !showColorPicker
                            ? 'ring-2 ring-offset-2 ring-primary scale-110'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }
                        `}
                        style={{ backgroundColor: c }}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`
                        w-10 h-10 rounded-full border-2 border-dashed transition-all 
                        flex items-center justify-center text-sm font-bold
                        ${showColorPicker
                          ? 'border-primary bg-muted text-primary'
                          : 'border-muted-foreground/30 hover:border-primary hover:text-primary'
                        }
                      `}
                    >
                      +
                    </button>
                  </div>

                  {showColorPicker && (
                    <div className="mt-3 p-4 border border-border rounded-lg bg-background space-y-3">
                      <HexColorPicker 
                        color={sobreColor} 
                        onChange={setSobreColor}
                        style={{ width: '100%' }}
                      />
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg border border-border"
                          style={{ backgroundColor: sobreColor }}
                        />
                        <Input
                          type="text"
                          value={sobreColor}
                          onChange={(e) => setSobreColor(e.target.value)}
                          className="flex-1 font-mono h-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* INFO */}
            <Card className="p-4 bg-muted border-border">
              <div className="flex gap-3">
                <span className="text-lg">💡</span>
                <div className="text-sm">
                  <p className="font-medium mb-1">{t('info.nextStep')}</p>
                  <p className="text-muted-foreground">
                    {t('info.nextStepDescription')}
                  </p>
                </div>
              </div>
            </Card>
          </form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <Button
            onClick={handleCrearSobre}
            disabled={loading || !sobreName.trim()}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? t('buttons.creating') : t('buttons.createEnvelope')}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" disabled={loading} className="w-full">
              {t('buttons.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
