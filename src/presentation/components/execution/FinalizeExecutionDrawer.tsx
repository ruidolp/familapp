'use client'

/**
 * FinalizeExecutionDrawer Component
 *
 * Final drawer to confirm purchase and sync to server
 * Clean, modern design with proper scrolling and fixed buttons
 */

import { useState, type ReactNode } from 'react'
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
  const { formatNumber, decimales } = useCurrency()
  const [manualTotal, setManualTotal] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepValue = decimales > 0
    ? Number((1 / Math.pow(10, decimales)).toFixed(decimales))
    : 1

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
      <SheetContent className="sm:max-w-[520px] flex flex-col p-0">
        <div className="border-b border-border bg-card px-6 py-5">
          <SheetTitle className="typography-h3">
            {t('shopping.execution.finalize.title')}
          </SheetTitle>
          <p className="typography-body-sm text-muted-foreground mt-1">
            {t('shopping.execution.finalize.description')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="bg-card-accent border border-card-accent rounded-2xl px-6 py-7 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('shopping.execution.finalize.calculatedTotal')}
            </p>
            <p className="mt-2 text-4xl font-bold text-primary">
              {totalCalculated > 0 ? formatNumber(totalCalculated) : formatNumber(0)}
            </p>
            <p className="typography-body-sm text-muted-foreground mt-3 max-w-md mx-auto">
              {t('shopping.execution.finalize.calculatedDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatusCard
              icon={<Check className="h-5 w-5" />}
              label={t('shopping.execution.finalize.purchased')}
              value={purchasedCount}
              variant="success"
            />
            <StatusCard
              icon={<X className="h-5 w-5" />}
              label={t('shopping.execution.finalize.discarded')}
              value={discardedCount}
              variant="muted"
            />
            <StatusCard
              icon={<Clock className="h-5 w-5" />}
              label={t('shopping.execution.finalize.pending')}
              value={pendingCount}
              variant={hasPendingItems ? 'warning' : 'muted'}
            />
          </div>

          {hasPendingItems && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:typography-body-sm">
                {t('shopping.execution.finalize.pendingWarning', { count: pendingCount })}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border border-border/80 bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 typography-body-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('shopping.execution.finalize.totalTime')}
            </div>
            <span className="font-mono font-semibold text-foreground">{timerFormatted}</span>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="manual-total" className="typography-body font-medium">
                {t('shopping.execution.finalize.manualTotal')}
              </Label>
              <p className="typography-metadata mt-1">
                {t('shopping.execution.finalize.manualTotalDesc')}
              </p>
            </div>
            <Input
              id="manual-total"
              type="number"
              inputMode="decimal"
              step={stepValue}
              placeholder={formatNumber(Math.max(totalCalculated, 0))}
              value={manualTotal}
              onChange={(e) => setManualTotal(e.target.value)}
              className="typography-body-lg h-12"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="border-t bg-background p-6 space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={syncing || (totalCalculated === 0 && !manualTotal)}
            className="w-full h-12 typography-label-lg"
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

interface StatusCardProps {
  icon: ReactNode
  label: string
  value: number
  variant?: 'success' | 'warning' | 'muted'
}

function StatusCard({ icon, label, value, variant = 'muted' }: StatusCardProps) {
  const baseClasses = 'rounded-xl border px-4 py-4 text-center flex flex-col items-center gap-2'
  const variantClasses = {
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    muted: 'border-border bg-muted text-foreground',
  } as const

  return (
    <div className={cn(baseClasses, variantClasses[variant])}>
      <div className="flex items-center justify-center typography-body-sm">{icon}</div>
      <p className="typography-h2 leading-none">{value}</p>
      <p className="typography-metadata">{label}</p>
    </div>
  )
}
