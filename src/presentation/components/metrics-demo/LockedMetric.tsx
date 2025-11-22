/**
 * COMPONENTE: LockedMetric - Wrapper para métricas bloqueadas
 *
 * ⚠️ DEMO - Borrar cuando se implemente sistema real
 */

'use client'

import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface LockedMetricProps {
  children: ReactNode
  isLocked?: boolean
  progress: {
    current: number
    required: number
    label: string
  }
  message: string
}

export function LockedMetric({ children, isLocked = true, progress, message }: LockedMetricProps) {
  if (!isLocked) {
    return <>{children}</>
  }

  const percentage = Math.round((progress.current / progress.required) * 100)

  return (
    <div className="relative">
      {/* Gráfico difuminado de fondo */}
      <div className="blur-sm opacity-30 brightness-75 select-none pointer-events-none">
        {children}
      </div>

      {/* Overlay de desbloqueo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md rounded-lg">
        <div className="max-w-[85%] text-center space-y-4">
          {/* Icono de candado */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Título */}
          <h3 className="typography-h3">Desbloquea esta métrica</h3>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress value={percentage} className="h-2" />
            <p className="typography-label">
              {progress.current} / {progress.required} {progress.label}
            </p>
          </div>

          {/* Mensaje motivacional */}
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="typography-body-sm">{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
