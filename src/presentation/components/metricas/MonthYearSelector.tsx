'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBudgetCycle, getMonthName, type BudgetCycle } from '@/infrastructure/utils/budget-cycle'

interface MonthYearSelectorProps {
  currentCycle: BudgetCycle
  onPrev: () => void
  onNext: () => void
}

export function MonthYearSelector({ currentCycle, onPrev, onNext }: MonthYearSelectorProps) {
  const monthName = getMonthName(currentCycle)
  const cycleLabel = formatBudgetCycle(currentCycle)

  const isCurrentCycle = () => {
    const now = new Date()
    return now >= currentCycle.startDate && now <= currentCycle.endDate
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        aria-label="Periodo anterior"
      >
        <ChevronLeft size={20} />
      </Button>

      <div className="flex-1 text-center space-y-1">
        <p className="typography-h4 text-foreground">{monthName}</p>
        <p className="typography-body-sm text-muted-foreground">
          {cycleLabel}
        </p>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={isCurrentCycle()}
        aria-label="Periodo siguiente"
      >
        <ChevronRight size={20} />
      </Button>
    </div>
  )
}
