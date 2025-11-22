'use client'

import { useMemo, useEffect, useState } from 'react'
import { Plus, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CategoriaCard } from '@/components/cards/CategoriaCard'
import { useSobreCategories } from '@/presentation/hooks/useSobres'
import { EditarCategoriaDrawer } from '@/components/drawers/EditarCategoriaDrawer'
import { useCurrency } from '@/presentation/providers/currency-provider'

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
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres')
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
      className="overflow-hidden transition-all duration-300 flex flex-col"
      style={{
        backgroundColor: bgColor,
        backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}ee 50%, ${bgColor}dd 100%)`,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        minHeight: 'calc(100vh - 12rem)',
      }}
    >
      {/* Contenido */}
      <div className="flex flex-col h-full" style={{ color: 'rgba(255,255,255,0.95)' }}>
        {/* Card: Estado de gasto */}
        <div
          className="rounded-lg border border-white/20 bg-white/10 backdrop-blur m-4 mb-0 p-3 space-y-2 cursor-pointer hover:bg-white/15 transition-colors"
          onClick={onVerDetalle}
        >
          {/* Header con estado de gasto y menú */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 space-y-2.5">
              {/* Grid de métricas */}
              <div className="grid grid-cols-2 gap-3">
                {/* Usado */}
                <div className="space-y-0.5">
                  <div className="text-xs text-white/70 font-medium uppercase tracking-wide">{t('usado')}</div>
                  <div className="typography-number-md text-white">
                    {formatNumber(gastadoNum)}
                  </div>
                </div>

                {/* Libre */}
                <div className="space-y-0.5">
                  <div className="text-xs text-white/70 font-medium uppercase tracking-wide">{t('libre')}</div>
                  <div className={`text-lg font-bold ${
                    presupuestoLibre < 0 ? 'text-red-300' : 'text-white'
                  }`}>
                    {formatNumber(presupuestoLibre)}
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">{Math.round(porcentajeGastado)}% {t('utilizado')}</span>
                  <span className="text-xs text-white/60">{formatNumber(presupuesto)} {t('total')}</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverspent
                        ? 'bg-red-400'
                        : porcentajeGastado > 80
                        ? 'bg-yellow-400'
                        : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Menu de 3 puntos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-white/20 flex-shrink-0"
                >
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onAgregarPresupuesto?.()
                }}>
                  {t('menu.increaseBudget')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDevolverPresupuesto?.()
                  }}
                  disabled={presupuestoLibre <= 0}
                >
                  {t('menu.reduceBudget')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEditarCategorias?.()
                }}>
                  {t('menu.editCategories')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onVerDetalle?.()
                }}>
                  {t('menu.shoppingList')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Separador visual */}
        <div className="border-t border-white/20 mx-4 mt-3 mb-1" />

        {/* Contenido: Categorías y opciones */}
        <div className="px-4 pt-2 pb-4 space-y-4 flex-1 overflow-y-auto">

        {/* Card "Asigne Presupuesto" - cuando no hay presupuesto */}
        {presupuesto <= 0 && (
          <div className="p-4 rounded-lg bg-white/10 text-center space-y-3 backdrop-blur border border-white/20">
            <p className="typography-body text-white/75">
              {t('emptyBudget.message')}
            </p>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAgregarPresupuesto?.()
              }}
              className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus size={18} />
              {t('emptyBudget.button')}
            </Button>
          </div>
        )}

        {/* Categorías */}
        {categoriasLoading ? (
          <div className="p-3 rounded-lg bg-white/10 text-center backdrop-blur">
            <p className="typography-body text-white/75">
              {t('categories.loading')}
            </p>
          </div>
        ) : categoriasOrdenadas.length > 0 ? (
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <p className="typography-body font-medium text-white/80">
              {t('categories.title', { count: categoriasOrdenadas.length })}
            </p>

            <div className="overflow-y-auto space-y-2 pr-2 flex-1">
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
              {/* Agregar Categoría button - inside scroll container */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarCategoria?.()
                }}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center gap-2"
                variant="outline"
              >
                <Plus size={18} />
                {t('categories.addButton')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-white/10 text-center backdrop-blur border border-white/20">
            <p className="typography-body text-white/75">
              {t('categories.empty')}
            </p>
            {/* Agregar Categoría button - when no categories */}
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onAgregarCategoria?.()
              }}
              className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Plus size={18} />
              {t('categories.addButton')}
            </Button>
          </div>
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
