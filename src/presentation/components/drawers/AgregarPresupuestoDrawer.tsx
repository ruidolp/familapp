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
import { ChevronDown, ChevronUp } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface AgregarPresupuestoDrawerProps {
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
      <h3 className="font-semibold text-sm text-foreground">{children}</h3>
    </div>
  )
}

export function AgregarPresupuestoDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  montoLibre,
  presupuestoAsignado,
  onSuccess,
}: AgregarPresupuestoDrawerProps) {
  const t = useTranslations('sobres.addBudget')
  const [loading, setLoading] = useState(false)
  const [monto, setMonto] = useState('')
  const [observacion, setObservacion] = useState('')
  const [expandedConfig, setExpandedConfig] = useState(false)
  const [montoRecurrente, setMontoRecurrente] = useState('')

  const montoRef = useRef<HTMLInputElement>(null)
  useInputFocus(montoRef, 350)

  useEffect(() => {
    if (open) {
      setMonto('')
      setObservacion('')
      setMontoRecurrente('')
      setExpandedConfig(false)
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
          presupuestoAsignado: Number(presupuestoAsignado) + montoNum,
          observacion,
          montoRecurrente: montoRecurrente ? parseFloat(montoRecurrente) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        notify.error(data.error || t('errors.addFailed'))
        setLoading(false)
        return
      }

      notify.success(t('success.added', { sobreName }))

      setMonto('')
      setObservacion('')
      setMontoRecurrente('')

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || t('errors.addFailed'))
    } finally {
      setLoading(false)
    }
  }

  const nuevoTotal = monto 
    ? Number(presupuestoAsignado) + parseFloat(monto || '0')
    : Number(presupuestoAsignado)

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
            
            {/* MONTO - Card Accent */}
            <Card className="p-5 bg-card-accent border-primary/20">
              <div className="space-y-3">
                <Label htmlFor="monto" className="text-base font-semibold">
                  💰 {t('form.amount')}
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                    +$
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
                    className="pl-14 text-2xl font-semibold h-14 bg-background"
                  />
                </div>
              </div>
            </Card>

            {/* RESUMEN */}
            <div className="space-y-3">
              <SectionTitle>{t('sections.summary')}</SectionTitle>
              
              <Card className="p-4 space-y-4 bg-card-elevated">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {t('form.availableInWallet')}
                    </p>
                    <p className="text-lg font-semibold">
                      ${Number(montoLibre).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {t('form.currentBudget')}
                    </p>
                    <p className="text-lg font-semibold">
                      ${Number(presupuestoAsignado).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {monto && parseFloat(monto) > 0 && (
                  <div className="border-t border-dashed border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('form.newBudget')}
                      </span>
                      <span className="text-xl font-bold text-primary">
                        ${nuevoTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* DETALLE */}
            <div className="space-y-3">
              <SectionTitle>{t('sections.details')}</SectionTitle>
              
              <Card className="p-4 space-y-4 bg-card-elevated">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="observacion" className="text-sm font-medium text-muted-foreground">
                      {t('form.observation')}
                    </Label>
                    <span className="text-xs text-muted-foreground">{t('form.optional')}</span>
                  </div>
                  <Input
                    id="observacion"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder={t('form.observationPlaceholder')}
                    className="h-10"
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedConfig(!expandedConfig)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">{t('form.advancedConfig')}</span>
                    {expandedConfig ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {expandedConfig && (
                    <div className="border-t border-border p-4 space-y-3 bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor="montoRecurrente" className="text-sm font-medium text-muted-foreground">
                          {t('form.recurringAmount')}
                        </Label>
                        <Input
                          id="montoRecurrente"
                          type="number"
                          step="0.01"
                          min="0"
                          value={montoRecurrente}
                          onChange={(e) => setMontoRecurrente(e.target.value)}
                          placeholder="0.00"
                          className="h-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('form.recurringAmountHelp')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={loading || !monto}
            className="w-full h-12 text-base font-semibold"
          >
            {loading ? t('buttons.saving') : t('buttons.addBudget')}
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
