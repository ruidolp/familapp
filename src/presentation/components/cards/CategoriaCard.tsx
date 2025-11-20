'use client'

import { type CSSProperties } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface CategoriaCardProps {
  id: string
  nombre: string
  emoji?: string
  color?: string
  gastado: number
  porcentaje: number
  presupuestoAsignado: number
  onClick?: (e?: React.MouseEvent) => void
  onFlashGasto?: (e?: React.MouseEvent) => void
}

export function CategoriaCard({
  id,
  nombre,
  emoji,
  color = '#3b82f6',
  gastado,
  porcentaje,
  presupuestoAsignado,
  onClick,
  onFlashGasto,
}: CategoriaCardProps) {
  const { formatNumber } = useCurrency()
  const gastadoNum = Number(gastado) || 0
  const porcentajeNum = Number(porcentaje) || 0
  const isOverspent = gastadoNum > presupuestoAsignado

  const accentColor = color || '#3b82f6'
  const accentStyles = {
    '--categoria-accent': accentColor,
  } as CSSProperties

  return (
    <div
      className="group flex cursor-pointer items-stretch overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-accent/5"
      style={accentStyles}
      onClick={(e) => onClick?.(e)}
    >
      <div className="w-1 bg-[var(--categoria-accent)]" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 text-sm font-medium text-foreground">
            {emoji && <span className="text-base">{emoji}</span>}
            <span className="truncate">{nombre}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {formatNumber(gastadoNum)}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onFlashGasto?.(e)
              }}
            >
              <Zap className="h-4 w-4" />
              <span className="sr-only">Agregar gasto rápido</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.min(porcentajeNum, 100)}%`,
                backgroundColor: isOverspent ? 'hsl(var(--destructive))' : accentColor,
              }}
            />
          </div>
          <span
            className={`text-xs font-medium ${
              isOverspent ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {porcentajeNum.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}
