'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { BottomNav, type TabType } from '@/presentation/components/layout/BottomNav'
import { DotIndicator } from '@/presentation/components/layout/DotIndicator'
import { ListasScreen } from '@/presentation/components/screens/ListasScreen'
import { SobresScreen } from '@/presentation/components/screens/SobresScreen'
import { MetricasScreen } from '@/presentation/components/screens/MetricasScreen'
import { ConfigScreen } from '@/presentation/components/screens/ConfigScreen'
import { OnboardingDrawer } from '@/components/drawers/OnboardingDrawer'
import { PostOnboardingInvitationsDialog } from '@/components/sobres/post-onboarding-invitations-dialog'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface DashboardClientProps {
  locale: string
  user: User
}

export function DashboardClient({ locale, user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sobres')
  const [contextualOpen, setContextualOpen] = useState(false)
  const [menuAction, setMenuAction] = useState<string | null>(null)
  const [listMenuAction, setListMenuAction] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [invitationsDialogOpen, setInvitationsDialogOpen] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [sobreCarouselIndex, setSobreCarouselIndex] = useState(0)
  const [sobreCarouselTotal, setSobreCarouselTotal] = useState(0)
  const [sobreActual, setSobreActual] = useState<{
    nombre: string
    emoji?: string
    presupuesto: number
  } | null>(null)

  // Mantener la página activa al refrescar usando localStorage
  useEffect(() => {
    setMounted(true)
    const savedTab = localStorage.getItem('dashboard-active-tab') as TabType | null
    if (savedTab && ['listas', 'sobres', 'metricas', 'config'].includes(savedTab)) {
      setActiveTab(savedTab)
    } else {
      // Si no hay nada guardado, forzar 'sobres' por defecto
      setActiveTab('sobres')
      localStorage.setItem('dashboard-active-tab', 'sobres')
    }

    // Detectar si el usuario necesita onboarding
    checkNeedsOnboarding()
  }, [])

  const checkNeedsOnboarding = async () => {
    try {
      const response = await fetch('/api/user/config')
      if (response.ok) {
        const data = await response.json()
        // Si no existe configuración o viene vacía, necesita onboarding
        if (!data.success || !data.config) {
          setNeedsOnboarding(true)
          setOnboardingOpen(true)
        } else {
          // Si no necesita onboarding, verificar invitaciones pendientes
          await checkPendingInvitations()
        }
      } else if (response.status === 404) {
        // No existe configuración
        setNeedsOnboarding(true)
        setOnboardingOpen(true)
      } else {
        // Si hay error, aún así verificar invitaciones
        await checkPendingInvitations()
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      // En caso de error, aún así verificar invitaciones
      await checkPendingInvitations()
    }
  }

  const checkPendingInvitations = async () => {
    try {
      const response = await fetch('/api/sobres/invitations')
      if (response.ok) {
        const data = await response.json()
        const pendientes = data.recibidas || []
        if (pendientes.length > 0) {
          setPendingInvitations(pendientes)
          setInvitationsDialogOpen(true)
        }
      }
    } catch (error) {
      console.error('Error checking pending invitations:', error)
    }
  }

  // Guardar tab activo cuando cambia
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dashboard-active-tab', activeTab)
    }
  }, [activeTab, mounted])

  // Acción contextual del botón central (+)
  const handleContextualAction = (action?: string) => {
    if (activeTab === 'listas') {
      setListMenuAction('nueva-lista')
      return
    }

    if (action) {
      setMenuAction(action)
    }
  }

  // Callbacks para SobresScreen (memoizados para evitar re-renders infinitos)
  const handleCarouselChange = useCallback((index: number, total: number) => {
    setSobreCarouselIndex(index)
    setSobreCarouselTotal(total)
  }, [])

  const handleSobreChange = useCallback((sobre: { nombre: string; emoji?: string; presupuesto: number } | null) => {
    setSobreActual(sobre)
  }, [])

  // Renderizar screen según tab activo
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'listas':
        return (
          <ListasScreen
            userId={user.id}
            menuAction={listMenuAction}
            onMenuActionHandled={() => setListMenuAction(null)}
          />
        )
      case 'sobres':
        return (
          <SobresScreen
            userId={user.id}
            menuAction={menuAction}
            onMenuActionHandled={() => setMenuAction(null)}
            onCarouselChange={handleCarouselChange}
            onSobreChange={handleSobreChange}
          />
        )
      case 'metricas':
        return <MetricasScreen />
      case 'config':
        return <ConfigScreen />
      default:
        return (
          <ListasScreen
            userId={user.id}
            menuAction={listMenuAction}
            onMenuActionHandled={() => setListMenuAction(null)}
          />
        )
    }
  }

  return (
    <>
      <AppShell
        footerContent={
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onContextualAction={handleContextualAction}
            currentSobreName={sobreActual?.nombre}
          />
        }
        dotIndicator={
          activeTab === 'sobres' && sobreCarouselTotal > 0
            ? <DotIndicator total={sobreCarouselTotal} current={sobreCarouselIndex} />
            : undefined
        }
      >
        {renderActiveScreen()}
      </AppShell>

      {/* OnboardingDrawer para usuarios nuevos */}
      <OnboardingDrawer
        open={onboardingOpen}
        onOpenChange={(open) => {
          setOnboardingOpen(open)
          // Si se cierra el onboarding, verificar invitaciones
          if (!open && needsOnboarding) {
            checkPendingInvitations()
          }
        }}
      />

      {/* Dialog de invitaciones pendientes */}
      <PostOnboardingInvitationsDialog
        invitaciones={pendingInvitations}
        open={invitationsDialogOpen}
        onOpenChange={setInvitationsDialogOpen}
      />
    </>
  )
}
