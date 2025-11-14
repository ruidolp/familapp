/**
 * TransferDrawer - Transferencia entre billeteras
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
import {
  useTransferBetween,
  type Billetera,
} from '@/presentation/hooks/useBilleteras'
import { useInputFocus } from '@/presentation/hooks/useInputFocus'
import { notify } from '@/infrastructure/lib/notifications'

interface TransferDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billeteras: Billetera[]
  preselectedId?: string | null
}

export function TransferDrawer({
  open,
  onOpenChange,
  billeteras,
  preselectedId,
}: TransferDrawerProps) {
  const t = useTranslations('billeteras')
  const transferMutation = useTransferBetween()

  // Refs para inputs
  const montoInputRef = useRef<HTMLInputElement>(null)

  // Hook para auto-scroll en inputs
  useInputFocus(montoInputRef, 350)

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [monto, setMonto] = useState('')

  // Reset form y preseleccionar origen si viene
  useEffect(() => {
    if (open) {
      setFromId(preselectedId || '')
      setToId('')
      setMonto('')
    }
  }, [open, preselectedId])

  // Filtrar billeteras disponibles para destino
  const availableDestinations = billeteras.filter((b) => b.id !== fromId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (fromId === toId) {
      notify.error(t('notifications.sameWallet'))
      return
    }

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      notify.error(t('transfer.invalidAmount'))
      return
    }

    // Validar saldo del origen
    const fromBilletera = billeteras.find((b) => b.id === fromId)
    if (fromBilletera && Number(fromBilletera.saldo_real) < montoNum) {
      notify.error(t('notifications.insufficientBalance'))
      return
    }

    await transferMutation.mutateAsync({
      fromBilleteraId: fromId,
      toBilleteraId: toId,
      monto: montoNum,
    })

    onOpenChange(false)
  }

  if (billeteras.length < 2) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('transfer.title')}</DrawerTitle>
            <DrawerDescription>
              {t('transfer.noWallets')}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                {t('delete.cancel')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('transfer.title')}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Desde */}
            <div className="space-y-2">
              <Label htmlFor="from">
                {t('transfer.from')} <span className="text-red-500">*</span>
              </Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfer.selectOrigin')} />
                </SelectTrigger>
                <SelectContent>
                  {billeteras.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre} (${Number(b.saldo_real).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hacia */}
            <div className="space-y-2">
              <Label htmlFor="to">
                {t('transfer.to')} <span className="text-red-500">*</span>
              </Label>
              <Select value={toId} onValueChange={setToId} disabled={!fromId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfer.selectDestination')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre} (${Number(b.saldo_real).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">
                {t('transfer.amount')} <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={montoInputRef}
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={t('transfer.amountPlaceholder')}
                required
              />
            </div>
          </form>
        </DrawerBody>

        <DrawerFooter>
          <Button
            type="submit"
            disabled={transferMutation.isPending || !fromId || !toId}
            className="w-full"
            onClick={handleSubmit}
          >
            {transferMutation.isPending
              ? t('transfer.submitting')
              : t('transfer.submit')}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              disabled={transferMutation.isPending}
              className="w-full"
            >
              {t('delete.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
