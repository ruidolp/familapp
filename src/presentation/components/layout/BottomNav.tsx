/**
 * BottomNav Component
 *
 * Navegación inferior fija con 5 botones:
 * - 4 tabs principales + 1 botón contextual central
 */

'use client'

import { useState } from 'react'
import {
  ListCheck,
  MailOpen,
  Plus,
  CircleChevronUp,
  Settings,
  ReceiptText,
  FolderPlus,
  Tags,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

export type TabType = 'listas' | 'sobres' | 'metricas' | 'config'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onContextualAction: (action?: string) => void
}

export function BottomNav({ activeTab, onTabChange, onContextualAction }: BottomNavProps) {
  const [sobresDrawerOpen, setSobresDrawerOpen] = useState(false)

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
        <Drawer open={sobresDrawerOpen} onOpenChange={setSobresDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CircleChevronUp className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="pb-6">
            <div className="mx-auto w-full max-w-md pt-2">
              <DrawerHeader className="pb-0 text-center">
                <DrawerTitle className="text-base font-semibold">Acciones Rápidas</DrawerTitle>
              </DrawerHeader>

              <div className="flex flex-col gap-5 px-4 py-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    className="h-14 rounded-2xl border border-border bg-card px-4 text-left text-sm font-semibold text-foreground"
                    onClick={() => handleSobresAction('nuevo-sobre')}
                  >
                    <div className="flex items-center gap-3">
                      <FolderPlus className="h-4 w-4 text-primary" />
                      Crear Sobre
                    </div>
                  </Button>

                  <Button
                    variant="secondary"
                    className="h-14 rounded-2xl border border-border bg-card px-4 text-left text-sm font-semibold text-foreground"
                    onClick={() => handleSobresAction('nueva-categoria')}
                  >
                    <div className="flex items-center gap-3">
                      <Tags className="h-4 w-4 text-primary" />
                      Agregar Categorías
                    </div>
                  </Button>
                </div>

                <Button
                  className="h-14 w-full gap-2 text-base"
                  onClick={() => handleSobresAction('nuevo-gasto')}
                >
                  <ReceiptText className="h-5 w-5" />
                  Registrar Gasto
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
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
