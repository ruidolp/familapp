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
}: CategoriaCardProps) {
  const gastadoNum = Number(gastado) || 0
  const porcentajeNum = Number(porcentaje) || 0
  const isOverspent = gastadoNum > presupuestoAsignado

  const bgColor = color || '#3b82f6'

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-3"
      onClick={(e) => onClick?.(e)}
    >
      <div className="space-y-2">
        {/* Header: emoji + nombre | gastado + % */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            {emoji && <span className="text-xl">{emoji}</span>}
            <h4 className="font-medium text-sm truncate">{nombre}</h4>
          </div>
          <div className="text-right ml-2">
            <p className="text-sm font-bold">
              ${gastadoNum.toFixed(2)}
            </p>
            <p className={`text-xs font-medium ${
              isOverspent ? 'text-red-600' : 'text-blue-600'
            }`}>
              {porcentajeNum.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-1.5 rounded-full overflow-hidden ${
          isOverspent ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <div
            className={`h-full ${
              isOverspent ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(porcentajeNum, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}
