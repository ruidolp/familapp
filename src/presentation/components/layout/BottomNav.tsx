/**
 * BottomNav Component
 *
 * Navegación inferior fija con 5 botones:
 * - 4 tabs principales + 1 botón contextual central
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Separator } from '@/presentation/components/ui/separator'

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
                <DrawerTitle className="text-base font-semibold">
                  {t('title')}
                </DrawerTitle>
                <DrawerDescription>
                  {currentSobreName
                    ? t('descriptionWithName', { name: currentSobreName })
                    : t('descriptionDefault')}
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-6 px-4 py-6">
                {/* ACCIÓN GLOBAL: NUEVO SOBRE */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground text-left">
                    Crear otro sobre
                  </p>
                  <Button
                    variant="secondary"
                    className="h-14 rounded-2xl border border-border bg-card px-4 text-left text-sm font-semibold text-foreground"
                    onClick={() => handleSobresAction('nuevo-sobre')}
                  >
                    <div className="flex items-center gap-3">
                      <FolderPlus className="h-4 w-4 text-primary" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">
                          Crear nuevo sobre
                        </span>
                        {currentSobreName && (
                          <span className="text-xs text-muted-foreground">
                            ¿Nuevo objetivo? Sepáralo de “{currentSobreName}”
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                </div>

                <Separator />

                <p className="text-xs font-semibold uppercase text-muted-foreground text-left">
                  {currentSobreName
                    ? `Operaciones en ${currentSobreName}`
                    : 'Operaciones del sobre'}
                </p>

                {/* CARD QUE YA TE GUSTA: OPERACIONES SOBRE EL SOBRE ACTUAL */}
                <div className="rounded-3xl border border-border bg-card/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="secondary"
                      className="h-14 rounded-2xl border border-border bg-background px-4 text-left text-sm font-semibold text-foreground"
                      onClick={() => handleSobresAction('nueva-categoria')}
                    >
                      <div className="flex items-center gap-3">
                        <Tags className="h-4 w-4 text-primary" />
                        Agregar Categorías
                      </div>
                    </Button>

                    <Button
                      className="h-14 rounded-2xl px-4 text-left text-sm font-semibold"
                      onClick={() => handleSobresAction('nuevo-gasto')}
                    >
                      <div className="flex items-center gap-3">
                        <ReceiptText className="h-5 w-5" />
                        Registrar Gasto
                      </div>
                    </Button>
                  </div>
                </div>
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
