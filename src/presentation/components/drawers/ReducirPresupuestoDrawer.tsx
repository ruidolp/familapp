'use client'

import { useState, useRef, useEffect } from 'react'
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
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface ReducirPresupuestoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  montoLibre: number
  presupuestoAsignado: number
  onSuccess?: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 bg-primary rounded-full" />
      <h3 className="font-semibold typography-body-sm text-foreground">{children}</h3>
    </div>
  )
}

export function ReducirPresupuestoDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  montoLibre,
  presupuestoAsignado,
  onSuccess,
}: ReducirPresupuestoDrawerProps) {
  const t = useTranslations('sobres.reduceBudget')
  const { formatNumber, simbolo } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [monto, setMonto] = useState('')
  const [observacion, setObservacion] = useState('')

  const montoRef = useRef<HTMLInputElement>(null)
  useInputFocus(montoRef, 350)

  useEffect(() => {
    if (open) {
      setMonto('')
      setObservacion('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const montoNum = parseFloat(monto)
      if (isNaN(montoNum) || montoNum <= 0) {
        notify.error(t('errors.invalidAmount'))
        setLoading(false)
        return
      }

      const response = await fetch(`/api/sobres/${sobreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presupuestoAsignado: Math.max(0, Number(presupuestoAsignado) - montoNum),
          observacion,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        notify.error(data.error || t('errors.reduceFailed'))
        setLoading(false)
        return
      }

      notify.success(t('success.reduced', { sobreName }))

      // Reset form
      setMonto('')
      setObservacion('')

      // Close drawer
      onOpenChange(false)

      // Callback
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || t('errors.reduceFailed'))
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
            {t('description', { sobreName })}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RESUMEN */}
            <div className="space-y-3">
              <SectionTitle>Resumen</SectionTitle>

              <Card className="p-4 space-y-4 bg-card-elevated">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="typography-metadata uppercase tracking-wide">
                      {t('form.freeAmount')}
                    </p>
                    <p className="typography-h3">
                      {simbolo ?? ''}{formatNumber(Number(montoLibre))}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="typography-metadata uppercase tracking-wide">
                      {t('form.assignedBudget')}
                    </p>
                    <p className="typography-h3">
                      {simbolo ?? ''}{formatNumber(Number(presupuestoAsignado))}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* MONTO A RESTAR */}
            <Card className="p-5 bg-card-accent border-destructive/20">
              <div className="space-y-3">
                <Label htmlFor="monto" className="typography-label-lg">
                  💸 {t('form.amountToReduce')}
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 typography-h2 text-muted-foreground">
                    -$
                  </span>
                  <Input
                    ref={montoRef}
                    id="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-14 typography-h2 h-14 bg-background"
                  />
                </div>
              </div>
            </Card>

            {/* Observación */}
            <div className="space-y-3">
              <SectionTitle>{t('form.observation')}</SectionTitle>

              <Card className="p-4 space-y-2 bg-card-elevated">
                <div className="flex items-center justify-between">
                  <Label htmlFor="observacion" className="typography-label text-muted-foreground">
                    {t('form.observation')}
                  </Label>
                  <span className="typography-metadata">{t('form.optional')}</span>
                </div>
                <Input
                  id="observacion"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder={t('form.observationPlaceholder')}
                  className="h-10"
                />
              </Card>
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !monto} className="w-full">
            {loading ? t('buttons.saving') : t('buttons.save')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full">
              {t('buttons.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
