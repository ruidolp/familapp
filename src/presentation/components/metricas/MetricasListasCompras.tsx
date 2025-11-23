'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MonthYearSelector } from './MonthYearSelector'
import { BarChart } from './BarChart'
import { LockedMetricCard } from './LockedMetricCard'
import {
  getCurrentBudgetCycle,
  formatBudgetCycle,
  getMonthName,
  getPreviousCycle,
  getNextCycle,
  type BudgetCycle,
} from '@/infrastructure/utils/budget-cycle'

interface MetricasListasComprasProps {
  userId: string
  onBack: () => void
}

export function MetricasListasCompras({ userId, onBack }: MetricasListasComprasProps) {
  const [diaInicioPeriodo, setDiaInicioPeriodo] = useState<number>(1)
  const [currentCycle, setCurrentCycle] = useState<BudgetCycle | null>(null)
  const [loading, setLoading] = useState(false)
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [topTiendas, setTopTiendas] = useState<any[]>([])
  const [hasData, setHasData] = useState(true)

  // Cargar configuración del usuario
  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const response = await fetch('/api/user/config')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.config) {
            const dia = data.config.dia_inicio_periodo || 1
            setDiaInicioPeriodo(dia)
            setCurrentCycle(getCurrentBudgetCycle(dia))
          }
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
        // Usar valores por defecto
        setCurrentCycle(getCurrentBudgetCycle(1))
      }
    }
    fetchUserConfig()
  }, [])

  useEffect(() => {
    if (currentCycle) {
      fetchMetrics()
    }
  }, [currentCycle])

  const fetchMetrics = async () => {
    if (!currentCycle) return

    setLoading(true)
    try {
      const startDate = currentCycle.startDate.toISOString()
      const endDate = currentCycle.endDate.toISOString()

      // Fetch top productos
      const productosRes = await fetch(
        `/api/metricas/listas/top-productos?startDate=${startDate}&endDate=${endDate}`
      )
      if (productosRes.ok) {
        const data = await productosRes.json()
        setTopProductos(data.productos || [])
        setHasData(data.productos && data.productos.length > 0)
      }

      // Fetch top tiendas
      const tiendasRes = await fetch(
        `/api/metricas/listas/top-tiendas?startDate=${startDate}&endDate=${endDate}`
      )
      if (tiendasRes.ok) {
        const data = await tiendasRes.json()
        setTopTiendas(data.tiendas || [])
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevCycle = () => {
    if (!currentCycle) return
    setCurrentCycle(getPreviousCycle(currentCycle, diaInicioPeriodo))
  }

  const handleNextCycle = () => {
    if (!currentCycle) return
    setCurrentCycle(getNextCycle(currentCycle, diaInicioPeriodo))
  }

  if (!currentCycle) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="typography-body text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  const monthName = getMonthName(currentCycle)
  const cycleLabel = formatBudgetCycle(currentCycle)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="typography-h3 text-foreground">Listas de Compras</h1>
          <p className="typography-body-sm text-foreground">{monthName}</p>
          <p className="typography-body-sm text-muted-foreground">
            Ciclo <span className="font-semibold">{cycleLabel}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Month Selector */}
        <MonthYearSelector
          currentCycle={currentCycle}
          onPrev={handlePrevCycle}
          onNext={handleNextCycle}
        />

        {!hasData && !loading ? (
          <Card className="p-8 text-center">
            <p className="typography-body text-muted-foreground">
              No hay datos disponibles para este mes
            </p>
          </Card>
        ) : (
          <>
            {/* Active Metrics */}
            <div className="space-y-6">
              {/* Top 10 Productos */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-primary" />
                  <h3 className="typography-h4 text-foreground">Top 10 Productos Más Comprados</h3>
                </div>
                {loading ? (
                  <p className="typography-body-sm text-muted-foreground">Cargando...</p>
                ) : topProductos.length > 0 ? (
                  <BarChart
                    data={topProductos}
                    labelKey="nombre"
                    valueKey="total_compras"
                    colorClass="bg-primary"
                  />
                ) : (
                  <p className="typography-body-sm text-muted-foreground">No hay datos</p>
                )}
              </Card>

              {/* Top 10 Tiendas */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-primary" />
                  <h3 className="typography-h4 text-foreground">Total de Compras por Tienda</h3>
                </div>
                {loading ? (
                  <p className="typography-body-sm text-muted-foreground">Cargando...</p>
                ) : topTiendas.length > 0 ? (
                  <BarChart
                    data={topTiendas}
                    labelKey="tienda"
                    valueKey="total"
                    formatValue={(value) => `$${value.toLocaleString()}`}
                    colorClass="bg-success"
                  />
                ) : (
                  <p className="typography-body-sm text-muted-foreground">No hay datos</p>
                )}
              </Card>
            </div>

            {/* Predictive Metrics (Locked) */}
            <div className="space-y-4">
              <h3 className="typography-h4 text-foreground">Métricas Predictivas</h3>

              <LockedMetricCard
                title="Predicción de Gasto Próximo Mes"
                message="Sigue usando FamilApp para que podamos predecir tu gasto del próximo mes basado en tus patrones de compra"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />

              <LockedMetricCard
                title="Productos que Deberías Comprar Pronto"
                message="Con más historial, te avisaremos qué productos podrías necesitar comprar basándonos en tu frecuencia de compra"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />

              <LockedMetricCard
                title="Comparativa de Precios vs Meses Anteriores"
                message="Acumula más meses de compras para ver cómo han variado los precios de tus productos favoritos"
                icon={<Lock size={32} className="text-muted-foreground" />}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
