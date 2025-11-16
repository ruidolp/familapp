/**
 * BottomNav Component
 *
 * Navegación inferior fija con 5 botones:
 * - 4 tabs principales + 1 botón contextual central
 */

'use client'

import { useState } from 'react'
import { BookMarked, MailOpen, Plus, ChartColumn, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type TabType = 'listas' | 'sobres' | 'metricas' | 'config'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onContextualAction: (action?: string) => void
}

export function BottomNav({ activeTab, onTabChange, onContextualAction }: BottomNavProps) {
  return (
    <div className="h-full flex items-center justify-around border-t bg-card px-2">
      {/* LISTAS */}
      <NavButton
        icon={BookMarked}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48">
            <DropdownMenuItem onClick={() => onContextualAction('nuevo-sobre')}>
              Nuevo Sobre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onContextualAction('nueva-categoria')}>
              Nueva Categoría
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onContextualAction('nueva-marca')}>
              Nueva Marca
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onContextualAction('nuevo-gasto')}>
              Nuevo Gasto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all ${
        active ? 'bg-primary/10' : ''
      }`}
    >
      <Icon
        className={`h-5 w-5 transition-all ${
          active ? 'text-primary font-bold' : 'text-muted-foreground'
        }`}
      />
      <span
        className={`text-[10px] font-medium transition-all ${
          active ? 'text-primary font-bold' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
