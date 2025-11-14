/**
 * DepositarRetirarDrawer - Depositar o Retirar dinero
 */

import { useTranslations } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBilleteras } from '@/presentation/hooks/useBilleteras'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { Loader2 } from 'lucide-react'

type OperationType = 'DEPOSITO' | 'RETIRO'

interface DepositarRetirarDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositarRetirarDrawer({
  open,
  onOpenChange,
}: DepositarRetirarDrawerProps) {
  const t = useTranslations('billeteras')
  const { billeteras, handleDeposito } = useBilleteras()

  // Refs para inputs
  const montoInputRef = useRef<HTMLInputElement>(null)
  const descripcionInputRef = useRef<HTMLInputElement>(null)

  // Hook para auto-scroll en inputs
  useInputFocus(montoInputRef, 350)
  useInputFocus(descripcionInputRef, 350)

  // Form state
  const [operationType, setOperationType] = useState<OperationType>('DEPOSITO')
  const [billeteraId, setBilleteraId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form cuando abre/cierra
  useEffect(() => {
    if (open) {
      setOperationType('DEPOSITO')
      setBilleteraId(billeteras.length > 0 ? billeteras[0].id : '')
      setMonto('')
      setDescripcion('')
    }
  }, [open, billeteras])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!billeteraId || !monto) {
      return
    }

    setLoading(true)
    try {
      const montoNumerico = parseFloat(monto)
      if (montoNumerico <= 0) {
        return
      }

      await handleDeposito(billeteraId, montoNumerico, operationType, descripcion)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const symbolo = operationType === 'DEPOSITO' ? '+' : '−'
  const operationLabel = operationType === 'DEPOSITO'
    ? t('deposit.title')
    : t('withdraw.title')

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{operationLabel}</DrawerTitle>
          <DrawerDescription>
            {t('deposit.description')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Operation Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={operationType === 'DEPOSITO' ? 'default' : 'outline'}
                onClick={() => setOperationType('DEPOSITO')}
                className="flex-1"
              >
                + {t('deposit.tabLabel')}
              </Button>
              <Button
                type="button"
                variant={operationType === 'RETIRO' ? 'default' : 'outline'}
                onClick={() => setOperationType('RETIRO')}
                className="flex-1"
              >
                − {t('withdraw.tabLabel')}
              </Button>
            </div>

            {/* Billetera Selection */}
            <div className="space-y-2">
              <Label htmlFor="billetera">
                {t('fields.wallet')} <span className="text-red-500">*</span>
              </Label>
              <Select value={billeteraId} onValueChange={setBilleteraId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billeteras.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.emoji} {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Mostrar saldo_proyectado de la billetera seleccionada */}
              {billeteraId && billeteras.find(b => b.id === billeteraId) && (
                <div className="text-sm text-muted-foreground">
                  {t('balance.projected')}: <span className="font-semibold text-foreground">
                    ${Number(billeteras.find(b => b.id === billeteraId)?.saldo_proyectado || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">
                {t('fields.amount')} <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold w-8 text-center">
                  {symbolo}
                </span>
                <Input
                  ref={montoInputRef}
                  id="monto"
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder={t('fields.amountPlaceholder')}
                  required
                  className="flex-1"
                />
              </div>
            </div>

            {/* Descripción (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                {t('fields.description')}
              </Label>
              <Input
                ref={descripcionInputRef}
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={t('fields.descriptionPlaceholder')}
              />
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            onClick={handleSubmit}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? t('deposit.submitting') : operationLabel}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={loading} className="w-full">
              {t('delete.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
