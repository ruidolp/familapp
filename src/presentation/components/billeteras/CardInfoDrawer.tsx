/**
 * CardInfoDrawer - Información detallada de billetera
 */

import { useTranslations } from 'next-intl'
import { Pencil, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
} from '@/components/ui/drawer'
import type { Billetera } from '@/presentation/hooks/useBilleteras'

interface CardInfoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billetera: Billetera | null
  onEdit: () => void
  onTransfer: () => void
}

export function CardInfoDrawer({
  open,
  onOpenChange,
  billetera,
  onEdit,
  onTransfer,
}: CardInfoDrawerProps) {
  const t = useTranslations('billeteras')

  if (!billetera) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{billetera.nombre}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t('fields.type')}
              </p>
              <p className="font-medium">{t(`types.${billetera.tipo}`)}</p>
            </div>

            {/* Saldo Real */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t('balance.real')}
              </p>
              <p className={`text-2xl font-bold ${Number(billetera.saldo_real) < 0 ? 'text-red-600' : 'text-foreground'}`}>
                ${Number(billetera.saldo_real).toFixed(2)}
              </p>
            </div>

            {/* Saldo Proyectado */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t('balance.projected')}
              </p>
              <p className={`text-2xl font-bold ${Number(billetera.saldo_proyectado) < 0 ? 'text-red-600' : 'text-foreground'}`}>
                ${Number(billetera.saldo_proyectado).toFixed(2)}
              </p>
            </div>

            {/* Compartida */}
            {billetera.is_compartida && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">{t('fields.shared')}</p>
              </div>
            )}

            {/* Interés */}
            {billetera.tasa_interes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('fields.interestRate')}
                </p>
                <p className="font-medium">{billetera.tasa_interes}%</p>
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={onEdit} className="w-full">
            <Pencil className="h-4 w-4 mr-2" />
            {t('actions.edit')}
          </Button>
          <Button onClick={onTransfer} variant="outline" className="w-full">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {t('actions.transfer')}
          </Button>
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
