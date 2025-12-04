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
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white typography-h2 transition-colors"
                  style={{ backgroundColor: sobreColor }}
                >
                  {sobreName.trim() ? sobreName.trim().charAt(0).toUpperCase() : '📁'}
                </div>
                <div className="flex-1">
                  <p className="typography-metadata uppercase tracking-wide mb-1">
                    {t('form.preview')}
                  </p>
                  <p className="typography-number-md">
                    {sobreName.trim() || t('form.envelopeName')}
                  </p>
                  <p className="typography-body-sm text-muted-foreground">
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
                  <Label htmlFor="nombre-sobre" className="typography-label text-muted-foreground">
                    {t('form.name')}
                  </Label>
                  <Input
                    ref={sobreNombreRef}
                    id="nombre-sobre"
                    value={sobreName}
                    onChange={(e) => setSobreName(e.target.value)}
                    placeholder={t('form.namePlaceholder')}
                    required
                    className="h-11 typography-body"
                  />
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <Label className="typography-label text-muted-foreground">
                    {t('form.color')}
                  </Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {COLORES_SUGERIDOS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSobreColor(c)
                            setShowColorPicker(false)
                          }}
                          className={`
                            h-9 w-9 rounded-lg border transition-all
                            ${sobreColor === c && !showColorPicker
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border hover:border-primary/60'}
                          `}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`
                          h-9 w-9 rounded-lg border border-dashed transition-all 
                          flex items-center justify-center text-sm font-semibold
                          ${showColorPicker
                            ? 'border-primary bg-muted text-primary'
                            : 'border-muted-foreground/50 hover:border-primary hover:text-primary'}
                        `}
                      >
                        +
                      </button>
                    </div>

                    {showColorPicker && (
                      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                        <HexColorPicker 
                          color={sobreColor} 
                          onChange={setSobreColor}
                          style={{ width: '100%' }}
                        />
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-lg border border-border"
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
                </div>
              </Card>
            </div>

            {/* INFO */}
            <Card className="p-4 bg-muted border-border">
              <div className="flex gap-3">
                <span className="typography-body-lg">💡</span>
                <div className="typography-body-sm">
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
            className="w-full h-12 typography-label-lg"
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
