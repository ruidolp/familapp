'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { SobreCard } from '@/components/cards/SobreCard'
import { CrearSobreDrawer } from '@/components/drawers/CrearSobreDrawer'
import { AgregarPresupuestoDrawer } from '@/components/drawers/AgregarPresupuestoDrawer'
import { CrearGastoDrawer } from '@/components/drawers/CrearGastoDrawer'
import { AgregarCategoriaDrawer } from '@/components/drawers/AgregarCategoriaDrawer'
import { OverspendWarningModal } from '@/components/modals/OverspendWarningModal'
import { notify } from '@/infrastructure/lib/notifications'
import { useSobre, useDevolverPresupuesto } from '@/presentation/hooks/useSobres'

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
}

interface WarningType {
  type: 'OVERSPEND_SOBRE' | 'NEGATIVE_WALLET'
  message: string
  details: any
}

export function SobresScreen({ userId }: { userId: string }) {
  const router = useRouter()
  const [sobres, setSobres] = useState<Sobre[]>([])
  const [loading, setLoading] = useState(false)

  // Drawers y modales
  const [crearSobreOpen, setCrearSobreOpen] = useState(false)
  const [agregarPresupuestoOpen, setAgregarPresupuestoOpen] = useState(false)
  const [crearGastoOpen, setCrearGastoOpen] = useState(false)
  const [agregarCategoriaOpen, setAgregarCategoriaOpen] = useState(false)
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

  const fetchSobres = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sobres')
      if (response.ok) {
        const data = await response.json()
        setSobres(data.sobres || [])
      } else {
        notify.error('Error al cargar sobres')
      }
    } catch (error) {
      console.error('Error:', error)
      notify.error('Error al cargar sobres')
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarPresupuesto = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setAgregarPresupuestoOpen(true)
  }

  const handleDevolverPresupuesto = async (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    try {
      const result = await devolverPresupuesto()
      notify.success(result.message)
      fetchSobres()
    } catch (error) {
      notify.error('Error al devolver presupuesto')
    }
  }

  const handleDetalleSobre = (sobre: Sobre) => {
    // TODO: Navegar a página de detalle del sobre
    console.log('Detalle de sobre:', sobre.id)
  }

  const handleSobreCreated = (sobre: Sobre) => {
    // Actualizar lista de sobres
    fetchSobres()
    // Automáticamente abrir AgregarPresupuestoDrawer para asignar presupuesto
    setSobreSeleccionado(sobre)
    setAgregarPresupuestoOpen(true)
  }

  const handleAgregarPresupuestoSuccess = () => {
    fetchSobres()
    setAgregarPresupuestoOpen(false)
  }

  const handleCrearGasto = (sobre: Sobre) => {
    setSobreSeleccionadoParaGasto(sobre.id)
    setCrearGastoOpen(true)
  }

  const handleAgregarCategoria = (sobre: Sobre) => {
    setSobreSeleccionado(sobre)
    setAgregarCategoriaOpen(true)
  }

  const handleCrearGastoSuccess = () => {
    fetchSobres()
    setCrearGastoOpen(false)
    setSobreSeleccionadoParaGasto('')
    setCategoriaPreseleccionada('')
  }

  const handleAgregarCategoriaSuccess = () => {
    fetchSobres()
    setAgregarCategoriaOpen(false)
  }

  const scrollToSlide = (index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Sobres</h2>
        <Button
          onClick={() => setCrearSobreOpen(true)}
          className="shadow-lg"
          size="lg"
        >
          ➕ Nuevo Sobre
        </Button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Cargando sobres...</p>
        </div>
      ) : sobres.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center space-y-4">
          <p className="text-muted-foreground">No tienes sobres aún</p>
          <Button
            onClick={() => setCrearSobreOpen(true)}
            variant="outline"
          >
            Crear tu primer sobre
          </Button>
        </div>
      ) : (
        <div className="relative pb-20">
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
                    onAgregarPresupuesto={() => handleAgregarPresupuesto(sobre)}
                    onVerDetalle={() => handleDetalleSobre(sobre)}
                    onDevolverPresupuesto={() => handleDevolverPresupuesto(sobre)}
                    onEditarCategorias={() => {
                      // TODO: Implementar editar categorías
                      console.log('Editar categorías del sobre:', sobre.id)
                    }}
                    onAgregarCategoria={() => handleAgregarCategoria(sobre)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          {sobres.length > 1 && (
            <div className="absolute bottom-[calc(2rem)] left-1/2 -translate-x-1/2 z-40 flex gap-2">
              {sobres.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    index === selectedIndex
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
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
        userId={userId}
        onSuccess={handleAgregarPresupuestoSuccess}
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

      {/* Botones flotantes para sobre */}
      {/* Botón abajo: Agregar Gasto a sobre existente */}
      {sobres.length > 0 && (
        <div className="fixed right-4 bottom-[calc(6rem-2px)] z-40">
          <Button
            onClick={() => {
              const sobreActual = sobres[selectedIndex]
              if (sobreActual) {
                handleCrearGasto(sobreActual)
              }
            }}
            className="rounded-full shadow-lg"
            size="lg"
          >
            ➕ Agregar Gasto
          </Button>
        </div>
      )}
    </div>
  )
}
