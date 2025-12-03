'use client'

import { useCurrency } from '@/presentation/providers/currency-provider'
import { useTranslations } from 'next-intl'

interface CategoriaCardProps {
  nombre: string
  emoji?: string
  color?: string
  gastado: number
  compras?: number
  meta?: number
  onClick?: (e?: React.MouseEvent) => void
  onFlashGasto?: (e?: React.MouseEvent) => void
}

export function CategoriaCard({
  nombre,
  emoji,
  color,
  gastado,
  compras = 0,
  meta,
  onClick,
  onFlashGasto,
}: CategoriaCardProps) {
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres.categoryCard')
  const gastadoNum = Number(gastado) || 0
  const metaNum = meta ? Number(meta) : undefined

  return (
    <button
      type="button"
      className="w-full cursor-pointer bg-transparent px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={e => {
        onClick?.(e)
        onFlashGasto?.(e)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 typography-body font-semibold text-foreground">
          {emoji ? (
            <span className="typography-body">{emoji}</span>
          ) : color ? (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate">{nombre}</span>
        </div>
        <span className="shrink-0 tabular-nums tracking-tight typography-label-lg text-foreground">
          {formatNumber(gastadoNum)}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="typography-caption font-semibold text-muted-foreground">
          {t('purchases', { count: compras })}
        </span>
        {metaNum !== undefined && (
          <span className="shrink-0 tabular-nums typography-caption font-semibold text-muted-foreground">
            {t('goal')}: {formatNumber(metaNum)}
          </span>
        )}
      </div>
    </button>
  )
}
