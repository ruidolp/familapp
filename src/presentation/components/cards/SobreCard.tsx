'use client'

import { useMemo, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoriaCard } from '@/components/cards/CategoriaCard'
import { useSobreCategories } from '@/presentation/hooks/useSobres'
import { EditarCategoriaDrawer } from '@/components/drawers/EditarCategoriaDrawer'

interface Billetera {
  id: string
  nombre: string
  emoji?: string
  moneda_principal_id?: string
}

interface Asignacion {
  billetera_id: string
  monto_asignado: number
  billetera?: Billetera
}

interface SobreCardProps {
  id: string
  nombre: string
  emoji?: string
  color?: string
  presupuestoAsignado: number
  gastado?: number
  asignaciones: Asignacion[]
  onAgregarPresupuesto?: () => void
  onDevolverPresupuesto?: () => void
  onEditarCategorias?: () => void
  onAgregarCategoria?: () => void
  onVerDetalle?: () => void
  onFlashGasto?: (categoriaId: string) => void
}

export function SobreCard({
  id,
  nombre,
  emoji,
  color,
  presupuestoAsignado,
  gastado = 0,
  asignaciones,
  onAgregarPresupuesto,
  onDevolverPresupuesto,
  onEditarCategorias,
  onAgregarCategoria,
  onVerDetalle,
  onFlashGasto,
}: SobreCardProps) {
  const [categoriasLoading, setCategoriasLoading] = useState(false)
  const [editarCategoriaOpen, setEditarCategoriaOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<{ id: string; nombre: string } | null>(null)

  // Asegurar que son números (pueden venir como strings/Decimal de la BD)
  const presupuesto = Number(presupuestoAsignado) || 0
  const gastadoNum = Number(gastado) || 0

  const presupuestoLibre = presupuesto - gastadoNum
  const porcentajeGastado = presupuesto > 0 ? (gastadoNum / presupuesto) * 100 : 0
  const isOverspent = gastadoNum > presupuesto

  // Hook para obtener categorías
  const { categorias, loading: categoriasLoadingHook, refetch: refetchCategorias } = useSobreCategories(id)

  // Sincronizar loading state
  useEffect(() => {
    setCategoriasLoading(categoriasLoadingHook)
  }, [categoriasLoadingHook])

  // Ordenar categorías por porcentaje descendente
  const categoriasOrdenadas = useMemo(() => {
    return [...categorias].sort((a, b) => {
      const pctA = Number(a.porcentaje) || 0
      const pctB = Number(b.porcentaje) || 0
      return pctB - pctA
    })
  }, [categorias])

  const bgColor = color || '#3b82f6'

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
      style={{
        backgroundColor: bgColor,
        backgroundImage: `linear-gradient(135deg, ${bgColor}cc 0%, ${bgColor}dd 100%)`,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
        minHeight: 'calc(100vh - 14rem)',
      }}
      onClick={onVerDetalle}
    >
      {/* Contenido */}
      <div className="flex flex-col h-full" style={{ color: 'rgba(255,255,255,0.95)' }}>
        {/* Card: Header con nombre y botón */}
        <div className="m-4 mb-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-xl">{nombre}</h3>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAgregarPresupuesto?.()
              }}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8 px-3"
              variant="outline"
            >
              ➕ Agregar Gasto
            </Button>
          </div>

          {/* Separador */}
          <div className="border-t border-white/20 mb-3" />

          {/* Presupuesto mes - Centrado */}
          <div className="text-center mb-4">
            <p className="text-base font-bold">
              Presupuesto mes: ${presupuesto.toFixed(2)}
            </p>
          </div>

          {/* Estado de gasto */}
          <div className="space-y-2">
            <div className="flex justify-between text-base">
              <span className="font-medium text-white">
                Gastado: ${gastadoNum.toFixed(2)}
              </span>
              <span className={`font-medium ${
                isOverspent ? 'text-yellow-100' : 'text-green-100'
              }`}>
                {isOverspent
                  ? `Exceso: $${(gastadoNum - presupuesto).toFixed(2)}`
                  : `Libre: $${presupuestoLibre.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 flex-1 rounded-full overflow-hidden ${
                isOverspent ? 'bg-white/20' : 'bg-white/20'
              }`}>
                <div
                  className={`h-full ${
                    isOverspent ? 'bg-yellow-300' : 'bg-green-300'
                  }`}
                  style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
                />
              </div>
              <span className="text-sm text-white font-medium whitespace-nowrap">
                {porcentajeGastado.toFixed(0)}% usado
              </span>
            </div>
          </div>
        </div>

        {/* Separador visual */}
        <div className="border-t border-white/20 mx-4 mt-3 mb-3" />

        {/* Contenido: Categorías y opciones */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">

        {/* Card "Asigne Presupuesto" - cuando no hay presupuesto */}
        {presupuesto <= 0 && (
          <div className="p-4 rounded-lg bg-white/10 text-center space-y-3 backdrop-blur border border-white/20">
            <p className="text-base text-white/75">
              Asigne presupuesto desde el botón arriba
            </p>
          </div>
        )}

        {/* Categorías */}
        {categoriasLoading ? (
          <div className="p-3 rounded-lg bg-white/10 text-center backdrop-blur">
            <p className="text-base text-white/75">
              Cargando categorías...
            </p>
          </div>
        ) : categoriasOrdenadas.length > 0 ? (
          <div className="space-y-3">
            <p className="text-base font-medium text-white/80">
              Categorías ({categoriasOrdenadas.length})
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
              {categoriasOrdenadas.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  id={categoria.id}
                  nombre={categoria.nombre}
                  emoji={categoria.emoji}
                  color={categoria.color}
                  gastado={categoria.gastado || 0}
                  porcentaje={categoria.porcentaje || 0}
                  presupuestoAsignado={presupuesto}
                  onClick={(e) => {
                    e?.stopPropagation()
                    setSelectedCategoria({ id: categoria.id, nombre: categoria.nombre })
                    setEditarCategoriaOpen(true)
                  }}
                  onFlashGasto={(e) => {
                    e?.stopPropagation()
                    onFlashGasto?.(categoria.id)
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-white/10 text-center backdrop-blur border border-white/20">
            <p className="text-base text-white/75">
              Sin categorías aún
            </p>
          </div>
        )}

        {/* Agregar Categoría button */}
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onAgregarCategoria?.()
          }}
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8"
          variant="outline"
        >
          ➕ Agregar Categoría
        </Button>

        {/* Badge de overspend */}
        {isOverspent && (
          <Badge className="w-full justify-center bg-yellow-400/30 text-yellow-100 border border-yellow-300/50">
            ⚠️ Presupuesto excedido
          </Badge>
        )}
        </div>
      </div>

      {/* Drawer editar categoría */}
      {selectedCategoria && (
        <EditarCategoriaDrawer
          open={editarCategoriaOpen}
          onOpenChange={setEditarCategoriaOpen}
          categoriaId={selectedCategoria.id}
          categoriaNombre={selectedCategoria.nombre}
          onSuccess={() => {
            refetchCategorias()
          }}
        />
      )}
    </Card>
  )
}
