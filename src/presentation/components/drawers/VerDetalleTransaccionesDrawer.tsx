'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notify } from '@/infrastructure/lib/notifications'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { TransactionItemWithUser } from '@/components/sobres/transaction-item-with-user'
import { getCurrentBudgetCycle, formatDetailedBudgetRange } from '@/infrastructure/utils/budget-cycle'
import { cn } from '@/infrastructure/lib/utils'
import { useSobreCategories } from '@/presentation/hooks/useSobres'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, SlidersHorizontal, Trash2 } from 'lucide-react'

interface Transaccion {
  id: string
  fecha: string
  monto: number
  descripcion?: string
  tipo: string
  usuario_id: string
  categoria?: {
    id: string
    nombre: string
    emoji?: string
  }
  subcategoria?: {
    id: string
    nombre: string
    emoji?: string
  }
  usuario: {
    id: string
    nombre?: string
    email?: string
    avatar?: string
  }
}

interface VerDetalleTransaccionesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  diaInicioPeriodo?: number
  onTransactionsUpdated?: () => void
}

export function VerDetalleTransaccionesDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  diaInicioPeriodo = 1,
  onTransactionsUpdated,
}: VerDetalleTransaccionesDrawerProps) {
  const { data: session } = useSession()
  const t = useTranslations('sobres.transactions')
  const { formatNumber, decimales } = useCurrency()
  const { categorias: sobreCategorias } = useSobreCategories(sobreId)
  const decimalPlaces = decimales ?? 0

  const currentCycle = useMemo(
    () => getCurrentBudgetCycle(diaInicioPeriodo),
    [diaInicioPeriodo]
  )

  const cycleLabel = useMemo(
    () => formatDetailedBudgetRange(currentCycle),
    [currentCycle]
  )

  const [loading, setLoading] = useState(false)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [totalMes, setTotalMes] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null)
  const [actionOpen, setActionOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([])

  // Cargar transacciones cuando se abre el drawer
  useEffect(() => {
    if (open && sobreId) {
      fetchTransacciones()
    }
  }, [open, sobreId])

  const fetchTransacciones = async () => {
    setLoading(true)
    try {
      const start = new Date(currentCycle.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(currentCycle.endDate)
      end.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        sobreId,
        fechaInicio: start.toISOString(),
        fechaFin: end.toISOString(),
      })

      const response = await fetch(`/api/transacciones?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTransacciones(data.transacciones || [])

        const totalDelMes = (data.transacciones || []).reduce(
          (sum: number, t: Transaccion) => sum + Number(t.monto),
          0
        )

        setTotalMes(totalDelMes)
      } else {
        notify.error(t('errors.loadFailed'))
      }
    } catch (error) {
      console.error('Error:', error)
      notify.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transaccionId: string) => {
    setDeletingId(transaccionId)
    try {
      const response = await fetch(`/api/transacciones/${transaccionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('errors.deleteFailed'))
      }

      notify.success(t('deleteSuccess'))
      await fetchTransacciones()
      onTransactionsUpdated?.()
      setActionOpen(false)
    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      notify.error(error.message || t('errors.deleteFailed'))
    } finally {
      setDeletingId(null)
      setConfirmOpen(false)
      setSelectedTransaccion(null)
    }
  }

  // Agrupar transacciones por fecha
  const transaccionesAgrupadas = transacciones.reduce(
    (acc: Record<string, Transaccion[]>, transaccion: Transaccion) => {
      const fecha = new Date(transaccion.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      if (!acc[fecha]) {
        acc[fecha] = []
      }
      acc[fecha].push(transaccion)
      return acc
    },
    {}
  )

  // Ordenar fechas descendentes (más recientes primero)
  const fechasOrdenadas = Object.keys(transaccionesAgrupadas).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const availableCategories = useMemo(() => {
    const fromSobre = (sobreCategorias || []).map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      emoji: cat.emoji,
    }))

    const fromTransactions = transacciones
      .filter((tx) => tx.categoria)
      .map((tx) => ({
        id: tx.categoria!.id,
        nombre: tx.categoria!.nombre,
        emoji: tx.categoria?.emoji,
      }))

    const unique: Record<string, { id: string; nombre: string; emoji?: string }> = {}
    for (const cat of [...fromSobre, ...fromTransactions]) {
      if (!unique[cat.id]) unique[cat.id] = cat
    }

    const hasUncategorized = transacciones.some((tx) => !tx.categoria?.id)
    const list = Object.values(unique)
    if (hasUncategorized) {
      list.push({
        id: 'uncategorized',
        nombre: t('noCategory'),
        emoji: '📂',
      })
    }
    return list
  }, [sobreCategorias, transacciones, t])

  const filteredTransacciones = useMemo(() => {
    if (!activeCategoryIds.length) return transacciones
    return transacciones.filter((tx) => {
      const categoriaId = tx.categoria?.id || 'uncategorized'
      return activeCategoryIds.includes(categoriaId)
    })
  }, [activeCategoryIds, transacciones])

  const prepareEditForm = (tx: Transaccion) => {
    setEditAmount((Math.abs(Number(tx.monto))).toFixed(decimalPlaces))
    setEditDescription(tx.descripcion || '')
    setEditDate(new Date(tx.fecha).toISOString().split('T')[0])
    setEditCategoryId(tx.categoria?.id || null)
  }

  const getSignedAmount = (tx: Transaccion | null) => {
    if (!tx) return ''
    const sign = tx.tipo === 'INGRESO' ? 1 : -1
    return formatNumber(sign * Number(tx.monto))
  }

  const handleSaveEdit = async () => {
    if (!selectedTransaccion) return
    setEditSaving(true)

    try {
      const payload: any = {
        monto: editAmount ? Number(editAmount) : undefined,
        descripcion: editDescription || undefined,
        fecha: editDate ? new Date(editDate).toISOString() : undefined,
        categoriaId: editCategoryId || undefined,
      }

      const response = await fetch(`/api/transacciones/${selectedTransaccion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('actions.updateError'))
      }

      notify.success(t('actions.updateSuccess'))
      await fetchTransacciones()
      onTransactionsUpdated?.()
      setEditOpen(false)
      setActionOpen(false)
      setSelectedTransaccion(null)
    } catch (error: any) {
      console.error('Error updating transaction:', error)
      notify.error(error.message || t('actions.updateError'))
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95dvh] overflow-hidden bg-gradient-to-b from-primary/15 via-background/85 to-background">
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description', { sobreName })}</DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <div className="text-center py-8">
              <p className="typography-body text-muted-foreground">{t('loading')}</p>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="typography-body text-muted-foreground">{t('noTransactions')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-background shadow-sm">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_45%)]" />
                <div className="relative flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="typography-caption text-muted-foreground uppercase tracking-wide">
                      {t('currentCycle')}
                    </p>
                    <p className="typography-body text-foreground">{cycleLabel}</p>
                    <p className="typography-h2 text-primary mt-2">{formatNumber(totalMes)}</p>
                    <p className="typography-body-sm text-muted-foreground">
                      {t('totalCurrentMonth')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="typography-caption">
                    {t('transactionsCount', { count: filteredTransacciones.length })}
                  </Badge>
                </div>
              </Card>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t('filters.title')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCategoryIds([])}
                    className="h-8"
                  >
                    {t('filters.all')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => {
                    const isActive = activeCategoryIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setActiveCategoryIds((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((id) => id !== cat.id)
                              : [...prev, cat.id]
                          )
                        }
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors shadow-sm',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/80 bg-background/60 hover:border-primary/40'
                        )}
                      >
                        {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
                        <span className="font-medium text-foreground">{cat.nombre}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {fechasOrdenadas.map((fecha) => {
                  const items = (transaccionesAgrupadas[fecha] || []).filter((tx) =>
                    filteredTransacciones.some((f) => f.id === tx.id)
                  )
                  if (!items.length) return null

                  return (
                    <div key={fecha} className="space-y-3">
                      <h3 className="typography-body-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {fecha}
                      </h3>

                      <div className="space-y-2">
                        {items.map((transaccion) => (
                          <TransactionItemWithUser
                            key={transaccion.id}
                            transaction={transaccion}
                            currentUserId={session?.user?.id}
                            onClick={() => {
                              setSelectedTransaccion(transaccion)
                              prepareEditForm(transaccion)
                              setActionOpen(true)
                            }}
                            showDate={false}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {t('buttons.close')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>

      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('confirmTitle')}</DrawerTitle>
            <DrawerDescription>{t('confirmMessage')}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="rounded-xl border border-border bg-card/70 p-4 space-y-1">
              <p className="typography-label text-foreground">
                {selectedTransaccion?.categoria?.nombre ||
                  selectedTransaccion?.subcategoria?.nombre ||
                  t('noCategory')}
              </p>
              {(selectedTransaccion?.subcategoria?.nombre || selectedTransaccion?.descripcion) && (
                <p className="typography-body-sm text-muted-foreground">
                  {selectedTransaccion?.subcategoria?.nombre || ''}
                  {selectedTransaccion?.subcategoria?.nombre && selectedTransaccion?.descripcion ? ' • ' : ''}
                  {selectedTransaccion?.descripcion || ''}
                </p>
              )}
              {selectedTransaccion && (
                <p className="typography-label-lg text-destructive">
                  {getSignedAmount(selectedTransaccion)}
                </p>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t('buttons.close')}
            </Button>
            <Button
              variant="destructive"
              disabled={!selectedTransaccion || deletingId === selectedTransaccion.id}
              onClick={() => selectedTransaccion && handleDelete(selectedTransaccion.id)}
            >
              {deletingId === selectedTransaccion?.id ? t('deleting') : t('confirmDeleteAction')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={actionOpen}
        onOpenChange={(open) => {
          setActionOpen(open)
          if (!open) {
            setSelectedTransaccion(null)
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('actions.title')}</DrawerTitle>
            <DrawerDescription>{t('actions.description')}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-3">
            <div className="rounded-xl border border-border bg-card/70 p-4 space-y-1">
              <p className="typography-label text-foreground">
                {selectedTransaccion?.categoria?.nombre ||
                  selectedTransaccion?.subcategoria?.nombre ||
                  t('noCategory')}
              </p>
              {(selectedTransaccion?.subcategoria?.nombre || selectedTransaccion?.descripcion) && (
                <p className="typography-body-sm text-muted-foreground">
                  {selectedTransaccion?.subcategoria?.nombre || ''}
                  {selectedTransaccion?.subcategoria?.nombre && selectedTransaccion?.descripcion ? ' • ' : ''}
                  {selectedTransaccion?.descripcion || ''}
                </p>
              )}
              {selectedTransaccion && (
                <p className="typography-label-lg text-primary">
                  {getSignedAmount(selectedTransaccion)}
                </p>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-1 gap-3">
            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                if (!selectedTransaccion) return
                prepareEditForm(selectedTransaccion)
                setEditOpen(true)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('actions.edit')}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                setActionOpen(false)
                setConfirmOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.delete')}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t('buttons.close')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) {
            setEditSaving(false)
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('actions.editTitle')}</DrawerTitle>
            <DrawerDescription>{t('actions.editDescription')}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('actions.fields.amount')}</Label>
              <Input
                id="amount"
                type="number"
                step={decimalPlaces === 0 ? 1 : `0.${'0'.repeat(decimalPlaces - 1)}1`}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('actions.fields.description')}</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t('actions.placeholders.description')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t('actions.fields.date')}</Label>
              <Input
                id="date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('actions.fields.category')}</Label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const isActive = editCategoryId === cat.id || (!editCategoryId && cat.id === 'uncategorized')
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditCategoryId(cat.id === 'uncategorized' ? null : cat.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/80 bg-muted/40 hover:border-primary/40'
                      )}
                    >
                      {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
                      <span className="font-medium text-foreground">{cat.nombre}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t('buttons.close')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? t('actions.saving') : t('actions.save')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Drawer>
  )
}
