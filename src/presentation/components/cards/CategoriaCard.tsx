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
        className="flex cursor-pointer items-stretch gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/5"
        onClick={e => {
          onClick?.(e)
          onViewTransactions?.(id, nombre)
        }}
      >
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 text-sm font-semibold text-foreground">
              {emoji && <span className="text-base">{emoji}</span>}
              <span className="truncate">{nombre}</span>
            </div>
            <span className="text-base font-semibold text-foreground">{formatNumber(gastadoNum)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t('purchases', { count: compras })}</span>
            <span>•</span>
            <span>{t('percentUsed', { percent: porcentajeNum.toFixed(0) })}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onFlashGasto?.(e)
            }}
          >
            <Zap className="h-5 w-5" />
            <span className="sr-only">{t('quickExpense')}</span>
          </Button>
        </div>
      </div>
    </>
  )
}
