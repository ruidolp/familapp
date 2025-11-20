'use client'

/**
 * FinalizeExecutionDrawer Component
 *
 * Final drawer to confirm purchase and sync to server
 * Clean, modern design with proper scrolling and fixed buttons
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Separator } from '@/presentation/components/ui/separator'
import { Check, X, Loader2, AlertCircle, Clock } from 'lucide-react'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'
import { cn } from '@/infrastructure/lib/utils'

interface FinalizeExecutionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalCalculated: number
  purchasedCount: number
  discardedCount: number
  pendingCount: number
  timerFormatted: string
  onConfirm: (manualTotal?: number) => Promise<void>
}

export function FinalizeExecutionDrawer({
  open,
  onOpenChange,
  totalCalculated,
  purchasedCount,
  discardedCount,
  pendingCount,
  timerFormatted,
  onConfirm,
}: FinalizeExecutionDrawerProps) {
  const t = useTranslations()
  const { formatNumber } = useCurrency()
  const [manualTotal, setManualTotal] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setSyncing(true)

    try {
      const manual = manualTotal ? parseFloat(manualTotal) : undefined
      await onConfirm(manual)
    } catch (err: any) {
      console.error('Error finalizing execution:', err)
      setError(err.message || 'Error al finalizar compra')
    } finally {
      setSyncing(false)
    }
  }

  const hasPendingItems = pendingCount > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] flex flex-col p-0">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Header - No SheetHeader to avoid fixed height issues */}
          <div className="p-6 pb-4">
            <SheetTitle className="text-xl font-bold">{t('shopping.execution.finalize.title')}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('shopping.execution.finalize.description')}
            </p>
          </div>

          <div className="px-6 space-y-6">
            {/* Summary Stats - More prominent */}
            <div className="grid grid-cols-3 gap-3">
              {/* Comprados */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-lg text-center border border-emerald-200/60 dark:border-emerald-800/60">
                <div className="flex items-center justify-center mb-1">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {purchasedCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('shopping.execution.finalize.purchased')}</p>
              </div>

              {/* Descartados */}
              <div className="bg-muted border border-border p-4 rounded-lg text-center opacity-75">
                <div className="flex items-center justify-center mb-1">
                  <X className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground/70">
                  {discardedCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('shopping.execution.finalize.discarded')}</p>
              </div>

              {/* Pendientes */}
              <div className={cn(
                'p-4 rounded-lg text-center border',
                hasPendingItems
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/60'
                  : 'bg-muted border-border opacity-50'
              )}>
                <div className="flex items-center justify-center mb-1">
                  <span className={cn(
                    'text-lg',
                    hasPendingItems && 'text-amber-700 dark:text-amber-400 font-bold'
                  )}>
                    ⏳
                  </span>
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  hasPendingItems
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-foreground/70'
                )}>
                  {pendingCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('shopping.execution.finalize.pending')}</p>
              </div>
            </div>

            {/* Warning for pending items */}
            {hasPendingItems && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  {t('shopping.execution.finalize.pendingWarning', { count: pendingCount })}
                </AlertDescription>
              </Alert>
            )}

            <Separator className="my-2" />

            {/* Tiempo total */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('shopping.execution.finalize.totalTime')}</span>
              </div>
              <span className="font-mono font-semibold text-foreground">{timerFormatted}</span>
            </div>

            <Separator className="my-2" />

            {/* Calculated Total - Highlighted */}
            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">{t('shopping.execution.finalize.calculatedTotal')}</p>
              <div className="text-3xl font-bold text-primary">
                {totalCalculated > 0 ? formatNumber(totalCalculated) : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('shopping.execution.finalize.calculatedDesc')}
              </p>
            </div>

            {/* Manual Total Input */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="manual-total" className="text-sm font-medium">
                  {t('shopping.execution.finalize.manualTotal')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('shopping.execution.finalize.manualTotalDesc')}
                </p>
              </div>
              <Input
                id="manual-total"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder={totalCalculated > 0 ? formatNumber(totalCalculated) : '0.00'}
                value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                className="text-lg h-11"
              />
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Spacer for bottom buttons */}
            <div className="h-4" />
          </div>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="border-t bg-background p-6 space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={syncing || (totalCalculated === 0 && !manualTotal)}
            className="w-full h-12 text-base font-semibold"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('shopping.execution.finalize.finalizing')}
              </>
            ) : (
              t('shopping.execution.finalize.submit')
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={syncing}
            className="w-full"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
