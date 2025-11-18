'use client'

/**
 * ExecutionItem Component
 *
 * Single item in shopping execution list
 * Actions:
 * - Tap: Mark as purchased (or open price drawer if prices enabled)
 * - Long press: Mark as discarded
 */

import { useState, useRef } from 'react'
import { Check, X, Tag } from 'lucide-react'
import { cn } from '@/infrastructure/lib/utils'
import { useCurrency } from '@/presentation/providers/currency-provider'
import type { LocalExecutionItem, ItemStatus } from '@/domain/types/shopping-execution'

interface ExecutionItemProps {
  item: LocalExecutionItem
  enablePrices: boolean
  onTap: (item: LocalExecutionItem) => void
  onLongPress: (item: LocalExecutionItem) => void
}

export function ExecutionItem({
  item,
  enablePrices,
  onTap,
  onLongPress,
}: ExecutionItemProps) {
  const { formatCurrency } = useCurrency()
  const [pressing, setPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    setPressing(true)
    longPressTimer.current = setTimeout(() => {
      // Long press detected
      setPressing(false)
      onLongPress(item)
    }, 800) // 800ms for long press
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (pressing) {
      // Normal tap
      onTap(item)
    }

    setPressing(false)
  }

  const handleClick = () => {
    onTap(item)
  }

  const isPending = item.status === 'pending'
  const isPurchased = item.status === 'purchased'
  const isDiscarded = item.status === 'discarded'

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg transition-all',
        isPending && 'bg-background border-border hover:border-primary cursor-pointer',
        isPurchased && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
        isDiscarded && 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 opacity-60',
        pressing && 'scale-95 bg-destructive/10'
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        setPressing(false)
      }}
      onClick={isPending ? handleClick : undefined}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isPurchased && (
          <div className="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
        {isDiscarded && (
          <div className="w-8 h-8 rounded-full bg-slate-400 dark:bg-slate-600 flex items-center justify-center">
            <X className="h-5 w-5 text-white" />
          </div>
        )}
        {isPending && (
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground" />
        )}
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium truncate',
          isDiscarded && 'line-through text-muted-foreground'
        )}>
          {item.product_name}
        </p>

        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>
            {item.cantidad_comprada || item.cantidad_planeada} {item.unidad_medida || 'un'}
          </span>

          {item.marca && (
            <>
              <span>•</span>
              <span>{item.marca}</span>
            </>
          )}

          {item.addedOnTheFly && (
            <>
              <span>•</span>
              <span className="text-primary font-medium">Agregado</span>
            </>
          )}
        </div>

        {/* Price info */}
        {isPurchased && item.precio_total && (
          <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400">
            <Tag className="h-3 w-3" />
            {formatCurrency(item.precio_total)}
            {item.precio_unitario && (
              <span className="text-xs font-normal text-muted-foreground">
                ({formatCurrency(item.precio_unitario)}/un)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Edit price button for purchased items */}
      {isPurchased && enablePrices && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onTap(item)
          }}
          className="flex-shrink-0 px-2 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary/10"
        >
          Editar
        </button>
      )}
    </div>
  )
}
