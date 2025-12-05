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

import { ArrowLeft, Calculator, Clock3 } from 'lucide-react'
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
  onBackClick: () => void
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
  onBackClick,
}: ExecutionHeaderProps) {
  const { formatNumber } = useCurrency()

  const isOverBudget = Boolean(budgetEnabled && budgetAmount && totalSpent > (budgetAmount ?? 0))
  const remainingAmount = budgetAmount ? budgetAmount - totalSpent : 0

  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={onBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{listName}</p>
              {storeName && <p className="typography-label text-foreground">{storeName}</p>}
              {showTimer && (
                <div className="mt-1 flex items-center gap-1 typography-metadata">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span className="font-mono font-semibold text-foreground">{timerFormatted}</span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={onCalculatorClick}>
            <Calculator className="h-5 w-5" />
          </Button>
        </div>

        <div className={`grid gap-3 ${budgetEnabled && budgetAmount ? 'grid-cols-2' : ''}`}>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs uppercase text-muted-foreground">Total actual</p>
            <p className="typography-h1 text-primary">{formatNumber(totalSpent)}</p>
            <p className="typography-metadata">Suma parcial.</p>
          </div>

          {budgetEnabled && budgetAmount && (
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase text-muted-foreground">Restante</p>
              <p className={`text-2xl font-semibold ${remainingAmount < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {formatNumber(remainingAmount)}
              </p>
              <p className="typography-metadata">
                Presupuesto: {formatNumber(budgetAmount)}
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
              value={Math.min(Math.max(budgetPercentage, 0), 100)}
              className="h-2"
              indicatorClassName={isOverBudget ? 'bg-destructive' : 'bg-primary'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
