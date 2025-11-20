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

import { Calculator, Clock3 } from 'lucide-react'
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
  onCalculatorClick,
}: ExecutionHeaderProps) {
  const { formatNumber } = useCurrency()

  const isOverBudget = budgetEnabled && budgetAmount && totalSpent > budgetAmount

  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{listName}</p>
            {storeName && <p className="text-sm font-medium text-foreground">{storeName}</p>}
            {showTimer && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                <span className="font-mono font-semibold text-foreground">{timerFormatted}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onCalculatorClick}>
            <Calculator className="h-4 w-4" />
          </Button>
        </div>

        <div className={`grid gap-3 ${budgetEnabled && budgetAmount ? 'sm:grid-cols-2' : ''}`}>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase text-muted-foreground">Total actual</p>
            <p className="text-3xl font-bold text-primary">{formatNumber(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Suma registrada hasta ahora.</p>
          </div>

          {budgetEnabled && budgetAmount && (
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase text-muted-foreground">Presupuesto</p>
              <p className={`text-2xl font-semibold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                {formatNumber(budgetAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Restante: {formatNumber(Math.max(budgetAmount - totalSpent, 0))}
              </p>
            </div>
          )}
        </div>

        {budgetEnabled && budgetAmount && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={isOverBudget ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                {formatNumber(totalSpent)} gastado
              </span>
              <span className="text-muted-foreground">{budgetPercentage.toFixed(0)}% del presupuesto</span>
            </div>
            <Progress
              value={Math.min(budgetPercentage, 120)}
              className="h-2"
              indicatorClassName={isOverBudget ? 'bg-destructive' : 'bg-primary'}
            />
            {isOverBudget && (
              <p className="text-xs font-medium text-destructive">
                Excedente: {formatNumber(totalSpent - budgetAmount)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
