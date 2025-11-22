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

import { type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/presentation/components/ui/drawer'
import { Label } from '@/presentation/components/ui/label'
import { Switch } from '@/presentation/components/ui/switch'
import { Separator } from '@/presentation/components/ui/separator'
import {
  Timer,
  Tag,
  Grid,
  AlignLeft,
} from 'lucide-react'
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
  const t = useTranslations()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{t('shopping.execution.settings.title')}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="rounded-xl border border-border/80 bg-card p-3 space-y-3">
            {/* Show Timer */}
            <SettingRow
              icon={<Timer className="h-4 w-4" />}
              title={t('shopping.execution.settings.showTimer')}
              description={t('shopping.execution.settings.showTimerDesc')}
              control={
                <Switch
                  checked={settings.showTimer}
                  onCheckedChange={(checked) => onSettingsChange({ showTimer: checked })}
                />
              }
            />
            <Separator />
            {/* Enable Prices */}
            <SettingRow
              icon={<Tag className="h-4 w-4" />}
              title={t('shopping.execution.settings.enablePrices')}
              description={t('shopping.execution.settings.enablePricesDesc')}
              control={
                <Switch
                  checked={settings.enablePrices}
                  onCheckedChange={(checked) => onSettingsChange({ enablePrices: checked })}
                />
              }
            />
            <Separator />
            {/* Show Categories */}
            <SettingRow
              icon={<Grid className="h-4 w-4" />}
              title={t('shopping.execution.settings.showCategories')}
              description={t('shopping.execution.settings.showCategoriesDesc')}
              control={
                <Switch
                  checked={settings.showCategories}
                  onCheckedChange={(checked) => onSettingsChange({ showCategories: checked })}
                />
              }
            />
            <Separator />
            {/* Flat List Mode */}
            <SettingRow
              icon={<AlignLeft className="h-4 w-4" />}
              title={t('shopping.execution.settings.flatListMode')}
              description={t('shopping.execution.settings.flatListModeDesc')}
              control={
                <Switch
                  checked={settings.flatListMode}
                  onCheckedChange={(checked) => onSettingsChange({ flatListMode: checked })}
                />
              }
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

interface SettingRowProps {
  icon: ReactNode
  title: string
  description: string
  control: ReactNode
}

function SettingRow({ icon, title, description, control }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <Label className="typography-label-lg flex items-center gap-2">
          {icon}
          {title}
        </Label>
        <p className="typography-body-sm text-muted-foreground leading-snug">
          {description}
        </p>
      </div>
      {control}
    </div>
  )
}
