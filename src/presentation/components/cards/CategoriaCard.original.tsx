'use client'

import { Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
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

  const bgColor = color || '#3b82f6'

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-2 border-white/20 bg-white/10 backdrop-blur"
      style={{ color: 'rgba(255,255,255,0.95)' }}
      onClick={(e) => onClick?.(e)}
    >
      <div className="space-y-1.5">
        {/* Header: emoji + nombre | gastado + flash$ button */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {emoji && <span className="typography-body-lg flex-shrink-0">{emoji}</span>}
            <h4 className="font-medium typography-body-sm truncate text-white">{nombre}</h4>
          </div>
          <div className="text-right flex items-center gap-1 whitespace-nowrap flex-shrink-0">
            <p className="typography-body-sm font-bold text-white">
              {formatNumber(gastadoNum)}
            </p>
            {/* Flash gasto button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFlashGasto?.(e)
              }}
              className="hover:scale-110 transition-transform text-white/75 hover:text-white"
              title="Agregar gasto rápido"
            >
              <Zap size={16} className="fill-current" />
            </button>
          </div>
        </div>

        {/* Progress bar con % a la derecha */}
        <div className="flex items-center gap-2">
          <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${
            isOverspent ? 'bg-white/20' : 'bg-white/20'
          }`}>
            <div
              className={`h-full ${
                isOverspent ? 'bg-yellow-300' : 'bg-green-300'
              }`}
              style={{ width: `${Math.min(porcentajeNum, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-medium whitespace-nowrap flex-shrink-0 ${
            isOverspent ? 'text-yellow-100' : 'text-green-100'
          }`}>
            {porcentajeNum.toFixed(0)}%
          </span>
        </div>
      </div>
    </Card>
  )
}
