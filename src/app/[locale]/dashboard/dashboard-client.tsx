'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUserConfig } from '@/presentation/providers/user-config-provider'
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

interface PendingInvitation {
  id: string
  tipo: 'sobre' | 'lista'
  nombre: string
  emoji?: string
  descripcion?: string | null
  rol: string
  inviter_name?: string
  inviter_image?: string
}

export function DashboardClient({ locale, user }: DashboardClientProps) {
  const { requiresOnboarding, isLoading: configLoading } = useUserConfig()
  const [activeTab, setActiveTab] = useState<TabType>('sobres')
  const [contextualOpen, setContextualOpen] = useState(false)
  const [menuAction, setMenuAction] = useState<string | null>(null)
  const [listMenuAction, setListMenuAction] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [invitationsDialogOpen, setInvitationsDialogOpen] = useState(false)
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
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
  }, [])

  // Detectar si el usuario necesita onboarding basado en UserConfigProvider
  useEffect(() => {
    if (configLoading) return // Esperar a que termine de cargar

    if (requiresOnboarding) {
      setOnboardingOpen(true)
    } else {
      // Si no necesita onboarding, verificar invitaciones pendientes
      checkPendingInvitations()
    }
  }, [requiresOnboarding, configLoading])

  const checkPendingInvitations = async () => {
    try {
      const [sobresRes, listasRes] = await Promise.all([
        fetch('/api/sobres/invitations'),
        fetch('/api/shopping-lists/invitations'),
      ])

      const sobresPendientes: PendingInvitation[] = []
      const listasPendientes: PendingInvitation[] = []

      if (sobresRes.ok) {
        const sobresData = await sobresRes.json()
        const recibidas = sobresData.recibidas || []
        recibidas.forEach((inv: any) => {
          sobresPendientes.push({
            id: inv.id,
            tipo: 'sobre',
            nombre: inv.sobre_nombre,
            emoji: inv.sobre_emoji,
            rol: inv.rol,
            inviter_name: inv.inviter_name,
            inviter_image: inv.inviter_image,
          })
        })
      }

      if (listasRes.ok) {
        const listasData = await listasRes.json()
        const recibidas = listasData.recibidas || []
        recibidas.forEach((inv: any) => {
          listasPendientes.push({
            id: inv.id,
            tipo: 'lista',
            nombre: inv.lista_nombre,
            descripcion: inv.lista_descripcion,
            rol: inv.rol,
            inviter_name: inv.inviter_name,
            inviter_image: inv.inviter_image,
          })
        })
      }

      const combined = [...sobresPendientes, ...listasPendientes]
      setPendingInvitations(combined)
      setInvitationsDialogOpen(combined.length > 0)
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
        return <MetricasScreen userId={user.id} />
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
          if (!open && requiresOnboarding) {
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
