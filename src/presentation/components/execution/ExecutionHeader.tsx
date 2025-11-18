'use client'

/**
 * ExecutionHeader Component
 *
 * Header for execution screen showing:
 * - List name
 * - Timer
 * - Budget progress
 * - Settings menu
 * - Calculator button
 */

import { Menu, Calculator, Settings } from 'lucide-react'
import { Button } from '@/presentation/components/ui/button'
import { Progress } from '@/presentation/components/ui/progress'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface ExecutionHeaderProps {
  listName: string
  storeName?: string
  showTimer: boolean
  timerFormatted: string
  budgetEnabled: boolean
  budgetAmount?: number
  totalSpent: number
  budgetPercentage: number
  onMenuClick: () => void
  onCalculatorClick: () => void
}

export function ExecutionHeader({
  listName,
  storeName,
  showTimer,
  timerFormatted,
  budgetEnabled,
  budgetAmount,
  totalSpent,
  budgetPercentage,
  onMenuClick,
  onCalculatorClick,
}: ExecutionHeaderProps) {
  const { formatNumber } = useCurrency()

  const isOverBudget = budgetEnabled && budgetAmount && totalSpent > budgetAmount

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate">{listName}</h1>
          {storeName && (
            <p className="text-sm text-muted-foreground">{storeName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCalculatorClick}
          >
            <Calculator className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Timer */}
      {showTimer && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tiempo:</span>
            <span className="font-mono font-bold text-foreground">
              {timerFormatted}
            </span>
          </div>
        </div>
      )}

      {/* Budget Progress */}
      {budgetEnabled && budgetAmount && (
        <div className="px-4 pb-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={isOverBudget ? 'text-destructive font-semibold' : ''}>
              Gastado: {formatNumber(totalSpent)}
            </span>
            <span className="text-muted-foreground">
              Presupuesto: {formatNumber(budgetAmount)}
            </span>
          </div>

          <Progress
            value={Math.min(budgetPercentage, 100)}
            className="h-2"
            indicatorClassName={isOverBudget ? 'bg-destructive' : 'bg-primary'}
          />

          {isOverBudget && (
            <p className="text-xs text-destructive font-medium">
              ¡Has excedido el presupuesto en {formatNumber(totalSpent - budgetAmount)}!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
