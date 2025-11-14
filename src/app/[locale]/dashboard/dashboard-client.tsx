'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { Header } from '@/presentation/components/layout/Header'
import { BottomNav, type TabType } from '@/presentation/components/layout/BottomNav'
import { BilleterasScreen } from '@/presentation/components/screens/BilleterasScreen'
import { SobresScreen } from '@/presentation/components/screens/SobresScreen'
import { MetricasScreen } from '@/presentation/components/screens/MetricasScreen'
import { ConfigScreen } from '@/presentation/components/screens/ConfigScreen'
import { OnboardingDrawer } from '@/components/drawers/OnboardingDrawer'

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
  const [activeTab, setActiveTab] = useState<TabType>('billeteras')
  const [contextualOpen, setContextualOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // Mantener la página activa al refrescar usando localStorage
  useEffect(() => {
    setMounted(true)
    const savedTab = localStorage.getItem('dashboard-active-tab') as TabType | null
    if (savedTab && ['billeteras', 'sobres', 'metricas', 'config'].includes(savedTab)) {
      setActiveTab(savedTab)
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
        }
      } else if (response.status === 404) {
        // No existe configuración
        setNeedsOnboarding(true)
        setOnboardingOpen(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  // Guardar tab activo cuando cambia
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dashboard-active-tab', activeTab)
    }
  }, [activeTab, mounted])

  // Acción contextual del botón central (+)
  const handleContextualAction = () => {
    if (activeTab === 'billeteras') {
      setContextualOpen(true)
    }
    if (activeTab === 'sobres') {
      // TODO: Abrir menú contextual para SOBRES (Crear Sobre, Crear Gasto)
      setContextualOpen(true)
    }
  }

  // Renderizar screen según tab activo
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'billeteras':
        return (
          <BilleterasScreen
            contextualOpen={contextualOpen}
            onContextualOpenChange={setContextualOpen}
          />
        )
      case 'sobres':
        return <SobresScreen userId={user.id} />
      case 'metricas':
        return <MetricasScreen />
      case 'config':
        return <ConfigScreen />
      default:
        return (
          <BilleterasScreen
            contextualOpen={false}
            onContextualOpenChange={() => {}}
          />
        )
    }
  }

  return (
    <>
      <AppShell
        header={
          <Header
            userName={user.name}
            userImage={user.image}
          />
        }
        footer={
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onContextualAction={handleContextualAction}
          />
        }
      >
        {renderActiveScreen()}
      </AppShell>

      {/* OnboardingDrawer para usuarios nuevos */}
      <OnboardingDrawer
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />
    </>
  )
}
