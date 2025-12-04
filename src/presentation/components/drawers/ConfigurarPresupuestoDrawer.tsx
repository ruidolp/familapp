'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Calculator, AlertTriangle, Sparkles, Target, Layers, Eye, ShieldCheck, X } from 'lucide-react'
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalculatorDrawer } from '@/components/execution/CalculatorDrawer'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { useCurrencyInput } from '@/presentation/hooks/useCurrencyInput'
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

type CategoriaMeta = Categoria & {
  esRemainder?: boolean
  descripcion?: string
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getLocaleSeparators = (locale: string) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const parts = formatter.formatToParts(1234.5)
  const decimalSeparator = parts.find(part => part.type === 'decimal')?.value || ','
  const groupSeparator = parts.find(part => part.type === 'group')?.value || '.'

  return { decimalSeparator, groupSeparator }
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
  const { formatNumber, simbolo, decimales, locale } = useCurrency()
  const { formatInputValue, parseInputToNumber } = useCurrencyInput()

  const [loading, setLoading] = useState(false)
  const [montoGlobal, setMontoGlobal] = useState('')
  const [ajusteManual, setAjusteManual] = useState(false)
  const [cuotas, setCuotas] = useState<Map<string, string>>(new Map())
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorTarget, setCalculatorTarget] = useState<string | null>(null)
  const [lastFocusedMeta, setLastFocusedMeta] = useState<string>('RESTANTES')
  const [presupuestoEnabled, setPresupuestoEnabled] = useState(false)

  const isEditing = presupuestoEnabled && !!(presupuestoActual?.enabled ?? presupuestoActual?.presupuesto_enabled)

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: decimales,
      }),
    [locale, decimales]
  )

  const formatNumberForInput = useCallback(
    (value?: number | null) => {
      if (value === null || value === undefined || isNaN(value)) {
        return ''
      }
      return numberFormatter.format(value)
    },
    [numberFormatter]
  )

  const updateCuotaValue = useCallback((categoriaId: string, value: string) => {
    setCuotas(prev => {
      const updated = new Map(prev)
      if (!value) {
        updated.delete(categoriaId)
      } else {
        updated.set(categoriaId, value)
      }
      return updated
    })
  }, [])

  const handleMontoGlobalChange = useCallback(
    (valor: string) => {
      const formatted = formatInputValue(valor)
      setMontoGlobal(formatted)
    },
    [formatInputValue]
  )

  // Inicializar valores si está editando
  useEffect(() => {
    if (open && presupuestoActual) {
      const enabledFlag = !!(presupuestoActual.enabled ?? presupuestoActual.presupuesto_enabled)
      setPresupuestoEnabled(enabledFlag)
      const formattedMonto =
        presupuestoActual.monto_global > 0
          ? formatNumberForInput(presupuestoActual.monto_global)
          : ''
      setMontoGlobal(formattedMonto)

      const nuevasCuotas = new Map<string, string>()
      presupuestoActual.cuotas?.forEach((cuota) => {
        if (cuota.monto_cuota > 0) {
          nuevasCuotas.set(
            cuota.categoria_id,
            formatNumberForInput(cuota.monto_cuota)
          )
        }
      })
      setCuotas(nuevasCuotas)
      setLastFocusedMeta('RESTANTES')
    } else if (open) {
      // Reset para nuevo
      setMontoGlobal('')
      setCuotas(new Map())
      setAjusteManual(false)
      setLastFocusedMeta('RESTANTES')
      setPresupuestoEnabled(false)
    }
  }, [open, presupuestoActual, formatNumberForInput])

  // Calcular suma de cuotas
  const sumaCuotas = useMemo(() => {
    let total = 0
    cuotas.forEach(valor => {
      const num = parseInputToNumber(valor)
      if (!isNaN(num)) total += num
    })
    return total
  }, [cuotas, parseInputToNumber])

  // Calcular resto del presupuesto
  const restoPresupuesto = useMemo(() => {
    const global = parseInputToNumber(montoGlobal)
    return Math.max(0, global - sumaCuotas)
  }, [montoGlobal, sumaCuotas, parseInputToNumber])

  // Warning cuando cuotas exceden global
  const excedePresupuesto = useMemo(() => {
    const global = parseInputToNumber(montoGlobal)
    return sumaCuotas > global ? sumaCuotas - global : 0
  }, [montoGlobal, sumaCuotas, parseInputToNumber])

  const categoriasList = useMemo<CategoriaMeta[]>(() => {
    return [
      {
        id: 'RESTANTES',
        nombre: t('categories.remainder'),
        emoji: '📦',
        descripcion: t('categories.remainderDescription'),
        esRemainder: true,
      },
      ...categorias,
    ]
  }, [categorias, t])

  const activationBenefits = useMemo(
    () =>
      [
        { key: 'metaGlobal', icon: Target },
        { key: 'partial', icon: Layers },
        { key: 'general', icon: Eye },
        { key: 'visual', icon: ShieldCheck },
      ].map(item => ({
        ...item,
        title: t(`disabled.items.${item.key}.title`),
        description: t(`disabled.items.${item.key}.description`),
      })),
    [t]
  )

  const noBlockInfo = useMemo(
    () => ({
      title: t('disabled.noBlock.title'),
      description: t('disabled.noBlock.description'),
    }),
    [t]
  )

  // Actualizar monto global cuando cambia suma de cuotas (si ajuste manual está desactivado)
  useEffect(() => {
    if (!ajusteManual && sumaCuotas > 0) {
      setMontoGlobal(formatNumberForInput(sumaCuotas))
    }
  }, [sumaCuotas, ajusteManual, formatNumberForInput])

  const handleCuotaChange = useCallback(
    (categoriaId: string, valor: string) => {
      const formattedValue = formatInputValue(valor)
      updateCuotaValue(categoriaId, formattedValue)
    },
    [formatInputValue, updateCuotaValue]
  )

  const handleCalculatorOpen = (target: string) => {
    setCalculatorTarget(target)
    setCalculatorOpen(true)
  }

  const handleCalculatorClose = (value?: string) => {
    if (value && calculatorTarget) {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        const formattedValue = formatNumberForInput(numericValue)
        if (calculatorTarget === 'global') {
          setMontoGlobal(formattedValue)
        } else {
          updateCuotaValue(calculatorTarget, formattedValue)
        }
      }
    }
    setCalculatorOpen(false)
    setCalculatorTarget(null)
  }

  const handleGuardar = async () => {
    setLoading(true)
    try {
      const global = parseInputToNumber(montoGlobal)

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

        const montoNum = parseInputToNumber(monto)
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

  const handleActivarMetas = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sobres/${sobreId}/presupuesto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })
      const data = await res.json()
      if (!data.success) {
        notify.error(data.error || t('error.save'))
        return
      }
      setPresupuestoEnabled(true)
      notify.success(t('success.enabled'))
    } catch (error) {
      console.error('Error al activar metas:', error)
      notify.error(t('error.save'))
    } finally {
      setLoading(false)
    }
  }

  const handleDesactivarMetas = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sobres/${sobreId}/presupuesto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })
      const data = await res.json()
      if (!data.success) {
        notify.error(data.error || t('error.save'))
        return
      }
      setPresupuestoEnabled(false)
      onOpenChange(false)
      onSuccess?.()
      notify.success(t('success.disabled'))
    } catch (error) {
      console.error('Error al desactivar metas:', error)
      notify.error(t('error.save'))
    } finally {
      setLoading(false)
    }
  }

  if (!presupuestoEnabled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg border-none bg-transparent p-0 shadow-none [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('disabled.title')}</DialogTitle>
          </DialogHeader>
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-background/95 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background/80 to-background" />
            <div className="relative flex flex-col gap-5 p-6 pb-7">
              <DialogClose className="absolute right-5 top-5 rounded-full bg-background/80 p-2 text-muted-foreground shadow-sm transition hover:bg-background hover:text-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">{t('actions.cancel')}</span>
              </DialogClose>

              <div className="space-y-1 text-left">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('disabled.badge')}
                </span>
                <h2 className="text-2xl font-semibold leading-tight text-foreground">
                  {t('disabled.title')}
                </h2>
                <p className="text-base font-medium leading-tight text-muted-foreground">
                  {t('disabled.description')}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t('disabled.listTitle')}
                </p>
                <div className="rounded-2xl border border-border/60 bg-background/90 divide-y divide-border/50">
                  {activationBenefits.map(({ key, icon: Icon, title, description }) => (
                    <div key={key} className="flex items-start gap-3 px-3 py-3">
                      <span className="mt-1 rounded-full bg-primary/10 text-primary p-1.5">
                        <Icon className="h-4 w-4" />
                      </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                ))}
                  <div className="flex items-start gap-3 px-3 py-3">
                    <span className="mt-1 rounded-full bg-primary/10 text-primary p-1.5">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {noBlockInfo.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {noBlockInfo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleActivarMetas}
                disabled={loading}
                className="h-12 w-full text-base font-semibold"
              >
                {loading ? t('actions.saving') : t('actions.enable')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
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

              {/* Introducción */}
              <p className="text-base font-semibold text-foreground">
                {t('intro')}
              </p>

                {/* Presupuesto Total */}
                <Card className="p-4 space-y-3 bg-primary/5 border-primary/20">
                  <Label htmlFor="monto-global" className="text-base font-semibold">
                    {t('global.label')}
                  </Label>

                  {!ajusteManual ? (
                    // Modo automático: mostrar solo texto centrado manteniendo altura
                    <div className="h-12 rounded-xl bg-background/50 border border-primary/20 flex items-center justify-center text-2xl font-semibold text-primary">
                      {formatNumber(parseInputToNumber(montoGlobal))}
                    </div>
                  ) : (
                    // Modo manual: mostrar input editable
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {simbolo}
                      </span>
                      <Input
                        id="monto-global"
                        type="text"
                        inputMode="decimal"
                        value={montoGlobal}
                        onChange={(e) => handleMontoGlobalChange(e.target.value)}
                        className="pl-8 h-12 text-lg"
                        placeholder="0"
                      />
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
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{t('categories.title')}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleCalculatorOpen(lastFocusedMeta || 'RESTANTES')}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-xl border divide-y overflow-hidden bg-card/60">
                {categoriasList.map((categoria) => {
                  const esRemainder = !!categoria.esRemainder
                  const cuotaActual = cuotas.get(categoria.id) ?? ''
                  const cuotaNum = parseInputToNumber(cuotaActual)
                  const gastadoNum = categoria.gastado || 0
                  const porcentaje =
                    cuotaNum > 0 && gastadoNum > 0 ? (gastadoNum / cuotaNum) * 100 : 0
                  const excedeCategoria = gastadoNum > cuotaNum && cuotaNum > 0
                  const mostrarGastado = !esRemainder && isEditing && gastadoNum > 0

                  return (
                    <div
                      key={categoria.id}
                      className={`px-3 py-2 space-y-1 ${
                        excedeCategoria ? 'bg-destructive/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg flex-none">
                            {esRemainder ? '📦' : categoria.emoji || '📁'}
                          </span>
                          <span className="font-semibold truncate">{categoria.nombre}</span>

                          {mostrarGastado && (
                            <span
                              className={`hidden text-xs font-medium md:inline truncate ${
                                excedeCategoria ? 'text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {t('categories.spent')}: {formatNumber(gastadoNum)}
                              {cuotaNum > 0 && (
                                <span className="ml-1">({porcentaje.toFixed(0)}%)</span>
                              )}
                            </span>
                          )}
                        </div>

                        <div className="relative w-32 sm:w-40 flex-none">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {simbolo}
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={cuotaActual}
                            onFocus={() => setLastFocusedMeta(categoria.id)}
                            onChange={(e) => handleCuotaChange(categoria.id, e.target.value)}
                            className="pl-7 text-right"
                            placeholder={t('categories.metaPlaceholder')}
                          />
                        </div>
                      </div>

                      {esRemainder && categoria.descripcion && (
                        <p className="text-xs text-muted-foreground">
                          {categoria.descripcion}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {categorias.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  {t('categories.empty')}
                </p>
              )}

              <Card className="border-destructive/40 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-destructive">
                      {t('deactivate.title')}
                    </h4>
                    <p className="text-xs text-destructive/80">
                      {t('deactivate.description')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDesactivarMetas}
                    disabled={loading}
                  >
                    {t('deactivate.action')}
                  </Button>
                </div>
              </Card>
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
