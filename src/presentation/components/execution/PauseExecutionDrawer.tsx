'use client'

/**
 * PauseExecutionDrawer Component
 *
 * Confirms that the user wants to pause the current purchase execution
 * and return to the shopping lists screen
 */

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
  SheetDescription,
} from '@/presentation/components/ui/sheet'
import { Button } from '@/presentation/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/presentation/components/ui/alert'

interface PauseExecutionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PauseExecutionDrawer({
  open,
  onOpenChange,
  onConfirm,
}: PauseExecutionDrawerProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px]">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Volver a Listas
          </SheetTitle>
          <SheetDescription className="text-base">
            Su compra actual quedará pausada y podrá reanudarla posteriormente desde el menú principal.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El progreso de su compra se guardará automáticamente. Podrá continuar con esta ejecución
              en cualquier momento desde la sección de compras activas.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleConfirm}
              variant="default"
              className="w-full h-11"
            >
              Confirmar y Volver a Listas
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11"
            >
              Continuar Comprando
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
