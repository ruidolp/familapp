'use client'

import { useMemo, useEffect, useState, type CSSProperties } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

  const accentColor = color || '#3b82f6'
  const libreEsPositivo = presupuestoLibre >= 0

  const withAlpha = (hex: string, alphaHex: string) => {
    if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex
    if (hex.length === 7) {
      return `${hex}${alphaHex}`
    }
    const r = hex[1]
    const g = hex[2]
    const b = hex[3]
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`
  }

  const accentBg = withAlpha(accentColor, 'b3')
  const accentStyles = {
    '--sobre-accent': accentColor,
  } as CSSProperties

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4" style={accentStyles}>
      <Card
        className="relative overflow-hidden rounded-3xl border border-transparent p-5 text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accentBg} 0%, ${withAlpha(accentColor, '90')} 60%)` }}
        onClick={onVerDetalle}
      >
        <div
          className="pointer-events-none absolute -top-4 right-2 h-16 w-20 opacity-70"
          style={{
            backgroundColor: accentColor,
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
          }}
        />
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-white/70">Sobre activo</p>
              <h2 className="text-2xl font-semibold leading-snug">{nombre}</h2>
              <p className="text-sm text-white/80">
                {formatNumber(presupuesto)} {t('total')}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80">
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Acciones del sobre</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onAgregarPresupuesto?.()
                  }}
                >
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditarCategorias?.()
                  }}
                >
                  {t('menu.editCategories')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onVerDetalle?.()
                  }}
                >
                  {t('menu.shoppingList')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 text-white">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-white/70">{t('usado')}</p>
              <p className="text-3xl font-bold">{formatNumber(gastadoNum)}</p>
              <p className="text-xs text-white/80">{Math.round(porcentajeGastado)}% del presupuesto</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs uppercase tracking-wide text-white/70">
                {libreEsPositivo ? t('libre') : 'Te pasaste'}
              </p>
              <p className={`text-3xl font-bold ${libreEsPositivo ? '' : 'text-red-100'}`}>
                {formatNumber(libreEsPositivo ? presupuestoLibre : Math.abs(presupuestoLibre))}
              </p>
              <p className="text-xs text-white/80">Disponible</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-1 flex-col">
        <div className="space-y-3 px-4 pt-2 pb-1">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t('categories.title', { count: categoriasOrdenadas.length })}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {presupuesto <= 0 && (
            <div className="space-y-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
              <p className="text-sm text-muted-foreground">{t('emptyBudget.message')}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarPresupuesto?.()
                }}
                className="w-full gap-2"
              >
                <Plus size={16} />
                {t('emptyBudget.button')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {categoriasLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('categories.loading')}
            </div>
          ) : categoriasOrdenadas.length > 0 ? (
            <>
              {categoriasOrdenadas.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  id={categoria.id}
                  nombre={categoria.nombre}
                  emoji={categoria.emoji}
                  gastado={categoria.gastado || 0}
                  porcentaje={categoria.porcentaje || 0}
                  compras={categoria.compras || 0}
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
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarCategoria?.()
                }}
              >
                <Plus size={16} />
                {t('categories.addButton')}
              </Button>
            </>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">{t('categories.empty')}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarCategoria?.()
                }}
              >
                <Plus size={16} />
                {t('categories.addButton')}
              </Button>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
