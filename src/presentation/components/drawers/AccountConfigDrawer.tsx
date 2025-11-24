'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/presentation/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface AccountConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Moneda {
  id: string
  nombre: string
  simbolo: string
}

const DAYS = Array.from({ length: 31 }, (_, index) => {
  const day = (index + 1).toString().padStart(2, '0')
  return { value: day }
})

export function AccountConfigDrawer({ open, onOpenChange }: AccountConfigDrawerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [monedas, setMonedas] = useState<Moneda[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedDay, setSelectedDay] = useState('01')

  const isReady = useMemo(() => Boolean(selectedCurrency && selectedDay), [selectedCurrency, selectedDay])

  useEffect(() => {
    if (!open) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [configRes, monedasRes] = await Promise.all([
          fetch('/api/user/config'),
          fetch('/api/monedas'),
        ])

        if (monedasRes.ok) {
          const monedasData = await monedasRes.json()
          setMonedas(monedasData.monedas || [])
        }

        if (configRes.ok) {
          const configData = await configRes.json()
          if (configData.config) {
            setSelectedCurrency(configData.config.moneda_principal_id || '')
            setSelectedDay(String(configData.config.dia_inicio_periodo || 1).padStart(2, '0'))
          }
        }
      } catch (error) {
        toast({
          title: 'Error al cargar configuración',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, toast])

  const handleSave = async () => {
    if (!isReady) return
    setSaving(true)
    try {
      const response = await fetch('/api/user/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monedaPrincipalId: selectedCurrency,
          diaInicioPeriodo: parseInt(selectedDay, 10),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'No se pudo actualizar tu configuración')
      }

      toast({
        title: 'Configuración actualizada',
        description: 'Tus cambios aplicarán inmediatamente.',
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Configuración de la cuenta</DrawerTitle>
          <DrawerDescription>
            Ajusta la moneda y el día en que se reinician tus periodos.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-6">
          <div className="space-y-2">
            <Label>Moneda principal</Label>
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              disabled={loading || monedas.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {monedas.map((moneda) => (
                  <SelectItem key={moneda.id} value={moneda.id}>
                    {moneda.nombre} ({moneda.simbolo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Alert className="bg-amber-50 dark:bg-amber-950/40 border-amber-200">
              <AlertTitle>Cambio de moneda</AlertTitle>
              <AlertDescription>
                Solo afectará a sobres nuevos. No convertiremos movimientos ni presupuestos existentes.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-2">
            <Label>Día de reinicio del periodo</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un día" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    Día {day.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Ese día se reinicia tu PERIODO financiero y se calculan los nuevos saldos.
            </p>
          </div>
        </DrawerBody>

        <DrawerFooter className="border-t border-border">
          <Button onClick={handleSave} disabled={!isReady || saving || loading} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full" disabled={saving}>
              Cancelar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
