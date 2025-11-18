'use client'

/**
 * SettingsSheet Component
 *
 * Sidebar sheet (sandwich menu) for execution settings
 * Allows toggling:
 * - Show/hide timer
 * - Enable/disable price input
 * - Show/hide categories view
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/presentation/components/ui/sheet'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import { Separator } from '@/presentation/components/ui/separator'
import { Timer, Tag, Grid } from 'lucide-react'
import type { ExecutionSettings } from '@/domain/types/shopping-execution'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ExecutionSettings
  onSettingsChange: (settings: Partial<ExecutionSettings>) => void
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>Configuración</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
