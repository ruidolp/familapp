'use client'

import { useState, useEffect } from 'react'
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
}

export function VerDetalleTransaccionesDrawer({
  open,
  onOpenChange,
  sobreId,
  sobreName,
}: VerDetalleTransaccionesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [totalMes, setTotalMes] = useState(0)

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
        notify.error('Error al cargar transacciones')
      }
    } catch (error) {
      console.error('Error:', error)
      notify.error('Error al cargar transacciones')
    } finally {
      setLoading(false)
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
          <DrawerTitle>Detalle de Transacciones</DrawerTitle>
          <DrawerDescription>
            Transacciones del sobre &quot;{sobreName}&quot;
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-base text-muted-foreground">Cargando transacciones...</p>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-base text-muted-foreground">No hay transacciones aún</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen del mes */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total mes actual</p>
                    <p className="text-2xl font-bold text-blue-600">${totalMes.toFixed(2)}</p>
                  </div>
                  <Badge variant="outline" className="text-base">
                    {transacciones.length} transacciones
                  </Badge>
                </div>
              </Card>

              {/* Transacciones agrupadas por fecha */}
              <div className="space-y-4">
                {fechasOrdenadas.map((fecha) => (
                  <div key={fecha} className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground">{fecha}</h3>

                    <div className="space-y-2">
                      {transaccionesAgrupadas[fecha].map((transaccion) => (
                        <Card
                          key={transaccion.id}
                          className="p-3 flex justify-between items-center hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {/* Icono de categoría */}
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {transaccion.categoria?.emoji ? (
                                <span className="text-base">{transaccion.categoria.emoji}</span>
                              ) : (
                                <span className="text-base">💰</span>
                              )}
                            </div>

                            {/* Información de la transacción */}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium">
                                {transaccion.subcategoria?.nombre ||
                                  transaccion.categoria?.nombre ||
                                  'Sin categoría'}
                              </p>
                              {transaccion.descripcion && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {transaccion.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Monto */}
                          <p className="text-base font-semibold text-foreground ml-2">
                            -${Number(transaccion.monto).toFixed(2)}
                          </p>
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
              Cerrar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
