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
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'

interface ReducirPresupuestoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  montoLibre: number
  presupuestoAsignado: number
  onSuccess?: () => void
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
  const t = useTranslations('common')
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
        notify.error('Monto debe ser mayor a 0')
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
        notify.error(data.error || 'Error al reducir presupuesto')
        setLoading(false)
        return
      }

      notify.success(`Presupuesto reducido en ${sobreName}`)

      // Reset form
      setMonto('')
      setObservacion('')

      // Close drawer
      onOpenChange(false)

      // Callback
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || 'Error al reducir presupuesto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Reducir Presupuesto</DrawerTitle>
          <DrawerDescription>
            Reduce presupuesto de tu sobre <span className="font-bold text-foreground">{sobreName}</span>. Esta acción
            no afecta gastos registrados
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CARD: Monto Libre y Presupuesto Asignado */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base text-muted-foreground">Monto Libre</p>
                  <p className="text-xl font-bold">${Number(montoLibre).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-base text-muted-foreground">Presupuesto Asignado</p>
                  <p className="text-xl font-bold">${Number(presupuestoAsignado).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-border" />

            {/* Monto a restar */}
            <div className="space-y-2">
              <Label htmlFor="monto" className="font-medium">
                Monto a restar <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-foreground">
                  -
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
                  className="text-base pl-8"
                />
              </div>
            </div>

            {/* Observación */}
            <div className="space-y-2">
              <Label htmlFor="observacion" className="font-medium">
                Observación
              </Label>
              <Input
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Ajuste de presupuesto"
                className="text-base"
              />
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !monto} className="w-full">
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full">
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
