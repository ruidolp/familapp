'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrency } from '@/presentation/providers/currency-provider'

interface OverspendWarning {
  type: 'OVERSPEND_SOBRE' | 'NEGATIVE_WALLET'
  message: string
  details: {
    presupuesto_asignado: number
    gastado: number
    sobreNombre?: string
    porcentajeExceso: number
    saldoAnterior?: number
    saldoNuevo?: number
  }
}

interface OverspendWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warning: OverspendWarning | null
  onConfirm?: () => void
  onAddBudget?: () => void
  loading?: boolean
}

export function OverspendWarningModal({
  open,
  onOpenChange,
  warning,
  onConfirm,
  onAddBudget,
  loading = false,
}: OverspendWarningModalProps) {
  const t = useTranslations()
  const { formatNumber } = useCurrency()
  const [showDetails, setShowDetails] = useState(false)

  if (!warning) return null

  const isOverspend = warning.type === 'OVERSPEND_SOBRE'
  const isNegativeWallet = warning.type === 'NEGATIVE_WALLET'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            {isOverspend ? t('modals.overspendWarning.budgetExceeded') : t('modals.overspendWarning.insufficientBalance')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {warning.message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Contenido específico por tipo */}
        <div className="space-y-4 py-4">
          {isOverspend && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <div className="grid grid-cols-2 gap-2 typography-body">
                  <div>
                    <p className="text-muted-foreground">{t('modals.overspendWarning.budget')}</p>
                    <p className="font-bold">
                      ${formatNumber(warning.details.presupuesto_asignado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('modals.overspendWarning.spent')}</p>
                    <p className="font-bold text-red-600">
                      ${formatNumber(warning.details.gastado)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    {t('modals.overspendWarning.excess')}: {Math.round(warning.details.porcentajeExceso)}%
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isNegativeWallet && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <div className="grid grid-cols-2 gap-2 typography-body">
                  <div>
                    <p className="text-muted-foreground">{t('modals.overspendWarning.currentBalance')}</p>
                    <p className="font-bold">
                      ${formatNumber(warning.details.saldoAnterior ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('modals.overspendWarning.balanceAfter')}</p>
                    <p className="font-bold text-red-600">
                      ${formatNumber(warning.details.saldoNuevo ?? 0)}
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Opciones recomendadas */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <p className="typography-body font-medium text-blue-900">{t('modals.overspendWarning.recommendedOptions')}</p>
            <ul className="typography-body-sm text-blue-800 space-y-1 list-disc list-inside">
              {isOverspend && (
                <>
                  <li>{t('modals.overspendWarning.increaseBudget')}</li>
                  <li>{t('modals.overspendWarning.transferBudget')}</li>
                  <li>{t('modals.overspendWarning.registerAnyway')}</li>
                </>
              )}
              {isNegativeWallet && (
                <>
                  <li>{t('modals.overspendWarning.makeDeposit')}</li>
                  <li>{t('modals.overspendWarning.transferMoney')}</li>
                  <li>{t('modals.overspendWarning.registerAnyway')}</li>
                </>
              )}
            </ul>
          </div>

          {/* Botón para mostrar más detalles */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="typography-body-sm text-muted-foreground hover:text-foreground underline"
          >
            {showDetails ? t('modals.overspendWarning.hideDetails') : t('modals.overspendWarning.showDetails')}
          </button>

          {showDetails && (
            <div className="bg-slate-50 rounded p-2 typography-body-sm font-mono space-y-1 max-h-32 overflow-y-auto">
              <p>tipo: {warning.type}</p>
              {warning.details.sobreNombre && (
                <p>sobre: {warning.details.sobreNombre}</p>
              )}
              <p>presupuesto: ${formatNumber(warning.details.presupuesto_asignado)}</p>
              <p>gastado: ${formatNumber(warning.details.gastado)}</p>
              <p>exceso: {Math.round(warning.details.porcentajeExceso)}%</p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel disabled={loading}>{t('common.cancel')}</AlertDialogCancel>

          {onAddBudget && (
            <Button
              variant="outline"
              onClick={onAddBudget}
              disabled={loading}
            >
              {t('modals.overspendWarning.addBudget')}
            </Button>
          )}

          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? t('modals.overspendWarning.registering') : t('modals.overspendWarning.registerAnywayButton')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
