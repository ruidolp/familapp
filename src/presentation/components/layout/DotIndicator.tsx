/**
 * DotIndicator.tsx - Indicador de página para swipe
 *
 * Muestra dots (.-.) para indicar la posición actual en una lista swipeable
 */

import React from 'react'

interface DotIndicatorProps {
  total: number
  current: number
  // Colores personalizables
  activeColor?: string
  inactiveColor?: string
  // Tamaño de los dots
  size?: 'sm' | 'md' | 'lg'
}

export function DotIndicator({
  total,
  current,
  activeColor = 'bg-foreground',
  inactiveColor = 'bg-foreground/40',
  size = 'md',
}: DotIndicatorProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  const dotSize = sizeClasses[size]

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`
            ${dotSize}
            rounded-full
            transition-all
            duration-300
            ${index === current ? activeColor : inactiveColor}
            ${index === current ? 'scale-125' : 'scale-100'}
          `}
        />
      ))}
    </div>
  )
}

export default DotIndicator
