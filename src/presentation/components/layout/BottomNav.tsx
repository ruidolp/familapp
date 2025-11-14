/**
 * BottomNav Component
 *
 * Navegación inferior fija con 5 botones:
 * - 4 tabs principales + 1 botón contextual central
 */

import { Wallet, MailOpen, Plus, ChartColumn, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type TabType = 'billeteras' | 'sobres' | 'metricas' | 'config'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onContextualAction: () => void
}

export function BottomNav({ activeTab, onTabChange, onContextualAction }: BottomNavProps) {
  return (
    <div className="h-full flex items-center justify-around border-t bg-card px-2">
      {/* BILLETERAS */}
      <NavButton
        icon={Wallet}
        label="BILLETERAS"
        active={activeTab === 'billeteras'}
        onClick={() => onTabChange('billeteras')}
      />

      {/* SOBRES */}
      <NavButton
        icon={MailOpen}
        label="SOBRES"
        active={activeTab === 'sobres'}
        onClick={() => onTabChange('sobres')}
      />

      {/* BOTÓN CONTEXTUAL CENTRAL */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onContextualAction}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* MÉTRICAS */}
      <NavButton
        icon={ChartColumn}
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
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
    >
      <Icon
        className={`h-5 w-5 ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
      <span
        className={`text-[10px] font-medium ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
