'use client'

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
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Opciones de visualización</DrawerTitle>
          <DrawerDescription>
            Personaliza cómo se muestra la lista
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-6">
          {/* Agrupar por categoría */}
          <div className="flex items-center justify-between">
            <Label htmlFor="group-category" className="text-base">
              Agrupar por categoría
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
              Mostrar controles de cantidad
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
              Listado plano
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
              Cerrar
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
