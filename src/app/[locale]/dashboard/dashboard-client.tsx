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
  const [activeTab, setActiveTab] = useState<TabType>('listas')
  const [contextualOpen, setContextualOpen] = useState(false)
  const [menuAction, setMenuAction] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
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
  const handleContextualAction = (action?: string) => {
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
        return <ListasScreen userId={user.id} />
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
        return <ListasScreen userId={user.id} />
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
        onOpenChange={setOnboardingOpen}
      />
    </>
  )
}
