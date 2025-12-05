/**
 * BottomNav Component
 *
 * Navegación inferior fija con 5 botones:
 * - 4 tabs principales + 1 botón contextual central
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListCheck, MailOpen, Plus, CircleChevronUp, Settings, ReceiptText, Tags, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from '@/components/ui/drawer'
import { useTheme } from '@/presentation/providers/theme-provider'
import { cn } from '@/lib/utils'

export type TabType = 'listas' | 'sobres' | 'metricas' | 'config'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onContextualAction: (action?: string) => void
  currentSobreName?: string | null
}

export function BottomNav({
  activeTab,
  onTabChange,
  onContextualAction,
  currentSobreName,
}: BottomNavProps) {
  const t = useTranslations('sobres.quickActions')
  const [sobresDrawerOpen, setSobresDrawerOpen] = useState(false)
  const { theme } = useTheme()
  const isRosadoTheme = theme === 'rosado'

  const description = currentSobreName
    ? t.rich('descriptionWithName', {
        name: currentSobreName,
        strong: (chunks) => <span className="font-semibold">{chunks}</span>,
      })
    : t('descriptionDefault')

  const handleSobresAction = (action: string) => {
    setSobresDrawerOpen(false)
    onContextualAction(action)
  }

  return (
    <div className="h-full flex items-center justify-around border-t bg-card px-2">
      {/* LISTAS */}
      <NavButton
        icon={ListCheck}
        label="LISTAS"
        active={activeTab === 'listas'}
        onClick={() => onTabChange('listas')}
      />

      {/* SOBRES */}
      <NavButton
        icon={MailOpen}
        label="SOBRES"
        active={activeTab === 'sobres'}
        onClick={() => onTabChange('sobres')}
      />

      {/* BOTÓN CONTEXTUAL CENTRAL */}
      {activeTab === 'sobres' ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onContextualAction('nuevo-gasto')}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      ) : activeTab === 'metricas' ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onContextualAction()}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <CircleChevronUp className="h-6 w-6" />
        </Button>
      ) : activeTab === 'config' ? (
        <div className="h-12 w-12" />
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onContextualAction()}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* MÉTRICAS */}
      <NavButton
        icon={CircleChevronUp}
        label="MÉTRICAS"
        active={activeTab === 'metricas'}
        onClick={() => onTabChange('metricas')}
      />

      {/* CONFIGURACIÓN */}
      <NavButton
        icon={Settings}
        label="CONFIG"
        active={activeTab === 'config'}
        onClick={() => onTabChange('config')}
      />
    </div>
  )
}

interface NavButtonProps {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 py-1.5 text-center transition-colors"
    >
      {active && (
        <span className="absolute left-1/2 top-1 h-1 w-10 -translate-x-1/2 rounded-full bg-primary" />
      )}
      <div
        className={`mx-auto flex max-w-[88px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition-all ${
          active ? 'bg-primary/10 shadow-sm' : 'hover:bg-muted/60'
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-colors ${
            active ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
        <span
          className={`text-[10px] font-medium transition-colors ${
            active ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  )
}
