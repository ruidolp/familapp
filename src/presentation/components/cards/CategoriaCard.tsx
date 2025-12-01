'use client'

import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { useTranslations } from 'next-intl'

interface CategoriaCardProps {
  id: string
  nombre: string
  emoji?: string
  color?: string
  gastado: number
  porcentaje: number
  compras?: number
  onClick?: (e?: React.MouseEvent) => void
  onViewTransactions?: (categoriaId: string, categoriaNombre: string) => void
  onFlashGasto?: (e?: React.MouseEvent) => void
}

export function CategoriaCard({
  id,
  nombre,
  emoji,
  color,
  gastado,
  porcentaje,
  compras = 0,
  onClick,
  onViewTransactions,
  onFlashGasto,
}: CategoriaCardProps) {
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres.categoryCard')
  const gastadoNum = Number(gastado) || 0
  const porcentajeNum = Number(porcentaje) || 0

  return (
    <>
      <div
        className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-theme transition-all hover:shadow-none hover:bg-accent/5"
        onClick={e => {
          onClick?.(e)
          onViewTransactions?.(id, nombre)
        }}
      >
        {/* Columna izquierda: 3 líneas de información */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2 typography-body font-semibold text-foreground">
            {emoji && <span className="typography-body">{emoji}</span>}
            <span className="truncate">{nombre}</span>
          </div>
          <div className="flex items-center gap-2 typography-caption font-semibold text-muted-foreground">
            <span>{t('purchases', { count: compras })}</span>
          </div>
          <div className="flex items-center gap-2 typography-caption font-semibold text-muted-foreground">
            <span>{t('percentUsed', { percent: porcentajeNum.toFixed(0) })}</span>
          </div>
        </div>

        {/* Columna derecha: monto (Flash button temporalmente oculto para validación visual) */}
        <div className="flex shrink-0 flex-col gap-2" style={{ alignItems: 'flex-end', width: 'auto' }}>
          <span className="text-right tabular-nums tracking-tight typography-label-lg text-foreground" style={{ lineHeight: '1', paddingRight: '0px', marginRight: '0px', display: 'block', width: 'max-content' }}>
            {formatNumber(gastadoNum)}
          </span>
          {/* 
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full text-muted-foreground"
              style={{ flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                onFlashGasto?.(e)
              }}
            >
              <Zap className="h-5 w-5" />
              <span className="sr-only">{t('quickExpense')}</span>
            </Button>
          */}
        </div>
      </div>
    </>
  )
}
