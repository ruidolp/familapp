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
import { ChevronDown, ChevronUp } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface AgregarPresupuestoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  montoLibre: number
  presupuestoAsignado: number
  onSuccess?: () => void
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
  const t = useTranslations('common')
  const { formatNumber } = useCurrency()
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
        notify.error('Monto debe ser mayor a 0')
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
        notify.error(data.error || 'Error al agregar presupuesto')
        setLoading(false)
        return
      }

      notify.success(`Presupuesto agregado a ${sobreName}`)

      // Reset form
      setMonto('')
      setObservacion('')
      setMontoRecurrente('')

      // Close drawer
      onOpenChange(false)

      // Callback
      onSuccess?.()
    } catch (err: any) {
      notify.error(err.message || 'Error al agregar presupuesto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Agregar Presupuesto</DrawerTitle>
          <DrawerDescription>
            Agrega presupuesto a tu sobre <span className="font-bold text-foreground">{sobreName}</span>, cada gasto
            reducirá el presupuesto. Todo en orden con 1 clic
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CARD: Monto Libre y Presupuesto Asignado */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base text-muted-foreground">Monto Libre</p>
                  <p className="text-xl font-bold">${formatNumber(Number(montoLibre))}</p>
                </div>
                <div className="text-right">
                  <p className="text-base text-muted-foreground">Presupuesto Asignado</p>
                  <p className="text-xl font-bold">${formatNumber(Number(presupuestoAsignado))}</p>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-border" />

            {/* Monto a sumar */}
            <div className="space-y-2">
              <Label htmlFor="monto" className="font-medium">
                Monto a sumar <span className="text-red-500">*</span>
              </Label>
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
                className="text-base"
              />
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
                placeholder="Ej: Presupuesto inicial"
                className="text-base"
              />
            </div>

            {/* Configuración Avanzada (Expandible) */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setExpandedConfig(!expandedConfig)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition"
              >
                <span className="font-medium">Configuración Avanzada</span>
                {expandedConfig ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {expandedConfig && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="montoRecurrente" className="font-medium">
                      Monto Recurrente
                    </Label>
                    <Input
                      id="montoRecurrente"
                      type="number"
                      step="0.01"
                      min="0"
                      value={montoRecurrente}
                      onChange={(e) => setMontoRecurrente(e.target.value)}
                      placeholder="0.00"
                      className="text-base"
                    />
                  </div>
                  <p className="text-base text-muted-foreground">
                    Te ahorramos ingresar todos los meses el presupuesto manual, asigna el valor por defecto y
                    nosotros lo cargaremos todos los meses
                  </p>
                </div>
              )}
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
