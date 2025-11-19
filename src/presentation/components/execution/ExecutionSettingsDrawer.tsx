'use client'

/**
 * ExecutionSettingsDrawer Component
 *
 * Drawer for execution settings (during shopping)
 * Allows toggling:
 * - Show/hide timer
 * - Enable/disable price input
 * - Show/hide categories view
 * - Flat list mode
 */

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/presentation/components/ui/drawer'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import { Separator } from '@/presentation/components/ui/separator'
import { Button } from '@/presentation/components/ui/button'
import { Timer, Tag, Grid, AlignLeft } from 'lucide-react'
import type { ExecutionSettings } from '@/domain/types/shopping-execution'

interface ExecutionSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ExecutionSettings
  onSettingsChange: (settings: Partial<ExecutionSettings>) => void
}

export function ExecutionSettingsDrawer({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: ExecutionSettingsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Configuración</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6">
          {/* Show Timer */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Mostrar cronómetro
              </Label>
              <p className="text-sm text-muted-foreground">
                Ver tiempo transcurrido
              </p>
            </div>
            <Switch
              checked={settings.showTimer}
              onCheckedChange={(checked) =>
                onSettingsChange({ showTimer: checked })
              }
            />
          </div>

          <Separator />

          {/* Enable Prices */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Agregar precios
              </Label>
              <p className="text-sm text-muted-foreground">
                Registrar precio de productos
              </p>
            </div>
            <Switch
              checked={settings.enablePrices}
              onCheckedChange={(checked) =>
                onSettingsChange({ enablePrices: checked })
              }
            />
          </div>

          <Separator />

          {/* Show Categories */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Ver por categorías
              </Label>
              <p className="text-sm text-muted-foreground">
                Agrupar productos por categoría
              </p>
            </div>
            <Switch
              checked={settings.showCategories}
              onCheckedChange={(checked) =>
                onSettingsChange({ showCategories: checked })
              }
            />
          </div>

          <Separator />

          {/* Flat List Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                Modo texto plano
              </Label>
              <p className="text-sm text-muted-foreground">
                Vista compacta sin bordes
              </p>
            </div>
            <Switch
              checked={settings.flatListMode}
              onCheckedChange={(checked) =>
                onSettingsChange({ flatListMode: checked })
              }
            />
          </div>
        </div>

        <div className="border-t p-4 bg-background">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cerrar
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
