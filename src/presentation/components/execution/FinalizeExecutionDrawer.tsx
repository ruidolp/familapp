'use client'

/**
 * FinalizeExecutionDrawer Component
 *
 * Final drawer to confirm purchase and sync to server
 * Shows:
 * - Calculated total
 * - Manual total input
 * - Summary of items (purchased/discarded)
 * - Confirm and sync button
 */

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'
import { Separator } from '@/presentation/components/ui/separator'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { useCurrency } from '@/presentation/providers/currency-provider'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'

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
      <SheetContent
       
        className="h-[600px] sm:max-w-[500px] sm:mx-auto"
      >
        <SheetHeader>
          <SheetTitle>Finalizar Compra</SheetTitle>
          <SheetDescription>
            Revisa el resumen y confirma la compra
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {purchasedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Comprados</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <X className="h-4 w-4 text-slate-600" />
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-400">
                  {discardedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Descartados</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {pendingCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </div>

          {/* Warning for pending items */}
          {hasPendingItems && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tienes {pendingCount} producto{pendingCount > 1 ? 's' : ''} pendiente
                {pendingCount > 1 ? 's' : ''}. Considera marcarlos como comprados o descartados.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Timer */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tiempo total</Label>
            <span className="font-mono font-bold text-lg">{timerFormatted}</span>
          </div>

          <Separator />

          {/* Calculated Total */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Total calculado</Label>
            <div className="text-3xl font-bold text-primary">
              {totalCalculated > 0 ? formatNumber(totalCalculated) : 'No disponible'}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de todos los productos con precio
            </p>
          </div>

          <Separator />

          {/* Manual Total Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-total" className="text-sm font-medium">
              Total pagado (opcional)
            </Label>
            <Input
              id="manual-total"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder={totalCalculated > 0 ? formatNumber(totalCalculated) : 'Ingresa el total'}
              value={manualTotal}
              onChange={(e) => setManualTotal(e.target.value)}
              className="text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              Si es diferente al calculado, ingresa el monto real del ticket
            </p>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
          <Button
            onClick={handleConfirm}
            disabled={syncing || (totalCalculated === 0 && !manualTotal)}
            className="w-full h-14 text-lg font-semibold"
          >
            {syncing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              'Finalizar y Sincronizar'
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={syncing}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
