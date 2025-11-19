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
  const { formatNumber } = useCurrency()
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
        isPurchased && 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60',
        isDiscarded && 'bg-muted border-border opacity-70',
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
          <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
        )}
        {isDiscarded && (
          <div className="w-8 h-8 rounded-full bg-muted-foreground/60 dark:bg-muted-foreground/50 flex items-center justify-center">
            <X className="h-5 w-5 text-muted" />
          </div>
        )}
        {isPending && (
          <div className="w-8 h-8 rounded-full border-2 border-muted-foreground" />
        )}
      </div>

      {/* Quantity */}
      <div className={cn(
        "text-sm font-medium min-w-[2rem] text-center flex-shrink-0",
        isDiscarded && 'line-through text-muted-foreground'
      )}>
        {item.cantidad_comprada || item.cantidad_planeada}
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
          {item.unidad_medida && (
            <span>{item.unidad_medida}</span>
          )}

          {item.marca && (
            <>
              {item.unidad_medida && <span>•</span>}
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
          <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Tag className="h-3 w-3" />
            {formatNumber(item.precio_total)}
            {item.precio_unitario && (
              <span className="text-xs font-normal text-muted-foreground">
                ({formatNumber(item.precio_unitario)}/un)
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
