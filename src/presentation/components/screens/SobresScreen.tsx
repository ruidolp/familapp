'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { SobreCard } from '@/components/cards/SobreCard'
import { CrearSobreDrawer } from '@/components/drawers/CrearSobreDrawer'
import { AgregarPresupuestoDrawer } from '@/components/drawers/AgregarPresupuestoDrawer'
import { ReducirPresupuestoDrawer } from '@/components/drawers/ReducirPresupuestoDrawer'
import { CrearGastoDrawer } from '@/components/drawers/CrearGastoDrawer'
import { EditarCategoriasMarcasDrawer } from '@/components/drawers/EditarCategoriasMarcasDrawer'
import { VerDetalleTransaccionesDrawer } from '@/components/drawers/VerDetalleTransaccionesDrawer'
import { EditarSobreDrawer } from '@/components/drawers/EditarSobreDrawer'
import { OverspendWarningModal } from '@/components/modals/OverspendWarningModal'
import { notify } from '@/infrastructure/lib/notifications'
import { useSobre, useDevolverPresupuesto } from '@/presentation/hooks/useSobres'
import { useTranslations } from 'next-intl'

interface Sobre {
  id: string
  nombre: string
  emoji?: string
  color?: string
  presupuesto_asignado: number
  gastado?: number
  asignaciones: any[]
  miAsignacion?: any[]
  resumen?: any[]
  is_compartido?: boolean
  usuario_id?: string
  user_role?: 'OWNER' | 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER'
  presupuesto_enabled?: boolean
}

interface WarningType {
  type: 'OVERSPEND_SOBRE' | 'NEGATIVE_WALLET'
  message: string
  details: any
}

interface SobresScreenProps {
  userId: string
  menuAction?: string | null
  onMenuActionHandled?: () => void
  onCarouselChange?: (index: number, total: number) => void
  onSobreChange?: (sobre: { nombre: string; emoji?: string; presupuesto: number } | null) => void
}

