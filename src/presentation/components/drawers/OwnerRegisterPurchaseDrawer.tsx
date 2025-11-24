'use client'

/**
 * OwnerRegisterPurchaseDrawer Component
 *
 * Allows list owner to register purchases made by invited users in their own budgets
 */

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/presentation/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/presentation/components/ui/sheet'
import { Label } from '@/presentation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'
import { Card } from '@/presentation/components/ui/card'
import { Badge } from '@/presentation/components/ui/badge'
import { Store, User, MapPin, CalendarClock, DollarSign, X } from 'lucide-react'
import { notify } from '@/infrastructure/lib/notifications'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface Sobre {
  id: string
  nombre: string
  emoji?: string
  presupuesto_asignado: number
  gastado?: number
  is_compartido?: boolean
}

interface Categoria {
  id: string
  nombre: string
  emoji?: string
}

interface Subcategoria {
  id: string
  nombre: string
  emoji?: string
  categoria_id: string
}

interface ExecutionInfo {
  id: string
  executor_name: string
  executor_email: string
  store_name: string
  total_manual?: number
  total_calculated?: number
  completed_at: string
}

interface OwnerRegisterPurchaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  execution: ExecutionInfo | null
  userId: string
  onSuccess: () => void
}

function SelectionBadge({
  emoji,
  label,
  onClear,
}: {
  emoji?: string
  label: string
  onClear: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-primary bg-primary/10 px-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {emoji && <span className="text-lg">{emoji}</span>}
        <span className="text-foreground">{label}</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1 text-primary transition-colors hover:bg-primary/10"
        aria-label="Cambiar selección"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function OwnerRegisterPurchaseDrawer({
  open,
  onOpenChange,
  execution,
  userId,
  onSuccess,
}: OwnerRegisterPurchaseDrawerProps) {
  const t = useTranslations('common')
  const { formatNumber } = useCurrency()

  // Data
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [executionItems, setExecutionItems] = useState<any[]>([])
  const [autoBrandSelected, setAutoBrandSelected] = useState(false)

  // Selection state
  const [sobreId, setSobreId] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [subcategoriaId, setSubcategoriaId] = useState<string>('')

  // Loading states
  const [isRegistering, setIsRegistering] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  // Load sobres and execution items on open
  useEffect(() => {
    if (open && userId) {
      loadSobres()
    }
    if (open && execution) {
      loadExecutionItems()
    }
  }, [open, userId, execution])

  const loadExecutionItems = async () => {
    if (!execution?.id) return
    try {
      const response = await fetch(`/api/shopping-executions/${execution.id}/items`)
      if (response.ok) {
        const data = await response.json()
        setExecutionItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading execution items:', error)
    }
  }

  // Load categories when sobre changes
  useEffect(() => {
    if (sobreId) {
      setCategoriaId('')
      setSubcategoriaId('')
      setAutoBrandSelected(false)
      loadCategoriasBySobre(sobreId)
    } else {
      setCategorias([])
      setCategoriaId('')
      setSubcategorias([])
      setAutoBrandSelected(false)
    }
  }, [sobreId])

  // Load subcategorias when categoria changes
  useEffect(() => {
    if (categoriaId) {
      setSubcategoriaId('')
      setAutoBrandSelected(false)
      loadSubcategoriasByCategoria(categoriaId)
    } else {
      setSubcategorias([])
      setSubcategoriaId('')
      setAutoBrandSelected(false)
    }
  }, [categoriaId])

  // Auto-select subcategoria if it exists in execution items or matches store name
  useEffect(() => {
    if (subcategorias.length === 0 || subcategoriaId || autoBrandSelected) return

    const normalizedStore = execution?.store_name?.trim().toLowerCase()

    if (normalizedStore) {
      const storeMatch = subcategorias.find(
        s => s.nombre?.trim().toLowerCase() === normalizedStore,
      )
      if (storeMatch) {
        setSubcategoriaId(storeMatch.id)
        setAutoBrandSelected(true)
        return
      }
    }

    if (executionItems.length > 0) {
      const executionSubcategoriaIds = [
        ...new Set(executionItems.map(item => item.subcategoria_id).filter(id => id)),
      ]
      const matchingSubcategoria = subcategorias.find(s =>
        executionSubcategoriaIds.includes(s.id),
      )

      if (matchingSubcategoria) {
        setSubcategoriaId(matchingSubcategoria.id)
        setAutoBrandSelected(true)
      }
    }
  }, [subcategorias, subcategoriaId, executionItems, execution, autoBrandSelected])

  useEffect(() => {
    if (!open) return
    setAutoBrandSelected(false)
  }, [open])

  // Auto-select first sobre
  useEffect(() => {
    if (sobres.length > 0 && !sobreId) {
      const hogarSobre = sobres.find(s => s.nombre?.toLowerCase().includes('hogar'))
      setSobreId(hogarSobre?.id || sobres[0]?.id || '')
    }
  }, [sobres, sobreId])

  // Auto-select first categoria
  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) {
      const defaultCategoria =
        categorias.find(c => c.nombre?.toLowerCase().includes('supermercado')) || categorias[0]
      setCategoriaId(defaultCategoria?.id || '')
    }
  }, [categorias, categoriaId])

  const loadSobres = async () => {
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        setSobres(data.sobres || [])
      }
    } catch (error) {
      console.error('Error loading sobres:', error)
    }
  }

  const loadCategoriasBySobre = async (sobreId: string) => {
    try {
      const response = await fetch(`/api/sobres/${sobreId}/categorias`)
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.categorias || [])
      }
    } catch (error) {
      console.error('Error loading categorias:', error)
    }
  }

  const loadSubcategoriasByCategoria = async (categoriaId: string) => {
    try {
      const response = await fetch(`/api/categorias/${categoriaId}/subcategorias`)
      if (response.ok) {
        const data = await response.json()
        setSubcategorias(data.subcategorias || [])
      }
    } catch (error) {
      console.error('Error loading subcategorias:', error)
    }
  }

  const selectedSubcategoria = subcategorias.find(s => s.id === subcategoriaId)

  const handleRegister = async () => {
    if (!execution) return

    // Validate
    if (!sobreId) {
      notify.error('Selecciona un sobre')
      return
    }
    if (!categoriaId) {
      notify.error('Selecciona una categoría')
      return
    }
    if (!subcategoriaId) {
      notify.error('Selecciona una marca')
      return
    }

    setIsRegistering(true)
    try {
      const response = await fetch(`/api/shopping-executions/${execution.id}/owner-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          sobre_id: sobreId,
          categoria_id: categoriaId,
          subcategoria_id: subcategoriaId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar')
      }

      notify.success('Compra registrada en tus sobres')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      notify.error(error.message || 'Error al registrar compra')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDismiss = async () => {
    if (!execution) return

    setIsDismissing(true)
    try {
      const response = await fetch(`/api/shopping-executions/${execution.id}/owner-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al descartar')
      }

      notify.success('Compra descartada')
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      notify.error(error.message || 'Error al descartar compra')
    } finally {
      setIsDismissing(false)
    }
  }

  const handleLater = () => {
    onOpenChange(false)
  }

  if (!execution) return null

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return formatter.format(date)
  }

  const executionItemsTotal = executionItems.reduce((sum, item) => {
    const value = Number(item.precio_total ?? 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const rawPurchaseTotal =
    execution.total_manual ??
    execution.total_calculated ??
    execution.total_estimado ??
    executionItemsTotal

  const purchaseTotal =
    typeof rawPurchaseTotal === 'number'
      ? rawPurchaseTotal
      : Number(rawPurchaseTotal ?? 0) || 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-[92vh] flex-col overflow-hidden sm:max-w-[480px]">
        <SheetHeader className="text-left">
          <SheetTitle className="typography-h3">Registrar compra</SheetTitle>
          <SheetDescription>
            Esta compra fue realizada por un invitado. ¿Quieres registrarla en tus sobres?
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto py-5">
          {/* Purchase Summary */}
          <Card className="mx-1 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total de la compra</p>
                  <p className="text-3xl font-bold text-foreground leading-tight">
                    {formatNumber(purchaseTotal)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 typography-body-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Ejecutada por:</span>
                  <span>{execution.executor_name || execution.executor_email}</span>
                </div>

                {execution.store_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Tienda:</span>
                    <span>{execution.store_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  <span className="font-medium">Fecha:</span>
                  <span>{formatDateTime(execution.completed_at)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Registration Form */}
          <Card className="mx-1 space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="typography-label text-foreground mb-1">¿Dónde registrar esta compra?</p>
              <p className="typography-metadata text-muted-foreground">
                Selecciona el sobre, categoría y marca de tu presupuesto
              </p>
            </div>

            <div className="space-y-4 rounded-xl bg-muted/40 p-3">
              {/* Sobre */}
              <div className="space-y-2">
                <Label htmlFor="sobre" className="typography-caption text-muted-foreground">
                  Sobre
                </Label>
                <Select value={sobreId} onValueChange={setSobreId}>
                  <SelectTrigger id="sobre">
                    <SelectValue placeholder="Seleccionar sobre" />
                  </SelectTrigger>
                  <SelectContent>
                    {sobres.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2 w-full">
                          {s.emoji && <span>{s.emoji}</span>}
                          <span className="truncate flex-1">{s.nombre}</span>
                          {s.is_compartido && (
                            <span className="text-xs text-muted-foreground">(Compartido)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoría */}
              {sobreId && (
                <div className="space-y-2">
                  <Label htmlFor="categoria" className="typography-caption text-muted-foreground">
                    Categoría
                  </Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.emoji && <span className="mr-1">{c.emoji}</span>}
                          <span className="truncate">{c.nombre}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Marca */}
              {categoriaId && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 typography-caption text-muted-foreground">
                    <Store className="h-3.5 w-3.5" /> Marca
                  </Label>
                  {subcategoriaId && selectedSubcategoria ? (
                    <SelectionBadge
                      emoji={selectedSubcategoria.emoji}
                      label={selectedSubcategoria.nombre}
                      onClear={() => {
                        setSubcategoriaId('')
                        setAutoBrandSelected(true)
                      }}
                    />
                  ) : subcategorias.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {subcategorias.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSubcategoriaId(s.id)
                            setAutoBrandSelected(true)
                          }}
                          className="min-h-[44px] w-full rounded-xl border border-transparent bg-muted px-3 py-2 text-left text-sm font-medium leading-tight text-foreground transition-all hover:bg-muted/80"
                        >
                          <div className="flex items-center gap-2">
                            {s.emoji && <span className="text-lg">{s.emoji}</span>}
                            <span className="flex-1">{s.nombre}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="typography-metadata text-muted-foreground italic">
                      No hay marcas disponibles
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer buttons */}
        <div className="border-t bg-background p-4 space-y-2">
          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={!sobreId || !categoriaId || !subcategoriaId || isRegistering || isDismissing}
          >
            {isRegistering ? 'Registrando...' : 'Registrar en mis sobres'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
              disabled={isRegistering || isDismissing}
            >
              {isDismissing ? 'Descartando...' : 'No registrar'}
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleLater}
              disabled={isRegistering || isDismissing}
            >
              Ver más tarde
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
