/**
 * ContextualDrawer - Drawer de acciones rápidas para billeteras
 */

import { useTranslations } from 'next-intl'
import { Wallet, ArrowRightLeft, Plus } from 'lucide-react'
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

interface ContextualDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWallet: () => void
  onTransfer: () => void
  onDeposito: () => void
}

export function ContextualDrawer({
  open,
  onOpenChange,
  onAddWallet,
  onTransfer,
  onDeposito,
}: ContextualDrawerProps) {
  const t = useTranslations('billeteras')

  const handleAction = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('contextual.title')}</DrawerTitle>
          <DrawerDescription>
            {t('title')}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-start gap-3"
              onClick={() => handleAction(onAddWallet)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('actions.addCard')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('emptyDescription')}
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-start gap-3"
              onClick={() => handleAction(onTransfer)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('actions.transfer')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('contextual.transferDescription')}
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-start gap-3"
              onClick={() => handleAction(onDeposito)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('contextual.depositoLabel')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('contextual.depositoDescription')}
                </p>
              </div>
            </Button>
          </div>
        </DrawerBody>

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
