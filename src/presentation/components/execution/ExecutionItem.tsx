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
import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'
import { cn } from '@/infrastructure/lib/utils'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { decimalToFraction } from '@/infrastructure/utils/quantity'
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
  const t = useTranslations('shopping.execution.finalize')
  const tItem = useTranslations('shopping.execution.item')
  const { formatNumber } = useCurrency()
  const [pressing, setPressing] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasMoved = useRef(false)
  const MOVEMENT_THRESHOLD = 10

  // Helper to format quantity as fraction if it's a decimal
  const formatQuantity = (quantity: string | number | undefined) => {
    if (!quantity) return ''
    const qty = String(quantity)

    // Check if it's a decimal number (like 0.5, 0.25, 0.75)
    if (!isNaN(Number(qty))) {
      const decimal = Number(qty)
      // Try to convert to fraction
      if (decimal < 1 && decimal > 0) {
        const fraction = decimalToFraction(decimal)
        if (fraction) return fraction
      }
    }

    return qty
  }

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
          'flex items-start gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted cursor-pointer',
          isPurchased && 'text-success',
          isDiscarded && 'opacity-60 line-through text-muted-foreground',
          pressing && 'bg-destructive/10'
        )}
      >
        <div className={cn(
          'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
          isPending && 'bg-muted-foreground/40',
          isPurchased && 'bg-success',
          isDiscarded && 'bg-destructive/40'
        )} />

        <span className="font-medium flex-shrink-0">
          {formatQuantity(item.cantidad_comprada || item.cantidad_planeada)}
        </span>

        <span className="flex-1">
          <span className="font-medium">
            {item.product_name}
            {(item.unidad_medida || item.marca) && (
              <span className="text-muted-foreground">
                {item.marca && ` - ${item.marca}`}
              </span>
            )}
          </span>
          {item.addedOnTheFly && (
            <span className="ml-2 inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 text-[10px] font-semibold uppercase tracking-tight text-primary">
              {tItem('addedDuringPurchase')}
            </span>
          )}
        </span>

        {isPurchased && item.precio_total && (
          <span className="flex-shrink-0 typography-caption">
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
        'flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer',
        isPending && 'bg-background border-border hover:border-primary/60',
        isPurchased && 'border-success/30 bg-success/5',
        isDiscarded && 'border-destructive/30 bg-destructive/5 text-muted-foreground',
        pressing && 'scale-95 bg-destructive/5'
      )}
      onPointerDown={handlePointerDownInternal}
      onPointerMove={handlePointerMoveInternal}
      onPointerUp={handlePointerUpInternal}
      onPointerCancel={handlePointerCancel}
    >
      {/* Quantity */}
      <div className={cn(
        'text-sm font-medium min-w-[2.2rem] text-center flex-shrink-0',
        isDiscarded && 'line-through text-muted-foreground'
      )}>
        {formatQuantity(item.cantidad_comprada || item.cantidad_planeada)}
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn(
            'font-medium',
            isDiscarded && 'line-through text-muted-foreground',
            isPurchased && 'text-success'
          )}>
            {item.product_name}
          </p>
          {item.addedOnTheFly && (
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 text-[10px] font-semibold uppercase tracking-tight text-primary">
              {tItem('addedDuringPurchase')}
            </span>
          )}
        </div>

        {/* Metadata (unidad, marca, agregado) and Price on same line */}
        <div className="flex flex-wrap items-center gap-x-2 typography-metadata">
          {[
            item.marca
              ? <span key="marca">{item.marca}</span>
              : null,
            isPurchased && item.precio_total
              ? (
                  <span key="precio" className="flex items-center gap-1 font-semibold text-success">
                    Total: {formatNumber(item.precio_total)}
                    {item.precio_unitario && (
                      <span className="font-normal text-muted-foreground">
                        ({formatNumber(item.precio_unitario)}/un)
                      </span>
                    )}
                  </span>
                )
              : null,
          ]
            .filter(Boolean)
            .map((node, index, arr) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span>•</span>}
                {node}
              </span>
            ))}
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
          className="flex-shrink-0 px-2 py-1 typography-caption text-primary border border-primary rounded hover:bg-primary/10 touch-auto"
        >
          Editar
        </button>
      )}
    </div>
  )
}
