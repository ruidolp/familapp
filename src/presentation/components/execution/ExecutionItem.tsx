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
  flatListMode?: boolean
  onTap: (item: LocalExecutionItem) => void
  onLongPress: (item: LocalExecutionItem) => void
  onPointerDown?: (e: React.PointerEvent) => void
  onPointerMove?: (e: React.PointerEvent) => void
}

export function ExecutionItem({
  item,
  enablePrices,
  flatListMode = false,
  onTap,
  onLongPress,
  onPointerDown,
  onPointerMove,
}: ExecutionItemProps) {
  const { formatNumber } = useCurrency()
  const [pressing, setPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasMoved = useRef(false)
  const MOVEMENT_THRESHOLD = 10

  const handlePointerDownInternal = (e: React.PointerEvent) => {
    // Track pointer start position for scroll detection
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    hasMoved.current = false

    // Call parent handler if provided
    onPointerDown?.(e)

    // Start long press timer
    setPressing(true)
    longPressTimer.current = setTimeout(() => {
      // Only trigger long press if there was no significant movement
      if (!hasMoved.current) {
        setPressing(false)
        onLongPress(item)
      }
    }, 800)
  }

  const handlePointerMoveInternal = (e: React.PointerEvent) => {
    // Call parent handler if provided
    onPointerMove?.(e)

    // Check if pointer has moved significantly
    if (!pointerStartRef.current) return

    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x)
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y)

    if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
      hasMoved.current = true
      pointerStartRef.current = null

      // Cancel long press timer if scrolling
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      setPressing(false)
    }
  }

  const handlePointerUpInternal = (e: React.PointerEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // Only trigger tap if there was no significant movement
    if (pressing && !hasMoved.current && pointerStartRef.current) {
      onTap(item)
    }

    // Reset state
    setPressing(false)
    pointerStartRef.current = null
    hasMoved.current = false
  }

  const handlePointerCancel = () => {
    // Clean up on pointer cancel (e.g., scroll started)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setPressing(false)
    pointerStartRef.current = null
    hasMoved.current = false
  }

  const isPending = item.status === 'pending'
  const isPurchased = item.status === 'purchased'
  const isDiscarded = item.status === 'discarded'

  // Flat list mode - simplified view like editor
  if (flatListMode) {
    return (
      <div
        onPointerDown={handlePointerDownInternal}
        onPointerMove={handlePointerMoveInternal}
        onPointerUp={handlePointerUpInternal}
        onPointerCancel={handlePointerCancel}
        className={cn(
          'flex items-start gap-2 px-2 py-1 hover:bg-muted cursor-pointer transition-colors',
          isPurchased && 'text-emerald-700 dark:text-emerald-400',
          isDiscarded && 'opacity-60 line-through text-muted-foreground',
          pressing && 'bg-destructive/10'
        )}
      >
        {/* Status indicator - small bullet */}
        <div className={cn(
          "flex-shrink-0 mt-1 w-2 h-2 rounded-full",
          isPending && "bg-muted-foreground/40",
          isPurchased && "bg-emerald-600 dark:bg-emerald-500",
          isDiscarded && "bg-muted-foreground/20"
        )} />

        {/* Quantity */}
        <span className="font-medium flex-shrink-0">
          {item.cantidad_comprada || item.cantidad_planeada}
        </span>

        {/* Product name and comment */}
        <span className="flex-1">
          {item.product_name}
          {(item.unidad_medida || item.marca) && (
            <span className="text-muted-foreground">
              {item.unidad_medida && ` (${item.unidad_medida})`}
              {item.marca && ` - ${item.marca}`}
            </span>
          )}
        </span>

        {/* Price (if available) */}
        {isPurchased && item.precio_total && (
          <span className="text-xs font-medium flex-shrink-0">
            {formatNumber(item.precio_total)}
          </span>
        )}
      </div>
    )
  }

  // Regular card mode - compact view (matching shopping list style)
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 border rounded-lg transition-all cursor-pointer',
        isPending && 'bg-background border-border hover:border-primary',
        isPurchased && 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/60 hover:border-emerald-300/60',
        isDiscarded && 'bg-muted border-border opacity-70 hover:border-muted-foreground',
        pressing && 'scale-95 bg-destructive/10'
      )}
      onPointerDown={handlePointerDownInternal}
      onPointerMove={handlePointerMoveInternal}
      onPointerUp={handlePointerUpInternal}
      onPointerCancel={handlePointerCancel}
    >
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
          'font-medium',
          isDiscarded && 'line-through text-muted-foreground',
          isPurchased && 'text-emerald-700 dark:text-emerald-400'
        )}>
          {item.product_name}
        </p>

        {/* Metadata (unidad, marca, agregado) and Price on same line */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

          {/* Price info inline */}
          {isPurchased && item.precio_total && (
            <>
              <span>•</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Tag className="h-2.5 w-2.5" />
                {formatNumber(item.precio_total)}
                {item.precio_unitario && (
                  <span className="font-normal text-muted-foreground">
                    ({formatNumber(item.precio_unitario)}/un)
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Edit price button for purchased items */}
      {isPurchased && enablePrices && (
        <button
          onPointerDown={(e) => {
            // Prevent parent pointer events from triggering
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onTap(item)
          }}
          className="flex-shrink-0 px-2 py-1 text-xs font-medium text-primary border border-primary rounded hover:bg-primary/10 touch-auto"
        >
          Editar
        </button>
      )}
    </div>
  )
}
