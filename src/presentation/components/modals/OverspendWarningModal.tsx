'use client'

import { useState } from 'react'
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
            {isOverspend ? 'Presupuesto Excedido' : 'Saldo Insuficiente'}
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
                <div className="grid grid-cols-2 gap-2 text-base">
                  <div>
                    <p className="text-muted-foreground">Presupuesto</p>
                    <p className="font-bold">
                      ${formatNumber(warning.details.presupuesto_asignado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gastado</p>
                    <p className="font-bold text-red-600">
                      ${formatNumber(warning.details.gastado)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    Exceso: {warning.details.porcentajeExceso.toFixed(1)}%
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isNegativeWallet && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-base">
                  <div>
                    <p className="text-muted-foreground">Saldo Actual</p>
                    <p className="font-bold">
                      ${formatNumber(warning.details.saldoAnterior ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo Después</p>
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
            <p className="text-base font-medium text-blue-900">💡 Opciones recomendadas:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              {isOverspend && (
                <>
                  <li>Aumentar el presupuesto del sobre</li>
                  <li>Transferir budget desde otro sobre</li>
                  <li>Registrar el gasto de todas formas (permitido)</li>
                </>
              )}
              {isNegativeWallet && (
                <>
                  <li>Realizar un depósito en la billetera</li>
                  <li>Transferir dinero desde otra billetera</li>
                  <li>Registrar el gasto de todas formas (permitido)</li>
                </>
              )}
            </ul>
          </div>

          {/* Botón para mostrar más detalles */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {showDetails ? 'Ocultar detalles' : 'Mostrar detalles técnicos'}
          </button>

          {showDetails && (
            <div className="bg-slate-50 rounded p-2 text-sm font-mono space-y-1 max-h-32 overflow-y-auto">
              <p>tipo: {warning.type}</p>
              {warning.details.sobreNombre && (
                <p>sobre: {warning.details.sobreNombre}</p>
              )}
              <p>presupuesto: ${formatNumber(warning.details.presupuesto_asignado)}</p>
              <p>gastado: ${formatNumber(warning.details.gastado)}</p>
              <p>exceso: {warning.details.porcentajeExceso.toFixed(2)}%</p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>

          {onAddBudget && (
            <Button
              variant="outline"
              onClick={onAddBudget}
              disabled={loading}
            >
              Agregar Budget
            </Button>
          )}

          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar de Todas Formas'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
