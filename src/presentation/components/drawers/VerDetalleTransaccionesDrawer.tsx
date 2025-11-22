'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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

interface Transaccion {
  id: string
  fecha: string
  monto: number
  descripcion?: string
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
}

interface VerDetalleTransaccionesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sobreId: string
  sobreName: string
  onTransactionsUpdated?: () => void
}

export function VerDetalleTransaccionesDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
  onTransactionsUpdated,
}: VerDetalleTransaccionesDrawerProps) {
  const t = useTranslations('sobres.transactions')
  const { formatNumber } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [totalMes, setTotalMes] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | null>(null)

  // Cargar transacciones cuando se abre el drawer
  useEffect(() => {
    if (open && sobreId) {
      fetchTransacciones()
    }
  }, [open, sobreId])

  const fetchTransacciones = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transacciones?sobreId=${sobreId}`)
      if (response.ok) {
        const data = await response.json()
        setTransacciones(data.transacciones || [])

        // Calcular total del mes
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        const totalDelMes = (data.transacciones || [])
          .filter((t: Transaccion) => {
            const transDate = new Date(t.fecha)
            return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear
          })
          .reduce((sum: number, t: Transaccion) => sum + Number(t.monto), 0)

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
              {/* Resumen del mes */}
              <Card className="p-4 border border-border bg-card/80 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="typography-body-sm text-muted-foreground">{t('totalCurrentMonth')}</p>
                    <p className="typography-h2 text-primary">{formatNumber(totalMes)}</p>
                  </div>
                  <Badge variant="secondary" className="typography-caption">
                    {t('transactionsCount', { count: transacciones.length })}
                  </Badge>
                </div>
              </Card>

              {/* Transacciones agrupadas por fecha */}
              <div className="space-y-4">
                {fechasOrdenadas.map((fecha) => (
                  <div key={fecha} className="space-y-3">
                    <h3 className="typography-body-sm font-semibold text-muted-foreground uppercase tracking-wide">{fecha}</h3>

                    <div className="space-y-2">
                      {transaccionesAgrupadas[fecha].map((transaccion) => (
                        <Card
                          key={transaccion.id}
                          className="p-3 flex justify-between items-center border border-border bg-card hover:bg-muted/50 transition cursor-pointer"
                          onClick={() => {
                            setSelectedTransaccion(transaccion)
                            setConfirmOpen(true)
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {/* Icono de categoría */}
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {transaccion.categoria?.emoji ? (
                                <span className="typography-body">{transaccion.categoria.emoji}</span>
                              ) : (
                                <span className="typography-body">💰</span>
                              )}
                          </div>

                          {/* Información de la transacción */}
                          <div className="flex-1 min-w-0">
                            <p className="typography-body font-medium text-foreground">
                              {transaccion.categoria?.nombre ||
                                transaccion.subcategoria?.nombre ||
                                t('noCategory')}
                            </p>
                            {(transaccion.subcategoria?.nombre || transaccion.descripcion) && (
                              <p className="typography-body-sm text-muted-foreground truncate">
                                {transaccion.subcategoria?.nombre || ''}
                                {transaccion.subcategoria?.nombre && transaccion.descripcion ? ' • ' : ''}
                                {transaccion.descripcion || ''}
                              </p>
                            )}
                          </div>
                        </div>

                          {/* Monto */}
                          <div className="flex items-center gap-2">
                            <p className="typography-label-lg text-destructive ml-2">
                              {formatNumber(-Number(transaccion.monto))}
                            </p>
                            {deletingId === transaccion.id && (
                              <span className="typography-metadata">{t('deleting')}</span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
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
                  {formatNumber(-Number(selectedTransaccion.monto))}
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
    </Drawer>
  )
}
