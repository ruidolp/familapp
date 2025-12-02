'use client'

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
  meta?: number
  onClick?: (e?: React.MouseEvent) => void
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
  meta,
  onClick,
  onFlashGasto,
}: CategoriaCardProps) {
  const { formatNumber } = useCurrency()
  const t = useTranslations('sobres.categoryCard')
  const gastadoNum = Number(gastado) || 0
  const porcentajeNum = Number(porcentaje) || 0
  const metaNum = meta ? Number(meta) : undefined

  return (
    <>
      <div
        className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-theme transition-all hover:shadow-none hover:bg-accent/5"
        onClick={e => {
          onClick?.(e)
          onFlashGasto?.(e)
        }}
      >
        {/* Primera línea: Nombre (izq) | Monto (der) - alineados verticalmente */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 typography-body font-semibold text-foreground">
            {emoji && <span className="typography-body">{emoji}</span>}
            <span className="truncate">{nombre}</span>
          </div>
          <span className="shrink-0 tabular-nums tracking-tight typography-label-lg text-foreground">
            {formatNumber(gastadoNum)}
          </span>
        </div>

        {/* Segunda línea: Compras (izq) | Meta (der) */}
        <div className="flex items-center justify-between gap-3">
          <span className="typography-caption font-semibold text-muted-foreground">
            {t('purchases', { count: compras })}
          </span>
          {metaNum !== undefined && (
            <span className="shrink-0 tabular-nums typography-caption font-semibold text-muted-foreground">
              {t('goal')}: {metaNum.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </>
  )
}
