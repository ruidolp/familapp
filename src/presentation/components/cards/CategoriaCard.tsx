'use client'

import { Card } from '@/components/ui/card'

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
  const gastadoNum = Number(gastado) || 0
  const porcentajeNum = Number(porcentaje) || 0
  const isOverspent = gastadoNum > presupuestoAsignado

  const bgColor = color || '#3b82f6'

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-3 border-white/20 bg-white/10 backdrop-blur"
      style={{ color: 'rgba(255,255,255,0.95)' }}
      onClick={(e) => onClick?.(e)}
    >
      <div className="space-y-2">
        {/* Header: emoji + nombre | gastado + % | flash$ button */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 flex-1">
            {emoji && <span className="text-xl">{emoji}</span>}
            <h4 className="font-medium text-base truncate text-white">{nombre}</h4>
          </div>
          <div className="text-right flex items-center gap-2 whitespace-nowrap">
            <div>
              <p className="text-base font-bold text-white">
                ${gastadoNum.toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${
                isOverspent ? 'text-yellow-100' : 'text-green-100'
              }`}>
                {porcentajeNum.toFixed(1)}%
              </p>
            </div>
            {/* Flash$ button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFlashGasto?.(e)
              }}
              className="text-lg hover:scale-110 transition-transform"
              title="Agregar gasto rápido"
            >
              ⚡💰
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-1.5 rounded-full overflow-hidden ${
          isOverspent ? 'bg-white/20' : 'bg-white/20'
        }`}>
          <div
            className={`h-full ${
              isOverspent ? 'bg-yellow-300' : 'bg-green-300'
            }`}
            style={{ width: `${Math.min(porcentajeNum, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}
