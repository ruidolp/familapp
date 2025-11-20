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

  const accentColor = color || '#3b82f6'
  const progressColor = isOverspent ? 'hsl(var(--destructive))' : accentColor
  const libreEsPositivo = presupuestoLibre >= 0
  const accentStyles = {
    '--sobre-accent': accentColor,
  } as CSSProperties

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4" style={accentStyles}>
      <Card
        className="relative cursor-pointer space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
        onClick={onVerDetalle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">{nombre}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(presupuesto)} presupuesto asignado
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
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

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {Math.round(porcentajeGastado)}% {t('utilizado')}
            </span>
            <span>
              {formatNumber(presupuesto)} {t('total')}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(Math.abs(porcentajeGastado), 100)}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">{t('usado')}</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">{formatNumber(gastadoNum)}</span>
              <span className="text-xs text-muted-foreground">{Math.round(porcentajeGastado)}%</span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs uppercase text-muted-foreground">
              {libreEsPositivo ? t('libre') : 'Te pasaste'}
            </p>
            <span
              className={`text-base font-semibold ${
                libreEsPositivo ? 'text-emerald-500 dark:text-emerald-400' : 'text-destructive'
              }`}
            >
              {formatNumber(libreEsPositivo ? presupuestoLibre : Math.abs(presupuestoLibre))}
            </span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-1 flex-col rounded-2xl border border-border bg-card">
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>
              {t('categories.title', { count: categoriasOrdenadas.length })}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {presupuesto <= 0 && (
            <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center">
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

        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pb-4">
          {categoriasLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('categories.loading')}
            </div>
          ) : categoriasOrdenadas.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-3 pb-1">
              {categoriasOrdenadas.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  id={categoria.id}
                  nombre={categoria.nombre}
                  emoji={categoria.emoji}
                  color={categoria.color || accentColor}
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
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onAgregarCategoria?.()
                }}
              >
                <Plus size={16} />
                {t('categories.addButton')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-center">
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
      </Card>

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
