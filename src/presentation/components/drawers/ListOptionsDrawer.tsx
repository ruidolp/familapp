'use client'

import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ListOptionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupByCategory: boolean
  onGroupByCategoryChange: (value: boolean) => void
  showInlineQty: boolean
  onShowInlineQtyChange: (value: boolean) => void
  flatListMode: boolean
  onFlatListModeChange: (value: boolean) => void
}

export function ListOptionsDrawer({
  open,
  onOpenChange,
  groupByCategory,
  onGroupByCategoryChange,
  showInlineQty,
  onShowInlineQtyChange,
  flatListMode,
  onFlatListModeChange,
}: ListOptionsDrawerProps) {
  const t = useTranslations()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('shopping.lists.options.title')}</DrawerTitle>
          <DrawerDescription>
            {t('shopping.lists.options.description')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Agrupar por categoría */}
          <div className="flex items-center justify-between">
            <Label htmlFor="group-category" className="text-base">
              {t('shopping.lists.options.groupByCategory')}
            </Label>
            <Switch
              id="group-category"
              checked={groupByCategory}
              onCheckedChange={onGroupByCategoryChange}
            />
          </div>

          {/* Mostrar controles de cantidad */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-qty-buttons" className="text-base">
              {t('shopping.lists.options.showControls')}
            </Label>
            <Switch
              id="show-qty-buttons"
              checked={!showInlineQty}
              onCheckedChange={(checked) => onShowInlineQtyChange(!checked)}
            />
          </div>

          {/* Listado plano */}
          <div className="flex items-center justify-between">
            <Label htmlFor="flat-list-mode" className="text-base">
              {t('shopping.lists.options.flatList')}
            </Label>
            <Switch
              id="flat-list-mode"
              checked={flatListMode}
              onCheckedChange={onFlatListModeChange}
            />
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {t('shopping.lists.options.close')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
