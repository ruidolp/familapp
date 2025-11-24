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
import { AgregarCategoriaDrawer } from '@/components/drawers/AgregarCategoriaDrawer'
import { EditarCategoriasMarcasDrawer } from '@/components/drawers/EditarCategoriasMarcasDrawer'
import { VerDetalleTransaccionesDrawer } from '@/components/drawers/VerDetalleTransaccionesDrawer'
import { VerDetalleCategoriaTransaccionesDrawer } from '@/components/drawers/VerDetalleCategoriaTransaccionesDrawer'
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
  const [agregarCategoriaOpen, setAgregarCategoriaOpen] = useState(false)
  const [editarCategoriasOpen, setEditarCategoriasOpen] = useState(false)
  const [verDetalleOpen, setVerDetalleOpen] = useState(false)
  const [detalleCategoriaOpen, setDetalleCategoriaOpen] = useState(false)
  const [categoriaDetalle, setCategoriaDetalle] = useState<{
    id: string
    nombre: string
    sobreId: string
    sobreName: string
  } | null>(null)
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
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

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
      case 'nuevo-sobre':
        setCrearSobreOpen(true)
        break
      case 'nueva-categoria':
        if (sobres.length > 0) {
          handleAgregarCategoria(sobres[selectedIndex])
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

  // Refresh sobres preservando el índice del carrusel
  const refreshSobres = useCallback(async () => {
    const previousIndex = selectedIndex
    await fetchSobres()
    setTimeout(() => {
      if (emblaApi && previousIndex >= 0) {
        emblaApi.scrollTo(previousIndex)
      }
    }, 100)
  }, [selectedIndex, emblaApi, fetchSobres])

  const handleAgregarPresupuesto = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setAgregarPresupuestoOpen(true)
  }

  const handleDevolverPresupuesto = async (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    try {
      const result = await devolverPresupuesto()
      notify.success(result.message)
      refreshSobres()
    } catch (error) {
      notify.error(t('list.returnError'))
    }
  }

  const handleReducirPresupuesto = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setReducirPresupuestoOpen(true)
  }

  const handleReducirPresupuestoSuccess = async () => {
    const previousIndex = selectedIndex

    await fetchSobres()

    setTimeout(() => {
      if (emblaApi && previousIndex >= 0) {
        emblaApi.scrollTo(previousIndex)
      }
    }, 100)

    setReducirPresupuestoOpen(false)
  }

  const handleDetalleSobre = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setVerDetalleOpen(true)
  }

  const handleDetalleCategoria = (categoriaId: string, categoriaNombre: string, sobreId: string, sobreName: string) => {
    setCategoriaDetalle({
      id: categoriaId,
      nombre: categoriaNombre,
      sobreId,
      sobreName,
    })
    setDetalleCategoriaOpen(true)
  }

  const handleSobreCreated = (sobre: Sobre) => {
    // Actualizar lista de sobres
    fetchSobres()
    // Automáticamente abrir AgregarPresupuestoDrawer para asignar presupuesto
    setSobreSeleccionado(sobre)
    setAgregarPresupuestoOpen(true)
  }

  const handleAgregarPresupuestoSuccess = async () => {
    const previousIndex = selectedIndex

    await fetchSobres()

    setTimeout(() => {
      if (emblaApi && previousIndex >= 0) {
        emblaApi.scrollTo(previousIndex)
      }
    }, 100)

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

  const handleAgregarCategoria = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setAgregarCategoriaOpen(true)
  }

  const handleEditarCategorias = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setEditarCategoriasOpen(true)
  }

  const handleCrearGastoSuccess = async () => {
    // Guardar índice actual antes de actualizar
    const previousIndex = selectedIndex

    // Actualizar lista de sobres
    await fetchSobres()

    // Restaurar posición del carousel después de actualizar
    setTimeout(() => {
      if (emblaApi && previousIndex >= 0) {
        emblaApi.scrollTo(previousIndex)
      }
    }, 100)

    setCrearGastoOpen(false)
    setSobreSeleccionadoParaGasto('')
    setCategoriaPreseleccionada('')
  }

  const handleAgregarCategoriaSuccess = async () => {
    const previousIndex = selectedIndex

    await fetchSobres()

    setTimeout(() => {
      if (emblaApi && previousIndex >= 0) {
        emblaApi.scrollTo(previousIndex)
      }
    }, 100)

    setAgregarCategoriaOpen(false)
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
          <div className="overflow-hidden" ref={emblaRef}>
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
                    onAgregarPresupuesto={() => handleAgregarPresupuesto(sobre)}
                    onVerDetalle={() => handleDetalleSobre(sobre)}
                    onDevolverPresupuesto={() => handleReducirPresupuesto(sobre)}
                    onEditarCategorias={() => handleEditarCategorias(sobre)}
                    onAgregarCategoria={() => handleAgregarCategoria(sobre)}
                    onFlashGasto={(categoriaId) => handleFlashGasto(sobre.id, categoriaId)}
                    onVerTransaccionesCategoria={(categoriaId, categoriaNombre) =>
                      handleDetalleCategoria(categoriaId, categoriaNombre, sobre.id, sobre.nombre)
                    }
                  />
                </div>
              ))}
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

      <AgregarCategoriaDrawer
        open={agregarCategoriaOpen}
        onOpenChange={setAgregarCategoriaOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        userId={userId}
        onSuccess={handleAgregarCategoriaSuccess}
      />
      <EditarCategoriasMarcasDrawer
        open={editarCategoriasOpen}
        onOpenChange={setEditarCategoriasOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        onSuccess={refreshSobres}
      />

      <VerDetalleTransaccionesDrawer
        open={verDetalleOpen}
        onOpenChange={setVerDetalleOpen}
        sobreId={sobreSeleccionado?.id || ''}
        sobreName={sobreSeleccionado?.nombre || ''}
        onTransactionsUpdated={refreshSobres}
      />
      <VerDetalleCategoriaTransaccionesDrawer
        open={detalleCategoriaOpen}
        onOpenChange={(open) => {
          setDetalleCategoriaOpen(open)
          if (!open) {
            setCategoriaDetalle(null)
          }
        }}
        sobreId={categoriaDetalle?.sobreId || ''}
        sobreName={categoriaDetalle?.sobreName || ''}
        categoriaId={categoriaDetalle?.id || ''}
        categoriaName={categoriaDetalle?.nombre || ''}
        onTransactionsUpdated={refreshSobres}
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
