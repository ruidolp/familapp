'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Calculator, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalculatorDrawer } from '@/components/execution/CalculatorDrawer'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { notify } from '@/infrastructure/lib/notifications'

interface Categoria {
  id: string
  nombre: string
  emoji?: string
  color?: string
  gastado?: number
}

interface CuotaCategoria {
  categoria_id: string
  monto_cuota: number
}

interface ConfigurarPresupuestoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreNombre: string
  categorias: Categoria[]
  presupuestoActual?: {
    enabled: boolean
    monto_global: number
    cuotas: CuotaCategoria[]
  }
  onSuccess?: () => void
}

export function ConfigurarPresupuestoDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreNombre,
  categorias,
  presupuestoActual,
  onSuccess,
}: ConfigurarPresupuestoDrawerProps) {
  const t = useTranslations('presupuesto')
  const { formatNumber, simbolo, decimales } = useCurrency()

  const [loading, setLoading] = useState(false)
  const [montoGlobal, setMontoGlobal] = useState('')
  const [ajusteManual, setAjusteManual] = useState(false)
  const [cuotas, setCuotas] = useState<Map<string, string>>(new Map())
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorTarget, setCalculatorTarget] = useState<string | null>(null)

  const isEditing = !!presupuestoActual?.enabled

  // Inicializar valores si está editando
  useEffect(() => {
    if (open && presupuestoActual) {
      setMontoGlobal(String(presupuestoActual.monto_global || ''))
      const nuevasCuotas = new Map<string, string>()
      presupuestoActual.cuotas?.forEach(cuota => {
        nuevasCuotas.set(cuota.categoria_id, String(cuota.monto_cuota))
      })
      setCuotas(nuevasCuotas)
    } else if (open) {
      // Reset para nuevo
      setMontoGlobal('')
      setCuotas(new Map())
      setAjusteManual(false)
    }
  }, [open, presupuestoActual])

  // Calcular suma de cuotas
  const sumaCuotas = useMemo(() => {
    let total = 0
    cuotas.forEach(valor => {
      const num = parseFloat(valor)
      if (!isNaN(num)) total += num
    })
    return total
  }, [cuotas])

  // Calcular resto del presupuesto
  const restoPresupuesto = useMemo(() => {
    const global = parseFloat(montoGlobal) || 0
    return Math.max(0, global - sumaCuotas)
  }, [montoGlobal, sumaCuotas])

  // Warning cuando cuotas exceden global
  const excedePresupuesto = useMemo(() => {
    const global = parseFloat(montoGlobal) || 0
    return sumaCuotas > global ? sumaCuotas - global : 0
  }, [montoGlobal, sumaCuotas])

  // Actualizar monto global cuando cambia suma de cuotas (si ajuste manual está desactivado)
  useEffect(() => {
    if (!ajusteManual && sumaCuotas > 0) {
      setMontoGlobal(String(sumaCuotas))
    }
  }, [sumaCuotas, ajusteManual])

  const handleCuotaChange = (categoriaId: string, valor: string) => {
    const nuevasCuotas = new Map(cuotas)
    if (valor === '' || valor === '0') {
      nuevasCuotas.delete(categoriaId)
    } else {
      nuevasCuotas.set(categoriaId, valor)
    }
    setCuotas(nuevasCuotas)
  }

  const handleCalculatorOpen = (target: string) => {
    setCalculatorTarget(target)
    setCalculatorOpen(true)
  }

  const handleCalculatorClose = (value?: string) => {
    if (value && calculatorTarget) {
      if (calculatorTarget === 'global') {
        setMontoGlobal(value)
      } else {
        handleCuotaChange(calculatorTarget, value)
      }
    }
    setCalculatorOpen(false)
    setCalculatorTarget(null)
  }

  const handleGuardar = async () => {
    setLoading(true)
    try {
      const global = parseFloat(montoGlobal) || 0

      if (global <= 0) {
        notify.error(t('validation.globalRequired'))
        return
      }

      // 1. Activar/actualizar presupuesto global
      const resPresupuesto = await fetch(`/api/sobres/${sobreId}/presupuesto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          monto_global: global,
        }),
      })

      const dataPresupuesto = await resPresupuesto.json()
      if (!dataPresupuesto.success) {
        notify.error(dataPresupuesto.error || t('error.save'))
        return
      }

      // 2. Guardar cuotas de categorías (excluir RESTANTES que es solo visual)
      const cuotasArray = Array.from(cuotas.entries())
      for (const [categoriaId, monto] of cuotasArray) {
        // Saltar "RESTANTES" ya que no es una categoría real
        if (categoriaId === 'RESTANTES') continue

        const montoNum = parseFloat(monto)
        if (montoNum > 0) {
          await fetch(`/api/sobres/${sobreId}/presupuesto/cuotas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoria_id: categoriaId,
              monto_cuota: montoNum,
            }),
          })
        }
      }

      // 3. Eliminar cuotas que fueron quitadas (si está editando)
      if (isEditing && presupuestoActual.cuotas) {
        for (const cuotaExistente of presupuestoActual.cuotas) {
          if (!cuotas.has(cuotaExistente.categoria_id)) {
            await fetch(
              `/api/sobres/${sobreId}/presupuesto/cuotas/${cuotaExistente.categoria_id}`,
              { method: 'DELETE' }
            )
          }
        }
      }

      notify.success(isEditing ? t('success.update') : t('success.create'))
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar presupuesto:', error)
      notify.error(t('error.save'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>
              {t('title.create')} (<strong>{sobreNombre}</strong>)
            </DrawerTitle>
          </DrawerHeader>

          <DrawerBody className="space-y-4 overflow-y-auto">
            {/* Descripción */}
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>

            {/* Presupuesto Total */}
            <Card className="p-4 space-y-3 bg-primary/5 border-primary/20">
              <Label htmlFor="monto-global" className="text-base font-semibold">
                {t('global.label')}
              </Label>

              {!ajusteManual ? (
                // Modo automático: mostrar como texto bold con personalidad
                <div className="flex items-center justify-center py-6">
                  <p className="text-3xl font-bold text-primary">
                    {formatNumber(parseFloat(montoGlobal) || 0)}
                  </p>
                </div>
              ) : (
                // Modo manual: mostrar input editable
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {simbolo}
                    </span>
                    <Input
                      id="monto-global"
                      type="number"
                      inputMode="decimal"
                      step={decimales > 0 ? 0.01 : 1}
                      min="0"
                      value={montoGlobal}
                      onChange={(e) => setMontoGlobal(e.target.value)}
                      className="pl-8 h-12 text-lg"
                      placeholder="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => handleCalculatorOpen('global')}
                  >
                    <Calculator className="h-5 w-5" />
                  </Button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ajuste-manual"
                  checked={ajusteManual}
                  onCheckedChange={(checked) => setAjusteManual(checked as boolean)}
                />
                <label
                  htmlFor="ajuste-manual"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('global.manualAdjust')}
                </label>
              </div>
            </Card>

            {/* Warning si excede */}
            {excedePresupuesto > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('warning.exceeds', { amount: formatNumber(excedePresupuesto) })}
                </AlertDescription>
              </Alert>
            )}

            {/* Metas por Categoría */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">{t('categories.title')}</h3>

              {/* Tipos de gastos restantes (primera) */}
              <Card className="p-4 bg-muted/40 border-dashed space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <Label className="font-semibold flex-1">{t('categories.remainder')}</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('categories.remainderDescription')}
                </p>

                {/* Input de meta para restantes */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {simbolo}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={decimales > 0 ? 0.01 : 1}
                      min="0"
                      value={cuotas.get('RESTANTES') || ''}
                      onChange={(e) => handleCuotaChange('RESTANTES', e.target.value)}
                      className="pl-8"
                      placeholder={t('categories.metaPlaceholder')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCalculatorOpen('RESTANTES')}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* Categorías del sobre */}
              {categorias.length === 0 ? (
                <Card className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t('categories.empty')}</p>
                </Card>
              ) : (
                categorias.map((categoria) => {
                  const cuotaActual = cuotas.get(categoria.id) || ''
                  const cuotaNum = parseFloat(cuotaActual) || 0
                  const gastadoNum = categoria.gastado || 0
                  const porcentaje =
                    cuotaNum > 0 && gastadoNum > 0 ? (gastadoNum / cuotaNum) * 100 : 0
                  const excedeCategoria = gastadoNum > cuotaNum && cuotaNum > 0

                  return (
                    <Card
                      key={categoria.id}
                      className={`p-4 space-y-3 ${
                        excedeCategoria ? 'border-destructive bg-destructive/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{categoria.emoji || '📁'}</span>
                        <Label className="font-semibold flex-1">{categoria.nombre}</Label>
                      </div>

                      {/* Input de meta */}
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {simbolo}
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step={decimales > 0 ? 0.01 : 1}
                            min="0"
                            value={cuotaActual}
                            onChange={(e) => handleCuotaChange(categoria.id, e.target.value)}
                            className="pl-8"
                            placeholder={t('categories.metaPlaceholder')}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCalculatorOpen(categoria.id)}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mostrar gastado si está editando */}
                      {isEditing && gastadoNum > 0 && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('categories.spent')}:</span>
                            <span
                              className={`font-semibold ${
                                excedeCategoria ? 'text-destructive' : 'text-foreground'
                              }`}
                            >
                              {simbolo} {formatNumber(gastadoNum)}
                              {cuotaNum > 0 && (
                                <span className="ml-2">
                                  ({excedeCategoria ? '🔴' : ''} {porcentaje.toFixed(0)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })
              )}
            </div>
          </DrawerBody>

          <DrawerFooter className="border-t">
            <div className="flex gap-2 w-full">
              <DrawerClose asChild>
                <Button variant="outline" className="flex-1" disabled={loading}>
                  {t('actions.cancel')}
                </Button>
              </DrawerClose>
              <Button onClick={handleGuardar} disabled={loading} className="flex-1">
                {loading ? t('actions.saving') : t('actions.save')}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Calculator Drawer */}
      <CalculatorDrawer
        open={calculatorOpen}
        onOpenChange={(open) => {
          if (!open) handleCalculatorClose()
        }}
      />
    </>
  )
}