export function SobresScreen({ userId, menuAction, onMenuActionHandled, onCarouselChange, onSobreChange }: SobresScreenProps) {
  const t = useTranslations('sobres')
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [loading, setLoading] = useState(false)
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState<number>(1)

  // Drawers y modales
  const [crearSobreOpen, setCrearSobreOpen] = useState(false)
  const [agregarPresupuestoOpen, setAgregarPresupuestoOpen] = useState(false)
  const [reducirPresupuestoOpen, setReducirPresupuestoOpen] = useState(false)
  const [crearGastoOpen, setCrearGastoOpen] = useState(false)
  const [editarCategoriasOpen, setEditarCategoriasOpen] = useState(false)
  const [verDetalleOpen, setVerDetalleOpen] = useState(false)
  const [editarSobreOpen, setEditarSobreOpen] = useState(false)
  const [sobreSeleccionado, setSobreSeleccionado] = useState<Sobre | null>(null)
  const [sobreSeleccionadoParaGasto, setSobreSeleccionadoParaGasto] = useState<string>('')
  const [categoriaPreseleccionada, setCategoriaPreseleccionada] = useState<string>('')
  const [warning, setWarning] = useState<WarningType | null>(null)
  const [warningModalOpen, setWarningModalOpen] = useState(false)

  // Carousel state
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: false,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Refs para preservar índice durante actualizaciones
  const targetIndexRef = useRef<number | null>(null)
  const isRestoringRef = useRef(false)

  // Hook para devolver presupuesto
  const { devolverPresupuesto, loading: devolverLoading } = useDevolverPresupuesto(
    sobreSeleccionado?.id || ''
  )

  // Cargar configuración del usuario
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const response = await fetch('/api/user/config')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.config) {
            setDiaInicioPeriodo(data.config.dia_inicio_periodo || 1)
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      }
    }
    fetchUserConfig()
  }, [])

  // Cargar sobres
  useEffect(() => {
    fetchSobres()
  }, [])

  // Carousel effect para actualizar selected index
  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      // NO actualizar selectedIndex si estamos restaurando posición
      if (isRestoringRef.current) return
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  // Effect para restaurar posición del carousel después de actualizar datos
  useEffect(() => {
    if (!emblaApi || targetIndexRef.current === null) return

    const restorePosition = () => {
      const targetIndex = targetIndexRef.current!

      // Scroll a la posición guardada
      emblaApi.scrollTo(targetIndex, false) // false = con animación suave

      // Actualizar selectedIndex
      setSelectedIndex(targetIndex)

      // Limpiar refs
      targetIndexRef.current = null
      isRestoringRef.current = false
    }

    // Pequeño delay para asegurar que el DOM está actualizado
    const timer = setTimeout(restorePosition, 50)

    return () => clearTimeout(timer)
  }, [emblaApi, sobres])

  // Notificar al padre sobre cambios en el carousel
  useEffect(() => {
    onCarouselChange?.(selectedIndex, sobres.length)
  }, [selectedIndex, sobres.length, onCarouselChange])

  // Notificar al padre sobre el sobre actual
  useEffect(() => {
    if (sobres.length > 0 && sobres[selectedIndex]) {
      const sobre = sobres[selectedIndex]
      onSobreChange?.({
        nombre: sobre.nombre,
        emoji: sobre.emoji,
        presupuesto: sobre.presupuesto_asignado,
      })
    } else {
      onSobreChange?.(null)
    }
  }, [selectedIndex, sobres, onSobreChange])

  // Manejar acciones del menú contextual
  useEffect(() => {
    if (!menuAction) return

    switch (menuAction) {
      case 'crear-sobre':
        setCrearSobreOpen(true)
        break
      case 'nueva-categoria':
        if (sobres.length > 0) {
          handleEditarCategorias(sobres[selectedIndex])
        }
        break
      case 'nuevo-gasto':
        if (sobres.length > 0) {
          handleCrearGasto(sobres[selectedIndex])
        }
        break
    }

    onMenuActionHandled?.()
  }, [menuAction])

  const fetchSobres = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        setSobres(data.sobres || [])
      } else {
        notify.error(t('list.loadError'))
      }
    } catch (error) {
      console.error('Error:', error)
      notify.error(t('list.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleAgregarPresupuesto = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setAgregarPresupuestoOpen(true)
  }

  const handleDevolverPresupuesto = async (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    try {
      const result = await devolverPresupuesto()
      notify.success(result.message)

      // Guardar índice actual para restaurar después
      targetIndexRef.current = selectedIndex
      isRestoringRef.current = true

      await fetchSobres()
    } catch (error) {
      notify.error(t('list.returnError'))
    }
  }

  const handleReducirPresupuesto = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setReducirPresupuestoOpen(true)
  }

  const handleReducirPresupuestoSuccess = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setReducirPresupuestoOpen(false)
  }

  const handleDetalleSobre = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setVerDetalleOpen(true)
  }

  const handleSobreCreated = async (sobre: Sobre) => {
    // Actualizar lista de sobres
    await fetchSobres()

    // Posicionar el carousel en el nuevo sobre (debería estar al final)
    // Como el nuevo sobre estará al final, necesitamos ir al último índice
    setTimeout(() => {
      if (emblaApi) {
        emblaApi.scrollTo(sobres.length, false) // Ir al último slide (el nuevo sobre)
      }
    }, 100)
  }

  const handleAgregarPresupuestoSuccess = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setAgregarPresupuestoOpen(false)
  }

  const handleCrearGasto = (sobre: Sobre) => {
    setSobreSeleccionadoParaGasto(sobre.id)
    setCrearGastoOpen(true)
  }

  const handleFlashGasto = (sobreId: string, categoriaId: string) => {
    setSobreSeleccionadoParaGasto(sobreId)
    setCategoriaPreseleccionada(categoriaId)
    setCrearGastoOpen(true)
  }

  const handleEditarCategorias = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setEditarCategoriasOpen(true)
  }

  const handleEditarCategoriasSuccess = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setEditarCategoriasOpen(false)
  }

  const handleEditarSobre = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setEditarSobreOpen(true)
  }

  const handleSobreUpdated = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setEditarSobreOpen(false)
  }

  const handleSobreDeleted = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setEditarSobreOpen(false)
  }

  const handleTransaccionesUpdated = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()
  }

  const handleCrearGastoSuccess = async () => {
    // Guardar índice actual para restaurar después
    targetIndexRef.current = selectedIndex
    isRestoringRef.current = true

    await fetchSobres()

    setCrearGastoOpen(false)
    setSobreSeleccionadoParaGasto('')
    setCategoriaPreseleccionada('')
  }

  const scrollToSlide = (index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }

  const sobreActual = sobres[selectedIndex]
  const tituloDinamico = sobreActual ? `${sobreActual.emoji} ${sobreActual.nombre}` : t('title')

  return (
    <div className="h-full flex flex-col">
      {/* Contenido */}
      {loading ? (
          <div className="flex-1 flex items-center justify-center rounded-lg border bg-card">
          <p className="text-muted-foreground">{t('list.loading')}</p>
          </div>
      ) : sobres.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center rounded-lg border bg-card space-y-4">
          <p className="text-muted-foreground">{t('list.empty')}</p>
          <Button
            onClick={() => setCrearSobreOpen(true)}
            variant="outline"
          >
            {t('list.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="relative flex-1 px-4 py-4">
          {/* Carousel Container */}
          <div className="-mx-4">
            <div className="overflow-hidden px-4" ref={emblaRef}>
              <div className="flex gap-4">
                {sobres.map((sobre) => (
                  <div
                    key={sobre.id}
                    className="flex-[0_0_100%] min-w-0"
                  >
                    <SobreCard
                      id={sobre.id}
                      nombre={sobre.nombre}
                      emoji={sobre.emoji}
                      color={sobre.color}
                      presupuestoAsignado={sobre.presupuesto_asignado}
                      gastado={sobre.gastado || 0}
                      asignaciones={sobre.asignaciones || []}
                      diaInicioPeriodo={diaInicioPeriodo}
                      isCompartido={Boolean(sobre.is_compartido)}
                      isOwner={sobre.usuario_id === userId}
                      userRole={sobre.user_role || 'OWNER'}
                      presupuestoEnabled={sobre.presupuesto_enabled}
                      onAgregarPresupuesto={() => handleAgregarPresupuesto(sobre)}
                      onVerDetalle={() => handleDetalleSobre(sobre)}
                      onDevolverPresupuesto={() => handleReducirPresupuesto(sobre)}
                      onEditarCategorias={() => handleEditarCategorias(sobre)}
                      onFlashGasto={(categoriaId) => handleFlashGasto(sobre.id, categoriaId)}
                      onEditarSobre={() => handleEditarSobre(sobre)}
                      onPresupuestoUpdated={async () => {
                        // Guardar índice actual para restaurar después
                        targetIndexRef.current = selectedIndex
                        isRestoringRef.current = true
                        await fetchSobres()
                      }}
                    />
                  </div>
                ))}

                {/* Slide para crear nuevo sobre */}
                <div className="flex-[0_0_100%] min-w-0">
                  <button
                    onClick={() => setCrearSobreOpen(true)}
                    className="h-full w-full rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 transition-all hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/10 hover:via-primary/15 hover:to-primary/10 active:scale-[0.98]"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <div className="rounded-full bg-primary/10 p-6">
                        <Plus className="h-12 w-12 text-primary" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="typography-h3 font-semibold text-foreground">
                          {t('list.createNew')}
                        </p>
                        <p className="typography-body-sm text-muted-foreground">
                          {t('list.createNewDescription')}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      <CrearSobreDrawer
        open={crearSobreOpen}
        onOpenChange={setCrearSobreOpen}
        userId={userId}
        onSobreCreated={handleSobreCreated}
      />

      <AgregarPresupuestoDrawer
        open={agregarPresupuestoOpen}
        onOpenChange={setAgregarPresupuestoOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        montoLibre={sobreSeleccionado ? (sobreSeleccionado.presupuesto_asignado - (sobreSeleccionado.gastado || 0)) : 0}
        presupuestoAsignado={sobreSeleccionado?.presupuesto_asignado || 0}
        onSuccess={handleAgregarPresupuestoSuccess}
      />

      <ReducirPresupuestoDrawer
        open={reducirPresupuestoOpen}
        onOpenChange={setReducirPresupuestoOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        montoLibre={sobreSeleccionado ? (sobreSeleccionado.presupuesto_asignado - (sobreSeleccionado.gastado || 0)) : 0}
        presupuestoAsignado={sobreSeleccionado?.presupuesto_asignado || 0}
        onSuccess={handleReducirPresupuestoSuccess}
      />

      <CrearGastoDrawer
        open={crearGastoOpen}
        onOpenChange={setCrearGastoOpen}
        userId={userId}
        preselectedSobreId={sobreSeleccionadoParaGasto}
        preselectedCategoriaId={categoriaPreseleccionada}
        onSuccess={handleCrearGastoSuccess}
      />

      <EditarCategoriasMarcasDrawer
        open={editarCategoriasOpen}
        onOpenChange={setEditarCategoriasOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        userRole={sobreSeleccionado?.user_role || 'OWNER'}
        onSuccess={handleEditarCategoriasSuccess}
      />

      <VerDetalleTransaccionesDrawer
        open={verDetalleOpen}
        onOpenChange={setVerDetalleOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        diaInicioPeriodo={diaInicioPeriodo}
        onTransactionsUpdated={handleTransaccionesUpdated}
      />

      <EditarSobreDrawer
        open={editarSobreOpen}
        onOpenChange={setEditarSobreOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreNombre={sobreSeleccionado?.nombre || ''}
        sobreColor={sobreSeleccionado?.color}
        onSobreUpdated={handleSobreUpdated}
        onSobreDeleted={handleSobreDeleted}
      />

      {/* Warning Modal */}
      <OverspendWarningModal
        open={warningModalOpen}
        onOpenChange={setWarningModalOpen}
        warning={warning}
        onConfirm={() => {
          // TODO: Confirm transaction
          setWarningModalOpen(false)
        }}
        onAddBudget={() => {
          setWarningModalOpen(false)
          handleAgregarPresupuesto(sobreSeleccionado!)
        }}
        loading={false}
      />
    </div>
  )
}
